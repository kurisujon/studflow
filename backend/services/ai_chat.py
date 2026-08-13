from __future__ import annotations

import logging
import re
import uuid
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from core.config import settings
from core.database import engine
from models.tables import (
    AIConversation,
    AIMessage,
    AIMessageCitation,
    Document,
    DocumentStatus,
)
from schemas.ai_chat import (
    ChatAnswer,
    CitationResponse,
    ConversationResponse,
    MessageResponse,
)
from services.ai_service import (
    AIServiceError,
    answer_conversation_question,
    generate_query_embedding,
)
from services.documents import get_document_index_readiness, search_owned_similar_chunks


logger = logging.getLogger(__name__)

INSUFFICIENT_EVIDENCE_ANSWER = (
    "I don't have enough evidence in this document to answer that question."
)


class ConversationNotFoundError(Exception):
    """Raised when a conversation or document is absent or not owned by the caller."""


class DocumentNotReadyError(Exception):
    """Raised when a document cannot currently support document chat."""


class SearchIndexNotReadyError(Exception):
    """Raised when no embedded document chunks are available."""

    def __init__(self, *, document_id: uuid.UUID, repairable: bool) -> None:
        super().__init__("The document search index is not ready.")
        self.document_id = document_id
        self.repairable = repairable


class ConcurrentConversationUpdateError(Exception):
    """Raised when another turn changes a conversation during generation."""


@dataclass(frozen=True)
class RetrievedChatChunk:
    id: uuid.UUID
    document_id: uuid.UUID
    order_index: int
    content: str


def _open_session() -> Session:
    return Session(engine)


def _conversation_response(conversation: AIConversation) -> ConversationResponse:
    return ConversationResponse(
        id=conversation.id,
        document_id=conversation.document_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


def _get_owned_document(
    session: Session,
    *,
    document_id: uuid.UUID,
    clerk_user_id: str,
) -> Document:
    document = session.exec(
        select(Document)
        .where(Document.id == document_id)
        .where(Document.clerk_user_id == clerk_user_id)
    ).first()
    if document is None:
        raise ConversationNotFoundError
    return document


def get_owned_conversation(
    session: Session,
    *,
    conversation_id: uuid.UUID,
    clerk_user_id: str,
    for_update: bool = False,
) -> AIConversation:
    statement = (
        select(AIConversation)
        .where(AIConversation.id == conversation_id)
        .where(AIConversation.clerk_user_id == clerk_user_id)
    )
    if for_update:
        statement = statement.with_for_update()
    conversation = session.exec(statement).first()
    if conversation is None:
        raise ConversationNotFoundError
    return conversation


def create_conversation(
    session: Session,
    *,
    document_id: uuid.UUID,
    clerk_user_id: str,
    title: str | None,
) -> ConversationResponse:
    document = _get_owned_document(
        session,
        document_id=document_id,
        clerk_user_id=clerk_user_id,
    )
    if document.status != DocumentStatus.COMPLETED:
        raise DocumentNotReadyError

    default_title = document.filename.rsplit(".", 1)[0].strip() or "Study conversation"
    now = datetime.utcnow()
    conversation = AIConversation(
        clerk_user_id=clerk_user_id,
        document_id=document.id,
        title=(title or default_title)[:160],
        created_at=now,
        updated_at=now,
    )
    try:
        session.add(conversation)
        session.commit()
        session.refresh(conversation)
    except Exception:
        session.rollback()
        raise
    return _conversation_response(conversation)


def list_conversations(
    session: Session,
    *,
    clerk_user_id: str,
    document_id: uuid.UUID | None,
) -> list[ConversationResponse]:
    if document_id is not None:
        _get_owned_document(
            session,
            document_id=document_id,
            clerk_user_id=clerk_user_id,
        )
    statement = select(AIConversation).where(
        AIConversation.clerk_user_id == clerk_user_id
    )
    if document_id is not None:
        statement = statement.where(AIConversation.document_id == document_id)
    conversations = session.exec(
        statement.order_by(AIConversation.updated_at.desc(), AIConversation.id.desc())
    ).all()
    return [_conversation_response(item) for item in conversations]


def update_conversation_title(
    session: Session,
    *,
    conversation_id: uuid.UUID,
    clerk_user_id: str,
    title: str,
) -> ConversationResponse:
    conversation = get_owned_conversation(
        session,
        conversation_id=conversation_id,
        clerk_user_id=clerk_user_id,
        for_update=True,
    )
    conversation.title = title
    conversation.updated_at = datetime.utcnow()
    try:
        session.add(conversation)
        session.commit()
        session.refresh(conversation)
    except Exception:
        session.rollback()
        raise
    return _conversation_response(conversation)


def delete_conversation(
    session: Session,
    *,
    conversation_id: uuid.UUID,
    clerk_user_id: str,
) -> None:
    conversation = get_owned_conversation(
        session,
        conversation_id=conversation_id,
        clerk_user_id=clerk_user_id,
        for_update=True,
    )
    try:
        session.delete(conversation)
        session.commit()
    except Exception:
        session.rollback()
        raise


def _citation_response(citation: AIMessageCitation) -> CitationResponse:
    return CitationResponse(
        index=citation.citation_index,
        source_type=citation.source_type,
        title=citation.title,
        url=citation.url,
        document_id=citation.document_id,
        chunk_id=citation.chunk_id,
        page_number=citation.page_number,
        excerpt=citation.excerpt,
    )


def list_messages(
    session: Session,
    *,
    conversation_id: uuid.UUID,
    clerk_user_id: str,
    limit: int,
    before_sequence: int | None,
) -> tuple[ConversationResponse, list[MessageResponse], int | None]:
    conversation = get_owned_conversation(
        session,
        conversation_id=conversation_id,
        clerk_user_id=clerk_user_id,
    )
    statement = select(AIMessage).where(
        AIMessage.conversation_id == conversation.id
    )
    if before_sequence is not None:
        statement = statement.where(AIMessage.sequence_number < before_sequence)
    newest_first = session.exec(
        statement.order_by(AIMessage.sequence_number.desc()).limit(limit + 1)
    ).all()
    has_more = len(newest_first) > limit
    page = list(reversed(newest_first[:limit]))

    citations_by_message: dict[uuid.UUID, list[AIMessageCitation]] = {
        message.id: [] for message in page
    }
    if page:
        citations = session.exec(
            select(AIMessageCitation)
            .where(AIMessageCitation.message_id.in_([message.id for message in page]))
            .order_by(
                AIMessageCitation.message_id.asc(),
                AIMessageCitation.citation_index.asc(),
            )
        ).all()
        for citation in citations:
            citations_by_message.setdefault(citation.message_id, []).append(citation)

    messages = [
        MessageResponse(
            id=message.id,
            conversation_id=message.conversation_id,
            sequence_number=message.sequence_number,
            role=message.role,
            content=message.content,
            selected_text=message.selected_text,
            retrieval_mode=message.retrieval_mode,
            suggested_followups=list(message.suggested_followups or []),
            citations=[
                _citation_response(citation)
                for citation in citations_by_message.get(message.id, [])
            ],
            created_at=message.created_at,
        )
        for message in page
    ]
    next_before = page[0].sequence_number if has_more and page else None
    return _conversation_response(conversation), messages, next_before


def _bounded_history(messages: list[AIMessage]) -> list[tuple[str, str]]:
    remaining_characters = 16_000
    selected: list[tuple[str, str]] = []
    for message in messages:
        if remaining_characters <= 0:
            break
        context_prefix = (
            f"Selected context: {message.selected_text}\n"
            if message.role == "user" and message.selected_text
            else ""
        )
        content = f"{context_prefix}{message.content}"[:remaining_characters]
        selected.append((message.role, content))
        remaining_characters -= len(content)
    return list(reversed(selected))


def _sanitize_markers(answer: str, valid_indexes: set[int]) -> tuple[str, set[int]]:
    referenced: set[int] = set()

    def replace_marker(match: re.Match[str]) -> str:
        index = int(match.group(1))
        if index in valid_indexes:
            referenced.add(index)
            return match.group(0)
        return ""

    return re.sub(r"\[(\d+)\]", replace_marker, answer), referenced


def send_conversation_message(
    *,
    conversation_id: uuid.UUID,
    clerk_user_id: str,
    question: str,
    selected_text: str | None = None,
) -> ChatAnswer:
    with _open_session() as session:
        conversation = get_owned_conversation(
            session,
            conversation_id=conversation_id,
            clerk_user_id=clerk_user_id,
        )
        if conversation.document_id is None:
            raise DocumentNotReadyError
        document = _get_owned_document(
            session,
            document_id=conversation.document_id,
            clerk_user_id=clerk_user_id,
        )
        if document.status != DocumentStatus.COMPLETED:
            raise DocumentNotReadyError
        index_readiness = get_document_index_readiness(
            session=session,
            document_id=document.id,
        )
        if not index_readiness.is_ready:
            raise SearchIndexNotReadyError(
                document_id=document.id,
                repairable=index_readiness.is_repairable,
            )
        recent_messages = session.exec(
            select(AIMessage)
            .where(AIMessage.conversation_id == conversation.id)
            .order_by(AIMessage.sequence_number.desc())
            .limit(12)
        ).all()
        history = _bounded_history(recent_messages)
        snapshot_updated_at = conversation.updated_at
        document_id = document.id
        document_title = document.filename

    retrieval_query = (
        f"{question}\n\nSelected context:\n{selected_text}"
        if selected_text
        else question
    )
    query_embedding = generate_query_embedding(retrieval_query)

    with _open_session() as session:
        conversation = get_owned_conversation(
            session,
            conversation_id=conversation_id,
            clerk_user_id=clerk_user_id,
        )
        if conversation.document_id != document_id:
            raise ConcurrentConversationUpdateError
        chunks = search_owned_similar_chunks(
            session=session,
            document_id=document_id,
            clerk_user_id=clerk_user_id,
            query_embedding=query_embedding,
            top_k=settings.rag_top_k,
        )
        retrieved_chunks = [
            RetrievedChatChunk(
                id=chunk.id,
                document_id=chunk.document_id,
                order_index=chunk.order_index,
                content=chunk.content,
            )
            for chunk in chunks
        ]

    if not retrieved_chunks:
        raise SearchIndexNotReadyError(document_id=document_id, repairable=False)

    source_registry = {
        index: chunk for index, chunk in enumerate(retrieved_chunks, start=1)
    }
    generated = answer_conversation_question(
        sources=[
            (index, chunk.content) for index, chunk in source_registry.items()
        ],
        user_question=question,
        conversation_history=history,
        selected_text=selected_text,
    )
    valid_indexes = set(source_registry)
    inline_marker_count = len(re.findall(r"\[(\d+)\]", generated.answer_markdown))
    answer_markdown, marker_indexes = _sanitize_markers(
        generated.answer_markdown.strip(),
        valid_indexes,
    )
    structured_indexes = set(generated.cited_source_indexes)
    if any(index not in valid_indexes for index in structured_indexes):
        raise AIServiceError("Gemini returned an invalid document citation.")

    if not generated.evidence_sufficient:
        if structured_indexes or inline_marker_count:
            logger.warning(
                "Discarding citations from insufficient-evidence conversation answer: "
                "conversation_id=%s structured_citation_count=%d inline_citation_count=%d",
                conversation_id,
                len(structured_indexes),
                inline_marker_count,
            )
        answer_markdown = INSUFFICIENT_EVIDENCE_ANSWER
        cited_indexes: set[int] = set()
        effective_followups: list[str] = []
    else:
        if not answer_markdown.strip():
            raise AIServiceError("Gemini returned an empty answer after citation validation.")
        cited_indexes = structured_indexes | marker_indexes
        if not cited_indexes:
            raise AIServiceError("Gemini returned a grounded answer without a valid citation.")
        effective_followups = generated.suggested_followups

    citation_payloads = [
        CitationResponse(
            index=index,
            source_type="document",
            title=document_title,
            url=None,
            document_id=document_id,
            chunk_id=source_registry[index].id,
            page_number=None,
            excerpt=source_registry[index].content.strip()[:500] or None,
        )
        for index in sorted(cited_indexes)
    ]

    with _open_session() as session:
        conversation = get_owned_conversation(
            session,
            conversation_id=conversation_id,
            clerk_user_id=clerk_user_id,
            for_update=True,
        )
        if conversation.document_id != document_id:
            raise ConcurrentConversationUpdateError
        if conversation.updated_at != snapshot_updated_at:
            raise ConcurrentConversationUpdateError
        document = _get_owned_document(
            session,
            document_id=document_id,
            clerk_user_id=clerk_user_id,
        )
        if document.status != DocumentStatus.COMPLETED:
            raise DocumentNotReadyError

        maximum_sequence = session.exec(
            select(func.max(AIMessage.sequence_number)).where(
                AIMessage.conversation_id == conversation.id
            )
        ).one()
        next_sequence = int(maximum_sequence or 0) + 1
        now = datetime.utcnow()
        user_message = AIMessage(
            conversation_id=conversation.id,
            sequence_number=next_sequence,
            role="user",
            content=question,
            selected_text=selected_text,
            retrieval_mode="document",
            suggested_followups=[],
            created_at=now,
        )
        assistant_message = AIMessage(
            conversation_id=conversation.id,
            sequence_number=next_sequence + 1,
            role="assistant",
            content=answer_markdown,
            retrieval_mode="document",
            suggested_followups=effective_followups,
            created_at=now,
        )
        try:
            session.add(user_message)
            session.add(assistant_message)
            session.flush()
            for citation in citation_payloads:
                session.add(
                    AIMessageCitation(
                        message_id=assistant_message.id,
                        citation_index=citation.index,
                        source_type=citation.source_type,
                        title=citation.title,
                        url=citation.url,
                        document_id=citation.document_id,
                        chunk_id=citation.chunk_id,
                        page_number=citation.page_number,
                        excerpt=citation.excerpt,
                    )
                )
            conversation.updated_at = datetime.utcnow()
            session.add(conversation)
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            raise ConcurrentConversationUpdateError from exc
        except Exception:
            session.rollback()
            raise

    return ChatAnswer(
        conversation_id=conversation_id,
        message_id=assistant_message.id,
        answer_markdown=answer_markdown,
        citations=citation_payloads,
        suggested_followups=effective_followups,
    )
