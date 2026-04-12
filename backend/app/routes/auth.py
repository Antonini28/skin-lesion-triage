"""
Auth endpoints: /auth/register, /auth/login, /auth/verify-otp, /auth/me, /auth/profile
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import User
from app.schemas.auth import (
    LoginRequest, RegisterRequest, TokenResponse, UpdateProfileRequest,
    UserResponse, VerifyOTPRequest,
)
from app.services import auth_service
from app.services.email_service import send_otp_email

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Dependency: current authenticated user ────────────────────────────────────

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


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register")
async def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = auth_service.get_user_by_email(db, body.email)
    if existing and existing.is_verified:
        raise HTTPException(
            status_code=400,
            detail="Email already registered. Please log in instead.",
        )

    # Create (or re-use unverified) user
    user = existing or auth_service.create_user(
        db, body.email, body.name, body.gender, body.year_of_birth
    )
    # Update details if re-registering
    if existing:
        user.name, user.gender, user.year_of_birth = body.name, body.gender, body.year_of_birth
        db.commit()

    code = auth_service.create_otp(db, body.email)
    await send_otp_email(body.email, code, body.name)
    return {"message": f"Verification code sent to {body.email}"}


@router.post("/login")
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.get_user_by_email(db, body.email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with that email. Please register first.",
        )
    code = auth_service.create_otp(db, body.email)
    await send_otp_email(body.email, code, user.name)
    return {"message": f"Verification code sent to {body.email}"}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(body: VerifyOTPRequest, db: Session = Depends(get_db)):
    user = auth_service.get_user_by_email(db, body.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not auth_service.verify_otp(db, body.email, body.code):
        raise HTTPException(status_code=400, detail="Invalid or expired code. Please try again.")

    user.is_verified = True
    db.commit()
    db.refresh(user)

    token = auth_service.create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


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
