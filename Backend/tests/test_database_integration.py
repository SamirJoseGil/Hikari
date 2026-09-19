"""Integration tests against a real local PostgreSQL. Skipped automatically if
DATABASE_URL is not reachable (no Gemini/LLM involved, so no API key needed).
"""
import pytest

from app.config import get_settings
from app.services.database import DatabaseService


def _get_db_or_skip() -> DatabaseService:
    db = DatabaseService(get_settings().database_url)
    try:
        db.init_schema()
    except Exception as exc:  # noqa: BLE001
        pytest.skip(f"PostgreSQL no disponible en este entorno: {exc}")
    return db


def test_save_and_list_consultation_roundtrip():
    db = _get_db_or_skip()
    response = {
        "scope": "laboral",
        "intent": "general_laboral",
        "summary": "resumen de prueba",
        "legal_analysis": "",
        "norms": [],
        "actions": [],
        "missing_information": [],
        "citations": [],
        "disclaimer": "disclaimer de prueba",
    }
    db.save_consultation(
        question="pregunta de integración de prueba",
        normalized_question="pregunta de integracion de prueba",
        scope="laboral",
        intent="general_laboral",
        response=response,
    )
    history = db.list_consultations(limit=5)
    assert len(history) > 0
    assert history[0]["scope"] in ("laboral", "fuera_de_dominio", "ambiguo")


def test_cache_roundtrip():
    db = _get_db_or_skip()
    key = "test-integration-cache-key"
    db.save_cached_response(key, {"scope": "laboral", "intent": "general_laboral"}, "laboral", "general_laboral")
    cached = db.get_cached_response(key)
    assert cached is not None
    assert cached["scope"] == "laboral"
