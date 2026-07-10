"""
Scan history endpoints: save, list, toggle follow-up.
"""
from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import ScanHistory, User
from app.routes.auth import get_current_user
from app.schemas.auth import SaveScanRequest, ScanResponse

router = APIRouter(prefix="/scans", tags=["scans"])


@router.post("/save", response_model=ScanResponse)
async def save_scan(
    body: SaveScanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scan = ScanHistory(
        user_id                = current_user.id,
        predicted_class        = body.predicted_class,
        predicted_class_full   = body.predicted_class_full,
        risk_level             = body.risk_level,
        malignancy_probability = body.malignancy_probability,
        triage_recommendation  = body.triage_recommendation,
        confidence             = body.confidence,
        body_location          = body.body_location,
        image_thumb            = body.image_thumb,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


@router.get("/history", response_model=List[ScanResponse])
async def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(ScanHistory)
        .filter(ScanHistory.user_id == current_user.id)
        .order_by(ScanHistory.scanned_at.desc())
        .all()
    )


@router.put("/{scan_id}/followup", response_model=ScanResponse)
async def toggle_followup(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scan = db.query(ScanHistory).filter(
        ScanHistory.id == scan_id,
        ScanHistory.user_id == current_user.id,
    ).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    scan.followed_up    = not scan.followed_up
    scan.followed_up_at = datetime.utcnow() if scan.followed_up else None
    db.commit()
    db.refresh(scan)
    return scan
