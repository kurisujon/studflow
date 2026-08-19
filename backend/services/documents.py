from __future__ import annotations

import json
import math
import uuid
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, update
from sqlmodel import Session, select

from models.tables import (
    AIConversation,
    AIHistory,
    Document,
    DocumentChunk,
    DocumentStatus,
    Flashcard,
    Quiz,
    QuizAttempt,
    QuizQuestion,
    RelatedVideo,
    Summary,
    StudyAnnotation,
)
from schemas.domain import DomainSummary, DomainFlashcard, DomainQuizQuestion
from services.document_processing import DocumentChunkPayload


@dataclass(frozen=True)
class DocumentIndexReadiness:
    total_chunks: int
    embedded_chunks: int
    generation: int = 1

    @property
    def is_ready(self) -> bool:
        return self.total_chunks > 0 and self.embedded_chunks == self.total_chunks

    @property
    def is_repairable(self) -> bool:
        return self.total_chunks > 0 and self.embedded_chunks < self.total_chunks


def create_document_record(
    *,
    session: Session,
    filename: str,
    file_url: str,
    file_size_bytes: int,
    document_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    clerk_user_id: str | None = None,
) -> Document:
    document_data = dict(
        user_id=user_id,
        clerk_user_id=clerk_user_id,
        filename=filename,
        file_url=file_url,
        status=DocumentStatus.PENDING,
        file_size_bytes=file_size_bytes,
    )
    if document_id is not None:
        document_data["id"] = document_id

    document = Document(**document_data)
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
    document.updated_at = datetime.now(timezone.utc)

    if page_count is not None:
        document.page_count = page_count

    session.add(document)
    session.commit()
    session.refresh(document)
    return document


def claim_failed_document_for_retry(
    *,
    session: Session,
    document_id: uuid.UUID,
) -> bool:
    """Atomically claim a failed document so only one retry can be queued."""
    try:
        result = session.exec(
            update(Document)
            .where(Document.id == document_id)
            .where(Document.status == DocumentStatus.FAILED)
            .values(
                status=DocumentStatus.PENDING,
                updated_at=datetime.now(timezone.utc),
            )
        )
        claimed = result.rowcount == 1
        session.commit()
        return claimed
    except Exception:
        session.rollback()
        raise


def delete_terminal_document(*, session: Session, document_id: uuid.UUID) -> str:
    """Delete a completed or failed document and every owned database record."""
    try:
        document = session.exec(
            select(Document)
            .where(Document.id == document_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        ).first()
        if document is None or document.status not in {
            DocumentStatus.COMPLETED,
            DocumentStatus.FAILED,
        }:
            raise ValueError("Only completed or failed documents can be deleted.")

        quiz = session.exec(
            select(Quiz).where(Quiz.document_id == document.id)
        ).first()
        if quiz is not None:
            for question in session.exec(
                select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id)
            ).all():
                session.delete(question)
            session.delete(quiz)

        document_models = (
            AIConversation,
            QuizAttempt,
            Flashcard,
            Summary,
            RelatedVideo,
            StudyAnnotation,
            AIHistory,
            DocumentChunk,
        )
        for model in document_models:
            records = session.exec(
                select(model).where(model.document_id == document.id)
            ).all()
            for record in records:
                session.delete(record)

        storage_path = document.file_url
        session.delete(document)
        session.commit()
        return storage_path
    except Exception:
        session.rollback()
        raise


def save_summary(
    *,
    session: Session,
    document_id: uuid.UUID,
    summary: DomainSummary,
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
    flashcards: list[DomainFlashcard],
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


def clear_incomplete_flashcards(*, session: Session, document_id: uuid.UUID) -> None:
    """Remove a partial generated set so a retry can regenerate it cleanly."""
    try:
        for card in session.exec(
            select(Flashcard).where(Flashcard.document_id == document_id)
        ).all():
            session.delete(card)
        session.commit()
    except Exception:
        session.rollback()
        raise


def clear_incomplete_quiz(*, session: Session, document_id: uuid.UUID) -> None:
    """Remove a partial quiz and its questions before regeneration."""
    try:
        quiz = session.exec(
            select(Quiz).where(Quiz.document_id == document_id)
        ).first()
        if quiz is not None:
            for question in session.exec(
                select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id)
            ).all():
                session.delete(question)
            session.delete(quiz)
        session.commit()
    except Exception:
        session.rollback()
        raise


def create_flashcard(
    *,
    session: Session,
    document_id: uuid.UUID,
    front: str,
    back: str,
) -> Flashcard:
    last_flashcard = session.exec(
        select(Flashcard)
        .where(Flashcard.document_id == document_id)
        .order_by(Flashcard.order_index.desc())
    ).first()

    flashcard = Flashcard(
        document_id=document_id,
        front=front,
        back=back,
        order_index=(last_flashcard.order_index + 1) if last_flashcard else 0,
    )
    session.add(flashcard)
    session.commit()
    session.refresh(flashcard)
    return flashcard


def save_document_chunks(
    *,
    session: Session,
    document_id: uuid.UUID,
    chunks: Sequence[str | DocumentChunkPayload],
    index_generation: int = 1,
) -> list[DocumentChunk]:
    records = [
        DocumentChunk(
            document_id=document_id,
            content=chunk.content if isinstance(chunk, DocumentChunkPayload) else chunk,
            page_number=chunk.page_number if isinstance(chunk, DocumentChunkPayload) else None,
            index_generation=index_generation,
            order_index=index,
        )
        for index, chunk in enumerate(chunks)
    ]
    try:
        session.add_all(records)
        session.commit()
        return records
    except Exception:
        session.rollback()
        raise


def get_document_chunks(
    *,
    session: Session,
    document_id: uuid.UUID,
    index_generation: int | None = None,
) -> list[DocumentChunk]:
    statement = select(DocumentChunk).where(DocumentChunk.document_id == document_id)
    if index_generation is None:
        statement = statement.join(Document, Document.id == DocumentChunk.document_id).where(
            DocumentChunk.index_generation == Document.active_index_generation
        )
    else:
        statement = statement.where(DocumentChunk.index_generation == index_generation)
    return session.exec(statement.order_by(DocumentChunk.order_index.asc())).all()


def get_unembedded_document_chunks(
    *,
    session: Session,
    document_id: uuid.UUID,
    index_generation: int | None = None,
) -> list[DocumentChunk]:
    statement = (
        select(DocumentChunk)
        .where(DocumentChunk.document_id == document_id)
        .where(DocumentChunk.embedding.is_(None))
    )
    if index_generation is None:
        statement = statement.join(Document, Document.id == DocumentChunk.document_id).where(
            DocumentChunk.index_generation == Document.active_index_generation
        )
    else:
        statement = statement.where(DocumentChunk.index_generation == index_generation)
    return session.exec(statement.order_by(DocumentChunk.order_index.asc())).all()


def get_document_index_readiness(
    *,
    session: Session,
    document_id: uuid.UUID,
    index_generation: int | None = None,
) -> DocumentIndexReadiness:
    """Return complete index counts; partial indexes are never chat-ready."""
    if index_generation is None:
        generation = int(
            session.exec(
                select(Document.active_index_generation).where(
                    Document.id == document_id
                )
            ).one()
        )
    else:
        generation = index_generation
    total_chunks, embedded_chunks = session.exec(
        select(
            func.count(DocumentChunk.id),
            func.count(DocumentChunk.id).filter(DocumentChunk.embedding.is_not(None)),
        )
        .where(DocumentChunk.document_id == document_id)
        .where(DocumentChunk.index_generation == generation)
    ).one()
    return DocumentIndexReadiness(
        generation=generation,
        total_chunks=int(total_chunks or 0),
        embedded_chunks=int(embedded_chunks or 0),
    )


def claim_unembedded_document_chunks(
    *,
    session: Session,
    document_id: uuid.UUID,
    limit: int,
    index_generation: int | None = None,
) -> list[DocumentChunk]:
    """Lock one missing-embedding batch so concurrent repair workers do not duplicate work."""
    if limit < 1:
        raise ValueError("limit must be at least one.")

    statement = (
        select(DocumentChunk)
        .where(DocumentChunk.document_id == document_id)
        .where(DocumentChunk.embedding.is_(None))
    )
    if index_generation is None:
        statement = statement.join(Document, Document.id == DocumentChunk.document_id).where(
            DocumentChunk.index_generation == Document.active_index_generation
        )
    else:
        statement = statement.where(DocumentChunk.index_generation == index_generation)
    return session.exec(
        statement.order_by(DocumentChunk.order_index.asc())
        .limit(limit)
        .with_for_update(skip_locked=True)
    ).all()


def save_chunk_embeddings(
    *,
    session: Session,
    chunks: Sequence[DocumentChunk],
    embeddings: Sequence[Sequence[float]],
) -> None:
    if len(chunks) != len(embeddings):
        raise ValueError("Each document chunk must receive exactly one embedding.")

    for chunk, embedding in zip(chunks, embeddings, strict=True):
        chunk.embedding = list(embedding)
        session.add(chunk)

    # Each committed batch is a resumable checkpoint for long uploads.
    session.commit()


def search_similar_chunks(
    *,
    session: Session,
    document_id: uuid.UUID,
    query_embedding: Sequence[float],
    top_k: int = 5,
) -> list[DocumentChunk]:
    """Return the closest indexed chunks using pgvector cosine distance."""
    if top_k < 1:
        raise ValueError("top_k must be at least one.")

    return session.exec(
        select(DocumentChunk)
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(DocumentChunk.document_id == document_id)
        .where(DocumentChunk.index_generation == Document.active_index_generation)
        .where(DocumentChunk.embedding.is_not(None))
        .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
    ).all()


def search_owned_similar_chunks(
    *,
    session: Session,
    document_id: uuid.UUID,
    clerk_user_id: str,
    query_embedding: Sequence[float],
    top_k: int = 5,
    index_generation: int | None = None,
) -> list[tuple[DocumentChunk, float]]:
    """Return semantic chunks and their cosine distances only when their parent document belongs to the caller."""
    if top_k < 1:
        raise ValueError("top_k must be at least one.")

    distance_col = DocumentChunk.embedding.cosine_distance(query_embedding).label("distance")
    
    statement = (
        select(DocumentChunk, distance_col)
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(DocumentChunk.document_id == document_id)
        .where(Document.clerk_user_id == clerk_user_id)
        .where(DocumentChunk.embedding.is_not(None))
    )
    if index_generation is None:
        statement = statement.where(
            DocumentChunk.index_generation == Document.active_index_generation
        )
    else:
        statement = statement.where(DocumentChunk.index_generation == index_generation)
    
    return session.exec(
        statement.order_by(distance_col)
        .limit(top_k)
    ).all()


def claim_document_reindex(
    *,
    session: Session,
    document_id: uuid.UUID,
    lease_seconds: int,
    now: datetime | None = None,
) -> tuple[int, int, uuid.UUID]:
    """Claim a new generation or resume the same generation after a stale lease."""
    if lease_seconds < 1:
        raise ValueError("Reindex lease duration must be positive.")
    claimed_at = now or datetime.now(timezone.utc)
    try:
        document = session.exec(
            select(Document)
            .where(Document.id == document_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        ).first()
        if document is None:
            raise ValueError("Document not found.")
        if document.status != DocumentStatus.COMPLETED:
            raise ValueError("Only completed documents can be reindexed.")
        if not document.filename.lower().endswith(".pdf"):
            raise ValueError("Only PDF documents can be reindexed.")
        active_generation = document.active_index_generation
        legacy_chunk_id = session.exec(
            select(DocumentChunk.id)
            .where(DocumentChunk.document_id == document.id)
            .where(DocumentChunk.index_generation == active_generation)
            .where(DocumentChunk.page_number.is_(None))
            .limit(1)
        ).first()
        if legacy_chunk_id is None:
            raise ValueError("The active PDF index is already page-aware.")
        if document.pending_index_generation is not None:
            stale_before = claimed_at - timedelta(seconds=lease_seconds)
            if (
                document.pending_index_heartbeat_at is not None
                and document.pending_index_heartbeat_at > stale_before
            ):
                raise ValueError("Document reindexing is already in progress.")
            pending_generation = document.pending_index_generation
            document.pending_index_page_cursor = document.pending_index_page_cursor or 0
        else:
            pending_generation = active_generation + 1
            document.pending_index_generation = pending_generation
            document.pending_index_page_cursor = 0

        document.pending_index_started_at = claimed_at
        document.pending_index_heartbeat_at = claimed_at
        lease_token = uuid.uuid4()
        document.pending_index_lease_token = lease_token
        document.updated_at = claimed_at
        session.add(document)
        session.commit()
        return active_generation, pending_generation, lease_token
    except Exception:
        session.rollback()
        raise


def release_document_reindex_claim(
    *,
    session: Session,
    document_id: uuid.UUID,
    index_generation: int,
    lease_token: uuid.UUID,
    clean_staged: bool = False,
) -> None:
    """Release matching lease metadata and optionally remove its staged chunks."""
    try:
        document = session.exec(
            select(Document)
            .where(Document.id == document_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        ).first()
        if (
            document
            and document.pending_index_generation == index_generation
            and document.pending_index_lease_token == lease_token
        ):
            if clean_staged:
                session.exec(
                    delete(DocumentChunk)
                    .where(DocumentChunk.document_id == document_id)
                    .where(DocumentChunk.index_generation == index_generation)
                )
            document.pending_index_generation = None
            document.pending_index_started_at = None
            document.pending_index_heartbeat_at = None
            document.pending_index_lease_token = None
            document.pending_index_page_cursor = None
            document.updated_at = datetime.now(timezone.utc)
            session.add(document)
        session.commit()
    except Exception:
        session.rollback()
        raise


def renew_document_reindex_lease(
    *,
    session: Session,
    document_id: uuid.UUID,
    index_generation: int,
    lease_token: uuid.UUID,
) -> int:
    """Refresh the matching lease and return its last completed page cursor."""
    try:
        document = session.exec(
            select(Document)
            .where(Document.id == document_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        ).first()
        if (
            document is None
            or document.pending_index_generation != index_generation
            or document.pending_index_lease_token != lease_token
        ):
            raise ValueError("The pending document index generation changed.")
        document.pending_index_heartbeat_at = datetime.now(timezone.utc)
        document.updated_at = datetime.now(timezone.utc)
        cursor = document.pending_index_page_cursor or 0
        session.add(document)
        session.commit()
        return cursor
    except Exception:
        session.rollback()
        raise


def checkpoint_reindex_page(
    *,
    session: Session,
    document_id: uuid.UUID,
    index_generation: int,
    lease_token: uuid.UUID,
    page_number: int,
    page_count: int,
    chunks: Sequence[DocumentChunkPayload],
) -> list[DocumentChunk]:
    """Atomically persist one page (including empty pages) and advance the cursor."""
    if page_number < 1 or page_count < page_number:
        raise ValueError("Invalid reindex page checkpoint.")
    if any(chunk.page_number != page_number for chunk in chunks):
        raise ValueError("Every checkpoint chunk must belong to its page.")
    try:
        document = session.exec(
            select(Document)
            .where(Document.id == document_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        ).first()
        if (
            document is None
            or document.pending_index_generation != index_generation
            or document.pending_index_lease_token != lease_token
        ):
            raise ValueError("The pending document index generation changed.")
        cursor = document.pending_index_page_cursor or 0
        if page_number <= cursor:
            session.rollback()
            return []
        if page_number != cursor + 1:
            raise ValueError("Reindex pages must be checkpointed sequentially.")

        maximum_order = session.exec(
            select(func.max(DocumentChunk.order_index))
            .where(DocumentChunk.document_id == document_id)
            .where(DocumentChunk.index_generation == index_generation)
        ).one()
        next_order = int(maximum_order if maximum_order is not None else -1) + 1
        records = [
            DocumentChunk(
                document_id=document_id,
                index_generation=index_generation,
                order_index=next_order + offset,
                page_number=page_number,
                content=chunk.content,
            )
            for offset, chunk in enumerate(chunks)
        ]
        if records:
            session.add_all(records)
        checkpointed_at = datetime.now(timezone.utc)
        document.pending_index_page_cursor = page_number
        document.pending_index_heartbeat_at = checkpointed_at
        document.page_count = page_count
        document.updated_at = checkpointed_at
        session.add(document)
        session.commit()
        return records
    except Exception:
        session.rollback()
        raise


def checkpoint_active_index_page(
    *,
    session: Session,
    document_id: uuid.UUID,
    index_generation: int,
    page_number: int,
    page_count: int,
    chunks: Sequence[DocumentChunkPayload],
) -> list[DocumentChunk]:
    """Atomically persist one active-index page and advance its durable cursor."""
    if page_number < 1 or page_count < page_number:
        raise ValueError("Invalid active index page checkpoint.")
    if any(chunk.page_number != page_number for chunk in chunks):
        raise ValueError("Every checkpoint chunk must belong to its page.")
    try:
        document = session.exec(
            select(Document)
            .where(Document.id == document_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        ).first()
        if document is None or document.active_index_generation != index_generation:
            raise ValueError("The active document index generation changed.")
        cursor = document.active_index_page_cursor
        if page_number <= cursor:
            session.rollback()
            return []
        if page_number != cursor + 1:
            raise ValueError("Active index pages must be checkpointed sequentially.")

        maximum_order = session.exec(
            select(func.max(DocumentChunk.order_index))
            .where(DocumentChunk.document_id == document_id)
            .where(DocumentChunk.index_generation == index_generation)
        ).one()
        next_order = int(maximum_order if maximum_order is not None else -1) + 1
        records = [
            DocumentChunk(
                document_id=document_id,
                index_generation=index_generation,
                order_index=next_order + offset,
                page_number=page_number,
                content=chunk.content,
            )
            for offset, chunk in enumerate(chunks)
        ]
        if records:
            session.add_all(records)
        checkpointed_at = datetime.now(timezone.utc)
        document.active_index_page_cursor = page_number
        document.page_count = page_count
        document.updated_at = checkpointed_at
        session.add(document)
        session.commit()
        return records
    except Exception:
        session.rollback()
        raise


def save_reindex_chunk_embeddings(
    *,
    session: Session,
    document_id: uuid.UUID,
    index_generation: int,
    lease_token: uuid.UUID,
    chunks: Sequence[DocumentChunk],
    embeddings: Sequence[Sequence[float]],
) -> None:
    """Checkpoint one locked staged embedding batch and renew its lease."""
    if len(chunks) != len(embeddings):
        raise ValueError("Each document chunk must receive exactly one embedding.")
    if any(
        chunk.document_id != document_id
        or chunk.index_generation != index_generation
        for chunk in chunks
    ):
        raise ValueError("Reindex embedding batch belongs to another generation.")
    try:
        document = session.exec(
            select(Document)
            .where(Document.id == document_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        ).first()
        if (
            document is None
            or document.pending_index_generation != index_generation
            or document.pending_index_lease_token != lease_token
        ):
            raise ValueError("The pending document index generation changed.")
        for chunk, embedding in zip(chunks, embeddings, strict=True):
            chunk.embedding = list(embedding)
            session.add(chunk)
        heartbeat = datetime.now(timezone.utc)
        document.pending_index_heartbeat_at = heartbeat
        document.updated_at = heartbeat
        session.add(document)
        session.commit()
    except Exception:
        session.rollback()
        raise


def claim_reindex_embedding_batch(
    *,
    session: Session,
    document_id: uuid.UUID,
    index_generation: int,
    lease_token: uuid.UUID,
    limit: int,
) -> list[DocumentChunk]:
    """Claim staged chunks only while the caller still owns the reindex lease."""
    if limit < 1:
        raise ValueError("limit must be at least one.")
    try:
        document = session.exec(
            select(Document)
            .where(Document.id == document_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        ).first()
        if (
            document is None
            or document.pending_index_generation != index_generation
            or document.pending_index_lease_token != lease_token
        ):
            raise ValueError("The pending document index generation changed.")
        return session.exec(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .where(DocumentChunk.index_generation == index_generation)
            .where(DocumentChunk.embedding.is_(None))
            .order_by(DocumentChunk.order_index.asc())
            .limit(limit)
            .with_for_update(skip_locked=True)
        ).all()
    except Exception:
        session.rollback()
        raise


def activate_document_index_generation(
    *,
    session: Session,
    document_id: uuid.UUID,
    index_generation: int,
    lease_token: uuid.UUID,
) -> None:
    """Atomically activate a fully embedded, page-aware staged PDF index."""
    try:
        document = session.exec(
            select(Document)
            .where(Document.id == document_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        ).first()
        if (
            document is None
            or document.pending_index_generation != index_generation
            or document.pending_index_lease_token != lease_token
        ):
            raise ValueError("The pending document index generation changed.")

        total_chunks, embedded_chunks, page_aware_chunks = session.exec(
            select(
                func.count(DocumentChunk.id),
                func.count(DocumentChunk.id).filter(DocumentChunk.embedding.is_not(None)),
                func.count(DocumentChunk.id).filter(DocumentChunk.page_number.is_not(None)),
            )
            .where(DocumentChunk.document_id == document_id)
            .where(DocumentChunk.index_generation == index_generation)
        ).one()
        if (
            not total_chunks
            or total_chunks != embedded_chunks
            or total_chunks != page_aware_chunks
            or not document.page_count
            or document.pending_index_page_cursor != document.page_count
        ):
            raise ValueError("The pending document index is incomplete.")

        document.active_index_generation = index_generation
        document.active_index_page_cursor = int(document.pending_index_page_cursor)
        document.pending_index_generation = None
        document.pending_index_started_at = None
        document.pending_index_heartbeat_at = None
        document.pending_index_lease_token = None
        document.pending_index_page_cursor = None
        document.updated_at = datetime.now(timezone.utc)
        session.add(document)
        session.commit()
    except Exception:
        session.rollback()
        raise


def _cosine_similarity(left: Sequence[float], right: Sequence[float]) -> float:
    numerator = sum(left_value * right_value for left_value, right_value in zip(left, right, strict=True))
    left_magnitude = math.sqrt(sum(value * value for value in left))
    right_magnitude = math.sqrt(sum(value * value for value in right))
    if not left_magnitude or not right_magnitude:
        return -1.0
    return numerator / (left_magnitude * right_magnitude)


def build_semantic_chunk_clusters(
    chunks: Sequence[DocumentChunk],
    *,
    max_chunks_per_cluster: int,
) -> list[list[str]]:
    """Group embedded chunks around distributed semantic anchors for long-document synthesis."""
    if max_chunks_per_cluster < 1:
        raise ValueError("max_chunks_per_cluster must be at least one.")
    if not chunks:
        return []
    if any(chunk.embedding is None for chunk in chunks):
        raise ValueError("All chunks must be embedded before semantic clustering.")

    cluster_count = max(1, math.ceil(len(chunks) / max_chunks_per_cluster))
    anchor_indexes = {
        min(len(chunks) - 1, round(index * (len(chunks) - 1) / max(cluster_count - 1, 1)))
        for index in range(cluster_count)
    }
    anchors = [chunks[index] for index in sorted(anchor_indexes)]
    assignments: list[list[DocumentChunk]] = [[] for _ in anchors]

    for chunk in chunks:
        best_anchor_index = max(
            range(len(anchors)),
            key=lambda anchor_index: _cosine_similarity(
                chunk.embedding or [],
                anchors[anchor_index].embedding or [],
            ),
        )
        assignments[best_anchor_index].append(chunk)

    clusters: list[list[str]] = []
    for assignment in assignments:
        ordered_assignment = sorted(assignment, key=lambda chunk: chunk.order_index)
        for start in range(0, len(ordered_assignment), max_chunks_per_cluster):
            clusters.append(
                [chunk.content for chunk in ordered_assignment[start : start + max_chunks_per_cluster]]
            )

    return clusters


def save_quiz(
    *,
    session: Session,
    document_id: uuid.UUID,
    questions: list[DomainQuizQuestion],
) -> Quiz:
    try:
        quiz = session.exec(
            select(Quiz)
            .where(Quiz.document_id == document_id)
            .with_for_update()
        ).first()

        if quiz is not None:
            existing_question = session.exec(
                select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id)
            ).first()
            if existing_question is not None:
                raise ValueError(
                    "Stored quiz already contains questions and cannot be replaced."
                )
        else:
            quiz = Quiz(document_id=document_id)
            session.add(quiz)
            session.flush()

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
    except Exception:
        session.rollback()
        raise


def save_related_videos(
    *,
    session: Session,
    document_id: uuid.UUID,
    videos: list[dict],
    relevance_reason: str = "",
) -> list[RelatedVideo]:
    from models.tables import RelatedVideo
    records = []
    for video in videos:
        record = RelatedVideo(
            document_id=document_id,
            title=video["title"],
            channel_title=video["channel_title"],
            video_id=video["video_id"],
            url=video["url"],
            thumbnail_url=video["thumbnail_url"],
            description=video["description"],
            relevance_reason=relevance_reason,
            published_at=video.get("published_at", ""),
        )
        records.append(record)
    
    session.add_all(records)
    session.commit()
    return records
