"""
ORM models: User, ScanHistory.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    name            = Column(String, nullable=False)
    password_hash   = Column(String, nullable=False)
    gender          = Column(String)          # 'male' | 'female'
    year_of_birth   = Column(Integer)
    profile_picture = Column(Text)            # base64 data-URL
    created_at      = Column(DateTime, default=datetime.utcnow)

    scans = relationship("ScanHistory", back_populates="user", cascade="all, delete-orphan")


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id                      = Column(Integer, primary_key=True, index=True)
    user_id                 = Column(Integer, ForeignKey("users.id"), nullable=False)
    predicted_class         = Column(String)
    predicted_class_full    = Column(String)
    risk_level              = Column(String)
    malignancy_probability  = Column(Float)
    triage_recommendation   = Column(String)
    confidence              = Column(Float)
    body_location           = Column(String, nullable=True)   # e.g. "Left forearm" — for mole tracking
    image_thumb             = Column(Text, nullable=True)     # small base64 JPEG data-URL
    scanned_at              = Column(DateTime, default=datetime.utcnow)
    followed_up             = Column(Boolean, default=False)
    followed_up_at          = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="scans")
