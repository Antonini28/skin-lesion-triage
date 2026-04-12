"""
Email sending via SMTP (aiosmtplib).
Set SMTP_USER + SMTP_PASSWORD env vars to enable real email delivery.
In development (no credentials) the OTP is logged to console instead.
"""
from __future__ import annotations

import logging
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

logger = logging.getLogger(__name__)

SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER: str = os.getenv("SMTP_USER", "")
SMTP_PASS: str = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM: str = os.getenv("SMTP_FROM", SMTP_USER)

_HTML_TEMPLATE = """\
<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;
            padding:32px;background:#f4f7fb;border-radius:16px;">
  <div style="background:#fff;border-radius:12px;padding:32px;text-align:center;
              box-shadow:0 4px 16px rgba(0,0,0,.09);">
    <div style="font-size:2.5rem;margin-bottom:12px;">🔬</div>
    <h2 style="color:#0f1c35;font-size:1.4rem;margin-bottom:8px;">SkinTriage AI</h2>
    <p style="color:#4a5568;margin-bottom:24px;">Hi {name}, here is your verification code:</p>
    <div style="background:#e8f0fd;border-radius:12px;padding:20px;margin-bottom:24px;">
      <span style="font-size:2.5rem;font-weight:800;color:#1a6fd4;letter-spacing:8px;">{code}</span>
    </div>
    <p style="color:#8a95a5;font-size:.85rem;">This code expires in 10 minutes.</p>
    <p style="color:#8a95a5;font-size:.78rem;margin-top:16px;">
      This tool does not provide a medical diagnosis.
      Always consult a qualified dermatologist.
    </p>
  </div>
</div>
"""


async def send_otp_email(to_email: str, otp_code: str, name: str = "there") -> bool:
    if not SMTP_USER or not SMTP_PASS:
        # Development fallback — print to logs so you can test without SMTP
        logger.warning(
            "⚠️  SMTP not configured. OTP for %s → %s  (set SMTP_USER / SMTP_PASSWORD)",
            to_email, otp_code,
        )
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your SkinTriage AI verification code"
    msg["From"]    = SMTP_FROM
    msg["To"]      = to_email
    msg.attach(MIMEText(_HTML_TEMPLATE.format(name=name, code=otp_code), "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASS,
            start_tls=True,
        )
        logger.info("OTP email sent to %s", to_email)
        return True
    except Exception as exc:
        logger.error("Failed to send OTP email to %s: %s", to_email, exc)
        return False
