# Fase 1 — Base técnica de HIKARI

### Estado inicial

- Repo con carpetas `Backend/`, `Frontend/`, `Docs/` ya existentes (nombres capitalizados, se
  respetaron para no romper referencias existentes).
- `Backend/app/main.py`: FastAPI mínimo, un solo endpoint `GET /` de prueba. Sin routers, sin
  modelos, sin config.
- `Backend/.venv` ya creado con `fastapi`, `uvicorn`, `pydantic` instalados (sin `requirements.txt`
  todavía).
- `Backend/.env` existía vacío; `Docs/BDyDocker.md` documenta Postgres vía Docker (puerto 5433,
  db `hackaton`, user `usuario_admin`).
- `Frontend/`: proyecto Remix + TypeScript (`package.json` con nombre "portafolio", reutilizado
  de otro proyecto), ya con rutas, Tailwind, etc. No consumía ninguna API todavía.
- No existía `README.md` en la raíz, ni `.gitignore` en la raíz, ni `requirements.txt`, ni
  `.env.example`, ni carpetas `corpus/`, `evals/`, ni `docs/logs`.

### Cambios realizados

Backend (`Backend/app/`):
- `config.py` — carga `.env` con `python-dotenv` y expone `Settings`/`get_settings()`.
- `models/consultation.py` — `ConsultationRequest`, `ConsultationResponse`, `NormReference`,
  `Citation`, `Action`, `MissingInformation`, enum `Scope`.
- `services/llm_service.py`, `services/embedding_service.py`, `services/knowledge_service.py` —
  interfaces (ABC) + implementación mock, con función factory `get_*_service()`.
- `services/database.py` — placeholder, solo expone `is_database_configured()` (no se agregó
  driver de Postgres todavía, para no sumar dependencias sin uso real).
- `intelligence/pipeline.py` — `normalize_query`, `detect_domain` (heurística por palabras clave),
  `detect_intent`, `retrieve_context`, `validate_response` (todos stubs deterministas).
- `routes/health.py` — `GET /api/health`.
- `routes/consultations.py` — `POST /api/consultations`, usa el pipeline de intelligence y
  devuelve una respuesta mock respetando el contrato.
- `main.py` — reescrito: registra los routers, agrega `CORSMiddleware` (abierto, para desarrollo).
- `requirements.txt` (nuevo) — fastapi, uvicorn, pydantic, python-dotenv, pytest, httpx.
- `.env.example` (nuevo) — `DATABASE_URL`, `LLM_API_KEY`, `LLM_PROVIDER`, `EMBEDDING_PROVIDER`.
- `tests/test_api.py` (nuevo) — 6 tests: health, contrato de consultation, mensaje vacío,
  mensaje muy largo, tipo inválido, mensaje fuera de dominio.

Raíz del repo:
- `README.md` (nuevo) — instrucciones de instalación/ejecución/pruebas.
- `corpus/README.md` (nuevo) — carpeta vacía preparada para el corpus legal.
- `evals/README.md` (nuevo) — carpeta vacía preparada para casos de evaluación.

Documentación (`Docs/`, reutilizando la carpeta ya existente en vez de crear `docs/` en minúscula):
- `Docs/architecture.md` (nuevo).
- `Docs/api-contract.md` (nuevo).
- `Docs/logs/phase-01.md` (este archivo).

No se tocó el frontend: sigue funcionando igual que antes, todavía no consume la API.

### Arquitectura actual

```
Frontend (Remix)  →  (aún no integrado)
Backend/app/
  main.py            FastAPI + CORS + routers
  config.py          variables de entorno
  routes/            health.py, consultations.py
  models/            consultation.py
  services/          llm_service.py, embedding_service.py, knowledge_service.py, database.py
  intelligence/       pipeline.py (normalización, detección de dominio/intención, retrieval, validación — todo stub)
tests/               test_api.py
```

### Contratos

- `GET /api/health` → `{ "status": "ok", "service": "hikari-backend" }`
- `POST /api/consultations`:
  - Request: `{ "message": string }` (1–4000 caracteres, no vacío tras `strip()`).
  - Response: `ConsultationResponse` con `scope` (`laboral | fuera_de_dominio | ambiguo`),
    `intent`, `summary`, `legal_analysis`, `norms[]`, `actions[]`, `missing_information[]`,
    `citations[]`, `disclaimer`.
  - Ver ejemplos completos en [Docs/api-contract.md](../api-contract.md).

### Decisiones

- Se mantuvieron los nombres de carpeta existentes (`Backend/`, `Frontend/`, `Docs/`) en vez de
  renombrar a minúsculas, para no romper rutas/scripts/imports ya configurados.
- `corpus/` y `evals/` sí se crearon en minúscula en la raíz porque no existían antes y así
  quedan alineados con la estructura objetivo.
- No se agregó ningún driver de base de datos (`psycopg2`/`sqlalchemy`) todavía: no hay uso real
  de la BD en esta fase, así que se evita una dependencia sin propósito inmediato.
- `python-dotenv`, `pytest` y `httpx` se agregaron porque son necesarios para que `.env` funcione
  localmente y para poder correr los tests con `TestClient` (requeridos explícitamente en el
  encargo).
- `detect_domain` es una heurística simple por palabras clave (no un clasificador real): suficiente
  para dejar el contrato de `scope` operativo sin sobre-construir en esta fase.
- CORS abierto (`allow_origins=["*"]`) para simplificar la integración del frontend durante el
  hackathon; se debe restringir antes de producción.

### Pendientes (siguiente fase)

- Conectar un LLM real en `LLMService` (proveedor configurable vía `LLM_PROVIDER`/`LLM_API_KEY`).
- Implementar `EmbeddingService` real y cargar el corpus en `corpus/`.
- Implementar `KnowledgeService` (retrieval real sobre el corpus/embeddings).
- Reemplazar la heurística de `detect_domain`/`detect_intent` por una clasificación más confiable.
- Construir el análisis jurídico real (`legal_analysis`, `norms`, `actions`, `citations`,
  `missing_information`) en vez de la respuesta mock actual.
- Conectar `database.py` a PostgreSQL/Supabase (persistencia de consultas, si se decide necesaria).
- Integrar el frontend con `POST /api/consultations` (formulario + render de la respuesta).
- Construir la suite de `evals/` con casos reales de derecho laboral.

### Problemas

- Ninguno bloqueante. Se detectó un proceso `uvicorn` de prueba quedando ocupando el puerto 8001
  durante la verificación manual; no afecta el código, solo el entorno de pruebas local.

### Cómo ejecutar

Ver [README.md](../../README.md) en la raíz del repo. Resumen:
```sh
cd Backend && source .venv/bin/activate && pip install -r requirements.txt
uvicorn app.main:app --reload
# en otra terminal:
curl http://127.0.0.1:8000/api/health
curl -X POST http://127.0.0.1:8000/api/consultations -H "Content-Type: application/json" -d '{"message":"Me despidieron sin justa causa"}'
cd Backend && pytest -q
```

### Estado

- backend funciona: **sí**
- frontend funciona: **sí** (sin cambios, no probado en esta fase pero no se tocó)
- API health funciona: **sí**
- consultation endpoint funciona: **sí** (respuesta mock, contrato válido)
- BD conectada: **no**
- LLM conectado: **no**

### Próxima fase

Implementar la capa de inteligencia real: clasificación de dominio/intención más robusta,
integración del `LLMService` con un proveedor real, y el `KnowledgeService`/embeddings sobre un
corpus mínimo de derecho laboral colombiano (Código Sustantivo del Trabajo como primer documento).
