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
from services.domain_validation import validate_summary, validate_flashcards, validate_quiz
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
    chunk_docx_text,
    chunk_pdf_pages,
    extract_docx_text,
    get_pdf_page_count,
    iter_pdf_pages,
)
from services.documents import (
    activate_document_index_generation,
    build_semantic_chunk_clusters,
    claim_unembedded_document_chunks,
    claim_reindex_embedding_batch,
    checkpoint_active_index_page,
    checkpoint_reindex_page,
    clear_incomplete_flashcards,
    clear_incomplete_quiz,
    get_document_index_readiness,
    get_document_chunks,
    get_unembedded_document_chunks,
    release_document_reindex_claim,
    renew_document_reindex_lease,
    save_chunk_embeddings,
    save_document_chunks,
    save_flashcards,
    save_quiz,
    save_related_videos,
    save_reindex_chunk_embeddings,
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
    generation = document.active_index_generation
    filename = document.filename.lower()
    existing_chunks = get_document_chunks(
        session=session,
        document_id=document.id,
        index_generation=generation,
    )
    if existing_chunks and (
        not filename.endswith(".pdf")
        or any(chunk.page_number is None for chunk in existing_chunks)
    ):
        # Preserve compatibility for DOCX and pre-page-aware PDF attempts. Mixing
        # page-local chunks into a flat/null-page generation would corrupt ordering.
        return existing_chunks

    update_document_status(
        session=session,
        document=document,
        status=DocumentStatus.EXTRACTING,
    )
    file_bytes = download_file_from_storage(document.file_url)

    if filename.endswith(".pdf"):
        page_count = get_pdf_page_count(file_bytes)
        for page in iter_pdf_pages(
            file_bytes,
            start_page=document.active_index_page_cursor + 1,
            ocr_enabled=settings.pdf_ocr_enabled,
            ocr_language=settings.pdf_ocr_language,
            ocr_dpi=settings.pdf_ocr_dpi,
            ocr_min_text_chars=settings.pdf_ocr_min_text_chars,
        ):
            checkpoint_active_index_page(
                session=session,
                document_id=document.id,
                index_generation=generation,
                page_number=page.page_number,
                page_count=page_count,
                chunks=chunk_pdf_pages([page], chunk_size=2000, overlap=200),
            )
        chunks = get_document_chunks(
            session=session,
            document_id=document.id,
            index_generation=generation,
        )
    elif filename.endswith(".docx"):
        extracted_text, page_count = extract_docx_text(file_bytes)
        chunks = chunk_docx_text(extracted_text, chunk_size=2000, overlap=200)
    else:
        raise DocumentProcessingError("Unsupported document type for processing.")

    update_document_status(
        session=session,
        document=document,
        status=DocumentStatus.CHUNKING,
        page_count=page_count,
    )
    if not chunks:
        raise DocumentProcessingError("No extractable text chunks were produced.")

    if filename.endswith(".pdf"):
        return chunks
    return save_document_chunks(
        session=session,
        document_id=document.id,
        chunks=chunks,
        index_generation=generation,
    )


def _embed_unfinished_chunks(
    session: Session,
    document: Document,
    *,
    index_generation: int | None = None,
    update_status: bool = True,
) -> list[DocumentChunk]:
    generation = index_generation or document.active_index_generation
    if update_status:
        update_document_status(
            session=session,
            document=document,
            status=DocumentStatus.EMBEDDING,
        )
    unembedded_chunks = get_unembedded_document_chunks(
        session=session,
        document_id=document.id,
        index_generation=generation,
    )
    for start in range(0, len(unembedded_chunks), settings.embedding_batch_size):
        batch = unembedded_chunks[start : start + settings.embedding_batch_size]
        embeddings = generate_embeddings_batch([chunk.content for chunk in batch])
        save_chunk_embeddings(session=session, chunks=batch, embeddings=embeddings)

    return get_document_chunks(
        session=session,
        document_id=document.id,
        index_generation=generation,
    )


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
        domain_summary = validate_summary(summary)
        summary_record = save_summary(session=session, document_id=document.id, summary=domain_summary)

    flashcards = _to_flashcard_payloads(_load_flashcards(session, document.id))
    quiz_questions = _load_quiz_questions(session, document.id)
    if len(flashcards) != 15 or len(quiz_questions) != 10:
        update_document_status(
            session=session,
            document=document,
            status=DocumentStatus.GENERATING,
        )

    if flashcards and len(flashcards) != 15:
        clear_incomplete_flashcards(session=session, document_id=document.id)
        flashcards = []
    if not flashcards:
        flashcards = generate_flashcards_from_summary(summary)
        domain_flashcards = validate_flashcards(flashcards)
        save_flashcards(session=session, document_id=document.id, flashcards=domain_flashcards)

    if quiz_questions and len(quiz_questions) != 10:
        clear_incomplete_quiz(session=session, document_id=document.id)
        quiz_questions = []
    if not quiz_questions:
        quiz_questions = generate_quiz_from_summary(summary)
        domain_quiz = validate_quiz(quiz_questions)
        save_quiz(session=session, document_id=document.id, questions=domain_quiz)

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
    acks_late=True,
    reject_on_worker_lost=True,
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


def _repair_completed_document_index(document_id: str) -> dict[str, int | str]:
    """Embed only missing chunks without changing completed study artifacts or status."""
    parsed_document_id = uuid.UUID(document_id)
    embedded_during_repair = 0

    with Session(engine) as session:
        document = _get_document(session, document_id)
        if document.status != DocumentStatus.COMPLETED:
            raise ValueError("Only completed documents are eligible for index repair.")

        while True:
            batch = claim_unembedded_document_chunks(
                session=session,
                document_id=parsed_document_id,
                limit=settings.embedding_batch_size,
            )
            if not batch:
                break
            embeddings = generate_embeddings_batch([chunk.content for chunk in batch])
            save_chunk_embeddings(session=session, chunks=batch, embeddings=embeddings)
            embedded_during_repair += len(batch)

        readiness = get_document_index_readiness(
            session=session,
            document_id=parsed_document_id,
            index_generation=document.active_index_generation,
        )
        return {
            "document_id": document_id,
            "status": document.status.value,
            "chunk_count": readiness.total_chunks,
            "embedded_chunk_count": readiness.embedded_chunks,
            "embedded_during_repair": embedded_during_repair,
        }


@celery_app.task(
    bind=True,
    name="tasks.repair_document_index_task",
    max_retries=settings.document_processing_max_retries,
)
def repair_document_index_task(self: Task, document_id: str) -> dict[str, int | str]:
    try:
        return _repair_completed_document_index(document_id)
    except Exception as exc:
        logger.exception(
            "Document index repair attempt %s failed for document %s.",
            self.request.retries + 1,
            document_id,
        )
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=min(60, 2 ** self.request.retries)) from exc
        raise


def dispatch_document_index_repair(document_id: uuid.UUID) -> bool:
    """Queue repair only for a completed document with repairable stored chunks."""
    with Session(engine) as session:
        document = _get_document(session, str(document_id))
        readiness = get_document_index_readiness(
            session=session,
            document_id=document_id,
            index_generation=document.active_index_generation,
        )
        if document.status != DocumentStatus.COMPLETED or not readiness.is_repairable:
            return False

    repair_document_index_task.delay(str(document_id))
    return True


def _reindex_completed_pdf(
    document_id: str,
    index_generation: int,
    lease_token: uuid.UUID,
) -> dict[str, int | str]:
    """Build a staged page-aware generation and activate it only when complete."""
    with Session(engine) as session:
        document = _get_document(session, document_id)
        if document.status != DocumentStatus.COMPLETED:
            raise ValueError("Only completed documents are eligible for reindexing.")
        if not document.filename.lower().endswith(".pdf"):
            raise ValueError("Only PDF documents are eligible for reindexing.")
        if document.pending_index_generation != index_generation:
            raise ValueError("The pending document index generation changed.")

        cursor = renew_document_reindex_lease(
            session=session,
            document_id=document.id,
            index_generation=index_generation,
            lease_token=lease_token,
        )
        file_bytes = download_file_from_storage(document.file_url)
        page_count = get_pdf_page_count(file_bytes)
        for page in iter_pdf_pages(
            file_bytes,
            start_page=cursor + 1,
            ocr_enabled=settings.pdf_ocr_enabled,
            ocr_language=settings.pdf_ocr_language,
            ocr_dpi=settings.pdf_ocr_dpi,
            ocr_min_text_chars=settings.pdf_ocr_min_text_chars,
        ):
            page_chunks = chunk_pdf_pages([page], chunk_size=2000, overlap=200)
            checkpoint_reindex_page(
                session=session,
                document_id=document.id,
                index_generation=index_generation,
                lease_token=lease_token,
                page_number=page.page_number,
                page_count=page_count,
                chunks=page_chunks,
            )

        while True:
            batch = claim_reindex_embedding_batch(
                session=session,
                document_id=document.id,
                index_generation=index_generation,
                lease_token=lease_token,
                limit=settings.embedding_batch_size,
            )
            if not batch:
                break
            embeddings = generate_embeddings_batch([chunk.content for chunk in batch])
            save_reindex_chunk_embeddings(
                session=session,
                document_id=document.id,
                index_generation=index_generation,
                lease_token=lease_token,
                chunks=batch,
                embeddings=embeddings,
            )

        chunks = get_document_chunks(
            session=session,
            document_id=document.id,
            index_generation=index_generation,
        )
        activate_document_index_generation(
            session=session,
            document_id=document.id,
            index_generation=index_generation,
            lease_token=lease_token,
        )
        return {
            "document_id": document_id,
            "status": DocumentStatus.COMPLETED.value,
            "active_index_generation": index_generation,
            "chunk_count": len(chunks),
        }


@celery_app.task(
    bind=True,
    name="tasks.reindex_document_task",
    max_retries=settings.document_processing_max_retries,
    acks_late=True,
    reject_on_worker_lost=True,
)
def reindex_document_task(
    self: Task,
    document_id: str,
    index_generation: int,
    lease_token: str,
) -> dict[str, int | str]:
    parsed_lease_token = uuid.UUID(lease_token)
    try:
        return _reindex_completed_pdf(
            document_id,
            index_generation,
            parsed_lease_token,
        )
    except Exception as exc:
        logger.exception(
            "Document reindex attempt %s failed for document %s generation %s.",
            self.request.retries + 1,
            document_id,
            index_generation,
        )
        if self.request.retries < self.max_retries:
            raise self.retry(
                exc=exc,
                countdown=min(60, 2 ** self.request.retries),
            ) from exc
        with Session(engine) as session:
            release_document_reindex_claim(
                session=session,
                document_id=uuid.UUID(document_id),
                index_generation=index_generation,
                lease_token=parsed_lease_token,
                clean_staged=True,
            )
        raise
