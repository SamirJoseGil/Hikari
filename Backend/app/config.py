"""Centralized configuration loaded from environment variables (.env)."""
import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    database_url: str = os.getenv("DATABASE_URL", "")
    llm_api_key: str = os.getenv("LLM_API_KEY", "")
    llm_provider: str = os.getenv("LLM_PROVIDER", "gemini")
    embedding_provider: str = os.getenv("EMBEDDING_PROVIDER", "gemini")
    llm_model: str = os.getenv("LLM_MODEL", "gemini-3.8-flash")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
    retrieval_top_k: int = int(os.getenv("RETRIEVAL_TOP_K", "5"))
    cache_backend: str = os.getenv("CACHE_BACKEND", "memory")


@lru_cache
def get_settings() -> Settings:
    return Settings()
