# SkinTriage AI — Skin Lesion Classification & Triage

An AI-powered web application that classifies dermoscopic skin lesion images into 7 clinical categories and provides a malignancy triage recommendation.

> **For educational / research use only. NOT a certified medical device.**

---

## Architecture

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | React + Vite | Vercel (free tier) |
| Backend | FastAPI + Uvicorn | Render (free tier) |
| ML Model | EfficientNet-B0 INT8 + RL threshold policy | Hugging Face Hub (free) |

---

## ML Pipeline

```
Image → Resize 224×224 → EfficientNet-B0 (INT8) → Temperature Scaling (T=1.099)
     → Softmax → Malignancy Score (mel+bcc+akiec) → RL Adaptive Threshold → Triage
```

**Model performance** (HAM10000 + ISIC 2019 + PH2 test sets):
- AUC: **0.909**
- Sensitivity: **97.3%** (at cost-sensitive threshold τ=0.131)
- Specificity: **54.7%**

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

### Step 2 — Deploy backend to Render

1. Push `skin_lesion_triage/backend/` to a GitHub repository
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo, set the **Root Directory** to `backend/`
4. Set environment variables in the Render dashboard:
   - `HF_REPO_ID` → `your-username/skin-lesion-triage-models`
   - `FRONTEND_URL` → *(set after Vercel deployment)*
   - `MODEL_CACHE_DIR` → `/tmp/models`
5. Deploy — Render builds the Docker image automatically

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
