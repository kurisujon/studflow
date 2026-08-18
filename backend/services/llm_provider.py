"""Low-level Gemini SDK wrapper: key rotation, retry, model fallback, and embeddings.

All public helpers are consumed exclusively by ``ai_service`` which remains the
external API surface.  Nothing outside ``backend/services/`` should import from
this module directly.
"""

from __future__ import annotations

import itertools
import logging
import time
from collections.abc import Sequence
from typing import Literal

from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel

from core.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Exception
# ---------------------------------------------------------------------------

class AIServiceError(Exception):
    """Raised when Gemini generation fails."""


# ---------------------------------------------------------------------------
# Key rotation
# ---------------------------------------------------------------------------

_key_iterator = None


def _get_api_key() -> str:
    global _key_iterator
    keys = settings.gemini_api_keys
    if not keys:
        raise AIServiceError("Gemini is not configured. Set GEMINI_API_KEY.")

    if _key_iterator is None:
        _key_iterator = itertools.cycle(keys)

    return next(_key_iterator)


# ---------------------------------------------------------------------------
# Client / model helpers
# ---------------------------------------------------------------------------

def _get_client(api_key: str | None = None) -> genai.Client:
    key_to_use = api_key or _get_api_key()
    return genai.Client(api_key=key_to_use)


def _candidate_models() -> list[str]:
    fallback_models = [
        model.strip()
        for model in settings.gemini_fallback_models.split(",")
        if model.strip()
    ]
    return [settings.gemini_model, *fallback_models]


def _is_retryable_error(exc: Exception) -> bool:
    status_code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    return status_code in {401, 403, 429, 500, 503, 504}


# ---------------------------------------------------------------------------
# Structured generation with retry + model fallback
# ---------------------------------------------------------------------------

def _generate_structured(
    *,
    prompt: str,
    response_schema: type,
):
    """Generate structured JSON content with automatic retry, key rotation, and
    model fallback.  Returns the raw SDK response on success.

    Raises ``AIServiceError`` on exhaustion of all retries and models.
    """
    last_error: Exception | None = None

    # Initialize with the next key in the pool
    current_key = _get_api_key()
    models = _candidate_models()
    total_models = len(models)

    for model_index, model_name in enumerate(models):
        max_retries = settings.gemini_max_retries

        for attempt in range(max_retries):
            key_rotated = False
            start_ns = time.monotonic_ns()
            client = _get_client(api_key=current_key)

            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=response_schema,
                    ),
                )
            except AIServiceError:
                raise
            except Exception as exc:  # pragma: no cover - third-party SDK/network errors vary
                duration_ms = (time.monotonic_ns() - start_ns) / 1_000_000
                last_error = exc

                if _is_retryable_error(exc) and attempt < max_retries - 1:
                    status_code = getattr(exc, "code", getattr(exc, "status_code", None))
                    if status_code in {401, 403, 429}:
                        # Immediately rotate to the next key
                        current_key = _get_api_key()
                        key_rotated = True
                        time.sleep(0.5)  # Brief pause before retrying with new key
                    else:
                        # Standard exponential backoff for 5xx errors
                        time.sleep(2 ** attempt)

                    logger.warning(
                        "llm.generate retryable_error:"
                        " operation=generation"
                        " model=%s"
                        " attempt=%d/%d"
                        " duration_ms=%.1f"
                        " success=false"
                        " key_rotated=%s"
                        " model_fallback=false"
                        " error=%s",
                        model_name,
                        attempt + 1,
                        max_retries,
                        duration_ms,
                        key_rotated,
                        exc,
                    )
                    continue

                # Non-retryable or final attempt -- log and break to try next model
                logger.error(
                    "llm.generate failed:"
                    " operation=generation"
                    " model=%s"
                    " attempt=%d/%d"
                    " duration_ms=%.1f"
                    " success=false"
                    " key_rotated=false"
                    " model_fallback=%s"
                    " error=%s",
                    model_name,
                    attempt + 1,
                    max_retries,
                    duration_ms,
                    model_index < total_models - 1,
                    exc,
                )
                break

            duration_ms = (time.monotonic_ns() - start_ns) / 1_000_000

            if not response.text:
                last_error = AIServiceError("Gemini returned an empty response.")
                logger.warning(
                    "llm.generate empty_response:"
                    " operation=generation"
                    " model=%s"
                    " attempt=%d/%d"
                    " duration_ms=%.1f"
                    " success=false"
                    " key_rotated=false"
                    " model_fallback=%s",
                    model_name,
                    attempt + 1,
                    max_retries,
                    duration_ms,
                    model_index < total_models - 1,
                )
                break

            logger.info(
                "llm.generate success:"
                " operation=generation"
                " model=%s"
                " attempt=%d/%d"
                " duration_ms=%.1f"
                " success=true"
                " key_rotated=false"
                " model_fallback=%s",
                model_name,
                attempt + 1,
                max_retries,
                duration_ms,
                model_index > 0,
            )
            return response

    raise AIServiceError(
        "Gemini generation failed after retries and fallbacks."
    ) from last_error


# ---------------------------------------------------------------------------
# Embedding with retry + key rotation
# ---------------------------------------------------------------------------

def _embed_contents(
    contents: Sequence[str],
    *,
    task_type: Literal["RETRIEVAL_DOCUMENT", "RETRIEVAL_QUERY"],
) -> list[list[float]]:
    """Embed text content with automatic retry and key rotation.

    Returns a list of float vectors.  Raises ``AIServiceError`` on exhaustion.
    """
    if not contents:
        return []

    last_error: Exception | None = None
    current_key = _get_api_key()
    max_retries = settings.gemini_max_retries

    for attempt in range(max_retries):
        key_rotated = False
        start_ns = time.monotonic_ns()
        client = _get_client(api_key=current_key)

        try:
            response = client.models.embed_content(
                model=settings.gemini_embedding_model,
                contents=list(contents),
                config=types.EmbedContentConfig(
                    task_type=task_type,
                    output_dimensionality=settings.embedding_dimensions,
                ),
            )
            embeddings = response.embeddings or []
            vectors = [list(embedding.values or []) for embedding in embeddings]

            if len(vectors) != len(contents):
                raise AIServiceError(
                    "Gemini returned a different number of embeddings than requested."
                )
            if any(len(vector) != settings.embedding_dimensions for vector in vectors):
                raise AIServiceError(
                    "Gemini returned embeddings with an unexpected dimension."
                )

            duration_ms = (time.monotonic_ns() - start_ns) / 1_000_000
            logger.info(
                "llm.embed success:"
                " operation=embedding"
                " model=%s"
                " attempt=%d/%d"
                " duration_ms=%.1f"
                " success=true"
                " key_rotated=false"
                " model_fallback=false"
                " items=%d",
                settings.gemini_embedding_model,
                attempt + 1,
                max_retries,
                duration_ms,
                len(vectors),
            )
            return [[float(value) for value in vector] for vector in vectors]

        except AIServiceError:
            raise
        except Exception as exc:  # pragma: no cover - third-party SDK/network errors vary
            duration_ms = (time.monotonic_ns() - start_ns) / 1_000_000
            last_error = exc

            if _is_retryable_error(exc) and attempt < max_retries - 1:
                status_code = getattr(exc, "code", getattr(exc, "status_code", None))
                if status_code in {401, 403, 429}:
                    current_key = _get_api_key()
                    key_rotated = True
                    time.sleep(0.5)
                else:
                    time.sleep(2 ** attempt)

                logger.warning(
                    "llm.embed retryable_error:"
                    " operation=embedding"
                    " model=%s"
                    " attempt=%d/%d"
                    " duration_ms=%.1f"
                    " success=false"
                    " key_rotated=%s"
                    " model_fallback=false"
                    " error=%s",
                    settings.gemini_embedding_model,
                    attempt + 1,
                    max_retries,
                    duration_ms,
                    key_rotated,
                    exc,
                )
                continue

            # Non-retryable or final attempt
            logger.error(
                "llm.embed failed:"
                " operation=embedding"
                " model=%s"
                " attempt=%d/%d"
                " duration_ms=%.1f"
                " success=false"
                " key_rotated=false"
                " model_fallback=false"
                " error=%s",
                settings.gemini_embedding_model,
                attempt + 1,
                max_retries,
                duration_ms,
                exc,
            )
            break

    raise AIServiceError(
        "Gemini embedding generation failed after retries."
    ) from last_error
