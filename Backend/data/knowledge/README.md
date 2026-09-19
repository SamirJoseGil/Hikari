# Embeddings precomputados

`embeddings.json` se genera con `Backend/scripts/build_embeddings.py` y no se versiona
(ver .gitignore) porque se puede regenerar en segundos y depende de la clave de API.

Formato del archivo:
```json
{ "corpus_hash": "sha256...", "embedding_model": "gemini-embedding-001", "generated_at": "...", "chunks": [ ... ] }
```

`corpus_hash` es el sha256 de `corpus/labor_law_co.jsonl` en el momento de la generación. Si el
corpus cambia después, el backend registra un `logger.warning` (no bloquea la app) recordando
regenerar los embeddings.

Para regenerarlo:

```sh
cd Backend
source .venv/bin/activate
python scripts/build_embeddings.py
```
