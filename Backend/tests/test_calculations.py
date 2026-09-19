from app.services.calculations import compute_deterministic_facts


def test_dias_servicio_calculable_when_years_mentioned():
    facts = compute_deterministic_facts("me despidieron sin justa causa después de 3 años de trabajo")
    assert facts["dias_servicio"]["calculable"] is True
    assert facts["dias_servicio"]["value"] == 3 * 365


def test_dias_servicio_not_calculable_without_years():
    facts = compute_deterministic_facts("mi jefe me grita frente a todos")
    assert facts["dias_servicio"]["calculable"] is False
    assert "fecha_de_ingreso" in facts["dias_servicio"]["missing"]


def test_cesantias_calculable_when_years_and_salary_known():
    facts = compute_deterministic_facts("trabaje 2 años y ganaba $2.000.000 mensuales")
    assert facts["cesantias_proporcionales"]["calculable"] is True
    assert facts["cesantias_proporcionales"]["value"] == 4_000_000.0


def test_cesantias_not_calculable_without_salary():
    facts = compute_deterministic_facts("trabaje 2 años en la empresa")
    assert facts["cesantias_proporcionales"]["calculable"] is False
    assert "salario" in facts["cesantias_proporcionales"]["missing"]


def test_indemnizacion_never_invents_smmlv_bracket():
    facts = compute_deterministic_facts(
        "me despidieron sin justa causa, trabaje 3 años, contrato indefinido, ganaba $3.000.000"
    )
    assert facts["indemnizacion_articulo_64"]["calculable"] is False
    assert "salario_minimo_legal_vigente" in facts["indemnizacion_articulo_64"]["missing"]
