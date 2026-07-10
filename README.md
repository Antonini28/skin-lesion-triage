# SkinTriage AI — Skin Lesion Classification & Triage

An AI-powered web application that classifies dermoscopic skin lesion images into
7 clinical lesion categories (plus a no-lesion class) and provides a malignancy
triage recommendation. It also includes **DermBot**, a grounded clinical chat
assistant that explains results using Retrieval-Augmented Generation over an
8,719-document knowledge base.

> **For educational / research use only. NOT a certified medical device.**

---

## Architecture

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | React + Vite | Vercel (free tier) |
| Backend | FastAPI + Uvicorn | Render (free tier) |
| ML Model | EfficientNet-B0 INT8 + RL threshold policy | Hugging Face Hub (free) |
| DermBot | Gemini 2.0 Flash + Gemini-embedding RAG (numpy cosine) | Google AI Studio (free tier) |

DermBot runs **without any local ML model** — document retrieval uses pre-computed
Gemini embeddings scored with a single numpy dot product, so the whole backend
fits inside Render's free 512 MB tier. If the Gemini key or RAG artifacts are
absent, DermBot degrades gracefully (LLM-only, then static clinical responses)
and image prediction is never affected.

---

## ML Pipeline

```
Image → Resize 224×224 → EfficientNet-B0 (INT8) → Temperature Scaling (T=1.099)
     → Softmax → Malignancy Score (mel+bcc+akiec) → RL Adaptive Threshold → Triage
```

**Model performance** (8-class model — HAM10000 + ISIC 2019 + PH2 test sets):
- AUC: **0.944**
- Cost-sensitive deployment threshold τ = **0.156**, temperature T = **1.293**

### Lesion Classes

| Code | Full Name | Risk |
|------|-----------|------|
| `akiec` | Actinic Keratoses | Pre-malignant |
| `bcc` | Basal Cell Carcinoma | MALIGNANT |
| `bkl` | Benign Keratosis | Benign |
| `df` | Dermatofibroma | Benign |
| `mel` | Melanoma | MALIGNANT |
| `nv` | Melanocytic Nevi | Benign |
| `vasc` | Vascular Lesions | Benign |

---

## Zero-Cost Deployment

### Step 1 — Upload models to Hugging Face Hub

```bash
pip install huggingface-hub

# Login (create a free account at huggingface.co first)
huggingface-cli login

# Create a public model repo
huggingface-cli repo create skin-lesion-triage-models --type model

# Upload the 3 required checkpoint files (NOT the large teacher models)
cd skin_lesion_triage/checkpoints
huggingface-cli upload YOUR_USERNAME/skin-lesion-triage-models \
    student_quantised_int8.pt \
    rl_threshold_policy.pt \
    threshold_config.json
```

### Step 1b — Build the DermBot RAG index (optional but recommended)

DermBot's grounded answers need two artifacts on the HF Hub repo:
`dermbot_docs.pkl` (the 8,719-doc knowledge base) and `dermbot_embeddings.npy`
(Gemini embeddings of those docs). Build and upload both with one command:

```bash
cd backend
pip install google-genai huggingface-hub numpy

# free Gemini key: https://aistudio.google.com/app/apikey
# HF write token: https://huggingface.co/settings/tokens
export GEMINI_API_KEY="your-gemini-key"
export HF_TOKEN="your-hf-write-token"

python scripts/build_rag_embeddings.py \
    --docs ../checkpoints/dermbot_docs.pkl \
    --repo YOUR_USERNAME/skin-lesion-triage-models \
    --upload
```

Skip this and DermBot still runs — it just answers from the LLM's own knowledge
instead of retrieved clinical passages.

### Step 2 — Deploy backend to Render

1. Push `skin_lesion_triage/backend/` to a GitHub repository
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo, set the **Root Directory** to `backend/`
4. Set environment variables in the Render dashboard:
   - `HF_REPO_ID` → `your-username/skin-lesion-triage-models`
   - `FRONTEND_URL` → *(set after Vercel deployment)*
   - `MODEL_CACHE_DIR` → `/tmp/models`
   - `GEMINI_API_KEY` → *(free key from [Google AI Studio](https://aistudio.google.com/app/apikey) — enables DermBot chat)*
5. Deploy — Render builds the Docker image automatically

> **DermBot works without a Gemini key** (static clinical responses), but a free
> key unlocks conversational, RAG-grounded answers.

### Step 3 — Deploy frontend to Vercel

1. Push `skin_lesion_triage/frontend/` to a GitHub repository (can be same repo)
2. Go to [vercel.com](https://vercel.com) → **Import Project**
3. Set build settings:
   - **Framework**: Vite
   - **Root Directory**: `frontend/`
4. Set environment variable:
   - `VITE_API_URL` → your Render backend URL (e.g. `https://skin-lesion-api.onrender.com`)
5. Deploy

### Step 4 — Wire CORS

Back in Render, update `FRONTEND_URL` with your actual Vercel app URL and redeploy.

---

## Local Development

### Backend

```bash
cd backend

# Install dependencies (CPU-only PyTorch)
pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Run the API (models load from ../checkpoints/ automatically)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

npm install
npm run dev
```

App available at: `http://localhost:5173`

---

## Project Structure

```
skin_lesion_triage/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py             # FastAPI app, CORS, /predict & /health routes
│   │   ├── config.py           # Settings & class definitions
│   │   ├── models/             # Model architectures
│   │   ├── services/           # Inference pipeline & model loader
│   │   ├── schemas/            # Pydantic request/response models
│   │   └── utils/              # Image transforms
│   ├── Dockerfile
│   ├── render.yaml             # Render deployment blueprint
│   └── requirements.txt
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Header, ImageUpload, ResultsPanel, etc.
│   │   ├── pages/              # Home, About
│   │   ├── api/client.js       # Axios API client
│   │   └── index.css           # Design system
│   ├── vercel.json             # Vercel SPA routing
│   └── package.json
├── checkpoints/                # Model weights (NOT deployed to Render)
│   ├── student_quantised_int8.pt   # ~16 MB — deployed to HF Hub
│   ├── rl_threshold_policy.pt      # ~26 KB — deployed to HF Hub
│   └── threshold_config.json       # Thresholds + temperature
└── pipeline_config.json        # Training configuration reference
```

---

## Free Tier Limits

| Service | Limit | Impact |
|---------|-------|--------|
| Render free | 512 MB RAM, spins down after 15 min idle | ~30-60s cold start on first request |
| Render free | 750 h/month | Covers a single service 24/7 |
| Vercel Hobby | 100 GB bandwidth | More than sufficient for a static SPA |
| HF Hub public | Unlimited storage | Stores ~16 MB of model files |

The frontend shows a "Server offline — first request will wake it" badge and uses a 2-minute timeout to handle Render cold starts gracefully.
