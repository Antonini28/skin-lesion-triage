"""
Auth helpers: OTP generation, JWT creation/verification, user CRUD.
"""
from __future__ import annotations

import os
import random
import string
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.models.db_models import OTPCode, User

SECRET_KEY: str = os.getenv("SECRET_KEY", "skintriage-dev-secret-change-in-production-32chars")
ALGORITHM:  str = "HS256"
TOKEN_EXPIRE_HOURS: int = 24 * 7   # 7 days


# ── OTP ───────────────────────────────────────────────────────────────────────

def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def create_otp(db: Session, email: str) -> str:
    """Invalidate old OTPs for this email and create a fresh one."""
    db.query(OTPCode).filter(
        OTPCode.email == email, OTPCode.used == False
    ).update({"used": True})
    db.commit()

    code = generate_otp()
    db.add(OTPCode(
        email=email,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    ))
    db.commit()
    return code


def verify_otp(db: Session, email: str, code: str) -> bool:
    row = db.query(OTPCode).filter(
        OTPCode.email      == email,
        OTPCode.code       == code,
        OTPCode.used       == False,
        OTPCode.expires_at >  datetime.utcnow(),
    ).first()
    if not row:
        return False
    row.used = True
    db.commit()
    return True


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None


# ── User CRUD ─────────────────────────────────────────────────────────────────

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, email: str, name: str, gender: str, year_of_birth: int) -> User:
    user = User(email=email, name=name, gender=gender, year_of_birth=year_of_birth)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
