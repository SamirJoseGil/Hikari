# HIKARI — Contrato de API (fase 1)

Base URL local: `http://127.0.0.1:8000`

## GET /api/health

Respuesta 200:
```json
{ "status": "ok", "service": "hikari-backend" }
```

## POST /api/consultations

### Request
```json
{ "message": "Me despidieron sin justa causa después de 3 años, ¿qué me corresponde?" }
```

Validaciones:
- `message` no puede estar vacío.
- `message` máximo 4000 caracteres.
- `message` debe ser `string` (cualquier otro tipo → 422).

### Response 200 (ejemplo dominio laboral)
```json
{
  "scope": "laboral",
  "intent": "terminacion_laboral",
  "summary": "El usuario fue despedido tras 3 años de servicio, sin que se alegara justa causa.",
  "legal_analysis": "Conforme al artículo 64 del C.S.T., la terminación unilateral sin justa causa comprobada da derecho a una indemnización...",
  "norms": [],
  "actions": [
    { "description": "Solicita por escrito la liquidación y el motivo formal del despido.", "priority": "alta" }
  ],
  "missing_information": [
    { "question": "¿Cuál era tu salario mensual al momento del despido?", "reason": "Necesario para calcular la indemnización del artículo 64." }
  ],
  "citations": [
    { "source": "Código Sustantivo del Trabajo", "excerpt": "Artículo 64", "url": "http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr001.html" }
  ],
  "disclaimer": "HIKARI ofrece orientación general de derecho laboral colombiano y no sustituye el consejo de un abogado. Verifica siempre con un profesional."
}
```

Nota: en la fase 2 este contenido lo produce un LLM real (Gemini) a partir de los fragmentos
recuperados del corpus; `norms`/`citations` solo contienen lo que efectivamente vino de esa
evidencia (nunca normas inventadas por el modelo).


### Response 200 (ejemplo fuera de dominio)
```json
{
  "scope": "fuera_de_dominio",
  "intent": "desconocido",
  "summary": "No se identificó una consulta de derecho laboral colombiano.",
  "legal_analysis": "",
  "norms": [],
  "actions": [],
  "missing_information": [],
  "citations": [],
  "disclaimer": "HIKARI ofrece orientación general de derecho laboral colombiano y no sustituye el consejo de un abogado. Verifica siempre con un profesional."
}
```

### Response 422 (validación)
```json
{ "detail": [ { "type": "string_too_short", "loc": ["body", "message"], "msg": "..." } ] }
```

## GET /api/consultations?limit=20

Devuelve el historial persistido (PostgreSQL/Supabase), más reciente primero. `limit` es opcional
(por defecto 20, máximo 100; valores fuera de rango → 422).

Response 200:
```json
[
  {
    "id": 8,
    "question": "Me despidieron sin justa causa después de 3 años de trabajo...",
    "scope": "laboral",
    "intent": "terminacion_laboral",
    "response": { "scope": "laboral", "intent": "terminacion_laboral", "...": "..." },
    "created_at": "2026-09-18T22:57:59.731053+00:00"
  }
]
```

## Modelos (Pydantic)

- `ConsultationRequest`: `message: str`
- `ConsultationResponse`: `scope`, `intent`, `summary`, `legal_analysis`, `norms: NormReference[]`,
  `actions: Action[]`, `missing_information: MissingInformation[]`, `citations: Citation[]`, `disclaimer`
- `NormReference`: `code`, `article?`, `description?`
- `Citation`: `source`, `excerpt?`, `url?`
- `Action`: `description`, `priority?`
- `MissingInformation`: `question`, `reason?`
- `scope` es un enum: `"laboral" | "fuera_de_dominio" | "ambiguo"`
