from __future__ import annotations

import logging
import uuid
from collections.abc import Sequence

from celery import Task
from sqlmodel import Session, select

from core.celery_app import celery_app
from core.config import settings
from core.database import engine
from models.tables import Document, DocumentChunk, DocumentStatus, Flashcard, Quiz, Summary
from services.ai_service import (
    AIServiceError,
    ComprehensiveSummary,
    FlashcardPayload,
    QuizQuestionPayload,
    extract_youtube_search_query,
    generate_embeddings_batch,
    generate_flashcards_from_summary,
    generate_quiz_from_summary,
    generate_summary,
    verify_study_materials,
)
from services.document_processing import (
    DocumentProcessingError,
    chunk_text,
    extract_docx_text,
    extract_pdf_text,
)
from services.documents import (
    build_semantic_chunk_clusters,
    get_document_chunks,
    get_unembedded_document_chunks,
    save_chunk_embeddings,
    save_document_chunks,
    save_flashcards,
    save_quiz,
    save_related_videos,
    save_summary,
    update_document_status,
)
from services.storage import StorageServiceError, download_file_from_storage
from services.youtube_service import search_related_videos

logger = logging.getLogger(__name__)


def _get_document(session: Session, document_id: str) -> Document:
    document = session.exec(
        select(Document).where(Document.id == uuid.UUID(document_id))
    ).first()
    if document is None:
        raise ValueError(f"Document {document_id} was not found.")
    return document


def _extract_and_persist_chunks(session: Session, document: Document) -> list[DocumentChunk]:
    existing_chunks = get_document_chunks(session=session, document_id=document.id)
    if existing_chunks:
        return existing_chunks

    update_document_status(
        session=session,
        document=document,
        status=DocumentStatus.EXTRACTING,
    )
    file_bytes = download_file_from_storage(document.file_url)
    filename = document.filename.lower()

    if filename.endswith(".pdf"):
        extracted_text, page_count = extract_pdf_text(file_bytes)
    elif filename.endswith(".docx"):
        extracted_text, page_count = extract_docx_text(file_bytes)
    else:
        raise DocumentProcessingError("Unsupported document type for processing.")

    update_document_status(
        session=session,
        document=document,
        status=DocumentStatus.CHUNKING,
        page_count=page_count,
    )
    chunks = chunk_text(extracted_text, chunk_size=2000, overlap=200)
    if not chunks:
        raise DocumentProcessingError("No extractable text chunks were produced.")

    return save_document_chunks(session=session, document_id=document.id, chunks=chunks)


def _embed_unfinished_chunks(session: Session, document: Document) -> list[DocumentChunk]:
    update_document_status(
        session=session,
        document=document,
        status=DocumentStatus.EMBEDDING,
    )
    unembedded_chunks = get_unembedded_document_chunks(
        session=session,
        document_id=document.id,
    )
    for start in range(0, len(unembedded_chunks), settings.embedding_batch_size):
        batch = unembedded_chunks[start : start + settings.embedding_batch_size]
        embeddings = generate_embeddings_batch([chunk.content for chunk in batch])
        save_chunk_embeddings(session=session, chunks=batch, embeddings=embeddings)

    return get_document_chunks(session=session, document_id=document.id)


def _load_summary(session: Session, document_id: uuid.UUID) -> tuple[Summary | None, ComprehensiveSummary | None]:
    summary_record = session.exec(
        select(Summary).where(Summary.document_id == document_id)
    ).first()
    if summary_record is None:
        return None, None

    try:
        return summary_record, ComprehensiveSummary.model_validate_json(summary_record.content)
    except Exception as exc:
        raise DocumentProcessingError("Stored summary could not be validated.") from exc


def _load_flashcards(session: Session, document_id: uuid.UUID) -> list[Flashcard]:
    return session.exec(
        select(Flashcard)
        .where(Flashcard.document_id == document_id)
        .order_by(Flashcard.order_index.asc())
    ).all()


def _load_quiz_questions(session: Session, document_id: uuid.UUID) -> list[QuizQuestionPayload]:
    quiz = session.exec(select(Quiz).where(Quiz.document_id == document_id)).first()
    if quiz is None:
        return []

    from models.tables import QuizQuestion
    import json

    questions = session.exec(
        select(QuizQuestion)
        .where(QuizQuestion.quiz_id == quiz.id)
        .order_by(QuizQuestion.order_index.asc())
    ).all()
    return [
        QuizQuestionPayload(
            question=question.question,
            options=json.loads(question.options),
            correct_answer_index=question.correct_answer_index,
            explanation=question.explanation,
        )
        for question in questions
    ]


def _to_flashcard_payloads(flashcards: Sequence[Flashcard]) -> list[FlashcardPayload]:
    return [FlashcardPayload(front=card.front, back=card.back) for card in flashcards]


def _generate_and_persist_materials(
    session: Session,
    document: Document,
    chunks: list[DocumentChunk],
) -> tuple[ComprehensiveSummary, list[FlashcardPayload], list[QuizQuestionPayload]]:
    summary_record, summary = _load_summary(session, document.id)
    if summary is None:
        update_document_status(
            session=session,
            document=document,
            status=DocumentStatus.ANALYZING,
        )
        semantic_clusters = build_semantic_chunk_clusters(
            chunks,
            max_chunks_per_cluster=settings.rag_cluster_max_chunks,
        )
        summary = generate_summary(
            [chunk.content for chunk in chunks],
            semantic_clusters=semantic_clusters,
        )
        summary_record = save_summary(session=session, document_id=document.id, summary=summary)

    flashcards = _to_flashcard_payloads(_load_flashcards(session, document.id))
    quiz_questions = _load_quiz_questions(session, document.id)
    if len(flashcards) < 15 or len(quiz_questions) < 10:
        update_document_status(
            session=session,
            document=document,
            status=DocumentStatus.GENERATING,
        )

    if not flashcards:
        flashcards = generate_flashcards_from_summary(summary)
        save_flashcards(session=session, document_id=document.id, flashcards=flashcards)
    elif len(flashcards) != 15:
        raise DocumentProcessingError("Stored flashcard set is incomplete and requires repair.")

    if not quiz_questions:
        quiz_questions = generate_quiz_from_summary(summary)
        save_quiz(session=session, document_id=document.id, questions=quiz_questions)
    elif len(quiz_questions) != 10:
        raise DocumentProcessingError("Stored quiz is incomplete and requires repair.")

    return summary, flashcards, quiz_questions


def _save_optional_related_videos(
    *,
    session: Session,
    document: Document,
    summary: ComprehensiveSummary,
) -> None:
    try:
        youtube_query = extract_youtube_search_query(summary.overall_overview)
        videos = search_related_videos(youtube_query.search_query, max_results=3)
        if videos:
            save_related_videos(
                session=session,
                document_id=document.id,
                videos=videos,
                relevance_reason=(
                    "Recommended because this document discusses "
                    f"{youtube_query.main_topic}."
                ),
            )
    except Exception as exc:  # Related videos are additive, never a processing blocker.
        logger.warning("Skipping YouTube related videos for document %s: %s", document.id, exc)


def _run_pipeline(document_id: str) -> dict[str, int | str]:
    """Advance the durable document workflow from its last completed checkpoint."""
    with Session(engine) as session:
        document = _get_document(session, document_id)
        if document.status == DocumentStatus.COMPLETED:
            chunks = get_document_chunks(session=session, document_id=document.id)
            return {
                "document_id": document_id,
                "status": DocumentStatus.COMPLETED.value,
                "chunk_count": len(chunks),
                "page_count": document.page_count or 0,
            }

        chunks = _extract_and_persist_chunks(session, document)
        chunks = _embed_unfinished_chunks(session, document)

        summary, flashcards, quiz_questions = _generate_and_persist_materials(
            session,
            document,
            chunks,
        )
        update_document_status(
            session=session,
            document=document,
            status=DocumentStatus.VALIDATING,
        )
        verify_study_materials(
            summary=summary,
            flashcards=flashcards,
            questions=quiz_questions,
        )
        _save_optional_related_videos(session=session, document=document, summary=summary)
        update_document_status(
            session=session,
            document=document,
            status=DocumentStatus.COMPLETED,
        )

        return {
            "document_id": document_id,
            "status": DocumentStatus.COMPLETED.value,
            "chunk_count": len(chunks),
            "page_count": document.page_count or 0,
        }


@celery_app.task(
    bind=True,
    name="tasks.process_document_task",
    max_retries=settings.document_processing_max_retries,
)
def process_document_task(self: Task, document_id: str) -> dict[str, int | str]:
    try:
        return _run_pipeline(document_id)
    except Exception as exc:
        logger.exception(
            "Document processing attempt %s failed for document %s.",
            self.request.retries + 1,
            document_id,
        )

        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=min(60, 2 ** self.request.retries)) from exc

        with Session(engine) as session:
            document = _get_document(session, document_id)
            update_document_status(
                session=session,
                document=document,
                status=DocumentStatus.FAILED,
            )
        raise
