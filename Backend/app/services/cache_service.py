"""Query cache, keyed by sha256 of the normalized query.

Two backends behind the same interface (CACHE_BACKEND=memory|postgres):
  - MemoryQueryCache: dict in the current process. Default, zero setup.
  - PostgresQueryCache: persists across restarts via DatabaseService.

Only exact-duplicate normalized queries are ever reused (see
Docs/architecture.md): we never reuse a full legal response based on semantic
similarity, since the underlying facts could differ.
"""
import hashlib
from abc import ABC, abstractmethod

from app.config import get_settings
from app.services.database import DatabaseService, get_database_service


class QueryCache(ABC):
    @staticmethod
    def make_key(normalized_query: str) -> str:
        return hashlib.sha256(normalized_query.encode("utf-8")).hexdigest()

    @abstractmethod
    def get(self, key: str) -> dict | None:
        raise NotImplementedError

    @abstractmethod
    def set(self, key: str, value: dict) -> None:
        raise NotImplementedError


class MemoryQueryCache(QueryCache):
    def __init__(self):
        self._store: dict[str, dict] = {}

    def get(self, key: str) -> dict | None:
        return self._store.get(key)

    def set(self, key: str, value: dict) -> None:
        self._store[key] = value


class PostgresQueryCache(QueryCache):
    def __init__(self, database: DatabaseService):
        self._database = database

    def get(self, key: str) -> dict | None:
        return self._database.get_cached_response(key)

    def set(self, key: str, value: dict) -> None:
        self._database.save_cached_response(
            key, value, scope=value.get("scope", "ambiguo"), intent=value.get("intent", "desconocida")
        )


_memory_cache = MemoryQueryCache()


def get_query_cache() -> QueryCache:
    if get_settings().cache_backend == "postgres":
        return PostgresQueryCache(get_database_service())
    return _memory_cache

