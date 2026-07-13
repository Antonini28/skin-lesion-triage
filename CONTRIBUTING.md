# Contributing to SkinSense

Thanks for your interest in contributing! This document explains how to set up a
development environment and submit changes.

## Development setup

### Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # fill in your own keys
uvicorn app.main:app --reload
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Making changes

1. Fork the repository and create a branch from `main`:
   `git checkout -b feat/short-description`
2. Keep changes focused — one feature or fix per pull request.
3. Follow the existing code style. Frontend code is linted with ESLint
   (`npm run lint` inside `frontend/`); backend code should pass
   `ruff check backend/`.
4. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit
   messages: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`.
5. Open a pull request against `main` and fill in the PR template.

## Reporting bugs and requesting features

Use the issue templates under **Issues → New issue**. Please include
reproduction steps, expected vs. actual behaviour, and environment details.

## Medical-safety scope

SkinSense is an educational/research project, **not a medical device**.
Contributions that weaken the safety pipeline (red-flag escalation, disclaimer
handling, prompt-injection blocking) will not be accepted without a thorough
discussion first — open an issue before starting work in that area.

## Code of Conduct

By participating you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).
