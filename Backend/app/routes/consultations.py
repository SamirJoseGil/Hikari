import logging
import time

from fastapi import APIRouter, Depends, Query

from app.intelligence.pipeline import detect_domain, detect_intent, normalize_query
from app.models.consultation import (
    Action,
    Citation,
    ConsultationRequest,
    ConsultationResponse,
    MissingInformation,
    Scope,
)
from app.services.cache_service import QueryCache, get_query_cache
from app.services.calculations import compute_deterministic_facts
from app.services.database import DatabaseService, get_database_service
from app.services.knowledge_service import KnowledgeService, get_knowledge_service
from app.services.llm_service import LLMService, get_llm_service
from app.services.prompts.hikari_master_prompt import SYSTEM_INSTRUCTION, build_prompt

logger = logging.getLogger(__name__)
router = APIRouter()

DISCLAIMER = (
    "HIKARI ofrece orientación general de derecho laboral colombiano y no sustituye "
    "el consejo de un abogado. Verifica siempre con un profesional."
)


def _out_of_domain_response() -> ConsultationResponse:
    return ConsultationResponse(
        scope=Scope.FUERA_DE_DOMINIO,
        intent="desconocida",
        summary="No se identificó una consulta de derecho laboral colombiano.",
        legal_analysis="",
        norms=[],
        actions=[],
        missing_information=[],
        citations=[],
        disclaimer=DISCLAIMER,
    )


def _fallback_response(scope: Scope, intent: str, reason: str) -> ConsultationResponse:
    return ConsultationResponse(
        scope=scope,
        intent=intent,
        summary="No fue posible generar el análisis en este momento.",
        legal_analysis="",
        norms=[],
        actions=[
            Action(description="Vuelve a intentar la consulta en unos minutos.", priority="alta"),
        ],
        missing_information=[
            MissingInformation(question=reason, reason="Fallo técnico controlado, no relacionado con tus datos."),
        ],
        citations=[],
        disclaimer=DISCLAIMER,
    )


def _enforce_contract(response: ConsultationResponse, scope: Scope) -> ConsultationResponse:
    """Post-LLM validation: force the fields the contract requires to always be present."""
    if not response.disclaimer:
        response.disclaimer = DISCLAIMER
    if response.scope != scope:
        # The backend's deterministic domain detection wins over the model's opinion.
        response.scope = scope
    response.citations = [c for c in response.citations if c.source]
    return response


@router.post("/api/consultations", response_model=ConsultationResponse)
def create_consultation(
    payload: ConsultationRequest,
    knowledge: KnowledgeService = Depends(get_knowledge_service),
    llm: LLMService = Depends(get_llm_service),
    cache: QueryCache = Depends(get_query_cache),
    database: DatabaseService = Depends(get_database_service),
) -> ConsultationResponse:
    start = time.monotonic()
    embedding_calls = 0
    llm_calls = 0
    cache_status = "miss"

    normalized = normalize_query(payload.message)
    scope = detect_domain(normalized)

    # Out-of-domain: zero embedding/LLM calls, immediate deterministic response.
    if scope == Scope.FUERA_DE_DOMINIO:
        response = _out_of_domain_response()
        _persist_best_effort(database, payload.message, normalized, response)
        _log_metrics(scope, "desconocida", "n/a", embedding_calls, llm_calls, start)
        return response

    intent = detect_intent(normalized, scope)

    cache_key = cache.make_key(normalized)
    cached = cache.get(cache_key)
    if cached is not None:
        cache_status = "hit"
        response = ConsultationResponse(**cached)
        _log_metrics(scope, intent, cache_status, embedding_calls, llm_calls, start)
        return response

    try:
        evidence = knowledge.search(normalized)
        embedding_calls += 1
    except Exception:
        logger.exception("Fallo en el retrieval de conocimiento")
        evidence = []

    deterministic_facts = compute_deterministic_facts(normalized)
    prompt = build_prompt(
        original_query=payload.message,
        normalized_query=normalized,
        scope=scope.value,
        intent=intent,
        evidence=evidence,
        deterministic_facts=deterministic_facts,
    )

    try:
        response = llm.generate_structured(SYSTEM_INSTRUCTION, prompt)
        llm_calls += 1
        response = _enforce_contract(response, scope)
    except Exception:
        logger.exception("Fallo en la generación del LLM")
        llm_calls += 1
        response = _fallback_response(scope, intent, "El servicio de análisis jurídico no está disponible.")

    cache.set(cache_key, response.model_dump(mode="json"))
    _persist_best_effort(database, payload.message, normalized, response)
    _log_metrics(scope, intent, cache_status, embedding_calls, llm_calls, start)
    return response


@router.get("/api/consultations")
def list_consultations(
    limit: int = Query(default=20, ge=1, le=100),
    database: DatabaseService = Depends(get_database_service),
) -> list[dict]:
    try:
        return database.list_consultations(limit=limit)
    except Exception:
        logger.exception("Fallo al listar el historial de consultas")
        return []


def _persist_best_effort(
    database: DatabaseService, question: str, normalized_question: str, response: ConsultationResponse
) -> None:
    try:
        database.save_consultation(
            question=question,
            normalized_question=normalized_question,
            scope=response.scope.value,
            intent=response.intent,
            response=response.model_dump(mode="json"),
        )
    except Exception:
        logger.exception("Fallo al persistir la consulta (no bloquea la respuesta al usuario)")


def _log_metrics(
    scope: Scope, intent: str, cache_status: str, embedding_calls: int, llm_calls: int, start: float
) -> None:
    latency = time.monotonic() - start
    # Deliberately omit the raw question text from logs (privacy: see Docs/architecture.md).
    logger.info(
        "[consultation] scope=%s intent=%s cache=%s embedding=%d llm=%d latency=%.3fs",
        scope.value,
        intent,
        cache_status,
        embedding_calls,
        llm_calls,
        latency,
    )


