"""PostgreSQL-backed persistence for consultations and (optionally) the cache.

Works against local PostgreSQL (Docker) or Supabase PostgreSQL: both speak the
same wire protocol, so a plain DATABASE_URL is all that's needed. One
connection per operation (no pool) — simplest option for a hackathon-sized
workload. Nothing here runs at import time: a missing/invalid DATABASE_URL
only raises when an operation is actually attempted.
"""
import json
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)

SCHEMA = """
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    normalized_question TEXT NOT NULL,
    scope TEXT NOT NULL,
    intent TEXT NOT NULL,
    response_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    response_json JSONB NOT NULL,
    scope TEXT NOT NULL,
    intent TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);
"""


class DatabaseService:
    def __init__(self, database_url: str):
        self._database_url = database_url

    def _connect(self):
        import psycopg

        if not self._database_url:
            raise RuntimeError("DATABASE_URL no está configurada.")
        return psycopg.connect(self._database_url, autocommit=True)

    def init_schema(self) -> None:
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(SCHEMA)

    def save_consultation(
        self, question: str, normalized_question: str, scope: str, intent: str, response: dict
    ) -> None:
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO consultations (question, normalized_question, scope, intent, response_json)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (question, normalized_question, scope, intent, json.dumps(response, ensure_ascii=False)),
            )

    def list_consultations(self, limit: int = 20) -> list[dict]:
        limit = max(1, min(limit, 100))
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, question, scope, intent, response_json, created_at
                FROM consultations
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (limit,),
            )
            rows = cur.fetchall()
        return [
            {
                "id": row[0],
                "question": row[1],
                "scope": row[2],
                "intent": row[3],
                "response": row[4],
                "created_at": row[5].isoformat(),
            }
            for row in rows
        ]

    def get_cached_response(self, key: str) -> dict | None:
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT response_json FROM cache WHERE key = %s", (key,))
            row = cur.fetchone()
        return row[0] if row else None

    def save_cached_response(self, key: str, response: dict, scope: str, intent: str) -> None:
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO cache (key, response_json, scope, intent)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (key) DO UPDATE SET
                    response_json = EXCLUDED.response_json,
                    scope = EXCLUDED.scope,
                    intent = EXCLUDED.intent,
                    created_at = now()
                """,
                (key, json.dumps(response, ensure_ascii=False), scope, intent),
            )


def get_database_service() -> DatabaseService:
    return DatabaseService(get_settings().database_url)

