# HIKARI — corpus legal

`labor_law_co.jsonl` contiene un corpus mínimo de derecho laboral colombiano, transcrito
directamente de fuentes oficiales (Secretaría del Senado). Cada línea es un fragmento JSON con:

```json
{ "id": "...", "topic": "...", "title": "...", "norm": "...", "article": "...", "content": "...", "source": "...", "source_url": "..." }
```

Fuentes usadas (fase 2):
- Código Sustantivo del Trabajo — artículos 22, 61, 62, 64, 186, 249.
- Ley 1010 de 2006 (acoso laboral) — artículos 2, 7, 10.

Para agregar más fragmentos, añade líneas JSONL con la misma estructura y vuelve a ejecutar
`Backend/scripts/build_embeddings.py` (ver [Docs/architecture.md](../Docs/architecture.md)).
