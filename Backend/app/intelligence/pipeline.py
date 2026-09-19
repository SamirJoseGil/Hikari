"""Intelligence layer: deterministic steps run before/after calling the LLM.

Domain and intent detection are rule-based (cheap) on purpose: the LLM is only
invoked once we already know the consultation is labor-related. See
Docs/architecture.md for the full pipeline and the cost-control rationale.
"""
from app.models.consultation import Scope

# Substrings (lowercase) that strongly suggest Colombian labor law.
LABOR_KEYWORDS = (
    "laboral",
    "trabaj",
    "empleo",
    "emplead",
    "despid",
    "renunci",
    "salario",
    "sueldo",
    "cesant",
    "indemniza",
    "contrato de trabajo",
    "contrato laboral",
    "jefe",
    "acoso laboral",
    "prestaciones sociales",
    "liquidacion laboral",
    "liquidación laboral",
    "vacaciones",
    "hora extra",
    "horas extra",
    "empleador",
)

# Substrings that suggest a different legal domain (consumer, civil, criminal, family...).
OUT_OF_DOMAIN_KEYWORDS = (
    "estafa",
    "estafaron",
    "carro",
    "vehiculo",
    "vehículo",
    "comprando",
    "compra",
    "vendedor",
    "producto",
    "garantia",
    "garantía",
    "arriendo",
    "arrendador",
    "arrendatario",
    "divorcio",
    "custodia",
    "herencia",
    "penal",
    "hurto",
    "robo",
    "accidente de transito",
    "accidente de tránsito",
)

# Ordered rules: (intent, keywords). First match wins.
INTENT_RULES = (
    ("acoso_laboral", ("acoso", "hostiga", "maltrat", "humilla", "grita", "intimida")),
    ("terminacion_laboral", ("despid", "terminaron", "terminación del contrato", "terminacion del contrato", "me sacaron")),
    ("liquidacion", ("liquidacion", "liquidación", "cesantia", "cesantía")),
    ("cambio_condiciones", ("cambio de cargo", "cambiaron de cargo", "cambio de condiciones", "cambio de funciones", "sin avisarme", "cambio de horario")),
    ("salario", ("salario", "sueldo", "no me paga", "no me pagan", "no pagan")),
    ("vacaciones", ("vacaciones",)),
    ("contrato_laboral", ("contrato",)),
)


def normalize_query(message: str) -> str:
    """Trims and collapses whitespace/case for downstream processing and caching."""
    return " ".join(message.strip().lower().split())


def detect_domain(normalized_message: str) -> Scope:
    """Rule-based domain detection: keywords first, LLM fallback not needed yet.

    A message can only be "laboral" if it contains a labor keyword. If it has
    no labor keyword but matches a clearly different domain, it's
    "fuera_de_dominio". Otherwise it's "ambiguo".
    """
    has_labor_signal = any(keyword in normalized_message for keyword in LABOR_KEYWORDS)
    has_out_of_domain_signal = any(keyword in normalized_message for keyword in OUT_OF_DOMAIN_KEYWORDS)

    if has_labor_signal:
        return Scope.LABORAL
    if has_out_of_domain_signal:
        return Scope.FUERA_DE_DOMINIO
    return Scope.AMBIGUO


def detect_intent(normalized_message: str, scope: Scope) -> str:
    """Rule-based intent classification. Only meaningful when scope is laboral."""
    if scope != Scope.LABORAL:
        return "desconocida"
    for intent, keywords in INTENT_RULES:
        if any(keyword in normalized_message for keyword in keywords):
            return intent
    return "general_laboral"


def validate_response(response: dict) -> bool:
    """Placeholder for post-LLM structural/deterministic validation."""
    return True

