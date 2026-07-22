from __future__ import annotations

import itertools
import time
from collections.abc import Sequence
from typing import Iterable, Literal

from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel, Field

from core.config import settings


class AIServiceError(Exception):
    """Raised when Gemini generation fails."""


class StudyMaterialQualityError(AIServiceError):
    """Raised when otherwise valid AI output is not usable study material."""


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


class SupportingChunk(BaseModel):
    chunk_index: int = Field(ge=0)
    excerpt: str
    relevance_reason: str


class DocumentQuestionAnswer(BaseModel):
    answer: str
    key_points: list[str]
    related_terms: list[str]
    suggested_flashcard: SuggestedFlashcard
    supporting_chunks: list[SupportingChunk]


class YouTubeSearchQuery(BaseModel):
    main_topic: str
    search_query: str
    keywords: list[str]


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


DOCUMENT_QA_PROMPT = """
You are an academic tutor answering a student's question about an uploaded study document.
You must answer using only the provided document chunks.
Do not invent facts not supported by the chunks.
Keep the answer clear, direct, and helpful for a student.
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


def _embed_contents(
    contents: Sequence[str],
    *,
    task_type: Literal["RETRIEVAL_DOCUMENT", "RETRIEVAL_QUERY"],
) -> list[list[float]]:
    if not contents:
        return []

    last_error: Exception | None = None
    current_key = _get_api_key()

    for attempt in range(settings.gemini_max_retries):
        client = _get_client(api_key=current_key)
        try:
            response = client.models.embed_content(
                model=settings.gemini_embedding_model,
                contents=list(contents),
                config=types.EmbedContentConfig(task_type=task_type),
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

            return [[float(value) for value in vector] for vector in vectors]
        except AIServiceError:
            raise
        except Exception as exc:  # pragma: no cover - third-party SDK/network errors vary
            last_error = exc
            if _is_retryable_error(exc) and attempt < settings.gemini_max_retries - 1:
                status_code = getattr(exc, "code", getattr(exc, "status_code", None))
                if status_code in {401, 403, 429}:
                    current_key = _get_api_key()
                    time.sleep(0.5)
                else:
                    time.sleep(2**attempt)
                continue
            break

    raise AIServiceError("Gemini embedding generation failed after retries.") from last_error


def generate_embeddings_batch(chunks: list[str]) -> list[list[float]]:
    """Embed a bounded batch of stored document chunks for semantic retrieval."""
    if len(chunks) > settings.embedding_batch_size:
        raise AIServiceError(
            f"Embedding batch exceeds configured limit of {settings.embedding_batch_size}."
        )
    return _embed_contents(chunks, task_type="RETRIEVAL_DOCUMENT")


def generate_query_embedding(query: str) -> list[float]:
    if not query.strip():
        raise AIServiceError("A search query is required to generate an embedding.")
    return _embed_contents([query.strip()], task_type="RETRIEVAL_QUERY")[0]


def _join_chunks(chunks: Iterable[str | tuple[int, str]]) -> str:
    rendered_chunks: list[str] = []
    for index, item in enumerate(chunks, start=1):
        chunk_index, chunk = item if isinstance(item, tuple) else (index - 1, item)
        rendered_chunks.append(f"Chunk {chunk_index}:\n{chunk}")
    return "\n\n".join(rendered_chunks)


def _batched(items: Sequence[ComprehensiveSummary], batch_size: int) -> Iterable[Sequence[ComprehensiveSummary]]:
    for start in range(0, len(items), batch_size):
        yield items[start : start + batch_size]


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


def generate_summary(
    chunks: list[str],
    *,
    semantic_clusters: list[list[str]] | None = None,
) -> ComprehensiveSummary:
    if not chunks:
        raise AIServiceError("Cannot generate a summary without document chunks.")

    chunk_guides: list[ComprehensiveSummary] = []
    cluster_groups = semantic_clusters or [chunks[index : index + 4] for index in range(0, len(chunks), 4)]

    for index, cluster in enumerate(cluster_groups, start=1):
        prompt = _summary_prompt(
            "Semantic document cluster "
            f"{index}. Cover every provided chunk, retaining details that distinguish one topic from another.\n\n"
            f"Study document text:\n{_join_chunks(cluster)}"
        )
        response = _generate_structured(
            prompt=prompt,
            response_schema=ComprehensiveSummary,
        )
        chunk_guides.append(ComprehensiveSummary.model_validate_json(response.text))

    # Hierarchical synthesis keeps a long document below the context limit at every step.
    current_guides = chunk_guides
    while len(current_guides) > 1:
        next_guides: list[ComprehensiveSummary] = []
        for guide_batch in _batched(current_guides, batch_size=6):
            final_prompt = _summary_prompt(
                "Combine these semantic-cluster study guides into one unified comprehensive study guide. "
                "Merge overlapping topics, preserve important technical details, and ensure the final "
                "guide fully covers the supplied material.\n\n"
                f"{_summary_guides_to_text(guide_batch)}"
            )
            response = _generate_structured(
                prompt=final_prompt,
                response_schema=ComprehensiveSummary,
            )
            next_guides.append(ComprehensiveSummary.model_validate_json(response.text))
        current_guides = next_guides

    return current_guides[0]


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


def _summary_context(summary: ComprehensiveSummary) -> str:
    return _summary_guides_to_text([summary])


def generate_flashcards_from_summary(summary: ComprehensiveSummary) -> list[FlashcardPayload]:
    """Generate recall prompts from the semantically synthesized document guide."""
    prompt = (
        "Generate exactly 15 flashcards from this semantic study guide.\n"
        "Cover the guide broadly, prioritize high-value concepts, and avoid duplicates. "
        "Return only valid JSON.\n\n"
        f"{_summary_context(summary)}"
    )
    response = _generate_structured(prompt=prompt, response_schema=list[FlashcardPayload])
    flashcards = [FlashcardPayload.model_validate(item) for item in response.parsed or []]
    if len(flashcards) != 15:
        raise AIServiceError("Gemini did not return exactly 15 flashcards.")
    return flashcards


def generate_quiz_from_summary(summary: ComprehensiveSummary) -> list[QuizQuestionPayload]:
    """Generate a balanced quiz from the semantically synthesized document guide."""
    prompt = (
        "Generate exactly 10 multiple-choice quiz questions from this semantic study guide.\n"
        "Cover the guide broadly. Each question must have exactly 4 distinct options and one correct "
        "answer index. Avoid duplicates. Return only valid JSON.\n\n"
        f"{_summary_context(summary)}"
    )
    response = _generate_structured(prompt=prompt, response_schema=list[QuizQuestionPayload])
    questions = [QuizQuestionPayload.model_validate(item) for item in response.parsed or []]
    if len(questions) != 10:
        raise AIServiceError("Gemini did not return exactly 10 quiz questions.")
    return questions


def verify_study_materials(
    *,
    summary: ComprehensiveSummary,
    flashcards: Sequence[FlashcardPayload],
    questions: Sequence[QuizQuestionPayload],
) -> None:
    """Apply deterministic checks after Pydantic schema validation and before completion."""
    if not summary.overall_overview.strip() or not summary.detailed_sections:
        raise StudyMaterialQualityError("The generated summary does not contain usable study sections.")
    if len(flashcards) != 15 or len({card.front.strip().casefold() for card in flashcards}) != 15:
        raise StudyMaterialQualityError("Generated flashcards are incomplete or duplicated.")
    if len(questions) != 10:
        raise StudyMaterialQualityError("Generated quiz is incomplete.")
    if any(len(question.options) != 4 or len(set(question.options)) != 4 for question in questions):
        raise StudyMaterialQualityError("Generated quiz contains invalid answer options.")


def explain_selection(
    *,
    highlighted_text: str,
    user_question: str = "",
    note_content: str = "",
    source: str = "selection",
) -> SelectionExplanation:
    if source == "note" and note_content and highlighted_text:
        context = (
            "The user is studying a document.\n\n"
            f"They selected or saved this text:\n{highlighted_text}\n\n"
            f"Their note about it:\n{note_content}\n\n"
            "Answer the user's question using this context. Keep the explanation clear, "
            "student-friendly, and relevant to the study material."
        )
    elif source == "note" and note_content:
        context = (
            "The user is studying a document.\n\n"
            f"They wrote this general note:\n{note_content}\n\n"
            "Answer the user's question using this note and the document context."
        )
    else:
        context = f"Highlighted study text:\n{highlighted_text}"

    prompt = (
        f"{EXPLAIN_SELECTION_PROMPT}\n\n"
        f"{context}\n\n"
        f"Student follow-up question:\n{user_question or 'Explain this clearly in simpler terms.'}"
    )
    response = _generate_structured(
        prompt=prompt,
        response_schema=SelectionExplanation,
    )
    return SelectionExplanation.model_validate_json(response.text)


def answer_document_question(
    *,
    chunks: list[tuple[int, str]],
    user_question: str,
) -> DocumentQuestionAnswer:
    if not chunks:
        raise AIServiceError("Cannot answer a document question without document chunks.")
    if not user_question.strip():
        raise AIServiceError("A document question is required.")

    prompt = (
        f"{DOCUMENT_QA_PROMPT}\n\n"
        "Use the chunk numbers exactly as provided when choosing supporting_chunks.\n"
        "Keep supporting_chunks limited to the most relevant 2 to 4 chunks.\n"
        "The excerpt for each supporting chunk must be a short quote or paraphrase from the chunk.\n\n"
        f"Student question:\n{user_question.strip()}\n\n"
        f"{_join_chunks(chunks)}"
    )
    response = _generate_structured(
        prompt=prompt,
        response_schema=DocumentQuestionAnswer,
    )
    answer = DocumentQuestionAnswer.model_validate_json(response.text)
    available_chunk_indexes = {chunk_index for chunk_index, _ in chunks}
    if not answer.supporting_chunks or any(
        item.chunk_index not in available_chunk_indexes for item in answer.supporting_chunks
    ):
        raise AIServiceError("Gemini returned invalid supporting document references.")
    return answer


def extract_youtube_search_query(document_text_or_summary: str) -> YouTubeSearchQuery:
    if not document_text_or_summary:
        raise AIServiceError("Cannot extract YouTube query without document content.")

    prompt = (
        "You are an expert educational content curator. Based on the following study document or summary, "
        "extract the main topic and suggest a short, tutorial-focused YouTube search query. "
        "Also provide 3-5 educational keywords.\n"
        "Return only valid JSON that matches the required schema.\n"
        "Do not return YouTube URLs.\n"
        "Do not invent video links.\n"
        "Keep the search_query concise and useful for a student.\n\n"
        f"Document context:\n{document_text_or_summary}"
    )
    
    response = _generate_structured(
        prompt=prompt,
        response_schema=YouTubeSearchQuery,
    )
    
    return YouTubeSearchQuery.model_validate_json(response.text)
