from fastapi.testclient import TestClient

from app.main import app
from app.models.consultation import (
    Action,
    Citation,
    ConsultationResponse,
    MissingInformation,
    Scope,
)
from app.services.cache_service import MemoryQueryCache, get_query_cache
from app.services.database import DatabaseService, get_database_service
from app.services.knowledge_service import KnowledgeService, get_knowledge_service
from app.services.llm_service import LLMService, get_llm_service


class FakeKnowledgeService(KnowledgeService):
    """Avoids real embedding calls/precomputed files in tests."""

    def search(self, query, top_k=None):
        return [
            {
                "id": "cst-art64",
                "norm": "Código Sustantivo del Trabajo",
                "article": "Artículo 64",
                "title": "Terminación unilateral sin justa causa",
                "content": "Texto de prueba.",
                "source": "Código Sustantivo del Trabajo",
                "source_url": "http://example.com/cst-64",
                "similarity": 0.9,
            }
        ]


class FakeLLMService(LLMService):
    """Avoids real Gemini calls in tests; counts calls to verify cache/cost control."""

    def __init__(self):
        self.calls = 0

    def generate_structured(self, system_instruction, prompt):
        self.calls += 1
        return ConsultationResponse(
            scope=Scope.LABORAL,
            intent="general_laboral",
            summary="Resumen de prueba.",
            legal_analysis="Análisis de prueba basado en la evidencia recuperada.",
            norms=[],
            actions=[Action(description="Reúne tu contrato y comprobantes de pago.")],
            missing_information=[MissingInformation(question="¿Cuál fue tu último salario?")],
            citations=[
                Citation(
                    source="Código Sustantivo del Trabajo",
                    excerpt="Artículo 64",
                    url="http://example.com/cst-64",
                )
            ],
            disclaimer="disclaimer de prueba",
        )


class FakeDatabaseService(DatabaseService):
    """In-memory stand-in so tests never touch a real Postgres instance."""

    def __init__(self):
        super().__init__(database_url="")
        self.consultations: list[dict] = []

    def save_consultation(self, question, normalized_question, scope, intent, response):
        self.consultations.append(
            {"question": question, "scope": scope, "intent": intent, "response": response}
        )

    def list_consultations(self, limit: int = 20):
        return list(reversed(self.consultations))[:limit]

    def get_cached_response(self, key):
        return None

    def save_cached_response(self, key, response, scope, intent):
        pass


fake_llm = FakeLLMService()
test_cache = MemoryQueryCache()
fake_db = FakeDatabaseService()

app.dependency_overrides[get_knowledge_service] = lambda: FakeKnowledgeService()
app.dependency_overrides[get_llm_service] = lambda: fake_llm
app.dependency_overrides[get_query_cache] = lambda: test_cache
app.dependency_overrides[get_database_service] = lambda: fake_db

client = TestClient(app)

REQUIRED_FIELDS = (
    "scope",
    "intent",
    "summary",
    "legal_analysis",
    "norms",
    "actions",
    "missing_information",
    "citations",
    "disclaimer",
)


def test_health_ok():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_c1_despido_sin_justa_causa():
    response = client.post(
        "/api/consultations",
        json={"message": "Me despidieron sin justa causa después de 3 años de trabajo. ¿Qué me deben pagar?"},
    )
    assert response.status_code == 200
    body = response.json()
    for field in REQUIRED_FIELDS:
        assert field in body
    assert body["scope"] == "laboral"
    assert len(body["citations"]) > 0
    assert len(body["actions"]) > 0
    assert body["disclaimer"]


def test_c2_acoso_y_cambio_de_cargo():
    response = client.post(
        "/api/consultations",
        json={"message": "Mi jefe me grita frente a todos y me cambió de cargo sin avisarme."},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["scope"] == "laboral"
    assert len(body["citations"]) > 0
    assert body["disclaimer"]


def test_c3_fuera_de_dominio_no_llama_llm():
    calls_before = fake_llm.calls
    response = client.post("/api/consultations", json={"message": "Me estafaron comprando un carro usado."})
    assert response.status_code == 200
    body = response.json()
    assert body["scope"] == "fuera_de_dominio"
    assert body["legal_analysis"] == ""
    assert body["disclaimer"]
    # Out-of-domain must not trigger an LLM call.
    assert fake_llm.calls == calls_before


def test_consulta_ambigua():
    response = client.post(
        "/api/consultations",
        json={"message": "No sé qué hacer, la situación en mi empresa es complicada."},
    )
    assert response.status_code == 200
    assert response.json()["scope"] == "ambiguo"


def test_consulta_laboral_con_informacion_insuficiente():
    response = client.post(
        "/api/consultations",
        json={"message": "Tengo un problema laboral pero no sé qué hacer."},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["scope"] == "laboral"
    assert len(body["missing_information"]) > 0


def test_consultation_empty_message_is_rejected():
    response = client.post("/api/consultations", json={"message": ""})
    assert response.status_code == 422


def test_consultation_message_too_long_is_rejected():
    response = client.post("/api/consultations", json={"message": "a" * 5000})
    assert response.status_code == 422


def test_consultation_invalid_type_is_rejected():
    response = client.post("/api/consultations", json={"message": 123})
    assert response.status_code == 422


def test_cache_avoids_duplicate_llm_call_for_equivalent_query():
    fake_llm.calls = 0
    first = client.post("/api/consultations", json={"message": "Me despidieron sin justa causa"})
    second = client.post("/api/consultations", json={"message": "  ME DESPIDIERON SIN JUSTA CAUSA  "})
    assert first.status_code == 200
    assert second.status_code == 200
    assert fake_llm.calls == 1


def test_consultation_is_persisted_and_listed_in_history():
    fake_db.consultations.clear()
    client.post("/api/consultations", json={"message": "Me deben pagar horas extra, jefe se niega"})
    response = client.get("/api/consultations?limit=10")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["scope"] == "laboral"


def test_history_limit_is_bounded():
    response = client.get("/api/consultations?limit=500")
    assert response.status_code == 422

