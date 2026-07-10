"""DermBot chat endpoints — POST /chat and POST /chat/image"""
from __future__ import annotations

import logging

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.schemas.chat import ChatRequest, ChatResponse, ImageChatResponse
from app.services.dermbot_service import DISCLAIMER

router = APIRouter(prefix="/chat", tags=["dermbot"])
logger = logging.getLogger(__name__)


@router.post("", response_model=ChatResponse)
async def chat(request: Request, body: ChatRequest):
    # DermBotService is attached to app.state during lifespan startup
    bot = getattr(request.app.state, "dermbot", None)
    if bot is None:
        raise HTTPException(
            status_code=503,
            detail="DermBot is still loading. Please try again in a few seconds.",
        )

    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        answer, sources_used, escalated, safety_filtered = bot.answer(
            question=question,
            predicted_class=body.predicted_class,
            predicted_class_full_name=body.predicted_class_full_name,
            malignancy_probability=body.malignancy_probability,
            triage_recommendation=body.triage_recommendation,
            risk_level=body.risk_level,
            confidence=body.confidence,
        )
    except Exception as exc:
        logger.error("DermBot answer failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="DermBot failed to generate a response.")

    return ChatResponse(
        answer=answer,
        sources_used=sources_used,
        escalated=escalated,
        safety_filtered=safety_filtered,
        disclaimer=DISCLAIMER,
    )


@router.post("/image", response_model=ImageChatResponse)
async def chat_image(
    request: Request,
    file: UploadFile = File(..., description="Skin lesion image (JPG/PNG)"),
    question: str = Form(""),
):
    """Classify an uploaded image with the trained model, then have DermBot
    discuss the result (hybrid: authoritative label + Gemini vision)."""
    inference = getattr(request.app.state, "inference", None)
    bot = getattr(request.app.state, "dermbot", None)
    if inference is None:
        raise HTTPException(status_code=503, detail="Model is still loading. Please try again in a few seconds.")
    if bot is None:
        raise HTTPException(status_code=503, detail="DermBot is still loading. Please try again in a few seconds.")

    if file.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}. Use JPEG or PNG.")

    image_bytes = await file.read()
    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="Uploaded file appears to be empty or corrupt.")
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    try:
        result = inference.predict(image_bytes)
    except Exception as exc:
        logger.error("Image chat inference failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Could not analyse that image. Please try a different one.")

    try:
        answer, sources_used, escalated, safety_filtered = bot.answer_with_image(
            image_bytes=image_bytes,
            mime_type=file.content_type,
            result=result,
            question=question,
        )
    except Exception as exc:
        logger.error("DermBot image answer failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="DermBot failed to describe that image.")

    return ImageChatResponse(
        answer=answer,
        sources_used=sources_used,
        escalated=escalated,
        safety_filtered=safety_filtered,
        disclaimer=DISCLAIMER,
        predicted_class=result.predicted_class,
        predicted_class_full_name=result.predicted_class_full_name,
        risk_level=result.risk_level,
        malignancy_probability=result.malignancy_probability,
        triage_recommendation=result.triage_recommendation,
        confidence=result.confidence,
        not_detected=getattr(result, "not_detected", False),
    )
