"""Pydantic schemas for the /chat (DermBot) endpoint."""
from __future__ import annotations
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    predicted_class: str
    predicted_class_full_name: str
    malignancy_probability: float = Field(..., ge=0.0, le=1.0)
    triage_recommendation: str
    risk_level: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class ChatResponse(BaseModel):
    answer: str
    sources_used: int = Field(default=0, description="Number of RAG documents used")
    escalated: bool = Field(default=False, description="True if red-flag escalation fired")
    safety_filtered: bool = False
    disclaimer: str
