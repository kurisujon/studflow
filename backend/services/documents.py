from __future__ import annotations

import json
import math
import uuid
from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import update
from sqlmodel import Session, select

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
