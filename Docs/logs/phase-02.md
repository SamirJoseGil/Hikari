# Fase 2 — Backend jurídico funcional de HIKARI

### Estado inicial

- Fase 1 verificada: FastAPI con `GET /api/health` y `POST /api/consultations` devolviendo una
  respuesta **mock** que ya respetaba el contrato (`scope`, `intent`, `summary`,
  `legal_analysis`, `norms`, `actions`, `missing_information`, `citations`, `disclaimer`).
- `services/llm_service.py`, `services/embedding_service.py`, `services/knowledge_service.py`
  eran interfaces con implementaciones mock (sin proveedor real).
- `intelligence/pipeline.py` tenía una heurística de dominio muy simple (una lista corta de
  palabras clave) y no tenía detección de intención real.
- No existía corpus legal, ni embeddings, ni caché de consultas, ni prompt maestro.
- `corpus/`, `evals/` existían vacíos (solo README de fase 1).
- Sin `LLM_API_KEY` configurada en `Backend/.env` (vacío).

### Cambios realizados

Corpus:
- `corpus/labor_law_co.jsonl` (nuevo): 10 fragmentos reales, transcritos directamente de
  www.secretariasenado.gov.co (Código Sustantivo del Trabajo, artículos 22, 61, 62, 64, 186, 249;
  Ley 1010 de 2006, artículos 2, 7, 10). Ningún texto fue inventado ni citado de memoria.
- `corpus/README.md` (actualizado): documenta el formato y las fuentes.

Backend — servicios reales:
- `app/services/embedding_service.py` (reescrito): `GeminiEmbeddingService` real
  (`embed_text`/`embed_texts` sobre `google-genai`, modelo `gemini-embedding-001`). El cliente
  se construye de forma perezosa (lazy) para no exigir `LLM_API_KEY` en peticiones que no lo
  necesitan (p. ej. consultas fuera de dominio).
- `app/services/llm_service.py` (reescrito): `GeminiLLMService.generate_structured(...)` usa
  `client.interactions.create(..., response_format={"schema": ConsultationResponse.model_json_schema()})`
  para forzar salida JSON estructurada. Incluye **un solo reintento** si la respuesta no valida
  contra el esquema Pydantic; si el segundo intento también falla, propaga la excepción (la
  captura la ruta).
- `app/services/knowledge_service.py` (reescrito): `InMemoryKnowledgeService` — carga perezosa
  de `Backend/data/knowledge/embeddings.json`, calcula similitud coseno con NumPy y devuelve el
  Top-K (por defecto 5) con toda la metadata necesaria para citar.
- `app/services/cache_service.py` (nuevo): `QueryCache`, diccionario en memoria con clave
  `sha256(texto_normalizado)`. Reemplazable por Postgres/Supabase sin tocar la ruta.
- `app/services/calculations.py` (nuevo): `compute_deterministic_facts(...)` — placeholder vacío,
  deja el lugar para cálculos de días/proporciones/indemnización en la siguiente fase.
- `app/services/prompts/hikari_master_prompt.py` (nuevo): `SYSTEM_INSTRUCTION` (rol, objetivo y
  las 14 reglas críticas pedidas) + `build_prompt(...)` que arma el payload (consulta original,
  normalizada, dominio, intención, evidencia recuperada, cálculos deterministas).

Backend — inteligencia:
- `app/intelligence/pipeline.py` (reescrito): `normalize_query` (trim + lower + espacios
  colapsados), `detect_domain` (reglas: palabra clave laboral → `laboral`; si no hay señal
  laboral pero sí de otro dominio → `fuera_de_dominio`; si no hay ninguna señal → `ambiguo`),
  `detect_intent` (reglas ordenadas: acoso_laboral, terminacion_laboral, liquidacion,
  cambio_condiciones, salario, vacaciones, contrato_laboral, general_laboral).

Backend — ruta:
- `app/routes/consultations.py` (reescrito): orquesta el pipeline completo con inyección de
  dependencias de FastAPI (`Depends`) para `KnowledgeService`, `LLMService` y `QueryCache` (esto
  permite sustituirlos por fakes en los tests sin llamadas reales). Corta camino (0 llamadas a
  embeddings/LLM) cuando `scope == fuera_de_dominio`. Aplica `_enforce_contract` después del LLM
  (fuerza disclaimer, sincroniza `scope` con el detectado por el backend, descarta citas sin
  fuente). Si el retrieval o el LLM fallan, captura la excepción, la registra con
  `logger.exception` y devuelve una respuesta de fallback controlada (sin stack trace al
  usuario).

Backend — configuración y utilidades:
- `app/config.py`: agrega `llm_model` (`gemini-3.8-flash`), `embedding_model`
  (`gemini-embedding-001`) y `retrieval_top_k` (5), todos configurables por variable de entorno.
- `Backend/scripts/build_embeddings.py` (nuevo): lee `corpus/labor_law_co.jsonl`, genera
  embeddings vía `EmbeddingService` y escribe `Backend/data/knowledge/embeddings.json`.
- `Backend/data/knowledge/README.md` (nuevo): cómo regenerar los embeddings.
- `requirements.txt`: agrega `google-genai` y `numpy`.
- `.env.example`: agrega `LLM_PROVIDER=gemini`, `EMBEDDING_PROVIDER=gemini`,
  `LLM_MODEL`, `EMBEDDING_MODEL`, `RETRIEVAL_TOP_K`.
- `.gitignore` (raíz): ignora `Backend/data/knowledge/embeddings.json` (se regenera, no se
  versiona, no contiene secretos pero tampoco aporta si queda desactualizado).

Tests:
- `Backend/tests/test_api.py` (reescrito): usa `app.dependency_overrides` con un
  `FakeKnowledgeService` y un `FakeLLMService` (cuenta llamadas) — ningún test llama a la Gemini
  API real. Cubre: health, C1 (despido sin justa causa), C2 (acoso + cambio de cargo), C3
  (estafa con carro usado → fuera de dominio, 0 llamadas al LLM), consulta ambigua, consulta
  laboral con información insuficiente, validaciones (vacío, muy largo, tipo inválido) y caché
  (dos variantes de la misma consulta normalizada solo generan 1 llamada al LLM).

Documentación:
- `Docs/architecture.md`: agrega la estructura de fase 2 y el diagrama detallado del pipeline de
  una consulta (con y sin fallos).
- `Docs/api-contract.md`: reemplaza el ejemplo mock por un ejemplo con contenido real derivado
  del corpus.
- `README.md`: agrega la sección para regenerar embeddings y actualiza la nota sobre el estado
  del endpoint.
- `Docs/logs/phase-02.md` (este archivo).

### Corpus

`corpus/labor_law_co.jsonl`, 10 fragmentos, todos con `id`, `topic`, `title`, `norm`, `article`,
`content`, `source`, `source_url`. Fuente: www.secretariasenado.gov.co (Código Sustantivo del
Trabajo y Ley 1010 de 2006). Cada fragmento conserva norma + artículo + contenido juntos (sin
partir artículos a la mitad). Cubre: definición de contrato, causales de terminación (arts. 61,
62, 64 — clave para C1), vacaciones (art. 186), cesantías (art. 249) y acoso laboral (Ley 1010,
arts. 2, 7, 10 — clave para C2).

### Embeddings

- Proveedor: **Gemini** (`google-genai`), modelo `gemini-embedding-001` (elegido porque genera
  un embedding independiente por cada cadena de una lista de entradas, que es exactamente lo que
  necesitamos para embeber los 10 fragmentos del corpus por separado; `gemini-embedding-2` agrega
  varias entradas en un solo embedding salvo que se usen objetos `Content` separados, lo que
  complica el caso de uso simple de este hackathon).
- Almacenamiento: `Backend/data/knowledge/embeddings.json` (no versionado), generado una sola vez
  con `Backend/scripts/build_embeddings.py`. Cada consulta solo calcula el embedding de la
  pregunta del usuario, nunca recalcula el corpus.
- Regeneración: `cd Backend && source .venv/bin/activate && python scripts/build_embeddings.py`
  (requiere `LLM_API_KEY`).
- **No se pudo generar el archivo real en esta fase** porque no hay una `LLM_API_KEY` disponible
  en este entorno de desarrollo. El código está listo y probado (mock) para generarlo en cuanto
  se configure la clave.

### Retrieval

`InMemoryKnowledgeService.search(query, top_k=5)`: calcula el embedding de la consulta,
similitud coseno (NumPy) contra la matriz de embeddings del corpus, devuelve los 5 fragmentos más
similares con toda la metadata para citar (norma, artículo, fuente, URL, fragmento). Sin base de
datos vectorial. Carga perezosa: si `embeddings.json` no existe, el error solo ocurre si
realmente se necesita el retrieval (no en consultas fuera de dominio).

### Clasificación

- **Dominio** (`detect_domain`): reglas por palabras clave. Si hay señal laboral → `laboral`. Si
  no hay señal laboral pero sí de otro dominio (compraventa, estafa, arriendo, divorcio, penal,
  etc.) → `fuera_de_dominio`. Si no hay ninguna señal clara → `ambiguo`. Sin llamada al LLM.
- **Intención** (`detect_intent`, solo si `scope == laboral`): reglas ordenadas — acoso_laboral,
  terminacion_laboral, liquidacion, cambio_condiciones, salario, vacaciones, contrato_laboral,
  general_laboral. Sin llamada al LLM.

### LLM

- Proveedor: **Gemini**, modelo `gemini-3.8-flash` (rápido y económico, adecuado para una app de
  orientación que no requiere razonamiento profundo, según la documentación oficial vigente).
- Salida estructurada: `client.interactions.create(..., response_format={"schema": ConsultationResponse.model_json_schema()})`,
  validada con `ConsultationResponse.model_validate_json(...)`. Un solo reintento controlado si
  el JSON no valida; sin cadenas de reintentos.
- El prompt maestro (`services/prompts/hikari_master_prompt.py`) instruye al modelo a: restringirse
  a derecho laboral colombiano, no inventar normas/artículos/sentencias/fuentes, distinguir
  hechos de inferencias, declarar información faltante, citar solo la evidencia entregada y
  nunca mencionar arquitectura interna al usuario.

### Pipeline final

```
input (ConsultationRequest)
  → preprocessing: validación Pydantic → normalize_query → detect_domain
      → si fuera_de_dominio: response inmediata, 0 llamadas a embeddings/LLM
  → detect_intent
  → cache lookup (sha256 del texto normalizado) → si hit, responde sin retrieval/LLM
  → retrieval: embed_text(query) + similitud coseno → Top-5 fragmentos del corpus
  → build_prompt (con evidencia + cálculos deterministas, aún vacíos)
  → LLM: generate_structured (1 llamada, 1 reintento solo si el JSON no valida)
  → validation: _enforce_contract (disclaimer, scope, citas con fuente)
  → cache.set(...)
  → response (ConsultationResponse)
```

### Costo

- 0 llamadas al LLM/embeddings para consultas fuera de dominio (corte determinista antes del
  retrieval).
- 1 sola llamada al LLM por consulta nueva (máximo 1 reintento interno solo ante JSON inválido).
- Consultas repetidas (mismo texto tras normalizar) reutilizan la respuesta cacheada: 0 llamadas
  adicionales. Verificado en `test_cache_avoids_duplicate_llm_call_for_equivalent_query`.
- Top-K de retrieval limitado a 5 fragmentos (nunca se envían 20-50 al LLM).

### Pruebas

`cd Backend && source .venv/bin/activate && pytest -q` → **10/10 passed** (con `FakeLLMService`/
`FakeKnowledgeService`, sin llamadas reales a Gemini):
- `test_health_ok`
- `test_c1_despido_sin_justa_causa` (scope laboral, citas y acciones presentes)
- `test_c2_acoso_y_cambio_de_cargo` (scope laboral, citas presentes)
- `test_c3_fuera_de_dominio_no_llama_llm` (scope fuera_de_dominio, 0 llamadas al LLM verificado)
- `test_consulta_ambigua` (scope ambiguo)
- `test_consulta_laboral_con_informacion_insuficiente` (missing_information no vacío)
- `test_consultation_empty_message_is_rejected` / `_too_long_` / `_invalid_type_` (422)
- `test_cache_avoids_duplicate_llm_call_for_equivalent_query` (1 sola llamada para 2 variantes)

También se verificó manualmente con el servidor real (sin `LLM_API_KEY`, para probar el manejo de
fallas): `/api/health` responde 200; la consulta fuera de dominio responde sin tocar el LLM; la
consulta laboral, al fallar la llamada real a Gemini (sin clave), devuelve una respuesta de
fallback controlada con código 200 (nunca un stack trace ni un 500).

### Problemas

- No hay `LLM_API_KEY` disponible en este entorno, por lo que **no se pudo probar la llamada real
  a Gemini** (generación de embeddings del corpus ni generación de respuestas). El código sigue
  el SDK oficial vigente (`google-genai`, `client.models.embed_content`,
  `client.interactions.create` con `response_format`) verificado contra la documentación oficial,
  pero debe probarse end-to-end en cuanto se configure la clave.
- Como no se generaron los embeddings reales, `Backend/data/knowledge/embeddings.json` no existe
  todavía en este entorno; se genera con `python scripts/build_embeddings.py` en cuanto haya
  clave.

### Estado

- backend funciona: **sí**
- health funciona: **sí**
- consultation real funciona: **parcialmente** — el pipeline completo (dominio, intención,
  retrieval, LLM, validación, caché, manejo de fallas) está implementado y probado con fakes;
  falta verificar la llamada real a Gemini porque no hay `LLM_API_KEY` en este entorno.
- C1 funciona: **sí** (con fakes; pendiente de verificación con LLM real)
- C2 funciona: **sí** (con fakes; pendiente de verificación con LLM real)
- C3 funciona: **sí** (se rechaza correctamente, verificado con el servidor real, 0 llamadas LLM)
- LLM conectado: **no** (código listo, falta `LLM_API_KEY`)
- embeddings conectados: **no** (código listo, falta `LLM_API_KEY` para generarlos)
- retrieval funcionando: **parcialmente** (lógica de coseno probada; falta `embeddings.json` real)
- BD conectada: **no** (fuera de alcance de esta fase, como se pidió)

### Próxima fase

1. Configurar `LLM_API_KEY` real y ejecutar `python scripts/build_embeddings.py` para generar
   `Backend/data/knowledge/embeddings.json`.
2. Probar C1, C2 y C3 contra la Gemini API real (no solo con fakes) y ajustar el prompt maestro
   según la calidad de las respuestas observadas.
3. Implementar `compute_deterministic_facts` en `app/services/calculations.py` (al menos: días de
   servicio, indemnización aproximada del artículo 64, cesantías proporcionales).
4. Integrar el frontend con `POST /api/consultations` (formulario + render de la respuesta
   estructurada, siguiendo `Frontend/docs/Estilos.md`).
5. Conectar PostgreSQL/Supabase para persistir consultas (reemplazando `QueryCache` en memoria).
