"""
DermBot orchestration service.

Pipeline per request:
  1. Input safety check  — block prompt injection
  2. Escalation layer    — red-flag symptoms → urgent message (skip LLM)
  3. RAG retrieval       — PubMedBERT + FAISS → top-5 passages
  4. Gemini 2.0 Flash   — grounded explanation generation
  5. Output safety wrap  — post-generation pattern filter + disclaimer

Uses google.genai (new SDK, NOT deprecated google.generativeai).
"""

from __future__ import annotations

import logging
import re
from typing import Optional

from app.config import GEMINI_API_KEY, GEMINI_MODEL
from app.services.rag_service import RAGService

logger = logging.getLogger(__name__)


def build_gemini_client():
    """Return a shared google-genai client, or None if unavailable.

    Used by both the RAG service (query embeddings) and DermBot (chat
    generation) so we create exactly one client per process.
    """
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set — DermBot will use static fallback")
        return None
    try:
        import google.genai as genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Gemini client ready (%s)", GEMINI_MODEL)
        return client
    except ImportError:
        logger.warning("google-genai not installed — DermBot will use static fallback")
    except Exception as exc:
        logger.warning("Gemini init failed: %s", exc)
    return None

DISCLAIMER = (
    "This is for educational purposes only and is not a medical diagnosis. "
    "Always consult a qualified dermatologist or healthcare professional."
)

# ── Safety patterns (from Phase 6 DPO alignment) ────────────────────────────

_INPUT_INJECTION = re.compile(
    r"ignore (your |all )?(instructions|rules|safety)|bypass|jailbreak|"
    r"pretend (you are|to be)|forget (your |all )?instructions|act as (?!a patient)",
    re.IGNORECASE,
)

_ESCALATION = re.compile(
    r"bleed|blood|won.t stop|rapid(ly)? grow|doubl.d in size|growing quickly|"
    r"open sore|ulcer|won.t heal|not healing|"
    r"spread(ing)?|lymph node|"
    r"severe pain|very painful|extremely painful|"
    r"turned black|black mole|"
    r"discharge|pus|infect",
    re.IGNORECASE,
)

_SELF_TREATMENT = re.compile(
    r"cut (it )?off|remove it myself|freeze (it )?at home|"
    r"tea tree (oil)?|apple cider|home remed|burn it off|tie it off",
    re.IGNORECASE,
)

_BLOCKED_OUTPUT = re.compile(
    r"you (definitely )?have cancer|you are dying|"
    r"100% (certain|sure) you have|guaranteed diagnosis|"
    r"no need to see a doctor|don.t need (a )?doctor|ignore the result",
    re.IGNORECASE,
)

_NO_REFERRAL = re.compile(
    r"dermatologist|GP|doctor|specialist|healthcare|medical professional|see a",
    re.IGNORECASE,
)

_ESCALATION_MSG = (
    "\n\n⚠️ The symptoms you described — such as rapid changes, bleeding, pain, "
    "or ulceration — may require urgent attention. Please contact your GP or a "
    "dermatologist as soon as possible, or attend A&E if bleeding is severe."
)

_SELF_TREAT_MSG = (
    "\n\n⚠️ Please do not attempt to remove or treat a skin lesion at home. "
    "Home removal risks infection, scarring, and may delay diagnosis of a "
    "serious condition. Consult a qualified dermatologist."
)

# ── Gemini prompt template ────────────────────────────────────────────────────

_PROMPT_TEMPLATE = """\
You are DermBot, a compassionate AI assistant embedded in a clinical skin lesion triage app.

SCAN RESULT:
  Detected class    : {predicted_class_full_name} ({predicted_class})
  Malignancy score  : {malignancy_pct:.1f}%
  Triage decision   : {triage_recommendation}
  Risk level        : {risk_level}
  Model confidence  : {confidence_pct:.1f}%

RETRIEVED CLINICAL CONTEXT (from PubMed + dermatology guidelines):
{context}

YOUR RULES:
1. Answer in plain English — compassionate, clear, max 120 words.
2. Ground your answer in the retrieved context where relevant.
3. Never say "you have [disease]" — say "the AI detected patterns consistent with…"
4. Never give a definitive diagnosis or a numeric probability as a certainty.
5. Always recommend consulting a qualified dermatologist.
6. If the context is not relevant to the question, answer from general knowledge.

PATIENT QUESTION: {question}"""


class DermBotService:
    def __init__(
        self,
        rag: Optional[RAGService],
        gemini_client=None,
    ) -> None:
        self._rag = rag
        self._gemini = gemini_client if gemini_client is not None else build_gemini_client()

    # ──────────────────────────────────────────────
    #  Public API
    # ──────────────────────────────────────────────

    def answer(
        self,
        question: str,
        predicted_class: str,
        predicted_class_full_name: str,
        malignancy_probability: float,
        triage_recommendation: str,
        risk_level: str,
        confidence: float,
    ) -> tuple[str, int, bool, bool]:
        """
        Returns (answer, sources_used, escalated, safety_filtered).
        """

        # 1. Block prompt injection
        if _INPUT_INJECTION.search(question):
            return (
                self._static_fallback(predicted_class_full_name, risk_level),
                0, False, True,
            )

        # 2. Pre-retrieval escalation (red-flag symptoms → skip LLM)
        if _ESCALATION.search(question):
            answer = (
                f"The AI detected patterns consistent with {predicted_class_full_name}. "
                f"Given the symptoms you mentioned, this may need urgent attention."
                + _ESCALATION_MSG
                + f"\n\n{DISCLAIMER}"
            )
            return answer, 0, True, False

        # 3. RAG retrieval (skipped gracefully if the index is unavailable)
        if self._rag is not None:
            passages = self._rag.retrieve(question)
            context  = self._rag.format_context(passages)
        else:
            passages, context = [], "No relevant clinical context retrieved."
        n_docs = len(passages)

        # 4. Gemini generation
        if self._gemini:
            try:
                prompt = _PROMPT_TEMPLATE.format(
                    predicted_class=predicted_class,
                    predicted_class_full_name=predicted_class_full_name,
                    malignancy_pct=malignancy_probability * 100,
                    triage_recommendation=triage_recommendation,
                    risk_level=risk_level,
                    confidence_pct=confidence * 100,
                    context=context,
                    question=question,
                )
                resp   = self._gemini.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt,
                )
                answer = resp.text.strip()

                # 5a. Block dangerous output
                if _BLOCKED_OUTPUT.search(answer):
                    return (
                        self._static_fallback(predicted_class_full_name, risk_level),
                        n_docs, False, True,
                    )

                # 5b. Append self-treatment warning if triggered in question
                if _SELF_TREATMENT.search(question):
                    answer += _SELF_TREAT_MSG

                # 5c. Ensure a referral mention exists
                if not _NO_REFERRAL.search(answer):
                    answer += (
                        " Please consult a qualified dermatologist for a professional evaluation."
                    )

                # 5d. Always append disclaimer
                answer += f"\n\n{DISCLAIMER}"
                return answer, n_docs, False, False

            except Exception as exc:
                logger.warning("DermBot: Gemini call failed: %s", exc)

        # Fallback when Gemini is unavailable
        return self._static_fallback(predicted_class_full_name, risk_level), 0, False, False

    # ──────────────────────────────────────────────
    #  Static fallback (no Gemini / safety block)
    # ──────────────────────────────────────────────

    def _static_fallback(self, full_name: str, risk_level: str) -> str:
        high = risk_level in ("MALIGNANT", "Pre-malignant")
        if high:
            return (
                f"The AI detected patterns consistent with {full_name}. "
                f"Given the risk classification, we strongly recommend booking "
                f"an appointment with a dermatologist as soon as possible — "
                f"early evaluation is important. This tool screens; it does not diagnose."
                f"\n\n{DISCLAIMER}"
            )
        return (
            f"The AI detected patterns consistent with {full_name}, which is "
            f"classified as low risk. Continue monitoring for any changes in size, "
            f"colour, or shape, and mention it at your next routine check-up with "
            f"your GP or dermatologist."
            f"\n\n{DISCLAIMER}"
        )
