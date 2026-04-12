"""
Pydantic schemas for the /predict endpoint.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ClassProbability(BaseModel):
    class_code: str = Field(..., description="Short class code, e.g. 'mel'")
    full_name: str = Field(..., description="Full clinical name, e.g. 'Melanoma'")
    probability: float = Field(..., ge=0.0, le=1.0)
    risk_category: str = Field(
        ..., description="One of: MALIGNANT, Pre-malignant, Benign"
    )
    colour: str = Field(..., description="Display colour hex code")


class PredictionResponse(BaseModel):
    predicted_class: str
    predicted_class_full_name: str
    class_probabilities: list[ClassProbability]
    malignancy_probability: float = Field(
        ..., ge=0.0, le=1.0,
        description="Sum of P(mel) + P(bcc) + P(akiec)"
    )
    threshold_used: float
    threshold_method: str = Field(
        ..., description="'rl_adaptive' or 'cost_sensitive'"
    )
    triage_recommendation: str
    risk_level: str
    confidence: float = Field(
        ..., ge=0.0, le=1.0,
        description="Max class probability after temperature scaling"
    )
    disclaimer: str = Field(
        default=(
            "This is not a diagnosis. "
            "Consult a qualified dermatologist for evaluation."
        )
    )


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str = "EfficientNet-B0 (quantised INT8)"
    num_classes: int = 7
