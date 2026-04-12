"""
Skin Lesion Triage API — FastAPI application.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_URL
from app.schemas.prediction import HealthResponse, PredictionResponse
from app.services.inference import InferenceService
from app.services.model_loader import (
    download_all,
    load_rl_policy,
    load_student_model,
    load_threshold_config,
)
from app.config import (
    STUDENT_CHECKPOINT,
    RL_POLICY_CHECKPOINT,
    THRESHOLD_CONFIG_FILE,
)

# ──────────────────────────────────────────────
#  Logging
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
#  Shared state
# ──────────────────────────────────────────────
inference_service: InferenceService | None = None


# ──────────────────────────────────────────────
#  Lifespan (startup / shutdown)
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Download models from HF Hub and warm-up inference."""
    global inference_service

    device = torch.device("cpu")  # free tier — CPU only
    logger.info("🚀 Starting model download …")

    try:
        paths = download_all()

        model = load_student_model(paths[STUDENT_CHECKPOINT], device)
        threshold_cfg = load_threshold_config(paths[THRESHOLD_CONFIG_FILE])

        rl_policy = None
        try:
            rl_policy = load_rl_policy(paths[RL_POLICY_CHECKPOINT], device)
        except Exception as exc:
            logger.warning("RL policy failed to load – using static threshold: %s", exc)

        inference_service = InferenceService(
            model=model,
            rl_policy=rl_policy,
            threshold_config=threshold_cfg,
            device=device,
        )
        logger.info("✅ All models loaded — server ready!")
    except Exception as exc:
        logger.error("❌ Model loading failed: %s", exc, exc_info=True)
        # Server still starts so the /health endpoint can report status

    yield  # ← app runs here

    logger.info("Shutting down …")


# ──────────────────────────────────────────────
#  App
# ──────────────────────────────────────────────
app = FastAPI(
    title="Skin Lesion Triage API",
    description=(
        "Classify dermoscopic images into 7 lesion categories and provide "
        "a malignancy triage recommendation."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Vercel frontend + local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
#  Routes
# ──────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health_check():
    """Check if the model is loaded and ready for inference."""
    return HealthResponse(
        status="ok" if inference_service else "loading",
        model_loaded=inference_service is not None,
    )


@app.post("/predict", response_model=PredictionResponse, tags=["inference"])
async def predict(file: UploadFile = File(..., description="Skin lesion image (JPG/PNG)")):
    """
    Upload a dermoscopic image and receive a triage recommendation.

    Returns per-class probabilities, malignancy score, and a triage
    recommendation (REFER vs ROUTINE).
    """
    if inference_service is None:
        raise HTTPException(
            status_code=503,
            detail="Model is still loading. Please try again in a few seconds.",
        )

    # Validate content type
    if file.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Use JPEG or PNG.",
        )

    image_bytes = await file.read()

    # Guard against empty / corrupt uploads
    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="Uploaded file appears to be empty or corrupt.")

    if len(image_bytes) > 10 * 1024 * 1024:  # 10 MB
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    try:
        result = inference_service.predict(image_bytes)
    except Exception as exc:
        logger.error("Inference failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Inference failed. Please try a different image.")

    return result
