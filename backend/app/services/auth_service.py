"""
Auth helpers: password hashing (stdlib only), JWT, user CRUD.
No external dependencies beyond python-jose.
"""
from __future__ import annotations

import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.models.db_models import User

SECRET_KEY: str = os.getenv("SECRET_KEY", "skintriage-dev-secret-change-in-production-32chars")
ALGORITHM:  str = "HS256"
TOKEN_EXPIRE_HOURS: int = 24 * 7   # 7 days

_ITERATIONS = 260_000


# ── Password hashing (PBKDF2-HMAC-SHA256, stdlib) ─────────────────────────────

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk   = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _ITERATIONS)
    return f"pbkdf2:sha256:{salt}:{dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, _, salt, dk_hex = stored.split(":")
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _ITERATIONS)
        return secrets.compare_digest(dk.hex(), dk_hex)
    except Exception:
        return False


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


def create_user(
    db: Session, email: str, password: str,
    name: str, gender: str, year_of_birth: int,
) -> User:
    user = User(
        email         = email,
        password_hash = hash_password(password),
        name          = name,
        gender        = gender,
        year_of_birth = year_of_birth,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
