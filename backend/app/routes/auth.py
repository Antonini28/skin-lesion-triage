"""
Auth endpoints: register, login, me, profile update.
Standard email + password — no OTP, no email service required.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import User
from app.schemas.auth import (
    LoginRequest, RegisterRequest, TokenResponse,
    UpdateProfileRequest, UserResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Dependency ────────────────────────────────────────────────────────────────

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    user_id = auth_service.verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = auth_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Register ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if auth_service.get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="Email already registered. Please log in.")

    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    user  = auth_service.create_user(
        db, body.email, body.password,
        body.name, body.gender, body.year_of_birth,
    )
    token = auth_service.create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.get_user_by_email(db, body.email)
    if not user or not auth_service.verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    token = auth_service.create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ── Me / Profile ──────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.name            is not None: current_user.name            = body.name
    if body.gender          is not None: current_user.gender          = body.gender
    if body.year_of_birth   is not None: current_user.year_of_birth   = body.year_of_birth
    if body.profile_picture is not None: current_user.profile_picture = body.profile_picture
    db.commit()
    db.refresh(current_user)
    return current_user
