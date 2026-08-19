from __future__ import annotations

import logging
from collections.abc import Sequence
from typing import Iterable

from pydantic import BaseModel, Field, ValidationError

from core.config import settings
from services.llm_provider import (
    AIServiceError,
    _embed_contents,
    _generate_structured,
)


logger = logging.getLogger(__name__)


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


class RawGroundedClaim(BaseModel):
    claim_text: str = Field(min_length=1, max_length=2000)
    cited_evidence_ids: list[str] = Field(default_factory=list)

class ConversationAnswer(BaseModel):
    claims: list[RawGroundedClaim]
    evidence_sufficient: bool
    suggested_followups: list[str] = Field(default_factory=list, max_length=4)


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


CONVERSATION_QA_PROMPT = """
You are StudFlow AI, a patient study assistant in an ongoing conversation.
Answer the student's current question using ONLY the supplied document sources.
Conversation history provides context for the student's intent, but it is not evidence.
Do not invent facts, titles, URLs, page numbers, or citations.

Your response must be an array of distinct claims. Each claim represents a distinct sentence or logical thought.
For each claim, you MUST provide a list of Evidence IDs (e.g. "e_01") that explicitly support that claim.
Do NOT use inline markdown citation markers (like [1]). Just provide the clean claim text and populate the cited_evidence_ids array with the exact IDs of the provided sources.

If the supplied evidence cannot answer the question at all:
1. Set evidence_sufficient to false.
2. Provide a single claim stating you cannot answer the question based on the evidence.
3. Provide an empty array for cited_evidence_ids.

If the evidence can answer the question, set evidence_sufficient to true and ensure every factual claim cites at least one valid Evidence ID from the supplied sources.
Prefer a concise explanation first, followed by useful detail when needed.
Return only JSON matching the required schema.
""".strip()


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


def answer_conversation_question(
    *,
    sources: list[tuple[str, str]],
    user_question: str,
    conversation_history: list[tuple[str, str]],
    selected_text: str | None = None,
) -> ConversationAnswer:
    if not sources:
        raise AIServiceError("Cannot answer a conversation question without document sources.")
    if not user_question.strip():
        raise AIServiceError("A conversation question is required.")

    history_text = "\n".join(
        f"{role.upper()}: {content}" for role, content in conversation_history
    ) or "No previous messages."
    source_text = "\n\n".join(
        f"Evidence ID: {evidence_id}\nContent: {content}"
        for evidence_id, content in sources
    )
    prompt = (
        f"{CONVERSATION_QA_PROMPT}\n\n"
        f"Recent conversation:\n{history_text}\n\n"
        f"Current student question:\n{user_question.strip()}\n\n"
        f"Student-selected context for this turn (use it to understand intent, but cite only the verified source registry):\n"
        f"{selected_text or 'No selected context.'}\n\n"
        f"Verified source registry:\n{source_text}\n\n"
        "cited_evidence_ids must contain every Evidence ID used to support a claim. "
        "Use only Evidence IDs present in the registry. Suggest no more than four concise follow-ups."
    )
    answer: ConversationAnswer | None = None
    final_validation_error: ValidationError | None = None
    for generation_attempt in range(2):
        response = _generate_structured(
            prompt=prompt,
            response_schema=ConversationAnswer,
        )
        try:
            answer = ConversationAnswer.model_validate_json(response.text)
            break
        except ValidationError as exc:
            final_validation_error = exc
            if generation_attempt == 0:
                logger.warning(
                    "Retrying malformed conversation answer: attempt=%d error_type=%s",
                    generation_attempt + 1,
                    type(exc).__name__,
                )

    if answer is None:
        raise AIServiceError(
            "Gemini returned an invalid structured conversation answer after retry."
        ) from final_validation_error

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
