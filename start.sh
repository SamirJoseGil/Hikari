#!/usr/bin/env bash
# Starts HIKARI locally, end to end, on a clean machine:
#   1. PostgreSQL via docker compose (self-contained, no external containers needed)
#   2. Backend (FastAPI) — creates tables, then serves on $BACKEND_PORT
#   3. Frontend (Remix) — serves on Vite's default port (5173, or next free one)
#
# Requires: Docker + Docker Compose, Python 3.12+, Node 20+, and Backend/.env with
# at least LLM_API_KEY set (see Backend/.env.example).
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"

if [ ! -f "$ROOT_DIR/Backend/.env" ]; then
  echo "==> Backend/.env no existe. Cópialo desde Backend/.env.example y completa LLM_API_KEY."
  exit 1
fi

echo "==> Levantando PostgreSQL (docker compose)"
cd "$ROOT_DIR"
docker compose up -d

echo "==> Esperando a que PostgreSQL esté listo"
for _ in $(seq 1 30); do
  if docker compose ps postgres --format json 2>/dev/null | grep -q '"Health":"healthy"'; then
    break
  fi
  sleep 1
done

echo "==> Preparando backend (venv + tablas)"
cd "$ROOT_DIR/Backend"
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt
python scripts/init_db.py

echo "==> Iniciando backend en http://127.0.0.1:${BACKEND_PORT}"
uvicorn app.main:app --port "$BACKEND_PORT" &
BACKEND_PID=$!

cleanup() {
  echo "==> Deteniendo backend (pid $BACKEND_PID)"
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "==> Iniciando frontend (ver terminal para la URL exacta, normalmente http://localhost:5173)"
cd "$ROOT_DIR/Frontend"
npm install --no-fund --no-audit
BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}" npm run dev

