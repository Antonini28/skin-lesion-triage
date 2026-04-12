"""
Download model checkpoints from Hugging Face Hub and load them
into memory.  On Render's free tier the models are cached in /tmp
so they survive within a single container lifecycle.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path

import torch

from app.config import (
    HF_REPO_ID,
    MODEL_CACHE_DIR,
    NUM_CLASSES,
    STUDENT_CHECKPOINT,
    RL_POLICY_CHECKPOINT,
    THRESHOLD_CONFIG_FILE,
)
from app.models.skin_model import create_student_model
from app.models.threshold_policy import ThresholdPolicyNetwork

logger = logging.getLogger(__name__)


def _download_file(repo_id: str, filename: str, cache_dir: str) -> str:
    """Download a single file from HF Hub and return the local path."""
    from huggingface_hub import hf_hub_download

    return hf_hub_download(
        repo_id=repo_id,
        filename=filename,
        cache_dir=cache_dir,
        force_download=False,          # reuse cache across restarts
    )


def _try_local_path(filename: str) -> str | None:
    """
    Check if the file already exists locally (useful for dev / Docker
    builds where checkpoints are baked in).
    """
    candidates = [
        Path(MODEL_CACHE_DIR) / filename,
        Path("checkpoints") / filename,
        Path("../checkpoints") / filename,
    ]
    for p in candidates:
        if p.exists():
            logger.info("Found local checkpoint: %s", p)
            return str(p)
    return None


def download_all(repo_id: str | None = None, cache_dir: str | None = None) -> dict[str, str]:
    """
    Ensure all required checkpoint / config files are available
    locally.  Returns a dict mapping logical name → local path.
    """
    repo_id = repo_id or HF_REPO_ID
    cache_dir = cache_dir or MODEL_CACHE_DIR
    os.makedirs(cache_dir, exist_ok=True)

    # pipeline_config.json is a training-time reference — not needed at inference.
    needed = [
        STUDENT_CHECKPOINT,
        RL_POLICY_CHECKPOINT,
        THRESHOLD_CONFIG_FILE,
    ]

    paths: dict[str, str] = {}
    for fname in needed:
        local = _try_local_path(fname)
        if local:
            paths[fname] = local
        else:
            logger.info("Downloading %s from %s …", fname, repo_id)
            paths[fname] = _download_file(repo_id, fname, cache_dir)
            logger.info("Downloaded → %s", paths[fname])

    return paths


def load_student_model(checkpoint_path: str, device: torch.device) -> torch.nn.Module:
    """Load the quantised EfficientNet-B0 student model.

    The checkpoint was saved after dynamic INT8 quantisation of the classifier
    head, so we must apply ``quantize_dynamic`` before loading the state dict.
    """
    model = create_student_model(num_classes=NUM_CLASSES)
    # Apply the same dynamic INT8 quantisation that was used during training
    # (quantises nn.Linear layers, including the final classifier head)
    model = torch.quantization.quantize_dynamic(
        model, {torch.nn.Linear}, dtype=torch.qint8
    )
    state_dict = torch.load(checkpoint_path, map_location=device, weights_only=True)
    model.load_state_dict(state_dict)
    model.eval()
    model.to(device)
    logger.info("✅ Student model (INT8 quantised) loaded from %s", checkpoint_path)
    return model


def load_rl_policy(checkpoint_path: str, device: torch.device) -> ThresholdPolicyNetwork:
    """Load the RL threshold policy network."""
    policy = ThresholdPolicyNetwork(state_dim=4, n_actions=20)
    state_dict = torch.load(checkpoint_path, map_location=device, weights_only=True)
    policy.load_state_dict(state_dict)
    policy.eval()
    policy.to(device)
    logger.info("✅ RL policy loaded from %s", checkpoint_path)
    return policy


def load_threshold_config(config_path: str) -> dict:
    """Load the threshold configuration JSON."""
    with open(config_path, "r") as f:
        cfg = json.load(f)
    logger.info(
        "✅ Threshold config loaded — deployment_threshold=%.4f, temperature=%.4f",
        cfg["deployment_threshold"],
        cfg["temperature"],
    )
    return cfg
