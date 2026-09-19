"""Deterministic labor-law calculations. The LLM must never redo this math.

Only implements calculations that are:
  1. purely arithmetic (no legal judgment required), or
  2. directly backed by a norm already present in the corpus (Art. 249 C.S.T.
     for cesantías), and
  3. computable without inventing any missing fact (salary, dates, contract
     type, etc. are never assumed).

Each concept reports either `calculable: true` with a `value`, or
`calculable: false` with the exact list of `missing` inputs. The indemnización
of Art. 64 C.S.T. is deliberately left as "not calculable" in this phase: its
formula depends on comparing the salary against the current SMMLV (minimum
wage), and that value is not part of our corpus/sources yet — computing it
would mean inventing a number, which is explicitly forbidden.
"""
import re

YEARS_PATTERN = re.compile(r"(\d+)\s*(?:a[ñn]os?)\b")
SALARY_PATTERN = re.compile(r"\$\s?([\d.,]+)")
SALARY_MILLIONS_PATTERN = re.compile(r"([\d]+(?:[.,]\d+)?)\s*millon(?:es)?")


def _extract_years_of_service(text: str) -> int | None:
    match = YEARS_PATTERN.search(text)
    return int(match.group(1)) if match else None


def _extract_monthly_salary(text: str) -> float | None:
    match = SALARY_MILLIONS_PATTERN.search(text)
    if match:
        return float(match.group(1).replace(",", ".")) * 1_000_000
    match = SALARY_PATTERN.search(text)
    if match:
        raw = match.group(1).replace(".", "").replace(",", "")
        if raw.isdigit():
            return float(raw)
    return None


def compute_deterministic_facts(normalized_query: str) -> dict:
    years_of_service = _extract_years_of_service(normalized_query)
    monthly_salary = _extract_monthly_salary(normalized_query)

    facts: dict = {}

    if years_of_service is not None:
        facts["dias_servicio"] = {
            "concept": "dias_servicio",
            "calculable": True,
            "value": years_of_service * 365,
            "unit": "days",
            "source": "backend",
            "note": "Estimado a partir de años completos mencionados en la consulta.",
        }
    else:
        facts["dias_servicio"] = {
            "concept": "dias_servicio",
            "calculable": False,
            "missing": ["fecha_de_ingreso", "fecha_de_terminacion"],
        }

    cesantias_missing = [
        name
        for name, value in (("tiempo_de_servicio", years_of_service), ("salario", monthly_salary))
        if value is None
    ]
    if cesantias_missing:
        facts["cesantias_proporcionales"] = {
            "concept": "cesantias_proporcionales",
            "calculable": False,
            "missing": cesantias_missing,
        }
    else:
        facts["cesantias_proporcionales"] = {
            "concept": "cesantias_proporcionales",
            "calculable": True,
            "value": round(monthly_salary * years_of_service, 2),
            "unit": "cop",
            "source": "backend",
            "basis": "Artículo 249 del C.S.T.: un mes de salario por cada año de servicio.",
        }

    # Deliberately not calculable in this phase: requires the current SMMLV
    # (minimum wage) to pick the salary bracket of Art. 64 C.S.T., which is
    # not part of our corpus/sources yet.
    facts["indemnizacion_articulo_64"] = {
        "concept": "indemnizacion_articulo_64",
        "calculable": False,
        "missing": ["salario", "tipo_de_contrato", "salario_minimo_legal_vigente"],
    }

    return facts

