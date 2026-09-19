# HIKARI — evaluaciones

`cases.json` contiene 5 casos mínimos: despido (C1), acoso/cambio de condiciones (C2), fuera de
dominio (C3), salario (C4) y vacaciones (C5).

`run_evals.py` los ejecuta de dos formas:

```sh
# Modo por defecto: solo normalize_query/detect_domain/detect_intent. Gratis, sin red, sin API key.
cd Backend && source .venv/bin/activate && python ../evals/run_evals.py

# Modo --live: llama al backend real (POST /api/consultations). Consume cuota de Gemini.
# Úsalo solo deliberadamente, nunca en pytest ni en CI.
python ../evals/run_evals.py --live --base-url http://127.0.0.1:8000
```

