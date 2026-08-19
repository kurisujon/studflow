from schemas.domain import (
    DomainSummary,
    DomainTopicDetail,
    DomainFlashcard,
    DomainQuizQuestion,
    DomainConversationAnswer,
)
from services.ai_service import (
    ComprehensiveSummary,
    FlashcardPayload,
    QuizQuestionPayload,
    ConversationAnswer,
)


def validate_summary(raw: ComprehensiveSummary) -> DomainSummary:
    """Validates and sanitizes a raw ComprehensiveSummary from the LLM."""
    return DomainSummary(
        overall_overview=raw.overall_overview,
        detailed_sections=[
            DomainTopicDetail(
                topic_title=topic.topic_title,
                key_points=topic.key_points,
                important_terms_and_definitions=topic.important_terms_and_definitions,
            )
            for topic in raw.detailed_sections
        ],
    )


def validate_flashcards(raw_flashcards: list[FlashcardPayload]) -> list[DomainFlashcard]:
    """Validates, sanitizes, and filters a list of raw FlashcardPayloads."""
    valid_cards = []
    for raw in raw_flashcards:
        try:
            valid_cards.append(
                DomainFlashcard(
                    front=raw.front,
                    back=raw.back,
                )
            )
        except ValueError:
            # Drop invalid flashcards
            continue
    return valid_cards


def validate_quiz(raw_quiz: list[QuizQuestionPayload]) -> list[DomainQuizQuestion]:
    """Validates, sanitizes, and filters a list of raw QuizQuestionPayloads."""
    valid_questions = []
    for raw in raw_quiz:
        try:
            valid_questions.append(
                DomainQuizQuestion(
                    question=raw.question,
                    options=raw.options,
                    correct_answer_index=raw.correct_answer_index,
                    explanation=raw.explanation,
                )
            )
        except ValueError:
            # Drop invalid questions
            continue
    return valid_questions


from typing import Set

def validate_conversation_answer(raw: ConversationAnswer, available_indexes: Set[int]) -> DomainConversationAnswer:
    """Validates and sanitizes a raw ConversationAnswer."""
    # Deduplicate citations while preserving order
    seen = set()
    unique_indexes = []
    for idx in raw.cited_source_indexes:
        if idx not in seen:
            seen.add(idx)
            unique_indexes.append(idx)
    
    # Phase B validation preparation
    if any(idx not in available_indexes for idx in unique_indexes):
        raise ValueError("Gemini returned an invalid conversation source reference.")
    if any(idx < 1 for idx in unique_indexes):
        raise ValueError("Gemini returned an invalid conversation source reference.")
    if raw.evidence_sufficient and not unique_indexes:
        raise ValueError("Gemini returned a grounded answer without a source reference.")

    return DomainConversationAnswer(
        answer_markdown=raw.answer_markdown,
        evidence_sufficient=raw.evidence_sufficient,
        cited_source_indexes=unique_indexes,
        suggested_followups=raw.suggested_followups,
    )
