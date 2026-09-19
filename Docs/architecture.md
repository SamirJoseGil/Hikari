# HIKARI — Arquitectura

Asesor de orientación jurídica laboral (derecho laboral colombiano, exclusivamente).

## Flujo de datos

```
Frontend (Remix)
      ↓
FastAPI (Backend)
      ↓
Intelligence Layer (normalización, detección de dominio, intención, validación)
      ↓
Knowledge / Embeddings (retrieval sobre corpus legal)
      ↓
LLM (redacción del análisis, no hace cálculos)
      ↓
Validation (estructura de la respuesta antes de responder)
      ↓
Database (PostgreSQL / Supabase: historial de consultas + caché persistente opcional)
```

## Principios

- El backend ejecuta todas las operaciones deterministas (normalización, detección de dominio,
  clasificación, cálculos) **antes** de llamar al LLM. El LLM no reemplaza esta lógica.
- El objetivo es minimizar tokens y número de llamadas al LLM: solo se invoca cuando el backend
  ya determinó que la consulta es de dominio laboral y ya reunió el contexto necesario.
- HIKARI está restringido exclusivamente a derecho laboral colombiano. Cualquier consulta fuera
  de ese dominio se marca con `scope = "fuera_de_dominio"` y no se envía al LLM.
- Los proveedores de LLM/embeddings/DB están detrás de interfaces (`app/services/`) para poder
  cambiarlos sin tocar las rutas ni el contrato de la API.

## Estructura del backend (fase 3)

```
Backend/app/
├── main.py                        # instancia FastAPI, CORS, routers, logging.basicConfig
├── config.py                       # variables de entorno (.env)
├── routes/                         # health.py, consultations.py (POST + GET historial)
├── models/                          # ConsultationRequest/Response, NormReference, Citation, Action...
├── services/
│   ├── llm_service.py                # LLMService (Gemini real, salida estructurada)
│   ├── embedding_service.py           # EmbeddingService (Gemini embeddings reales)
│   ├── knowledge_service.py           # retrieval en memoria (coseno sobre embeddings precomputados)
│   ├── cache_service.py               # QueryCache: MemoryQueryCache | PostgresQueryCache (CACHE_BACKEND)
│   ├── calculations.py                 # dias_servicio, cesantias_proporcionales (indemnización 64 aún no calculable)
│   ├── database.py                     # DatabaseService real (psycopg): consultations + cache
│   └── prompts/hikari_master_prompt.py  # prompt maestro de HIKARI
└── intelligence/
    └── pipeline.py                 # normalize_query, detect_domain, detect_intent, validate_response
```

```
Backend/scripts/init_db.py    # crea las tablas si no existen (idempotente)
```

```
Backend/data/knowledge/embeddings.json   # generado por Backend/scripts/build_embeddings.py (no versionado)
Backend/scripts/build_embeddings.py      # precomputa embeddings del corpus
corpus/labor_law_co.jsonl                # corpus mínimo (CST + Ley 1010 de 2006), fuente real
```

## Pipeline de una consulta (fase 3)

```
POST /api/consultations
  → validación Pydantic (mensaje no vacío, ≤4000 caracteres, tipo string)
  → normalize_query (trim + lower + espacios colapsados)
  → detect_domain (reglas de palabras clave: laboral | fuera_de_dominio | ambiguo)
      → si "fuera_de_dominio": responde de inmediato, 0 llamadas a embeddings/LLM,
        se persiste igualmente en `consultations` para historial
  → detect_intent (reglas de palabras clave, solo si el dominio es laboral)
  → cache lookup (sha256 del texto normalizado; backend memory o postgres según CACHE_BACKEND)
      → si hay hit: responde sin tocar embeddings/LLM
  → knowledge.search(query, top_k=5): embed_text de la consulta + similitud coseno contra
    el corpus precomputado → Top-K fragmentos con norma/artículo/fuente/URL
  → compute_deterministic_facts: dias_servicio y cesantias_proporcionales si los datos
    están explícitos en el mensaje; nunca inventa salario/fechas/tipo de contrato
  → build_prompt (services/prompts/hikari_master_prompt.py) + llm.generate_structured
      → 1 sola llamada al LLM; 1 reintento interno solo si el JSON no valida contra el esquema
  → _enforce_contract: fuerza disclaimer, sincroniza scope con el detectado por el backend,
    descarta citas sin fuente identificable
  → cache.set(...) + database.save_consultation(...) (best-effort, no bloquea la respuesta)
  → logger.info("[consultation] scope=... intent=... cache=... embedding=... llm=... latency=...")
    (nunca se registra el texto de la consulta)
  → respuesta ConsultationResponse

GET /api/consultations?limit=20
  → database.list_consultations(limit) (máx. 100), orden descendente por fecha
```

Si el retrieval o el LLM fallan (sin API key, proveedor caído, JSON inválido tras el reintento),
la ruta captura la excepción, la registra con `logger.exception` y devuelve una
`ConsultationResponse` de fallback controlada (sin stack trace al usuario, con
`missing_information` explicando que el análisis no está disponible).

## Estado de esta fase

El pipeline de dominio/intención/retrieval/LLM/validación ya es real (Gemini). Persistencia en
PostgreSQL/Supabase y la integración del frontend quedan para la siguiente fase. Ver
[Docs/logs/phase-02.md](logs/phase-02.md).
