"""Shared LLM-judge helper for the C3/C4/C5 evaluators.

Judges run on a dedicated model (distinct from the production generation model)
so the pipeline never grades its own output, and so judge calls draw from a
separate provider quota bucket.
"""
from typing import TypeVar

from pydantic import BaseModel, ValidationError

from eval.answer.exceptions import InfrastructureError
from services.llm_provider import AIServiceError, _generate_structured

JUDGE_MODEL = "gemini-3.5-flash-lite"

T = TypeVar("T", bound=BaseModel)


def judge_structured(prompt: str, schema: type[T]) -> T:
    """Run a structured judge call and return the validated schema instance.

    Raises ``InfrastructureError`` for provider exhaustion, empty responses, or
    malformed JSON so runners retry the item instead of scoring it as a failure.
    """
    try:
        response = _generate_structured(
            prompt=prompt,
            response_schema=schema,
            model_override=JUDGE_MODEL,
        )
    except AIServiceError as exc:
        raise InfrastructureError(str(exc)) from exc

    text = getattr(response, "text", None)
    if not text:
        raise InfrastructureError(f"Judge model {JUDGE_MODEL} returned an empty response.")

    try:
        return schema.model_validate_json(text)
    except ValidationError as exc:
        raise InfrastructureError(
            f"Judge model {JUDGE_MODEL} returned malformed {schema.__name__} output: {exc}"
        ) from exc
