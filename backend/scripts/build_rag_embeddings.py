"""
One-time RAG index builder for DermBot (zero-cost / free-tier friendly).

Embeds the clinical knowledge base with the Gemini `text-embedding-004` model
and produces two artifacts that the backend loads at runtime:

    dermbot_embeddings.npy   float32 matrix [n_docs, 768]
    dermbot_docs.pkl         list[dict] with keys {text, source, title}

Then (optionally) uploads both to the Hugging Face Hub model repo so Render
can download them on startup.

────────────────────────────────────────────────────────────────────────────
USAGE
────────────────────────────────────────────────────────────────────────────
1. Get a FREE Gemini API key:  https://aistudio.google.com/app/apikey
2. Get a HF WRITE token:       https://huggingface.co/settings/tokens
3. Run from the backend/ directory:

    pip install google-genai huggingface-hub numpy
    setx GEMINI_API_KEY  "your-gemini-key"        # (open a new shell after)
    setx HF_TOKEN        "your-hf-write-token"
    python scripts/build_rag_embeddings.py \
        --docs ../checkpoints/dermbot_docs.pkl \
        --repo Stoic1344223/skin-lesion-triage-models \
        --upload

Omit --upload to only build the .npy locally (e.g. to sanity-check first).
"""

from __future__ import annotations

import argparse
import os
import pickle
import time
from pathlib import Path

import numpy as np

EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")
EMBED_DIM = int(os.getenv("GEMINI_EMBED_DIM", "768"))
BATCH = int(os.getenv("EMBED_BATCH", "25"))  # docs per embed_content request


def load_docs(path: Path) -> list[dict]:
    with open(path, "rb") as f:
        docs = pickle.load(f)
    print(f"Loaded {len(docs):,} documents from {path}")
    return docs


def doc_text(doc: dict) -> str:
    return (doc.get("text") or doc.get("answer") or doc.get("abstract") or "").strip()


PACE = float(os.getenv("PACE_SECONDS", "1.5"))   # gap between requests (free-tier RPM)
MAX_CHARS = int(os.getenv("EMBED_MAX_CHARS", "2000"))  # cap tokens/request


def embed_all(docs: list[dict], ckpt: Path | None = None) -> np.ndarray:
    """Embed every doc, pacing for free-tier limits and checkpointing to disk.

    Progress is saved to ``ckpt`` (a .npy of shape [done, EMBED_DIM]) after every
    batch, so a re-run resumes from where a rate-limit/interrupt left off.
    """
    import google.genai as genai
    from google.genai import types

    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise SystemExit("GEMINI_API_KEY is not set. See the header of this file.")
    client = genai.Client(api_key=key)
    cfg = types.EmbedContentConfig(
        output_dimensionality=EMBED_DIM, task_type="RETRIEVAL_DOCUMENT"
    )

    texts = [(doc_text(d) or " ")[:MAX_CHARS] for d in docs]

    # Resume from checkpoint if present.
    vectors: list[list[float]] = []
    if ckpt and ckpt.exists():
        prev = np.load(ckpt)
        vectors = prev.tolist()
        print(f"Resuming from checkpoint: {len(vectors):,} already embedded")

    t0 = time.time()
    start = len(vectors)
    while start < len(texts):
        batch = texts[start : start + BATCH]
        for attempt in range(9):
            try:
                resp = client.models.embed_content(model=EMBED_MODEL, contents=batch, config=cfg)
                embs = resp.embeddings if getattr(resp, "embeddings", None) else [resp.embedding]
                vectors.extend(e.values for e in embs)
                break
            except Exception as exc:
                wait = min(2 ** attempt, 90)
                print(f"  batch {start}: {str(exc)[:80]} — retry in {wait}s", flush=True)
                time.sleep(wait)
        else:
            # Persist partial progress before giving up so a re-run resumes.
            if ckpt:
                np.save(ckpt, np.asarray(vectors, dtype=np.float32))
            raise SystemExit(f"Stuck at batch {start} — checkpoint saved ({len(vectors)} done). Re-run to resume.")

        if ckpt:
            np.save(ckpt, np.asarray(vectors, dtype=np.float32))
        done = len(vectors)
        print(f"  embedded {done:,}/{len(texts):,}  ({time.time() - t0:.0f}s)", flush=True)
        start = done
        time.sleep(PACE)

    matrix = np.asarray(vectors, dtype=np.float32)[: len(texts)]
    print(f"Embeddings matrix: {matrix.shape}  ({matrix.nbytes / 1e6:.1f} MB)")
    return matrix


def upload(repo: str, embeddings_path: Path, docs_path: Path) -> None:
    from huggingface_hub import HfApi, login

    token = os.getenv("HF_TOKEN")
    if not token:
        raise SystemExit("HF_TOKEN is not set — cannot upload. Re-run with it set.")
    login(token=token)
    api = HfApi()
    for p in (embeddings_path, docs_path):
        print(f"Uploading {p.name} → {repo} …")
        api.upload_file(
            path_or_fileobj=str(p),
            path_in_repo=p.name,
            repo_id=repo,
            repo_type="model",
        )
    print("Upload complete. Trigger a manual redeploy on Render to pick them up.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--docs", default="../checkpoints/dermbot_docs.pkl")
    ap.add_argument("--out", default="../checkpoints/dermbot_embeddings.npy")
    ap.add_argument("--repo", default="Stoic1344223/skin-lesion-triage-models")
    ap.add_argument("--upload", action="store_true")
    args = ap.parse_args()

    docs_path = Path(args.docs)
    out_path = Path(args.out)

    docs = load_docs(docs_path)
    ckpt = out_path.with_suffix(".partial.npy")
    matrix = embed_all(docs, ckpt=ckpt)

    if matrix.shape[0] != len(docs):
        raise SystemExit(f"Count mismatch: {matrix.shape[0]} embeddings vs {len(docs)} docs")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    np.save(out_path, matrix)
    print(f"Saved embeddings → {out_path}")

    if args.upload:
        upload(args.repo, out_path, docs_path)


if __name__ == "__main__":
    main()
