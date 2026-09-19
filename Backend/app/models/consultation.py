"""Pydantic models for the /api/consultations contract."""
from enum import Enum

from pydantic import BaseModel, Field, field_validator

MAX_MESSAGE_LENGTH = 4000


class Scope(str, Enum):
    LABORAL = "laboral"
    FUERA_DE_DOMINIO = "fuera_de_dominio"
    AMBIGUO = "ambiguo"


class ConsultationRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("message no puede estar vacío")
        return value


class NormReference(BaseModel):
    code: str
    article: str | None = None
    description: str | None = None


class Citation(BaseModel):
    source: str
    excerpt: str | None = None
    url: str | None = None


class Action(BaseModel):
    description: str
    priority: str | None = None


class MissingInformation(BaseModel):
    question: str
    reason: str | None = None


class ConsultationResponse(BaseModel):
    scope: Scope
    intent: str
    summary: str
    legal_analysis: str
    norms: list[NormReference] = []
    actions: list[Action] = []
    missing_information: list[MissingInformation] = []
    citations: list[Citation] = []
    disclaimer: str
