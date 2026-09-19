"""Knowledge/retrieval service: in-memory cosine-similarity search over a
precomputed corpus of embeddings (see Backend/scripts/build_embeddings.py).

No vector database is used on purpose (small corpus, hackathon scope).
"""
import hashlib
import json
import logging
from abc import ABC, abstractmethod
from pathlib import Path

import numpy as np

from app.config import get_settings
from app.services.embedding_service import EmbeddingService, get_embedding_service

logger = logging.getLogger(__name__)

BACKEND_ROOT = Path(__file__).resolve().parents[2]
EMBEDDINGS_PATH = BACKEND_ROOT / "data" / "knowledge" / "embeddings.json"
CORPUS_PATH = BACKEND_ROOT.parent / "corpus" / "labor_law_co.jsonl"


class KnowledgeService(ABC):
    @abstractmethod
    def search(self, query: str, top_k: int | None = None) -> list[dict]:
        raise NotImplementedError


class InMemoryKnowledgeService(KnowledgeService):
    """Loads the precomputed corpus embeddings lazily on first search().

    Lazy on purpose: simply injecting this service via FastAPI's Depends must
    not require embeddings.json to exist for requests that never call
    search() (e.g. out-of-domain consultations).
    """

    def __init__(self, embedding_service: EmbeddingService, embeddings_path: Path = EMBEDDINGS_PATH):
        self._embedding_service = embedding_service
        self._embeddings_path = embeddings_path
        self._chunks: list[dict] | None = None
        self._matrix: np.ndarray | None = None

    def _load(self) -> None:
        if self._chunks is not None:
            return
        if not self._embeddings_path.exists():
            raise RuntimeError(
                f"No se encontraron embeddings precomputados en {self._embeddings_path}. "
                "Ejecuta Backend/scripts/build_embeddings.py."
            )
        with self._embeddings_path.open(encoding="utf-8") as f:
            data = json.load(f)
        self._chunks = data["chunks"]
        self._matrix = np.array([chunk["embedding"] for chunk in self._chunks], dtype=float)
        self._warn_if_corpus_changed(data.get("corpus_hash"))

    @staticmethod
    def _warn_if_corpus_changed(stored_hash: str | None) -> None:
        if not stored_hash or not CORPUS_PATH.exists():
            return
        current_hash = hashlib.sha256(CORPUS_PATH.read_bytes()).hexdigest()
        if current_hash != stored_hash:
            logger.warning(
                "El corpus (%s) cambió desde que se generaron los embeddings. "
                "Ejecuta Backend/scripts/build_embeddings.py para regenerarlos.",
                CORPUS_PATH,
            )

    def search(self, query: str, top_k: int | None = None) -> list[dict]:
        self._load()
        top_k = top_k or get_settings().retrieval_top_k
        if not self._chunks:
            return []
        query_embedding = np.array(self._embedding_service.embed_text(query), dtype=float)
        similarities = self._cosine_similarity(query_embedding, self._matrix)
        top_indices = np.argsort(similarities)[::-1][:top_k]
        results = []
        for idx in top_indices:
            chunk = {k: v for k, v in self._chunks[idx].items() if k != "embedding"}
            chunk["similarity"] = float(similarities[idx])
            results.append(chunk)
        return results

    @staticmethod
    def _cosine_similarity(query_vector: np.ndarray, matrix: np.ndarray) -> np.ndarray:
        query_norm = np.linalg.norm(query_vector) or 1e-10
        matrix_norms = np.linalg.norm(matrix, axis=1)
        matrix_norms[matrix_norms == 0] = 1e-10
        return (matrix @ query_vector) / (matrix_norms * query_norm)


def get_knowledge_service() -> KnowledgeService:
    return InMemoryKnowledgeService(embedding_service=get_embedding_service())

