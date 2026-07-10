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
You are DermBot, a warm, conversational AI assistant in a clinical skin lesion triage app.
You are chatting with a patient about their scan — this is an ongoing back-and-forth, not a
one-off Q&A.

SCAN RESULT:
  Detected class    : {predicted_class_full_name} ({predicted_class})
  Malignancy score  : {malignancy_pct:.1f}%
  Triage decision   : {triage_recommendation}
  Risk level        : {risk_level}
  Model confidence  : {confidence_pct:.1f}%

RETRIEVED CLINICAL CONTEXT (from PubMed + dermatology guidelines):
{context}

CONVERSATION SO FAR:
{history}

HOW TO REPLY:
- Respond naturally to the patient's latest message. Build on what was already said; do NOT
  re-introduce yourself or repeat points you already made.
- Warm, clear, plain English. Usually 2-4 sentences — go longer only if they ask for detail.
- It's good to ask a short follow-up question when it helps you understand their concern.
- Use the retrieved context where relevant; otherwise answer from general knowledge.
- Never say "you have [disease]" — say "the AI detected patterns consistent with…". Never give
  a definitive diagnosis or state a probability as a certainty.
- Do NOT end every message with a disclaimer or a stock "see a dermatologist" line. Mention
  professional care only when it is genuinely the relevant next step.

PATIENT'S LATEST MESSAGE: {question}
DermBot:"""


_GENERAL_TEMPLATE = """\
You are DermBot, a warm, conversational AI assistant specialising in skin health and
dermatology, embedded in a skin lesion triage app. The user has not run a scan. This is an
ongoing chat, not a one-off Q&A.

RETRIEVED CLINICAL CONTEXT (from PubMed + dermatology guidelines):
{context}

CONVERSATION SO FAR:
{history}

HOW TO REPLY:
- Respond naturally to the user's latest message and build on the conversation so far; do NOT
  re-introduce yourself or repeat yourself.
- Warm, clear, plain English. Usually 2-4 sentences — go longer only if they ask for detail.
- Feel free to ask a short follow-up question to understand what they need.
- Use the retrieved context where relevant; otherwise use general knowledge.
- Never diagnose or claim certainty about a specific person's condition.
- Suggest the app's scan feature or a dermatologist only when it's genuinely relevant — not as
  boilerplate on every message.

USER'S LATEST MESSAGE: {question}
DermBot:"""


_IMAGE_TEMPLATE = """\
You are DermBot, a compassionate AI assistant in a clinical skin lesion triage app.

The app's TRAINED triage model already analysed the attached image (this is the
authoritative result — do not contradict it):
  Detected class    : {full_name} ({code})
  Malignancy score  : {mal_pct:.1f}%
  Triage decision   : {triage}
  Risk level        : {risk}
  Model confidence  : {conf_pct:.1f}%

RETRIEVED CLINICAL CONTEXT (from PubMed + dermatology guidelines):
{context}

Look at the attached image and explain the result to the user. RULES:
1. Anchor to the model's classification above — do NOT offer a different diagnosis.
2. Plain English, compassionate, max 140 words.
3. Briefly describe visual features in the image that are consistent with {full_name}.
4. Never say "you have [disease]" — say "the AI detected patterns consistent with…".
5. Explain what it means and the sensible next step; recommend a qualified dermatologist.

USER QUESTION (may be empty): {question}"""


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

    @staticmethod
    def _format_history(history: Optional[list[tuple[str, str]]]) -> str:
        """Render prior (role, text) turns as a readable transcript for the prompt."""
        if not history:
            return "(this is the start of the conversation)"
        lines = []
        for role, text in history:
            who = "Patient" if role == "user" else "DermBot"
            lines.append(f"{who}: {text}")
        return "\n".join(lines)

    def answer(
        self,
        question: str,
        predicted_class: Optional[str] = None,
        predicted_class_full_name: Optional[str] = None,
        malignancy_probability: Optional[float] = None,
        triage_recommendation: Optional[str] = None,
        risk_level: Optional[str] = None,
        confidence: Optional[float] = None,
        history: Optional[list[tuple[str, str]]] = None,
    ) -> tuple[str, int, bool, bool]:
        """
        Returns (answer, sources_used, escalated, safety_filtered).

        Scan fields are optional: when absent, DermBot answers as a general
        skin-health assistant instead of interpreting a specific scan result.
        ``history`` carries prior (role, text) turns so replies stay in context.

        For image-based questions, use ``answer_with_image`` instead — it runs
        the hybrid classifier-anchored + Gemini-vision path.
        """
        has_scan = bool(predicted_class_full_name)
        first_turn = not history
        high_risk = risk_level in ("MALIGNANT", "Pre-malignant")
        history_block = self._format_history(history)

        # 1. Block prompt injection
        if _INPUT_INJECTION.search(question):
            return (
                self._static_fallback(predicted_class_full_name, risk_level),
                0, False, True,
            )

        # 2. Pre-retrieval escalation (red-flag symptoms → skip LLM)
        if _ESCALATION.search(question):
            lead = (
                f"The AI detected patterns consistent with {predicted_class_full_name}. "
                if has_scan else ""
            )
            answer = (
                lead
                + "Given the symptoms you mentioned, this may need urgent attention."
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
                if has_scan:
                    prompt = _PROMPT_TEMPLATE.format(
                        predicted_class=predicted_class,
                        predicted_class_full_name=predicted_class_full_name,
                        malignancy_pct=(malignancy_probability or 0.0) * 100,
                        triage_recommendation=triage_recommendation,
                        risk_level=risk_level,
                        confidence_pct=(confidence or 0.0) * 100,
                        context=context,
                        history=history_block,
                        question=question,
                    )
                else:
                    prompt = _GENERAL_TEMPLATE.format(
                        context=context, history=history_block, question=question
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

                # 5c. Ensure a referral only for high-risk scans that omit one —
                #     not on every casual reply (that's what made it feel robotic).
                if high_risk and not _NO_REFERRAL.search(answer):
                    answer += (
                        " Given the risk level, I'd recommend having this looked at by a "
                        "qualified dermatologist."
                    )

                # 5d. Append the disclaimer sparingly: on the first reply, or whenever
                #     the scan is high-risk — not on every follow-up message.
                if first_turn or high_risk:
                    answer += f"\n\n{DISCLAIMER}"
                return answer, n_docs, False, False

            except Exception as exc:
                logger.warning("DermBot: Gemini call failed: %s", exc)

        # Fallback when Gemini is unavailable
        return self._static_fallback(predicted_class_full_name, risk_level), 0, False, False

    # ──────────────────────────────────────────────
    #  Image discussion (hybrid: classifier label + Gemini vision)
    # ──────────────────────────────────────────────

    def answer_with_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        result,
        question: str = "",
    ) -> tuple[str, int, bool, bool]:
        """
        Discuss an uploaded image, anchored to the trained model's classification.

        `result` is the PredictionResponse from the triage model. Returns
        (answer, sources_used, escalated, safety_filtered).
        """
        full = result.predicted_class_full_name
        risk = result.risk_level
        q = (question or "").strip()

        # No lesion detected → don't discuss a disease.
        if getattr(result, "not_detected", False):
            msg = (
                "I couldn't detect a clear skin lesion in that image. Try a closer, "
                "well-lit photo of the specific spot. If you're worried about a spot — "
                "especially one that's changing, bleeding, or not healing — please see "
                "a dermatologist."
                f"\n\n{DISCLAIMER}"
            )
            return msg, 0, False, False

        # Block prompt injection in the accompanying question.
        if q and _INPUT_INJECTION.search(q):
            return self._static_fallback(full, risk), 0, False, True

        # RAG grounding on the detected condition + question.
        if self._rag is not None:
            passages = self._rag.retrieve(f"{full}. {q}".strip())
            context = self._rag.format_context(passages)
        else:
            passages, context = [], "No relevant clinical context retrieved."
        n_docs = len(passages)

        if self._gemini:
            try:
                from google.genai import types

                prompt = _IMAGE_TEMPLATE.format(
                    full_name=full,
                    code=result.predicted_class,
                    mal_pct=(result.malignancy_probability or 0.0) * 100,
                    triage=result.triage_recommendation,
                    risk=risk,
                    conf_pct=(result.confidence or 0.0) * 100,
                    context=context,
                    question=q or "(none)",
                )
                img_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                resp = self._gemini.models.generate_content(
                    model=GEMINI_MODEL, contents=[prompt, img_part]
                )
                answer = resp.text.strip()

                if _BLOCKED_OUTPUT.search(answer):
                    return self._static_fallback(full, risk), n_docs, False, True
                if _SELF_TREATMENT.search(q):
                    answer += _SELF_TREAT_MSG
                if not _NO_REFERRAL.search(answer):
                    answer += " Please consult a qualified dermatologist for a professional evaluation."
                answer += f"\n\n{DISCLAIMER}"
                return answer, n_docs, False, False
            except Exception as exc:
                logger.warning("DermBot: image answer failed: %s", exc)

        return self._static_fallback(full, risk), n_docs, False, False

    # ──────────────────────────────────────────────
    #  Static fallback (no Gemini / safety block)
    # ──────────────────────────────────────────────

    def _static_fallback(self, full_name: Optional[str], risk_level: Optional[str]) -> str:
        # No scan context → general guidance.
        if not full_name:
            return (
                "I'm DermBot, here to help with general skin-health questions. "
                "I can't give a diagnosis — for anything specific, run a scan in the "
                "app or consult a qualified dermatologist, especially if a spot is "
                "changing, bleeding, or not healing."
                f"\n\n{DISCLAIMER}"
            )
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
