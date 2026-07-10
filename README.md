# SkinSense — AI Skin Lesion Triage + DermBot Assistant

SkinSense is an AI-powered web app that pairs a **computer-vision triage model** with
**DermBot, a conversational clinical LLM assistant**. Upload a dermoscopic image and the
vision model classifies the lesion and gives a malignancy triage recommendation; then chat
with DermBot to understand what the result means, ask general skin-health questions, or upload
a photo for it to discuss — all grounded in clinical dermatology literature.

> **For educational / research use only. NOT a certified medical device.**

---

## Two AI systems, working together

| System | What it does | Technology |
|--------|--------------|-----------|
| **Vision triage model** | Classifies a lesion into 7 lesion classes (+ a "no-lesion" class) and produces a calibrated malignancy score → triage decision | EfficientNet-B0 (INT8) + temperature scaling + RL-adaptive threshold |
| **DermBot (LLM)** | Conversational assistant that explains results, answers skin-health questions, and discusses uploaded photos | Gemini 2.5 Flash + retrieval-augmented generation (RAG) over 8,719 clinical documents |

DermBot is not a bolt-on chatbot — it is a core half of the product. It holds a real
back-and-forth conversation, retrieves supporting passages from a clinical knowledge base
before answering, and runs a multi-layer safety pipeline (prompt-injection blocking, red-flag
symptom escalation, self-treatment warnings, and output filtering).

---

## Architecture

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | React + Vite | Vercel (free tier) |
| Backend | FastAPI + Uvicorn | Render (free tier) |
| Vision model | EfficientNet-B0 INT8 + RL threshold policy | Hugging Face Hub (free) |
| DermBot LLM | Gemini 2.5 Flash (chat) + Gemini embeddings (retrieval) | Google AI Studio (free tier) |
| RAG index | Pre-computed embeddings + numpy cosine search | Hugging Face Hub (free) |

The whole stack is designed to run at **zero cost**: the RAG retrieval uses pre-computed
Gemini embeddings and an in-memory numpy search (no 500 MB embedding model), so DermBot fits
inside Render's free 512 MB tier alongside the vision model.

---

## Vision triage pipeline

```
Image → Resize 224×224 → EfficientNet-B0 (INT8) → Temperature Scaling (T=1.29)
     → Softmax → Malignancy Score (mel+bcc+akiec) → RL Adaptive Threshold → Triage
```

**Model performance** (HAM10000 + ISIC 2019 + PH2 test sets):
- **AUC: 0.944**
- Cost-sensitive deployment threshold **τ = 0.156** (tuned to favour sensitivity — it is safer
  to over-refer than to miss a malignancy)
- 8-class output including a dedicated **`no_lesion`** class so non-lesion / unclear photos are
  flagged rather than force-classified

### Lesion classes

| Code | Full Name | Risk |
|------|-----------|------|
| `akiec` | Actinic Keratoses | Pre-malignant |
| `bcc` | Basal Cell Carcinoma | MALIGNANT |
| `bkl` | Benign Keratosis | Benign |
| `df` | Dermatofibroma | Benign |
| `mel` | Melanoma | MALIGNANT |
| `nv` | Melanocytic Nevi | Benign |
| `vasc` | Vascular Lesions | Benign |
| `no_lesion` | No skin lesion detected | None |

---

## DermBot (LLM) pipeline

Every DermBot message flows through:

```
User message (+ conversation history, + optional scan context / image)
  1. Input safety check    — block prompt injection
  2. Escalation layer      — red-flag symptoms → urgent guidance (skip LLM)
  3. RAG retrieval         — Gemini-embed the query → numpy cosine search → top-5 passages
  4. Gemini 2.5 Flash      — grounded, in-context, conversational reply
  5. Output safety wrap    — dangerous-output filter + high-risk referral
```

Key behaviours:
- **Conversational** — the last several turns are sent as history, so DermBot follows up and
  resolves references ("is *it* dangerous?") instead of answering each message in isolation.
- **Image chat (hybrid)** — when a photo is uploaded in the chat, the trained vision model
  produces the authoritative label and DermBot discusses it with Gemini vision, anchored to
  that label so it never freelances a contradictory diagnosis.
- **Graceful degradation** — if the Gemini key or RAG index is missing, DermBot falls back to
  LLM-only or static clinical responses, and image triage is never affected.

---

## Features

- **Scan triage** — upload a lesion image, get a calibrated risk + triage recommendation.
- **DermBot assistant** — always-available floating chat; answers stream in as they're written.
- **Mole tracking** — tag a scan with a body location; the Tracking page groups scans per spot
  into a dated timeline with a per-spot risk trend (risk up / down / stable).
- **Scan history & follow-ups** — logged-in users get a saved record and follow-up tracking.
- **UV Index** — daily UV guidance.

---

## Zero-Cost Deployment

### Step 1 — Vision + RAG artifacts on Hugging Face Hub

Upload the checkpoint files and the DermBot RAG artifacts to a free HF model repo:
`student_quantised_int8.pt`, `rl_threshold_policy.pt`, `threshold_config.json`,
`dermbot_embeddings.npy`, `dermbot_docs.pkl`.

The RAG embeddings are built once with [`backend/scripts/build_rag_embeddings.py`](backend/scripts/build_rag_embeddings.py).

### Step 2 — Backend on Render

1. New **Web Service** → connect this repo → **Root Directory** `backend/`.
2. Environment variables:
   - `HF_REPO_ID` → `your-username/skin-lesion-triage-models`
   - `GEMINI_API_KEY` → your free key from [aistudio.google.com](https://aistudio.google.com/app/apikey) *(enables DermBot chat)*
   - `FRONTEND_URL` → *(your Vercel URL, set after Step 3)*
   - `MODEL_CACHE_DIR` → `/tmp/models`
   - `DATABASE_URL` → *(optional — a free Postgres for persistent accounts/history; SQLite in `/tmp` otherwise)*

### Step 3 — Frontend on Vercel

1. **Import Project** → **Framework** Vite → **Root Directory** `frontend/`.
2. Environment variable: `VITE_API_URL` → your Render backend URL.

### Step 4 — Wire CORS

Set `FRONTEND_URL` in Render to your Vercel URL and redeploy.

---

## Local Development

### Backend
```bash
cd backend
pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
API docs at `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App at `http://localhost:5173`.

---

## Project Structure

```
skin_lesion_triage/
├── backend/                       # FastAPI backend
│   ├── app/
│   │   ├── main.py                # App, CORS, model + DermBot startup
│   │   ├── routes/                # /predict, /chat, /chat/image, /scans, /auth
│   │   ├── services/
│   │   │   ├── inference.py       # Vision triage pipeline
│   │   │   ├── dermbot_service.py # DermBot orchestration + safety
│   │   │   ├── rag_service.py     # Gemini-embedding RAG retrieval
│   │   │   └── model_loader.py    # HF Hub downloads (models + RAG artifacts)
│   │   └── ...
│   ├── scripts/build_rag_embeddings.py   # One-time RAG index builder
│   └── requirements.txt
├── frontend/                      # React + Vite frontend
│   └── src/
│       ├── components/            # ScanModal, ResultsPanel, DermBotChat, …
│       └── pages/                 # Inbox, Tracking, UVIndex, Account, …
├── docs/                          # Slides + written reports
│   ├── slides/                    # Conference + vlog decks
│   └── reports/                   # Horizon Scan reports, DocBot implementation plan
└── checkpoints/                   # Model weights (not committed — pulled from HF Hub)
```

---

## Free Tier Notes

| Service | Limit | Impact |
|---------|-------|--------|
| Render free | 512 MB RAM, spins down after 15 min idle | ~30–60 s cold start on first request |
| Render free | SQLite in `/tmp` resets on restart | Set `DATABASE_URL` (free Postgres) for persistent accounts/history |
| Gemini free | Per-model daily quota | DermBot uses `gemini-2.5-flash`; falls back to static replies if exhausted |
| Vercel Hobby | 100 GB bandwidth | Ample for a static SPA |
| HF Hub public | Unlimited storage | Stores ~16 MB vision model + ~30 MB RAG index |

The frontend shows a "server waking up" notice and uses a long timeout to handle Render cold
starts gracefully.
