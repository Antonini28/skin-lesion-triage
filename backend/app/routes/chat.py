"""DermBot chat endpoint — POST /chat"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

from app.schemas.chat import ChatRequest, ChatResponse
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
