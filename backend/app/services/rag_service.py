"""
RAG retrieval service — Gemini embeddings + in-memory numpy cosine search.

Design goal: run inside Render's free tier (512 MB RAM). We therefore do
NOT load a local embedding model. Instead:

  • Documents are pre-embedded offline (build_rag_embeddings.py) with the
    Gemini `text-embedding-004` model and stored as a float32 matrix.
  • At query time we embed only the question via the Gemini API and score it
    against the pre-computed matrix with a single numpy dot product.

Memory footprint = the embeddings matrix (8,719 × 768 × 4 B ≈ 27 MB) plus
the document store — no PyTorch, no sentence-transformers, no FAISS.

If artifacts or the API key are missing, `retrieve()` returns an empty list
and DermBot degrades to LLM-only answers.
"""

from __future__ import annotations

import logging
import pickle
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)


class RAGService:
    def __init__(
        self,
        embeddings_path: str,
        docs_path: str,
        gemini_client=None,
        embed_model: str = "gemini-embedding-001",
        embed_dim: int = 768,
        top_k: int = 5,
    ) -> None:
        self.top_k = top_k
        self._gemini = gemini_client
        self._embed_model = embed_model
        self._embed_dim = embed_dim
        self._matrix: Optional[np.ndarray] = None
        self._docs: list[dict] = []

        # ── Load pre-computed embeddings matrix ───────────────────────────
        logger.info("Loading RAG embeddings from %s …", embeddings_path)
        matrix = np.load(embeddings_path).astype(np.float32)
        # L2-normalise rows so cosine similarity == dot product.
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self._matrix = matrix / norms
        logger.info("RAG embeddings loaded — %s", self._matrix.shape)

        # ── Load document store ───────────────────────────────────────────
        logger.info("Loading document store from %s …", docs_path)
        with open(docs_path, "rb") as f:
            self._docs = pickle.load(f)
        logger.info("Document store loaded — %d documents", len(self._docs))

        if self._matrix.shape[0] != len(self._docs):
            logger.warning(
                "RAG mismatch: %d embeddings vs %d docs — retrieval disabled",
                self._matrix.shape[0],
                len(self._docs),
            )
            self._matrix = None

    # ──────────────────────────────────────────────
    #  Public API
    # ──────────────────────────────────────────────

    def retrieve(self, query: str) -> list[str]:
        """Return top-k passage strings for a query (empty list if unavailable)."""
        if self._matrix is None or self._gemini is None:
            return []

        q_vec = self._embed_query(query)
        if q_vec is None:
            return []

        # Cosine similarity against every document, then take the top-k.
        scores = self._matrix @ q_vec  # (n_docs,)
        k = min(self.top_k, scores.shape[0])
        top_idx = np.argpartition(-scores, k - 1)[:k]
        top_idx = top_idx[np.argsort(-scores[top_idx])]

        passages: list[str] = []
        for idx in top_idx:
            doc = self._docs[int(idx)]
            text = doc.get("text") or doc.get("answer") or doc.get("abstract") or ""
            if text:
                passages.append(text.strip())
        return passages

    def format_context(self, passages: list[str]) -> str:
        """Format retrieved passages into a numbered context block."""
        if not passages:
            return "No relevant clinical context retrieved."
        lines = [f"[{i + 1}] {p}" for i, p in enumerate(passages)]
        return "\n\n".join(lines)

    # ──────────────────────────────────────────────
    #  Internal
    # ──────────────────────────────────────────────

    def _embed_query(self, query: str) -> Optional[np.ndarray]:
        """Embed a single query via the Gemini API → unit-norm float32 vector."""
        try:
            from google.genai import types
            resp = self._gemini.models.embed_content(
                model=self._embed_model,
                contents=query,
                config=types.EmbedContentConfig(
                    output_dimensionality=self._embed_dim,
                    task_type="RETRIEVAL_QUERY",
                ),
            )
            # google-genai returns .embeddings (list) on recent versions and
            # .embedding (single) on older ones — support both.
            if getattr(resp, "embeddings", None):
                values = resp.embeddings[0].values
            else:
                values = resp.embedding.values
            vec = np.asarray(values, dtype=np.float32)
            n = np.linalg.norm(vec)
            return vec / n if n else vec
        except Exception as exc:
            logger.warning("RAG query embedding failed: %s", exc)
            return None
