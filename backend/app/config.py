"""
Application configuration – loaded from environment variables.
"""

import os
from pathlib import Path

# ──────────────────────────────────────────────
#  DermBot / Gemini
# ──────────────────────────────────────────────
# Generation model (chat answers) + embedding model (RAG query encoding).
# Both run through the free Gemini API — no local ML model is loaded at
# runtime, so DermBot fits comfortably inside Render's 512 MB free tier.
GEMINI_API_KEY:     str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL:       str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_EMBED_MODEL: str = os.getenv("GEMINI_EMBED_MODEL", "text-embedding-004")

# ──────────────────────────────────────────────
#  RAG artifacts (stored in HF Hub repo, optional)
# ──────────────────────────────────────────────
# Pre-computed once with build_rag_embeddings.py and uploaded to HF Hub.
#   dermbot_embeddings.npy → float32 matrix [n_docs, 768] (Gemini embeddings)
#   dermbot_docs.pkl       → list[dict] with keys {text, source, title}
# If these are absent, DermBot degrades gracefully to LLM-only answers.
RAG_EMBEDDINGS_FILE: str = "dermbot_embeddings.npy"
DOCS_STORE_FILE:     str = "dermbot_docs.pkl"
RAG_TOP_K:           int = 5

# ──────────────────────────────────────────────
#  Hugging Face Hub
# ──────────────────────────────────────────────
HF_REPO_ID: str = os.getenv("HF_REPO_ID", "Stoic1344223/skin-lesion-triage-models")
MODEL_CACHE_DIR: str = os.getenv("MODEL_CACHE_DIR", "/tmp/models")

# ──────────────────────────────────────────────
#  CORS
# ──────────────────────────────────────────────
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://skin-lesion-triage-gxic.vercel.app")

# ──────────────────────────────────────────────
#  Model / Pipeline
# ──────────────────────────────────────────────
NUM_CLASSES: int = 8

CLASS_NAMES: list[str] = [
    "akiec", "bcc", "bkl", "df", "mel", "nv", "vasc", "no_lesion"
]

CLASS_TO_IDX: dict[str, int] = {c: i for i, c in enumerate(CLASS_NAMES)}
IDX_TO_CLASS: dict[int, str] = {i: c for i, c in enumerate(CLASS_NAMES)}

MALIGNANT_CLASSES: set[str] = {"mel", "bcc", "akiec"}
MALIGNANT_INDICES: list[int] = sorted(CLASS_TO_IDX[c] for c in MALIGNANT_CLASSES)
BENIGN_INDICES: list[int] = sorted(
    CLASS_TO_IDX[c] for c in CLASS_NAMES if c not in MALIGNANT_CLASSES
)

CLASS_INFO: dict[str, dict] = {
    "akiec":     {"full": "Actinic Keratoses",   "risk": "Pre-malignant", "colour": "#f39c12"},
    "bcc":       {"full": "Basal Cell Carcinoma", "risk": "MALIGNANT",     "colour": "#e67e22"},
    "bkl":       {"full": "Benign Keratosis",     "risk": "Benign",        "colour": "#3498db"},
    "df":        {"full": "Dermatofibroma",        "risk": "Benign",        "colour": "#1abc9c"},
    "mel":       {"full": "Melanoma",             "risk": "MALIGNANT",     "colour": "#e74c3c"},
    "nv":        {"full": "Melanocytic Nevi",     "risk": "Benign",        "colour": "#2ecc71"},
    "vasc":      {"full": "Vascular Lesions",     "risk": "Benign",        "colour": "#9b59b6"},
    "no_lesion": {"full": "No Skin Lesion",       "risk": "None",          "colour": "#27ae60"},
}

IMAGENET_MEAN: list[float] = [0.485, 0.456, 0.406]
IMAGENET_STD: list[float] = [0.229, 0.224, 0.225]
IMAGE_SIZE: int = 224

# Checkpoint filenames expected in HF repo
STUDENT_CHECKPOINT: str = "student_quantised_int8.pt"
RL_POLICY_CHECKPOINT: str = "rl_threshold_policy.pt"
THRESHOLD_CONFIG_FILE: str = "threshold_config.json"
PIPELINE_CONFIG_FILE: str = "pipeline_config.json"

# RL threshold grid (must match training)
RL_THRESHOLD_GRID: list[float] = [round(0.1 + i * (0.8 / 19), 6) for i in range(20)]
