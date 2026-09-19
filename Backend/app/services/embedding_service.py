"""Embedding service interface. Default provider: Gemini (gemini-embedding-001)."""
from abc import ABC, abstractmethod

from app.config import get_settings


class EmbeddingService(ABC):
    @abstractmethod
    def embed_text(self, text: str) -> list[float]:
        raise NotImplementedError

    @abstractmethod
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError


class GeminiEmbeddingService(EmbeddingService):
    """Wraps google-genai's embed_content. See Docs/architecture.md for model choice.

    The genai client is built lazily on first use (not in __init__) so that
    simply injecting this service via FastAPI's Depends never requires an API
    key or touches the network for requests that end up not needing it (e.g.
    out-of-domain consultations).
    """

    def __init__(self, api_key: str, model: str):
        self._api_key = api_key
        self._model = model
        self._client = None

    def _get_client(self):
        if self._client is None:
            from google import genai
            from google.genai import types

            if not self._api_key:
                raise RuntimeError("LLM_API_KEY no está configurada (requerida para embeddings de Gemini).")
            # See llm_service.py: disable the SDK's default 5-attempt backoff
            # retry so a rate limit fails fast instead of hanging for minutes.
            self._client = genai.Client(
                api_key=self._api_key,
                http_options=types.HttpOptions(
                    timeout=45_000,
                    retry_options=types.HttpRetryOptions(attempts=1),
                ),
            )
        return self._client

    def embed_text(self, text: str) -> list[float]:
        return self.embed_texts([text])[0]

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        result = self._get_client().models.embed_content(model=self._model, contents=texts)
        return [embedding.values for embedding in result.embeddings]


def get_embedding_service() -> EmbeddingService:
    settings = get_settings()
    if settings.embedding_provider == "gemini":
        return GeminiEmbeddingService(api_key=settings.llm_api_key, model=settings.embedding_model)
    raise RuntimeError(f"EMBEDDING_PROVIDER no soportado: {settings.embedding_provider}")
