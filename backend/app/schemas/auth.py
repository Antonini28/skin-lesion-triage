"""
Pydantic schemas for auth and scan-history endpoints.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email:         EmailStr
    name:          str
    gender:        str   # 'male' | 'female'
    year_of_birth: int


class LoginRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    code:  str


class UpdateProfileRequest(BaseModel):
    name:            Optional[str] = None
    gender:          Optional[str] = None
    year_of_birth:   Optional[int] = None
    profile_picture: Optional[str] = None   # base64 data-URL


class UserResponse(BaseModel):
    id:              int
    email:           str
    name:            str
    gender:          Optional[str]
    year_of_birth:   Optional[int]
    profile_picture: Optional[str]
    is_verified:     bool
    created_at:      datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserResponse


# ── Scans ─────────────────────────────────────────────────────────────────────

class SaveScanRequest(BaseModel):
    predicted_class:        str
    predicted_class_full:   str
    risk_level:             str
    malignancy_probability: float
    triage_recommendation:  str
    confidence:             float


class ScanResponse(BaseModel):
    id:                     int
    predicted_class:        str
    predicted_class_full:   str
    risk_level:             str
    malignancy_probability: float
    triage_recommendation:  str
    confidence:             float
    scanned_at:             datetime
    followed_up:            bool
    followed_up_at:         Optional[datetime]

    model_config = {"from_attributes": True}
