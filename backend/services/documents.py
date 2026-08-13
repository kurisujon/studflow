from __future__ import annotations

import json
import math
import uuid
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import func, update
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
from services.ai_service import ComprehensiveSummary, FlashcardPayload, QuizQuestionPayload


@dataclass(frozen=True)
class DocumentIndexReadiness:
    total_chunks: int
    embedded_chunks: int

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
    document.updated_at = datetime.utcnow()

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
                updated_at=datetime.utcnow(),
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


def get_document_chunks(
    *,
    session: Session,
    document_id: uuid.UUID,
) -> list[DocumentChunk]:
    return session.exec(
        select(DocumentChunk)
        .where(DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.order_index.asc())
    ).all()


def get_unembedded_document_chunks(
    *,
    session: Session,
    document_id: uuid.UUID,
) -> list[DocumentChunk]:
    return session.exec(
        select(DocumentChunk)
        .where(DocumentChunk.document_id == document_id)
        .where(DocumentChunk.embedding.is_(None))
        .order_by(DocumentChunk.order_index.asc())
    ).all()


def get_document_index_readiness(
    *,
    session: Session,
    document_id: uuid.UUID,
) -> DocumentIndexReadiness:
    """Return complete index counts; partial indexes are never chat-ready."""
    total_chunks, embedded_chunks = session.exec(
        select(
            func.count(DocumentChunk.id),
            func.count(DocumentChunk.id).filter(DocumentChunk.embedding.is_not(None)),
        ).where(DocumentChunk.document_id == document_id)
    ).one()
    return DocumentIndexReadiness(
        total_chunks=int(total_chunks or 0),
        embedded_chunks=int(embedded_chunks or 0),
    )


def claim_unembedded_document_chunks(
    *,
    session: Session,
    document_id: uuid.UUID,
    limit: int,
) -> list[DocumentChunk]:
    """Lock one missing-embedding batch so concurrent repair workers do not duplicate work."""
    if limit < 1:
        raise ValueError("limit must be at least one.")

    return session.exec(
        select(DocumentChunk)
        .where(DocumentChunk.document_id == document_id)
        .where(DocumentChunk.embedding.is_(None))
        .order_by(DocumentChunk.order_index.asc())
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
        .where(DocumentChunk.document_id == document_id)
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
) -> list[DocumentChunk]:
    """Return semantic chunks only when their parent document belongs to the caller."""
    if top_k < 1:
        raise ValueError("top_k must be at least one.")

    return session.exec(
        select(DocumentChunk)
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(DocumentChunk.document_id == document_id)
        .where(Document.clerk_user_id == clerk_user_id)
        .where(DocumentChunk.embedding.is_not(None))
        .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
    ).all()


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
    questions: list[QuizQuestionPayload],
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
