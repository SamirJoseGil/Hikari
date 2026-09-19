"""Creates the consultations/cache tables if they don't exist yet.

Idempotent: safe to run multiple times, never drops data. Works against local
PostgreSQL (Docker) or Supabase PostgreSQL — both use DATABASE_URL.

    cd Backend
    source .venv/bin/activate
    python scripts/init_db.py
"""
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.database import get_database_service  # noqa: E402


def main() -> None:
    db = get_database_service()
    db.init_schema()
    print("Tablas 'consultations' y 'cache' listas (creadas si no existían).")


if __name__ == "__main__":
    main()
