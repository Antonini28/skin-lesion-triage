"""
Skin Lesion Triage API — FastAPI application.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    DOCS_STORE_FILE,
    FRONTEND_URL,
    GEMINI_EMBED_DIM,
    GEMINI_EMBED_MODEL,
    RAG_EMBEDDINGS_FILE,
    RAG_TOP_K,
    RL_POLICY_CHECKPOINT,
    STUDENT_CHECKPOINT,
    THRESHOLD_CONFIG_FILE,
)
from app.database import Base, engine
from app.models import db_models  # noqa: F401 — registers ORM models with Base
from app.routes import auth as auth_routes
from app.routes import chat as chat_routes
from app.routes import scans as scans_routes
from app.schemas.prediction import HealthResponse, PredictionResponse
from app.services.dermbot_service import DermBotService, build_gemini_client
from app.services.inference import InferenceService
from app.services.model_loader import (
    download_all,
    download_rag_artifacts,
    load_rl_policy,
    load_student_model,
    load_threshold_config,
)
from app.services.rag_service import RAGService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

inference_service: InferenceService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global inference_service

    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created/verified")

    device = torch.device("cpu")
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
        app.state.inference = inference_service  # used by /chat/image
        logger.info("✅ Inference models loaded")
    except Exception as exc:
        logger.error("❌ Model loading failed: %s", exc, exc_info=True)

    # ── DermBot (RAG + Gemini) ─────────────────────────────────────────────
    # Never fatal to prediction: any failure here leaves /predict working and
    # DermBot degrades to LLM-only (or static) answers.
    try:
        gemini_client = build_gemini_client()

        rag = None
        rag_paths = download_rag_artifacts()
        if rag_paths:
            try:
                rag = RAGService(
                    embeddings_path=rag_paths[RAG_EMBEDDINGS_FILE],
                    docs_path=rag_paths[DOCS_STORE_FILE],
                    gemini_client=gemini_client,
                    embed_model=GEMINI_EMBED_MODEL,
                    embed_dim=GEMINI_EMBED_DIM,
                    top_k=RAG_TOP_K,
                )
            except Exception as exc:
                logger.warning("RAG index failed to load — LLM-only DermBot: %s", exc)
        else:
            logger.info("RAG artifacts not found — DermBot running LLM-only")

        app.state.dermbot = DermBotService(rag=rag, gemini_client=gemini_client)
        logger.info("✅ DermBot ready (RAG=%s, Gemini=%s)",
                    "on" if rag else "off",
                    "on" if gemini_client else "off")
    except Exception as exc:
        logger.error("❌ DermBot loading failed: %s", exc, exc_info=True)
        app.state.dermbot = None

    yield
    logger.info("Shutting down …")


app = FastAPI(
    title="Skin Lesion Triage API",
    description=(
        "Classify dermoscopic images into 7 lesion categories (plus a "
        "no-lesion class) and provide a malignancy triage recommendation."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://skin-lesion-triage.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_routes.router)
app.include_router(scans_routes.router)
app.include_router(chat_routes.router)


# ── Core endpoints ────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health_check():
    return HealthResponse(
        status="ok" if inference_service else "loading",
        model_loaded=inference_service is not None,
    )


@app.post("/predict", response_model=PredictionResponse, tags=["inference"])
async def predict(file: UploadFile = File(..., description="Skin lesion image (JPG/PNG)")):
    if inference_service is None:
        raise HTTPException(status_code=503, detail="Model is still loading. Please try again in a few seconds.")

    if file.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}. Use JPEG or PNG.")

    image_bytes = await file.read()

    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="Uploaded file appears to be empty or corrupt.")
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    try:
        result = inference_service.predict(image_bytes)
    except Exception as exc:
        logger.error("Inference failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Inference failed. Please try a different image.")

    return result
