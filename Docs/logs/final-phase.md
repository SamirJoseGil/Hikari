# Fase final — HIKARI demo-ready

### Última pasada

- Correcciones: ninguna crítica encontrada en la revisión rápida de rutas, imports, env vars,
  secretos y arranque; todo intacto.
- PDF: **sí**. Botón "Descargar PDF" en `/chat` (visible solo con una respuesta cargada), usa
  `window.print()` con una vista impresa dedicada (`print-area` + letterhead HIKARI/Orientación
  laboral/Situación). Cero dependencias nuevas, cero cambios de backend/contrato.
- Pruebas finales: `tsc --noEmit` limpio, `pytest -q` 23/23, `GET /api/health` 200, C3 fuera de
  dominio verificado en el navegador (0 llamadas a Gemini) mostrando el botón "Descargar PDF".
  No se repitieron C1/C2 contra Gemini real (cuota agotada, no era necesario).
- Problemas restantes: ninguno bloqueante para la demo.

### Estado final

HIKARI funciona de extremo a extremo: frontend multi-vista, backend real (Gemini + retrieval +
PostgreSQL), historial e invitado, y ahora arranca en una máquina limpia con un único flujo
reproducible (`docker compose` para PostgreSQL + `start.sh`).

### Rutas

- `/` — inicio (propuesta de valor, CTA a `/chat`, ejemplos, cómo funciona).
- `/chat` — formulario, resultado, historial de invitado, nueva consulta (vista principal).
- `/about` — qué es HIKARI, cómo funciona, fuentes jurídicas, límites, disclaimer.
- `/login`, `/register` — preparadas visualmente, con aviso explícito de "próximamente"; nunca
  simulan una sesión real.
- `/profile` — estado invitado, conteo de consultas locales, enlaces a Consultar/Iniciar sesión.

### Extras

- E1 corpus (10 fragmentos reales), E2 citas (norma/artículo/fuente/fragmento), E4 evaluación
  (`evals/cases.json` + `run_evals.py`, 5/5 OK en modo gratuito), E5 fuera de dominio (0
  embeddings/LLM), E6 tests (23/23), E10 historial (backend persistente + invitado en
  localStorage), E13 accesibilidad básica (labels, `aria-invalid`, foco visible).
- Auth: **solo preparada**, no real (sin infraestructura Supabase/Auth ya disponible en el
  proyecto); modo invitado es el flujo principal y válido.

### Startup (máquina limpia)

```sh
cp Backend/.env.example Backend/.env   # pegar LLM_API_KEY
./start.sh
```

`start.sh` ahora:
1. `docker compose up -d` — levanta un PostgreSQL propio del proyecto (contenedor
   `hikari_postgres`, puerto 5433, volumen nombrado), **sin depender de ningún contenedor
   personal del desarrollador** (antes dependía de un Postgres externo ya corriendo).
2. Espera a que el healthcheck de Postgres esté en verde.
3. Crea el venv, instala dependencias, corre `scripts/init_db.py` (idempotente).
4. Inicia el backend (`uvicorn`, puerto configurable con `BACKEND_PORT`, por defecto 8000) y el
   frontend (`npm run dev`, Vite imprime el puerto real, normalmente 5173).

`docker-compose.yml` es nuevo (antes no existía) y solo contiene el servicio de PostgreSQL —no se
tocó la app ni se agregaron Dockerfiles para backend/frontend, para no reestructurar el proyecto.

### Cambios críticos de esta pasada

- `docker-compose.yml` (nuevo): PostgreSQL autocontenido con valores por defecto que coinciden
  con `Backend/.env.example` (usuario, contraseña, puerto 5433, db `hackaton`).
- `start.sh`: ahora levanta Docker Compose primero y espera su healthcheck antes de tocar el
  backend.
- `Backend/requirements.txt`: todas las versiones fijadas exactas (antes `google-genai`, `numpy`
  y `psycopg[binary]` no tenían versión o usaban `>=`), tomadas de lo realmente instalado y
  probado (`google-genai==2.24.0`, `numpy==2.5.3`, `psycopg==3.3.6`, `psycopg-binary==3.3.6`,
  `httpx==0.28.1`).
- `README.md`: reescrito para máquina limpia — requisitos reales, comando único, tabla de
  variables de entorno, URLs de frontend/backend, cómo obtener la API key, tests, evals,
  regeneración de embeddings y limitaciones.

### Pruebas (humo final, sin gastar cuota de Gemini)

- `docker compose config` — valida el compose file (sin levantarlo en esta máquina para no
  chocar con contenedores personales ya corriendo en el puerto 5433).
- Backend real (puerto alterno) → `GET /api/health` → `200 OK`.
- `POST /api/consultations` con C3 ("Me estafaron comprando un carro usado.") →
  `scope=fuera_de_dominio`, sin log de llamadas a Gemini.
- `GET /api/consultations?limit=3` → historial persistido, sobrevive reinicios (ya verificado en
  fases previas).
- Frontend (`/`) recargado → navegación completa visible, sin errores de hidratación.
- `cd Backend && pytest -q` → 23/23 passed.
- `cd Frontend && npx tsc --noEmit` → sin errores.
- No se repitieron llamadas reales a C1/C2 contra Gemini (cuota gratuita agotada; no era
  necesario para esta pasada, que es de reproducibilidad, no de contenido).

### Limitaciones

- La cuota gratuita diaria de Gemini puede seguir agotada; el fallback controlado ya está
  verificado (ver `Docs/logs/phase-04.md`).
- No hay autenticación real (declarado honestamente en `/login`, `/register` y `/profile`).
- `docker-compose.yml` solo containeriza PostgreSQL; backend y frontend siguen ejecutándose con
  Python/Node nativos vía `start.sh` (decisión deliberada para no reestructurar la app).
- No se probó `docker compose up` en este equipo de desarrollo porque el puerto 5433 ya está
  ocupado por un contenedor Postgres personal del desarrollador (ajeno a este repo); en una
  máquina limpia no hay ese conflicto. Se validó el archivo con `docker compose config`.

### Demo (orden recomendado, ~3 minutos)

1. **Inicio** (`/`): propuesta de valor y disclaimer de dominio exclusivo.
2. **Consultar** (`/chat`): mostrar una consulta ya guardada en el historial (evita gastar
   cuota) señalando resumen, análisis, normas con cita/fuente, acciones, información faltante y
   disclaimer.
3. Probar **C3** ("Me estafaron comprando un carro usado.") en vivo → respuesta instantánea de
   "fuera del ámbito laboral", 0 llamadas a Gemini.
4. **Sobre HIKARI** (`/about`): fuentes jurídicas y límites.
5. **Perfil** (`/profile`) → **Iniciar sesión** (`/login`): modo invitado funcional hoy, auth
   declarada como futura.
6. Redimensionar la ventana para mostrar el responsive básico.

