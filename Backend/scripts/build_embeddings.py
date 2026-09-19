"""Precomputes embeddings for the corpus and writes Backend/data/knowledge/embeddings.json.

Run manually whenever corpus/labor_law_co.jsonl changes:

    cd Backend
    source .venv/bin/activate
    python scripts/build_embeddings.py

Requires LLM_API_KEY (Gemini) configured in Backend/.env. The output stores a
sha256 hash of the corpus file so the app can warn if the corpus changed since
the embeddings were generated (see knowledge_service.py).
"""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.config import get_settings  # noqa: E402
from app.services.embedding_service import get_embedding_service  # noqa: E402

CORPUS_PATH = REPO_ROOT / "corpus" / "labor_law_co.jsonl"
OUTPUT_PATH = BACKEND_ROOT / "data" / "knowledge" / "embeddings.json"


def load_corpus(path: Path) -> list[dict]:
    chunks = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                chunks.append(json.loads(line))
    return chunks


def corpus_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    chunks = load_corpus(CORPUS_PATH)
    if not chunks:
        raise SystemExit(f"El corpus {CORPUS_PATH} está vacío o no existe.")

    embedding_service = get_embedding_service()
    texts = [f"{chunk['norm']} {chunk['article']}: {chunk['content']}" for chunk in chunks]
    embeddings = embedding_service.embed_texts(texts)

    for chunk, embedding in zip(chunks, embeddings):
        chunk["embedding"] = embedding

    output = {
        "corpus_hash": corpus_hash(CORPUS_PATH),
        "embedding_model": get_settings().embedding_model,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "chunks": chunks,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False)

    print(f"Generados {len(chunks)} embeddings en {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

