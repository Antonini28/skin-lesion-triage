"""Pydantic schemas for the /chat (DermBot) endpoint."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    role: str            # 'user' | 'bot'
    text: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    # Prior conversation turns, oldest → newest, so DermBot can hold a thread.
    history: list[ChatTurn] = Field(default_factory=list)
    # Scan context is optional — DermBot also answers general skin-health
    # questions when the user hasn't run a scan.
    predicted_class: Optional[str] = None
    predicted_class_full_name: Optional[str] = None
    malignancy_probability: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    triage_recommendation: Optional[str] = None
    risk_level: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class ChatResponse(BaseModel):
    answer: str
    sources_used: int = Field(default=0, description="Number of RAG documents used")
    escalated: bool = Field(default=False, description="True if red-flag escalation fired")
    safety_filtered: bool = False
    disclaimer: str


class ImageChatResponse(BaseModel):
    """Response for /chat/image — the triage prediction plus DermBot's discussion."""
    answer: str
    sources_used: int = 0
    escalated: bool = False
    safety_filtered: bool = False
    disclaimer: str
    # Authoritative result from the trained triage model
    predicted_class: Optional[str] = None
    predicted_class_full_name: Optional[str] = None
    risk_level: Optional[str] = None
    malignancy_probability: Optional[float] = None
    triage_recommendation: Optional[str] = None
    confidence: Optional[float] = None
    not_detected: bool = False
