"""
Full inference pipeline — mirrors the evaluation logic from Phase 5/6/7.

Pipeline:
  1. Preprocess image → 224×224 normalised tensor
  2. Forward pass through quantised EfficientNet-B0
  3. Temperature-scale logits
  4. Softmax → per-class probabilities
  5. Compute malignancy score  =  P(mel) + P(bcc) + P(akiec)
  6. Choose threshold (RL adaptive or cost-sensitive fallback)
  7. Produce triage recommendation
"""

from __future__ import annotations

import io
import logging
from typing import Any

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

from app.config import (
    CLASS_INFO,
    CLASS_NAMES,
    IDX_TO_CLASS,
    MALIGNANT_INDICES,
    NUM_CLASSES,
    RL_THRESHOLD_GRID,
)
from app.schemas.prediction import ClassProbability, PredictionResponse
from app.utils.transforms import build_inference_transforms

logger = logging.getLogger(__name__)


class InferenceService:
    """Stateful service holding the loaded models + config."""

    def __init__(
        self,
        model: torch.nn.Module,
        rl_policy: torch.nn.Module | None,
        threshold_config: dict,
        device: torch.device,
    ) -> None:
        self.model = model
        self.rl_policy = rl_policy
        self.threshold_config = threshold_config
        self.device = device

        self.temperature: float = threshold_config.get("temperature", 1.0)
        self.fallback_threshold: float = threshold_config.get(
            "deployment_threshold", 0.131
        )
        self.transform = build_inference_transforms()

        logger.info(
            "InferenceService ready — temperature=%.4f, fallback_τ=%.4f, RL=%s",
            self.temperature,
            self.fallback_threshold,
            "ON" if rl_policy else "OFF",
        )

    # ──────────────────────────────────────────────
    #  Public API
    # ──────────────────────────────────────────────

    def predict(self, image_bytes: bytes) -> PredictionResponse:
        """Run the full triage pipeline on raw image bytes."""

        # 1. Preprocess
        img_tensor = self._preprocess(image_bytes)  # [1, 3, 224, 224]

        # 2 + 3. Forward + temperature scaling
        with torch.no_grad():
            logits = self.model(img_tensor)  # [1, 7]
            scaled_logits = logits / self.temperature
            probs = F.softmax(scaled_logits, dim=-1)  # [1, 7]

        probs_np: np.ndarray = probs.cpu().numpy()[0]  # (7,)
        predicted_idx: int = int(probs_np.argmax())
        predicted_class: str = IDX_TO_CLASS[predicted_idx]

        # 4. Malignancy score
        mal_prob: float = float(probs_np[MALIGNANT_INDICES].sum())

        # 5. Threshold
        threshold, method = self._get_threshold(probs_np, mal_prob)

        # 6. Triage
        is_referral = mal_prob >= threshold
        triage = (
            "REFER — Specialist Review Recommended"
            if is_referral
            else "ROUTINE — Low Risk, Monitor"
        )

        # 7. Build response
        class_probs = [
            ClassProbability(
                class_code=name,
                full_name=CLASS_INFO[name]["full"],
                probability=round(float(probs_np[i]), 6),
                risk_category=CLASS_INFO[name]["risk"],
                colour=CLASS_INFO[name]["colour"],
            )
            for i, name in enumerate(CLASS_NAMES)
        ]

        return PredictionResponse(
            predicted_class=predicted_class,
            predicted_class_full_name=CLASS_INFO[predicted_class]["full"],
            class_probabilities=class_probs,
            malignancy_probability=round(mal_prob, 6),
            threshold_used=round(threshold, 6),
            threshold_method=method,
            triage_recommendation=triage,
            risk_level=CLASS_INFO[predicted_class]["risk"],
            confidence=round(float(probs_np.max()), 6),
        )

    # ──────────────────────────────────────────────
    #  Internal helpers
    # ──────────────────────────────────────────────

    def _preprocess(self, image_bytes: bytes) -> torch.Tensor:
        """Open raw bytes → PIL → 224×224 normalised tensor on device."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = self.transform(img).unsqueeze(0)  # [1, 3, 224, 224]
        return tensor.to(self.device)

    def _get_threshold(
        self, probs: np.ndarray, mal_prob: float
    ) -> tuple[float, str]:
        """
        Use the RL adaptive policy if available; otherwise fall back
        to the cost-sensitive static threshold from threshold_config.
        """
        if self.rl_policy is not None:
            try:
                return self._rl_threshold(probs, mal_prob), "rl_adaptive"
            except Exception:
                logger.warning("RL policy failed – using fallback threshold")

        return self.fallback_threshold, "cost_sensitive"

    def _rl_threshold(self, probs: np.ndarray, mal_prob: float) -> float:
        """
        Build the 4-dim state vector and query the RL policy.
        State = [mal_prob, entropy, max_prob, prediction_margin]
        """
        entropy = float(-np.sum(probs * np.log(probs + 1e-10)))
        max_prob = float(probs.max())
        sorted_probs = np.sort(probs)[::-1]
        margin = float(sorted_probs[0] - sorted_probs[1])

        state = torch.tensor(
            [mal_prob, entropy, max_prob, margin],
            dtype=torch.float32,
            device=self.device,
        ).unsqueeze(0)

        with torch.no_grad():
            action_probs = self.rl_policy(state)  # [1, 20]
            action = int(action_probs.argmax(dim=-1).item())

        threshold = RL_THRESHOLD_GRID[action]
        return threshold
