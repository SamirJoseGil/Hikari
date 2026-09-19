"""LLM service interface. Default provider: Gemini, structured JSON output."""
import logging
from abc import ABC, abstractmethod

from app.config import get_settings
from app.models.consultation import ConsultationResponse

logger = logging.getLogger(__name__)


class LLMService(ABC):
    @abstractmethod
    def generate_structured(self, system_instruction: str, prompt: str) -> ConsultationResponse:
        raise NotImplementedError


class GeminiLLMService(LLMService):
    """Wraps google-genai's structured output (response_format + JSON schema).

    Allows a single retry if the model returns a payload that fails Pydantic
    validation. No further retries are attempted (cost control).
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
                raise RuntimeError("LLM_API_KEY no está configurada (requerida para el LLM de Gemini).")
            # The SDK retries 429/5xx up to 5 times with backoff (up to 60s) by
            # default, which turns our "max 1 retry" cost policy into up to 10
            # hidden HTTP calls and multi-minute hangs. Disable it explicitly.
            self._client = genai.Client(
                api_key=self._api_key,
                http_options=types.HttpOptions(
                    timeout=45_000,
                    retry_options=types.HttpRetryOptions(attempts=1),
                ),
            )
        return self._client

    def _call(self, system_instruction: str, prompt: str) -> str:
        interaction = self._get_client().interactions.create(
            model=self._model,
            system_instruction=system_instruction,
            input=prompt,
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": ConsultationResponse.model_json_schema(),
            },
        )
        return interaction.output_text

    def generate_structured(self, system_instruction: str, prompt: str) -> ConsultationResponse:
        last_error: Exception | None = None
        for attempt in range(2):
            try:
                raw_text = self._call(system_instruction, prompt)
                return ConsultationResponse.model_validate_json(raw_text)
            except Exception as exc:  # noqa: BLE001 - deliberately broad, one controlled retry
                last_error = exc
                logger.warning("Intento %s de generación LLM falló: %s", attempt + 1, exc)
        raise RuntimeError("El LLM no devolvió una respuesta estructurada válida") from last_error


def get_llm_service() -> LLMService:
    settings = get_settings()
    if settings.llm_provider == "gemini":
        return GeminiLLMService(api_key=settings.llm_api_key, model=settings.llm_model)
    raise RuntimeError(f"LLM_PROVIDER no soportado: {settings.llm_provider}")
