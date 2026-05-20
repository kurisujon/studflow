from __future__ import annotations

import itertools
import time
from typing import Iterable

from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel, Field

from core.config import settings


class AIServiceError(Exception):
    """Raised when Gemini generation fails."""


class TopicDetail(BaseModel):
    topic_title: str
    key_points: list[str] = Field(min_length=4)
    important_terms_and_definitions: list[str]


class ComprehensiveSummary(BaseModel):
    overall_overview: str
    detailed_sections: list[TopicDetail]


class FlashcardPayload(BaseModel):
    front: str = Field(description="The question or concept to recall.")
    back: str = Field(description="The answer or explanation.")


class QuizQuestionPayload(BaseModel):
    question: str = Field(description="The multiple-choice question.")
    options: list[str] = Field(
        description="Exactly 4 distinct answer options.",
        min_length=4,
        max_length=4,
    )
    correct_answer_index: int = Field(
        description="The zero-based index of the correct option.",
        ge=0,
        le=3,
    )
    explanation: str = Field(description="Brief explanation of why the answer is correct.")


class SuggestedFlashcard(BaseModel):
    front: str
    back: str


class SelectionExplanation(BaseModel):
    selected_text: str
    simplified_explanation: str
    beginner_explanation: str
    example: str
    related_terms: list[str]
    suggested_flashcard: SuggestedFlashcard


SUMMARY_SYSTEM_PROMPT = """
You are an expert academic tutor. I am providing you with extracted text from a study document.
Your task is to create a COMPREHENSIVE, highly detailed study guide.
DO NOT write a brief summary. You must extract every major concept, important detail, and key definition from the text.
Break the document down into logical topics. For every topic, provide a detailed title, at least 4 in-depth bullet points explaining the core concepts, and a list of important terms.
If the document is long, ensure your response thoroughly covers the beginning, middle, and end of the provided text. Do not skip over technical details.
""".strip()


EXPLAIN_SELECTION_PROMPT = """
You are a patient academic tutor helping a student understand a highlighted word, phrase, or passage from study material.
Explain it clearly, simply, and accurately. Avoid jargon when possible. If the student asks a follow-up question, answer it directly.
Return only JSON that matches the required schema.
""".strip()


_key_iterator = None


def _get_api_key() -> str:
    global _key_iterator
    keys = settings.gemini_api_keys
    if not keys:
        raise AIServiceError("Gemini is not configured. Set GEMINI_API_KEY.")
    
    if _key_iterator is None:
        _key_iterator = itertools.cycle(keys)
        
    return next(_key_iterator)


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


def _generate_structured(
    *,
    prompt: str,
    response_schema: type[BaseModel] | type[list[FlashcardPayload]] | type[list[QuizQuestionPayload]],
):
    last_error: Exception | None = None
    
    # Initialize with the next key in the pool
    current_key = _get_api_key()

    for model_name in _candidate_models():
        for attempt in range(settings.gemini_max_retries):
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
            except Exception as exc:  # pragma: no cover - third-party SDK/network errors vary
                last_error = exc
                if _is_retryable_error(exc) and attempt < settings.gemini_max_retries - 1:
                    status_code = getattr(exc, "code", getattr(exc, "status_code", None))
                    if status_code in {401, 403, 429}:
                        # 403/429 -> Immediately rotate to the next key
                        current_key = _get_api_key()
                        time.sleep(0.5)  # Brief pause before retrying with new key
                    else:
                        # Standard exponential backoff for 5xx errors
                        time.sleep(2 ** attempt)
                    continue
                break

            if not response.text:
                last_error = AIServiceError("Gemini returned an empty response.")
                break

            return response

    raise AIServiceError("Gemini generation failed after retries and fallbacks.") from last_error


def _join_chunks(chunks: Iterable[str]) -> str:
    return "\n\n".join(f"Chunk {index + 1}:\n{chunk}" for index, chunk in enumerate(chunks))


def _summary_prompt(source_text: str) -> str:
    return (
        f"{SUMMARY_SYSTEM_PROMPT}\n\n"
        "Return only JSON that matches the required schema.\n\n"
        f"{source_text}"
    )


def _summary_guides_to_text(guides: Iterable[ComprehensiveSummary]) -> str:
    sections: list[str] = []

    for index, guide in enumerate(guides, start=1):
        section_lines = [f"Chunk Study Guide {index}:", f"Overview: {guide.overall_overview}"]
        for topic in guide.detailed_sections:
            section_lines.append(f"Topic: {topic.topic_title}")
            section_lines.extend(f"- {point}" for point in topic.key_points)
            if topic.important_terms_and_definitions:
                section_lines.append("Important terms:")
                section_lines.extend(f"- {term}" for term in topic.important_terms_and_definitions)
        sections.append("\n".join(section_lines))

    return "\n\n".join(sections)


def generate_summary(chunks: list[str]) -> ComprehensiveSummary:
    if not chunks:
        raise AIServiceError("Cannot generate a summary without document chunks.")

    chunk_guides: list[ComprehensiveSummary] = []

    for index, chunk in enumerate(chunks, start=1):
        prompt = _summary_prompt(
            f"Chunk number: {index}\n\nStudy document text:\n{chunk}"
        )
        response = _generate_structured(
            prompt=prompt,
            response_schema=ComprehensiveSummary,
        )
        chunk_guides.append(ComprehensiveSummary.model_validate_json(response.text))

    final_prompt = _summary_prompt(
        "Combine these chunk-level study guides into one unified comprehensive study guide. "
        "Merge overlapping topics, preserve important technical details, and ensure the final "
        "guide fully covers the entire document.\n\n"
        f"{_summary_guides_to_text(chunk_guides)}"
    )
    response = _generate_structured(
        prompt=final_prompt,
        response_schema=ComprehensiveSummary,
    )
    return ComprehensiveSummary.model_validate_json(response.text)


def generate_flashcards(chunks: list[str]) -> list[FlashcardPayload]:
    if not chunks:
        raise AIServiceError("Cannot generate flashcards without document chunks.")

    prompt = (
        "Generate exactly 15 flashcards from the document chunks below.\n"
        "Use balanced coverage across the document.\n"
        "Avoid duplicates. Return only valid JSON.\n\n"
        f"{_join_chunks(chunks)}"
    )
    response = _generate_structured(prompt=prompt, response_schema=list[FlashcardPayload])
    flashcards = [FlashcardPayload.model_validate(item) for item in response.parsed or []]

    if len(flashcards) != 15:
        raise AIServiceError("Gemini did not return exactly 15 flashcards.")

    return flashcards


def generate_quiz(chunks: list[str]) -> list[QuizQuestionPayload]:
    if not chunks:
        raise AIServiceError("Cannot generate quiz questions without document chunks.")

    prompt = (
        "Generate exactly 10 multiple-choice quiz questions from the document chunks below.\n"
        "Each question must have exactly 4 distinct options and one correct answer index.\n"
        "Avoid duplicates. Return only valid JSON.\n\n"
        f"{_join_chunks(chunks)}"
    )
    response = _generate_structured(prompt=prompt, response_schema=list[QuizQuestionPayload])
    questions = [QuizQuestionPayload.model_validate(item) for item in response.parsed or []]

    if len(questions) != 10:
        raise AIServiceError("Gemini did not return exactly 10 quiz questions.")

    return questions


def explain_selection(
    *,
    highlighted_text: str,
    user_question: str = "",
) -> SelectionExplanation:
    prompt = (
        f"{EXPLAIN_SELECTION_PROMPT}\n\n"
        f"Highlighted study text:\n{highlighted_text}\n\n"
        f"Student follow-up question:\n{user_question or 'Explain this clearly in simpler terms.'}"
    )
    response = _generate_structured(
        prompt=prompt,
        response_schema=SelectionExplanation,
    )
    return SelectionExplanation.model_validate_json(response.text)
