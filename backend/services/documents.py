from __future__ import annotations

import json
import uuid
from datetime import datetime

from sqlmodel import Session

from models.tables import (
    Document,
    DocumentChunk,
    DocumentStatus,
    Flashcard,
    Quiz,
    QuizQuestion,
    Summary,
)
from services.ai_service import ComprehensiveSummary, FlashcardPayload, QuizQuestionPayload


def create_document_record(
    *,
    session: Session,
    filename: str,
    file_url: str,
    file_size_bytes: int,
    user_id: uuid.UUID | None = None,
) -> Document:
    document = Document(
        user_id=user_id,
        filename=filename,
        file_url=file_url,
        status=DocumentStatus.PENDING,
        file_size_bytes=file_size_bytes,
    )
    session.add(document)
    session.commit()
    session.refresh(document)
    return document


def update_document_status(
    *,
    session: Session,
    document: Document,
    status: DocumentStatus,
    page_count: int | None = None,
) -> Document:
    document.status = status
    document.updated_at = datetime.utcnow()

    if page_count is not None:
        document.page_count = page_count

    session.add(document)
    session.commit()
    session.refresh(document)
    return document


def save_summary(
    *,
    session: Session,
    document_id: uuid.UUID,
    summary: ComprehensiveSummary,
) -> Summary:
    summary_record = Summary(
        document_id=document_id,
        content=json.dumps(summary.model_dump()),
    )
    session.add(summary_record)
    session.commit()
    session.refresh(summary_record)
    return summary_record


def save_flashcards(
    *,
    session: Session,
    document_id: uuid.UUID,
    flashcards: list[FlashcardPayload],
) -> list[Flashcard]:
    records = [
        Flashcard(
            document_id=document_id,
            front=flashcard.front,
            back=flashcard.back,
            order_index=index,
        )
        for index, flashcard in enumerate(flashcards)
    ]
    session.add_all(records)
    session.commit()
    return records


def save_document_chunks(
    *,
    session: Session,
    document_id: uuid.UUID,
    chunks: list[str],
) -> list[DocumentChunk]:
    records = [
        DocumentChunk(
            document_id=document_id,
            content=chunk,
            order_index=index,
        )
        for index, chunk in enumerate(chunks)
    ]
    session.add_all(records)
    session.commit()
    return records


def save_quiz(
    *,
    session: Session,
    document_id: uuid.UUID,
    questions: list[QuizQuestionPayload],
) -> Quiz:
    quiz = Quiz(document_id=document_id)
    session.add(quiz)
    session.commit()
    session.refresh(quiz)

    quiz_question_records = [
        QuizQuestion(
            quiz_id=quiz.id,
            question=question.question,
            options=json.dumps(question.options),
            correct_answer_index=question.correct_answer_index,
            explanation=question.explanation,
            order_index=index,
        )
        for index, question in enumerate(questions)
    ]
    session.add_all(quiz_question_records)
    session.commit()
    session.refresh(quiz)
    return quiz
