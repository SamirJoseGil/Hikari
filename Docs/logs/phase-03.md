# Fase 3 — Backend real de extremo a extremo

### Estado inicial (resumen de Fase 2)

- Pipeline completo implementado pero solo verificado con `FakeLLMService`/`FakeKnowledgeService`
  en los tests; ningún camino se había probado contra Gemini real.
- `services/embedding_service.py` y `services/llm_service.py` ya usaban `google-genai`, pero la
  versión instalada (`1.2.0`) no exponía la API `interactions` que usaba el código —
  nunca se había ejecutado contra la librería real.
- No existían embeddings reales (`Backend/data/knowledge/embeddings.json` no existía).
- `app/services/calculations.py` era un placeholder vacío (`compute_deterministic_facts` → `{}`).
- `app/services/database.py` solo tenía `is_database_configured()`; no había persistencia real.
- La caché (`QueryCache`) era únicamente en memoria, sin opción persistente.
- No había endpoint de historial (`GET /api/consultations`).
- No había métricas de coste/latencia en logs.

### Cambios realizados

- `app/services/embedding_service.py` / `app/services/llm_service.py`: sin cambios de diseño,
  pero se detectó y corrigió el problema real descrito abajo (upgrade de dependencia).
- `app/services/calculations.py` (reescrito): `compute_deterministic_facts` real — ver sección
  "Cálculos".
- `app/services/database.py` (reescrito): `DatabaseService` real sobre `psycopg` — ver sección
  "Base de datos".
- `app/services/cache_service.py` (reescrito): `QueryCache` (ABC) + `MemoryQueryCache` +
  `PostgresQueryCache`, seleccionable con `CACHE_BACKEND`.
- `app/routes/consultations.py` (reescrito): persiste cada consulta (best-effort, no bloquea la
  respuesta si la BD falla), agrega `GET /api/consultations?limit=20`, agrega métricas de coste
  vía `logger.info` (`cache`, `embedding`, `llm`, `latency`), nunca registra el texto de la
  consulta.
- `app/main.py`: agrega `logging.basicConfig(level=logging.INFO, ...)` — sin esto, los
  `logger.info(...)` de la app eran descartados silenciosamente por la configuración de logging
  por defecto de uvicorn (bug real encontrado durante la auditoría de coste, ver "Problemas").
- `Backend/scripts/init_db.py` (nuevo): crea `consultations` y `cache` si no existen (idempotente).
- `Backend/scripts/build_embeddings.py`: ahora guarda `corpus_hash` (sha256 del corpus),
  `embedding_model` y `generated_at` junto a los fragmentos, en vez de una lista plana.
- `app/services/knowledge_service.py`: adaptado al nuevo formato (`data["chunks"]`) y agrega un
  `logger.warning` (no bloqueante) si el corpus cambió desde que se generaron los embeddings.
- `requirements.txt`: agrega `psycopg[binary]`; sube el requisito de `google-genai` a `>=2.24.0`
  (ver "Problemas").
- `.env.example`: agrega `CACHE_BACKEND=memory`.
- Tests nuevos: `tests/test_calculations.py`, `tests/test_cache_service.py`,
  `tests/test_database_integration.py` (integración real contra PostgreSQL local, se salta sola
  si no hay conexión). `tests/test_api.py` agrega `FakeDatabaseService` y dos tests para el
  historial (persistencia + límite acotado).
- Docs: `Docs/architecture.md` y `Docs/api-contract.md` actualizados a la estructura/pipeline de
  fase 3. `README.md` (raíz): se agregó una sección "Instalación y ejecución local" sin tocar el
  contenido de producto/marketing que ya existía (fue reescrito por fuera de este pipeline entre
  fases; no se revirtió).

### Gemini

- Proveedor: **Gemini**. Modelo LLM: `gemini-3.8-flash`. Modelo de embeddings:
  `gemini-embedding-001`.
- Prueba real (servidor local, `LLM_API_KEY` real, `CACHE_BACKEND=memory`):
  - **C1** ("Me despidieron sin justa causa después de 3 años de trabajo. ¿Qué me deben pagar?"):
    `scope=laboral`, `intent=terminacion_laboral`. `legal_analysis` explica correctamente el
    artículo 64 (con los tres escenarios según tipo de contrato/salario, sin asumir ninguno),
    cita también el artículo 249 (cesantías). `missing_information` pide exactamente lo que
    falta (tipo de contrato, salario, vacaciones pendientes). Citas con fuente y URL reales.
    Disclaimer presente. **Resultado: correcto y bien fundamentado.**
  - **C2** ("Mi jefe me grita frente a todos y me cambió de cargo sin avisarme."):
    `scope=laboral`, `intent=acoso_laboral`. Reconoce correctamente la presunción de acoso
    laboral (Ley 1010/2006, art. 7) y el posible despido indirecto (CST art. 62-B). Pide
    reiteración de los hechos, testigos y si hubo desmejora salarial — preguntas pertinentes.
    Citas y disclaimer presentes. **Resultado: correcto y bien fundamentado.**
  - **C3** ("Me estafaron comprando un carro usado."): `scope=fuera_de_dominio`, `intent`
    ausente/`desconocida`, `legal_analysis=""`, 0 llamadas a embeddings/LLM (verificado con el
    log `embedding=0 llm=0`). **Resultado: correcto.**

### Embeddings

- Modelo: `gemini-embedding-001` (elegido en fase 2 porque genera un embedding independiente por
  cada texto de una lista, ideal para los 10 fragmentos del corpus).
- Fragmentos: 10 (Código Sustantivo del Trabajo arts. 22, 61, 62, 64, 186, 249; Ley 1010 de 2006
  arts. 2, 7, 10).
- Archivo generado: `Backend/data/knowledge/embeddings.json` (~420 KB; 10 embeddings de 3072
  dimensiones cada uno + metadata `corpus_hash`/`embedding_model`/`generated_at`). No se
  versiona (regenerable, no contiene secretos).
- Regeneración: `cd Backend && source .venv/bin/activate && python scripts/build_embeddings.py`.
  Solo necesita ejecutarse una vez (o cuando cambie el corpus); las consultas normales solo
  calculan el embedding de la pregunta del usuario.

### Retrieval

- Método: similitud coseno con NumPy sobre los embeddings precomputados en memoria, sin vector DB.
- Top-K: 5 (configurable con `RETRIEVAL_TOP_K`).
- Comportamiento observado (prueba manual con `InMemoryKnowledgeService` real):
  - C1 → top hits: art. 64 (0.726), art. 249 (0.681), art. 62-A (0.675), art. 62-B (0.654), Ley
    1010 art. 10 (0.642). El artículo correcto (64) queda primero.
  - C2 → top hits: Ley 1010 art. 7 (0.686), CST art. 62-B (0.646), Ley 1010 art. 2 (0.639), CST
    art. 62-A (0.636), Ley 1010 art. 10 (0.618). Los artículos de acoso laboral quedan primero.
  - C3 → el retrieval nunca se ejecuta (el pipeline corta en `detect_domain` antes de tocar
    embeddings), así que no hay resultados que evaluar.
- Sin problemas de relevancia detectados para C1/C2; no fue necesario ampliar el corpus ni
  ajustar el algoritmo de selección.

### Cálculos

Implementados en `app/services/calculations.py` (extracción determinista por regex sobre el
texto normalizado, nunca inventa datos faltantes):

- `dias_servicio`: calculable si el mensaje menciona explícitamente "N años" (ej. C1 → 1095
  días). Si no, `calculable: false` con `missing: ["fecha_de_ingreso", "fecha_de_terminacion"]`.
- `cesantias_proporcionales` (art. 249 C.S.T.): calculable solo si años de servicio **y** salario
  mensual están explícitos en el texto (`salario * años`). Si falta cualquiera de los dos,
  `calculable: false` con el campo faltante exacto.
- `indemnizacion_articulo_64`: **deliberadamente siempre `calculable: false`** en esta fase. El
  artículo 64 exige comparar el salario contra el SMMLV vigente para elegir el tramo de la
  indemnización, y ese valor no forma parte de nuestro corpus/fuentes verificadas — calcularlo
  significaría inventar una cifra, algo explícitamente prohibido. `missing` incluye
  `salario_minimo_legal_vigente` para dejar claro qué falta agregar en una fase futura.
- Los resultados se inyectan en el prompt como `calculos_deterministas`; el LLM nunca rehace esta
  aritmética (se le indica explícitamente en `SYSTEM_INSTRUCTION`).

### Base de datos

- PostgreSQL (Docker local, contenedor `postgres_text_db`, puerto 5433) verificado con las
  credenciales de `Backend/.env`. También funciona contra Supabase Postgres sin cambios (mismo
  protocolo, solo cambia `DATABASE_URL`).
- Driver: `psycopg` 3 (`psycopg[binary]`), una conexión por operación (sin pool), autocommit.
- Tablas (`Backend/scripts/init_db.py`, idempotente — `CREATE TABLE IF NOT EXISTS`):
  - `consultations(id, question, normalized_question, scope, intent, response_json, created_at)`
  - `cache(key, response_json, scope, intent, created_at, expires_at)`
- `DatabaseService` (`app/services/database.py`): `init_schema`, `save_consultation`,
  `list_consultations(limit)`, `get_cached_response`, `save_cached_response`. Sin SQL directo en
  las rutas (`routes → services → database`).
- **Persistencia comprobada de extremo a extremo:** se enviaron 3 consultas (C1 en el momento del
  bug de SDK, "vacaciones" y C3), se reinició el proceso del backend (`kill` + nuevo `uvicorn`), y
  `GET /api/consultations?limit=3` devolvió las 3 consultas anteriores con su `response_json`
  completo tras el reinicio.

### Cache

- `MemoryQueryCache` (por defecto, `CACHE_BACKEND=memory`): dict en el proceso actual.
- `PostgresQueryCache` (`CACHE_BACKEND=postgres`): persiste en la tabla `cache`, misma interfaz.
- Regla de reutilización: solo se reutiliza la respuesta completa si la clave (`sha256` del texto
  normalizado) es **exactamente** igual a una consulta anterior. No hay reutilización por
  similitud semántica de respuestas jurídicas completas (evita el riesgo de aplicar una respuesta
  a hechos distintos).

### Coste

Ejemplos reales de los logs (`[consultation] scope=... intent=... cache=... embedding=... llm=... latency=...`),
verificados contra el servidor real:

```
[consultation] scope=fuera_de_dominio intent=desconocida cache=n/a embedding=0 llm=0 latency=0.060s
[consultation] scope=laboral intent=vacaciones cache=miss embedding=1 llm=1 latency=13.994s
[consultation] scope=laboral intent=vacaciones cache=hit embedding=0 llm=0 latency=0.001s
```

Nunca se registra el texto de la consulta (solo `scope`/`intent`/métricas), por privacidad.

### Tests

`cd Backend && source .venv/bin/activate && pytest -q` → **23/23 passed**, sin llamadas a Gemini
(usa `FakeLLMService`/`FakeKnowledgeService`/`FakeDatabaseService`) y sin requerir `LLM_API_KEY`.
Las pruebas de `test_database_integration.py` sí usan un PostgreSQL real (no Gemini) y se saltan
automáticamente (`pytest.skip`) si no hay conexión disponible; en este entorno se ejecutaron
contra el Postgres local real y pasaron.

Desglose: 10 tests de `test_api.py` (health, C1/C2/C3 con fakes, ambiguo, información
insuficiente, validaciones, caché, historial persistido, límite acotado del historial), 5 de
`test_calculations.py`, 4 de `test_cache_service.py`, 2 de `test_database_integration.py` (contra
Postgres real), más los 2 heredados de fases anteriores dentro de `test_api.py`.

### Problemas

1. **`google-genai` 1.2.0 no soportaba `client.interactions`** (usado por `llm_service.py` desde
   la fase 2, pero nunca antes probado contra la librería real). Se verificó la documentación
   oficial vigente y se confirmó que la API `Interactions` sí existe en el SDK actual; el
   problema era la versión instalada. Se actualizó a `google-genai>=2.24.0` (última disponible en
   PyPI) y la llamada funcionó de inmediato. Se documenta como lección: la fase 2 no había podido
   detectar esto por falta de `LLM_API_KEY`.
2. **Los logs de coste (`logger.info`) no aparecían** en la salida de uvicorn porque nunca se
   había configurado `logging.basicConfig`. Corregido en `app/main.py`.
3. Ningún otro bloqueo. El corpus/retrieval no necesitó ajustes: los artículos correctos ya
   quedaban primero para C1 y C2 sin ninguna optimización adicional.

### Estado final

- backend real: **sí**
- Gemini real: **sí** (verificado con C1 y C2 reales)
- embeddings reales: **sí** (10 fragmentos, `gemini-embedding-001`, archivo generado y verificado)
- retrieval real: **sí** (verificado manualmente, artículos relevantes en el top de C1/C2)
- C1 real: **sí**
- C2 real: **sí**
- C3 real: **sí** (0 llamadas a embeddings/LLM, verificado en logs)
- calculations: **sí** (parcial y honesto: `dias_servicio` y `cesantias_proporcionales`
  calculables cuando el dato está explícito; `indemnizacion_articulo_64` deliberadamente no
  calculable en esta fase por falta de una fuente verificada del SMMLV vigente)
- PostgreSQL: **sí** (Docker local, puerto 5433, verificado)
- Supabase: **no probado directamente** (mismo código/protocolo que PostgreSQL; no se disponía de
  una instancia Supabase en este entorno, pero no hay nada específico de Supabase en el código)
- persistencia: **sí** (verificada con reinicio real del backend)
- cache persistente: **sí** (`PostgresQueryCache` implementada; por defecto se usa la variante en
  memoria, `CACHE_BACKEND=memory`, más simple para desarrollo local)

### Pendientes

- Verificar `CACHE_BACKEND=postgres` con una prueba manual dedicada (la clase está implementada y
  usa las mismas operaciones de `DatabaseService` ya probadas, pero no se ejecutó explícitamente
  con ese backend activado en esta fase).
- Probar contra una instancia Supabase real (no solo PostgreSQL local).
- Ampliar `compute_deterministic_facts` con el SMMLV vigente (como fuente verificada) para poder
  calcular `indemnizacion_articulo_64` cuando los demás datos estén completos.
- Revisar manualmente más variaciones de C1/C2 (frases distintas) para afinar el prompt si aparece
  algún caso con calidad inferior a la observada aquí.

### Próxima fase

Integración del frontend con la API real (formulario de consulta, render de
`ConsultationResponse`, historial) y construcción de la experiencia de usuario de HIKARI sobre
Remix, siguiendo `Frontend/docs/Estilos.md`.
