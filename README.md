# HIKARI

Asistente de orientación en **derecho laboral colombiano**. El usuario describe su situación en
lenguaje natural y recibe una orientación jurídica estructurada (resumen, análisis, normas
aplicables con cita y fuente, acciones sugeridas, información faltante y disclaimer), basada en
un corpus jurídico real y generada con un LLM.

HIKARI **no** cubre otras áreas del derecho (civil, penal, familia, consumo, etc.) y **no**
sustituye la asesoría de un abogado.

## Arquitectura (resumen)

```
Frontend (Remix)  →  FastAPI  →  detección de dominio/intención (reglas, sin LLM)
                                        │
                          fuera de dominio ──► respuesta inmediata (0 embeddings, 0 LLM)
                                        │
                                  laboral / ambiguo
                                        │
                     cache exacta (sha256) ──► hit: responde sin llamar a nada
                                        │
                     embedding de la consulta + similitud coseno sobre el corpus (Top-5)
                                        │
                       Gemini (1 llamada, 1 reintento solo si el JSON no valida)
                                        │
                         validación de contrato + PostgreSQL (historial + cache)
```

Ver [Docs/architecture.md](Docs/architecture.md) y [Docs/api-contract.md](Docs/api-contract.md)
para el detalle completo, y [Docs/logs/](Docs/logs/) para el registro de cada fase de desarrollo.

## Requisitos

- Docker + Docker Compose (para PostgreSQL — no depende de ningún contenedor previo tuyo)
- Python 3.12+, Node.js 20+
- Una API key de Gemini gratuita: https://aistudio.google.com/apikey (crea una cuenta, pulsa
  "Create API key" y copia el valor)

## Instalación y ejecución (máquina limpia)

```sh
git clone <este-repositorio> hikari
cd hikari
cp Backend/.env.example Backend/.env
# edita Backend/.env y pega tu LLM_API_KEY (el resto de valores ya funcionan tal cual)
./start.sh
```

`start.sh` hace todo el trabajo:
1. Levanta PostgreSQL con `docker compose up -d` (contenedor propio del proyecto, puerto 5433).
2. Crea el entorno virtual de Python, instala dependencias y crea las tablas (`init_db.py`).
3. Inicia el backend en `http://127.0.0.1:8000`.
4. Instala dependencias de Node e inicia el frontend (Vite imprime la URL exacta, normalmente
   `http://localhost:5173`).

Si el puerto 8000 u otro ya está en uso en tu máquina, exporta `BACKEND_PORT` antes de ejecutar
`./start.sh` (por ejemplo `BACKEND_PORT=8010 ./start.sh`) y ajusta `Frontend/.env`
(`BACKEND_URL=http://127.0.0.1:8010`) en consecuencia.

**Nota:** `python scripts/build_embeddings.py` (ver más abajo) ya se ejecutó para este corpus y
su resultado no se versiona; solo hace falta volver a correrlo si cambias el corpus o no existe
`Backend/data/knowledge/embeddings.json`.

## Variables de entorno (`Backend/.env.example`)

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL. El valor por defecto ya coincide con el
  PostgreSQL que levanta `docker-compose.yml` (usuario, contraseña, puerto 5433, db `hackaton`) |
| `LLM_API_KEY` | **Única variable que de verdad tienes que configurar.** API key de Gemini,
  obtenida en https://aistudio.google.com/apikey |
| `LLM_PROVIDER` | `gemini` (único proveedor implementado) |
| `LLM_MODEL` | Modelo de generación, por defecto `gemini-3.8-flash` |
| `EMBEDDING_PROVIDER` | `gemini` |
| `EMBEDDING_MODEL` | Modelo de embeddings, por defecto `gemini-embedding-001` |
| `RETRIEVAL_TOP_K` | Fragmentos del corpus a recuperar por consulta (por defecto 5) |
| `CACHE_BACKEND` | `memory` (por defecto, sin setup) o `postgres` (persistente) |

`docker-compose.yml` acepta opcionalmente `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` y
`POSTGRES_PORT` (con los mismos valores por defecto que `Backend/.env.example`) si quieres
cambiarlos; en ese caso actualiza `DATABASE_URL` para que coincida.

Nunca subas `Backend/.env` al repositorio (ya está en `.gitignore`); usa `.env.example` como
plantilla. No hay claves reales en el código ni en `.env.example`.

`Frontend/.env` solo necesita `BACKEND_URL` (por defecto `http://127.0.0.1:8000`; ajústalo si tu
backend corre en otro puerto).

## URLs

- Frontend: `http://localhost:5173` (Vite imprime el puerto exacto si el 5173 está ocupado).
- Backend: `http://127.0.0.1:8000` (o el puerto que definas con `BACKEND_PORT`).
- Health check: `http://127.0.0.1:8000/api/health`.

## Uso

1. Abre el frontend (`http://localhost:5173` o el puerto que indique `npm run dev`).
2. Ve a **Consultar** (`/chat`) y describe tu situación, o usa un ejemplo rápido.
3. HIKARI muestra resumen, análisis, normas con artículo y fuente, acciones, información
   faltante y el disclaimer. Si la consulta no es laboral, lo indica sin llamar al LLM.
4. Tu historial de consultas (modo invitado) se guarda en este navegador; en `/profile` puedes
   ver cuántas consultas has hecho.
5. Cada orientación visible en `/chat` se puede exportar a PDF con el botón "Descargar PDF"
   (usa la impresión del navegador, sin llamadas adicionales a Gemini).

## Tests

```sh
cd Backend && source .venv/bin/activate && pytest -q
```

Usan fakes/mocks: nunca llaman a Gemini ni requieren `LLM_API_KEY`. Las pruebas de base de datos
se saltan automáticamente si PostgreSQL no está disponible.

```sh
cd Frontend && npx tsc --noEmit
```

## Regenerar embeddings del corpus

Solo necesario una vez, o cuando cambie `corpus/labor_law_co.jsonl` (requiere `LLM_API_KEY`):

```sh
cd Backend && source .venv/bin/activate && python scripts/build_embeddings.py
```

## Evaluación (`evals/`)

5 casos mínimos (despido, acoso/cambio de condiciones, fuera de dominio, salario, vacaciones):

```sh
# Gratis: solo valida detección de dominio/intención, sin llamar a Gemini
cd Backend && source .venv/bin/activate && python ../evals/run_evals.py

# Consume cuota de Gemini: llama al backend real. Úsalo con moderación.
python ../evals/run_evals.py --live --base-url http://127.0.0.1:8000
```

## Limitaciones conocidas

- El plan gratuito de Gemini tiene cuota diaria limitada; si se agota, HIKARI responde con un
  mensaje controlado (nunca un error crudo) en vez de la orientación jurídica.
- No hay autenticación real todavía: HIKARI funciona en modo invitado (historial guardado en el
  navegador); `/login` y `/register` están preparadas pero no conectadas a un backend de auth.
- El corpus jurídico cubre 10 fragmentos (Código Sustantivo del Trabajo y Ley 1010 de 2006);
  no todos los temas laborales están representados.

---

**HIKARI ofrece orientación general y no sustituye el consejo de un abogado. Verifica siempre
con un profesional.**
