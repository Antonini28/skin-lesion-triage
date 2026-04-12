# ─────────────────────────────────────────────────
#  Skin Lesion Triage API — Docker Image
# ─────────────────────────────────────────────────
FROM python:3.11-slim

# Prevent Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies first (cacheable layer)
# CPU-only PyTorch wheel index is passed on the command line for reliability
COPY requirements.txt .
RUN pip install --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements.txt

# Copy application code
COPY app/ ./app/

# Expose port (Render injects $PORT at runtime)
EXPOSE 8000

# Start with Uvicorn — Render sets $PORT automatically
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
