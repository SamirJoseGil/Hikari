"""Runs the eval cases in evals/cases.json.

Default mode (no flags): checks ONLY the deterministic, free parts of the
pipeline (normalize_query, detect_domain, detect_intent). Does not call
Gemini, does not need LLM_API_KEY, safe to run anytime.

    cd Backend && source .venv/bin/activate && python ../evals/run_evals.py

Full mode (--live): also calls the real backend's /api/consultations for each
case and prints scope/citations. This DOES consume Gemini quota — only run it
deliberately, never automatically.

    python ../evals/run_evals.py --live --base-url http://127.0.0.1:8010
"""
import argparse
import json
import sys
import urllib.request
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1] / "Backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.intelligence.pipeline import detect_domain, detect_intent, normalize_query  # noqa: E402

CASES_PATH = Path(__file__).resolve().parent / "cases.json"


def run_deterministic(cases: list[dict]) -> bool:
    all_ok = True
    for case in cases:
        normalized = normalize_query(case["message"])
        scope = detect_domain(normalized)
        intent = detect_intent(normalized, scope)
        ok = scope.value == case["expected_scope"] and intent == case["expected_intent"]
        all_ok = all_ok and ok
        status = "OK" if ok else "FAIL"
        print(f"[{status}] {case['id']}: scope={scope.value} intent={intent}")
    return all_ok


def run_live(cases: list[dict], base_url: str) -> None:
    for case in cases:
        payload = json.dumps({"message": case["message"]}).encode("utf-8")
        req = urllib.request.Request(
            f"{base_url}/api/consultations",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = json.loads(resp.read())
        has_citations = len(body.get("citations", [])) > 0
        print(
            f"{case['id']}: scope={body['scope']} intent={body['intent']} "
            f"citations={len(body.get('citations', []))} (esperadas: {case['expect_citations']}, obtenidas: {has_citations})"
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="Llama al backend real (consume Gemini).")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    args = parser.parse_args()

    cases = json.loads(CASES_PATH.read_text(encoding="utf-8"))

    if args.live:
        run_live(cases, args.base_url)
        return

    ok = run_deterministic(cases)
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
