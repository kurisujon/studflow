from __future__ import annotations

import logging
import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from core.database import commit_and_reassert_rls, tenant_session

from core.config import settings
from models.tables import (
    AIConversation,
    AIMessage,
    AIMessageCitation,
    Document,
    DocumentStatus,
)
from schemas.ai_chat import (
    ChatAnswer,
    ChatAnswerStatus,
    CitationResponse,
    ConversationResponse,
    MessageResponse,
    RetrievalMode,
)
from services.ai_service import (
    AIServiceError,
    answer_conversation_question,
    evaluate_citations,
    generate_query_embedding,
)
from services.domain_validation import (
    apply_semantic_validation,
    question_requires_document_evidence,
    validate_conversation_answer,
)
from services.documents import get_document_index_readiness, search_owned_similar_chunks
from services.retrieval_quality import evaluate_retrieval_quality


logger = logging.getLogger(__name__)

INSUFFICIENT_EVIDENCE_ANSWER = (
    "I don't have enough evidence in this document to answer that question."
)
MIXED_SOURCE_UNVERIFIED_NOTICE = (
    "I couldn't verify the source-specific part from the retrieved document evidence."
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


class UnsupportedRetrievalModeError(Exception):
    """Raised before generation when an unavailable retrieval mode is requested."""


@dataclass(frozen=True)
class RetrievedChatChunk:
    id: uuid.UUID
    document_id: uuid.UUID
    order_index: int
    content: str
    page_number: int | None
    index_generation: int


def _open_session(clerk_user_id: str) -> Session:
    return tenant_session(clerk_user_id)


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
    for_update: bool = False,
) -> Document:
    statement = (
        select(Document)
        .where(Document.id == document_id)
        .where(Document.clerk_user_id == clerk_user_id)
    )
    if for_update:
        statement = statement.with_for_update().execution_options(
            populate_existing=True
        )
    document = session.exec(statement).first()
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
    now = datetime.now(timezone.utc)
    conversation = AIConversation(
        clerk_user_id=clerk_user_id,
        document_id=document.id,
        title=(title or default_title)[:160],
        created_at=now,
        updated_at=now,
    )
    try:
        session.add(conversation)
        commit_and_reassert_rls(session, clerk_user_id)
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
    conversation.updated_at = datetime.now(timezone.utc)
    try:
        session.add(conversation)
        commit_and_reassert_rls(session, clerk_user_id)
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
        commit_and_reassert_rls(session, clerk_user_id)
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
            status=ChatAnswerStatus(message.status),
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
        content = message.content[:remaining_characters]
        selected.append((message.role, content))
        remaining_characters -= len(content)
    return list(reversed(selected))


def _recent_selected_context(messages: list[AIMessage]) -> str | None:
    """Return a selection only when it belongs to the latest user turn."""
    for message in messages:
        if message.role != "user":
            continue
        if message.selected_text and message.selected_text.strip():
            return message.selected_text.strip()
        return None
    return None


_TEACHING_CONTEXT_STOPWORDS = {
    "about", "after", "also", "and", "answer", "are", "assistant", "before", "contains",
    "context", "document", "figure", "following", "highlighted", "ignore",
    "describes", "had", "has", "how", "instruction", "instructions", "material", "of", "out", "output", "passage", "previous",
    "prompt", "provided", "report", "reported", "reports", "respond", "response", "selected",
    "source", "study", "system", "table", "text", "the", "this", "uploaded", "using",
    "value", "values", "was", "were", "with", "would",
}


def _teaching_topic_keywords(context: str | None) -> str | None:
    """Reduce source text to a bounded, non-propositional concept cue."""
    if not context:
        return None
    keywords: list[str] = []
    for token in re.findall(r"[A-Za-z][A-Za-z-]{2,}", context):
        normalized = token.lower()
        if normalized in _TEACHING_CONTEXT_STOPWORDS or normalized in keywords:
            continue
        keywords.append(normalized)
        if len(keywords) == 12:
            break
    return "Topic keywords: " + ", ".join(keywords) if keywords else None


from schemas.domain import (
    ClaimProvenance,
    ConversationAnswerMode,
    ConversationGenerationPath,
    ConversationRequestScope,
    SemanticallyValidatedClaim,
)


_EXPLICIT_DOCUMENT_ONLY_PATTERNS = (
    re.compile(r"\b(?:only|strictly)\s+(?:use|using|from|based on)\s+(?:this|the|my)\s+(?:uploaded\s+)?(?:document|material|source|upload)", re.IGNORECASE),
    re.compile(r"\b(?:use|using|answer from)\s+only\s+(?:this|the|my)\s+(?:uploaded\s+)?(?:document|material|source|upload)", re.IGNORECASE),
    re.compile(r"\bdo not use\s+(?:anything|information|knowledge)\s+(?:outside|beyond)\s+(?:this|the|my)\s+(?:document|material|source|upload)", re.IGNORECASE),
    re.compile(r"\b(?:use|using)\s+(?:only|solely|exclusively)\s+(?:this|the|my)?\s*(?:uploaded\s+)?(?:document|material|source|upload|paper)", re.IGNORECASE),
    re.compile(r"\bdo not use\s+(?:any\s+)?(?:outside|external)\s+(?:knowledge|information|sources?)\b", re.IGNORECASE),
    re.compile(r"\buse\s+no\s+(?:outside|external)\s+(?:knowledge|information|sources?)\b", re.IGNORECASE),
    re.compile(r"\banswer\s+only\s+with\s+information\s+(?:contained\s+)?in\s+(?:this|the|my)\s+(?:file|document|paper|upload)\b", re.IGNORECASE),
    re.compile(r"\brestrict\s+(?:the\s+)?answer\s+to\s+(?:this|the|my)\s+(?:file|document|paper|upload|source|material)\b", re.IGNORECASE),
)
_REFERENTIAL_FOLLOWUP = re.compile(
    r"^(?:and\s+)?what about\b|"
    r"\b(?:it|they|them|that|this|those|these|the method|the value)\b|"
    r"^(?:why|how|how so|when|where)\s*[?.!]*$|"
    r"^(?:please\s+)?(?:explain|elaborate|continue)(?:\s+(?:further|more))?\s*[?.!]*$|"
    r"^can you\s+(?:explain|elaborate|continue)(?:\s+(?:further|more))?\s*[?.!]*$",
    re.IGNORECASE,
)
_GENERAL_SCOPE_PATTERN = re.compile(
    r"\b(?:in general|generally|using general knowledge|as a general concept)\b",
    re.IGNORECASE,
)
_TEACHING_REQUEST_PATTERN = re.compile(
    r"\b(?:and|also)\s+(?:explain|teach|show|give|provide|compare)|"
    r"\b(?:give|provide|show)\s+(?:me\s+)?(?:an?|another)\s+(?:worked|practical|hypothetical)?\s*example\b|"
    r"\b(?:worked|practical|hypothetical)\s+example\b|\b(?:in general|generally)\b",
    re.IGNORECASE,
)


def _is_explicit_document_only(question: str) -> bool:
    return any(pattern.search(question) for pattern in _EXPLICIT_DOCUMENT_ONLY_PATTERNS)


def _is_source_specific(question: str) -> bool:
    return question_requires_document_evidence(question)


def _request_scope(
    question: str,
    history: list[tuple[str, str]],
) -> ConversationRequestScope:
    if _is_explicit_document_only(question):
        return ConversationRequestScope.DOCUMENT_ONLY
    source_specific = _is_source_specific(question)
    if source_specific and _TEACHING_REQUEST_PATTERN.search(question):
        return ConversationRequestScope.MIXED
    if source_specific:
        return ConversationRequestScope.SOURCE_SPECIFIC
    if _GENERAL_SCOPE_PATTERN.search(question):
        return ConversationRequestScope.HYBRID
    if not _REFERENTIAL_FOLLOWUP.search(question.strip()):
        return ConversationRequestScope.HYBRID
    if _TEACHING_REQUEST_PATTERN.search(question):
        return ConversationRequestScope.HYBRID
    previous_user_question = next(
        (content for role, content in reversed(history) if role == "user"),
        None,
    )
    if previous_user_question and _is_explicit_document_only(previous_user_question):
        return ConversationRequestScope.DOCUMENT_ONLY
    if previous_user_question and _is_source_specific(previous_user_question):
        return ConversationRequestScope.SOURCE_SPECIFIC
    return ConversationRequestScope.HYBRID


def _is_document_only_turn(
    question: str,
    history: list[tuple[str, str]],
) -> bool:
    return _request_scope(question, history) == ConversationRequestScope.DOCUMENT_ONLY


def _retrieval_query(
    question: str,
    selected_text: str | None,
    history: list[tuple[str, str]],
    prior_selected_text: str | None = None,
) -> str:
    parts = [question.strip()]
    if selected_text:
        parts.append(f"Selected context:\n{selected_text.strip()}")
    if _REFERENTIAL_FOLLOWUP.search(question.strip()):
        if not selected_text and prior_selected_text:
            parts.append(f"Prior selected context:\n{prior_selected_text.strip()}")
        recent_user_questions = [
            (
                content.strip()
                if len(content.strip()) <= 2_000
                else f"{content.strip()[:1_000]}\n…\n{content.strip()[-1_000:]}"
            )
            for role, content in history
            if role == "user" and content.strip()
        ][-2:]
        if recent_user_questions:
            parts.append("Recent student context:\n" + "\n".join(recent_user_questions))
    return "\n\n".join(parts)


def _render_grounded_answer(claims: list[SemanticallyValidatedClaim]) -> tuple[str, set[str]]:
    """Deterministically render grounded claims to a Markdown string with inline citation markers."""
    paragraphs = []
    cited_eids = set()

    for claim in claims:
        marker_numbers = []
        for citation in claim.citations:
            if citation.support_level == 'UNSUPPORTED':
                continue
            eid = citation.evidence_id
            cited_eids.add(eid)
            try:
                num = int(eid.replace("e_", ""))
                marker_numbers.append(num)
            except ValueError:
                pass

        # Sort the markers for a clean UI like [1][2]
        marker_numbers.sort()
        markers_str = "".join([f"[{num}]" for num in marker_numbers])

        # Space out the markers from the text if it doesn't end in space
        if markers_str and claim.claim_text and not claim.claim_text.endswith(" "):
            paragraphs.append(f"{claim.claim_text} {markers_str}")
        else:
            paragraphs.append(f"{claim.claim_text}{markers_str}")

    return "\n\n".join(paragraphs), cited_eids


def _render_hybrid_answer(
    claims: list[SemanticallyValidatedClaim],
) -> tuple[str, set[str]]:
    """Render validated claims while making non-document teaching explicit."""
    paragraphs: list[str] = []
    cited_eids: set[str] = set()
    introduced_general = False
    introduced_example = False

    for claim in claims:
        if claim.provenance == ClaimProvenance.DOCUMENT:
            rendered, claim_eids = _render_grounded_answer([claim])
            if rendered:
                paragraphs.append(rendered)
                cited_eids.update(claim_eids)
            continue

        if claim.provenance == ClaimProvenance.GENERAL:
            if not introduced_general:
                paragraphs.append("**General explanation**")
                introduced_general = True
            paragraphs.append(claim.claim_text)
            continue

        if not introduced_example:
            paragraphs.append("**Illustrative example**")
            introduced_example = True
        paragraphs.append(claim.claim_text)

    return "\n\n".join(paragraphs), cited_eids


def _generate_validated_path(
    *,
    generation_path: ConversationGenerationPath,
    source_registry: dict[str, RetrievedChatChunk],
    question: str,
    history: list[tuple[str, str]],
    selected_text: str | None,
    teaching_context: str | None,
):
    path_sources = (
        [(eid, chunk.content) for eid, chunk in source_registry.items()]
        if generation_path == ConversationGenerationPath.STRICT_DOCUMENT
        else []
    )
    path_history = (
        history
        if generation_path == ConversationGenerationPath.STRICT_DOCUMENT
        else [(role, content) for role, content in history if role == "user"]
    )
    path_context = (
        selected_text
        if generation_path == ConversationGenerationPath.STRICT_DOCUMENT
        else teaching_context if generation_path == ConversationGenerationPath.TEACHING else None
    )
    raw_generated = answer_conversation_question(
        sources=path_sources,
        user_question=question,
        conversation_history=path_history,
        selected_text=path_context,
        generation_path=generation_path.value,
    )
    try:
        generated = validate_conversation_answer(
            raw_generated,
            set(source_registry) if generation_path == ConversationGenerationPath.STRICT_DOCUMENT else set(),
            generation_path=generation_path,
        )
    except ValueError as exc:
        raise AIServiceError(str(exc)) from exc

    if generation_path == ConversationGenerationPath.STRICT_DOCUMENT:
        generated = generated.model_copy(update={"suggested_followups": []})

    if generation_path == ConversationGenerationPath.STRICT_DOCUMENT and generated.evidence_sufficient:
        evaluations = evaluate_citations([
            (claim.claim_text, eid, source_registry[eid].content)
            for claim in generated.claims
            for eid in claim.cited_evidence_ids
        ])
        generated = apply_semantic_validation(generated, evaluations)
    else:
        generated = apply_semantic_validation(generated, [])

    from services.domain_validation import filter_unsupported_claims
    return filter_unsupported_claims(generated)


def send_conversation_message(
    *,
    conversation_id: uuid.UUID,
    clerk_user_id: str,
    question: str,
    selected_text: str | None = None,
    retrieval_mode: RetrievalMode = "document",
) -> ChatAnswer:
    if retrieval_mode != "document":
        raise UnsupportedRetrievalModeError

    with _open_session(clerk_user_id) as session:
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
            index_generation=document.active_index_generation,
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
        prior_selected_text = _recent_selected_context(recent_messages)
        snapshot_updated_at = conversation.updated_at
        document_id = document.id
        document_title = document.filename
        index_generation = document.active_index_generation

    request_scope = _request_scope(question, history)
    document_only = request_scope == ConversationRequestScope.DOCUMENT_ONLY
    retrieval_query = _retrieval_query(
        question,
        selected_text,
        history,
        prior_selected_text,
    )
    teaching_context = _teaching_topic_keywords(
        selected_text
        or (
            prior_selected_text
            if _REFERENTIAL_FOLLOWUP.search(question.strip())
            else None
        )
    )
    query_embedding = generate_query_embedding(retrieval_query)

    with _open_session(clerk_user_id) as session:
        conversation = get_owned_conversation(
            session,
            conversation_id=conversation_id,
            clerk_user_id=clerk_user_id,
        )
        if conversation.document_id != document_id:
            raise ConcurrentConversationUpdateError
        document = _get_owned_document(
            session,
            document_id=document_id,
            clerk_user_id=clerk_user_id,
        )
        if document.active_index_generation != index_generation:
            raise ConcurrentConversationUpdateError
        chunks = search_owned_similar_chunks(
            session=session,
            document_id=document_id,
            clerk_user_id=clerk_user_id,
            query_embedding=query_embedding,
            top_k=settings.rag_top_k,
            index_generation=index_generation,
        )
        evidence_set = evaluate_retrieval_quality(
            chunks,
            threshold=settings.retrieval_min_score_threshold
        )

        # We still need the original retrieved_chunks format for now
        # but in a real B4/B5 we'd branch here if not evidence_set.quality.threshold_passed
        retrieved_chunks = [
            RetrievedChatChunk(
                id=chunk.id,
                document_id=chunk.document_id,
                order_index=chunk.order_index,
                content=chunk.content,
                page_number=chunk.page_number,
                index_generation=chunk.index_generation,
            )
            for chunk, distance in chunks
        ]

    retrieval_passed = bool(
        evidence_set.evidence and evidence_set.quality.threshold_passed
    )

    requires_source = request_scope in {
        ConversationRequestScope.DOCUMENT_ONLY,
        ConversationRequestScope.SOURCE_SPECIFIC,
        ConversationRequestScope.MIXED,
    }
    mixed_source_unverified = False

    # Phase B5 remains the deterministic fast path for explicit source-only turns.
    if document_only and not retrieval_passed:
        answer_markdown = INSUFFICIENT_EVIDENCE_ANSWER
        cited_eids: set[str] = set()
        effective_followups: list[str] = []
        message_status = ChatAnswerStatus.INSUFFICIENT_EVIDENCE
        source_registry = {}
    else:
        source_registry: dict[str, RetrievedChatChunk] = (
            {
                f"e_{index:02d}": chunk
                for index, chunk in enumerate(retrieved_chunks, start=1)
            }
            if retrieval_passed
            else {}
        )
        if request_scope == ConversationRequestScope.MIXED and not retrieval_passed:
            mixed_source_unverified = True
            paths = [ConversationGenerationPath.TEACHING]
        elif requires_source and not retrieval_passed:
            paths = [ConversationGenerationPath.CLARIFICATION]
        elif request_scope == ConversationRequestScope.MIXED:
            paths = [
                ConversationGenerationPath.STRICT_DOCUMENT,
                ConversationGenerationPath.TEACHING,
            ]
        elif requires_source:
            paths = [ConversationGenerationPath.STRICT_DOCUMENT]
        else:
            paths = [ConversationGenerationPath.TEACHING]

        path_results = [
            _generate_validated_path(
                generation_path=path,
                source_registry=source_registry,
                question=question,
                history=history,
                selected_text=selected_text,
                teaching_context=teaching_context,
            )
            for path in paths
        ]

        if (
            request_scope == ConversationRequestScope.SOURCE_SPECIFIC
            and paths == [ConversationGenerationPath.STRICT_DOCUMENT]
            and path_results[0][1] == ChatAnswerStatus.INSUFFICIENT_EVIDENCE
        ):
            paths = [ConversationGenerationPath.CLARIFICATION]
            path_results = [
                _generate_validated_path(
                    generation_path=ConversationGenerationPath.CLARIFICATION,
                    source_registry=source_registry,
                    question=question,
                    history=history,
                    selected_text=selected_text,
                    teaching_context=teaching_context,
                )
            ]

        if len(path_results) == 2:
            strict_answer, strict_status = path_results[0]
            teaching_answer, teaching_status = path_results[1]
            if strict_status == ChatAnswerStatus.INSUFFICIENT_EVIDENCE:
                mixed_source_unverified = True
                generated = teaching_answer.model_copy(update={
                    "answer_mode": ConversationAnswerMode.MIXED,
                    "generation_path": ConversationGenerationPath.COMPOSITE,
                    "suggested_followups": [],
                })
                b6_status = ChatAnswerStatus.PARTIALLY_ANSWERED
            else:
                generated = strict_answer.model_copy(update={
                    "claims": [*strict_answer.claims, *teaching_answer.claims],
                    "answer_mode": ConversationAnswerMode.MIXED,
                    "generation_path": ConversationGenerationPath.COMPOSITE,
                    "suggested_followups": teaching_answer.suggested_followups,
                })
                b6_status = (
                    ChatAnswerStatus.ANSWERED
                    if strict_status == teaching_status == ChatAnswerStatus.ANSWERED
                    else ChatAnswerStatus.PARTIALLY_ANSWERED
                )
                if b6_status != ChatAnswerStatus.ANSWERED:
                    generated = generated.model_copy(update={"suggested_followups": []})
        else:
            generated, b6_status = path_results[0]
            if mixed_source_unverified:
                generated = generated.model_copy(update={
                    "answer_mode": ConversationAnswerMode.MIXED,
                    "generation_path": ConversationGenerationPath.COMPOSITE,
                    "suggested_followups": [],
                })
                b6_status = ChatAnswerStatus.PARTIALLY_ANSWERED

        if b6_status == ChatAnswerStatus.INSUFFICIENT_EVIDENCE:
            answer_markdown = INSUFFICIENT_EVIDENCE_ANSWER
            cited_eids = set()
            effective_followups = []
            message_status = ChatAnswerStatus.INSUFFICIENT_EVIDENCE
        elif generated.answer_mode == ConversationAnswerMode.CLARIFICATION:
            answer_markdown = generated.clarification_question or INSUFFICIENT_EVIDENCE_ANSWER
            cited_eids = set()
            effective_followups = []
            message_status = ChatAnswerStatus.PARTIALLY_ANSWERED
        else:
            if paths == [ConversationGenerationPath.STRICT_DOCUMENT]:
                answer_markdown, cited_eids = _render_grounded_answer(generated.claims)
            else:
                answer_markdown, cited_eids = _render_hybrid_answer(generated.claims)
            if not answer_markdown.strip():
                answer_markdown = INSUFFICIENT_EVIDENCE_ANSWER
                cited_eids = set()
                effective_followups = []
                message_status = ChatAnswerStatus.INSUFFICIENT_EVIDENCE
            else:
                effective_followups = generated.suggested_followups
                message_status = b6_status
                if mixed_source_unverified:
                    answer_markdown = (
                        f"{MIXED_SOURCE_UNVERIFIED_NOTICE}\n\n{answer_markdown}"
                    )


    citation_payloads = []
    for eid in sorted(cited_eids):
        # Determine the UI index from the string ID
        try:
            index = int(eid.replace("e_", ""))
        except ValueError:
            continue

        chunk = source_registry[eid]
        citation_payloads.append(
            CitationResponse(
                index=index,
                source_type="document",
                title=document_title,
                url=None,
                document_id=document_id,
                chunk_id=chunk.id,
                page_number=chunk.page_number,
                excerpt=chunk.content.strip()[:500] or None,
            )
        )

    with _open_session(clerk_user_id) as session:
        # Match document-deletion lock order: document first, then conversation.
        document = _get_owned_document(
            session,
            document_id=document_id,
            clerk_user_id=clerk_user_id,
            for_update=True,
        )
        if document.status != DocumentStatus.COMPLETED:
            raise DocumentNotReadyError
        if document.active_index_generation != index_generation:
            raise ConcurrentConversationUpdateError
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

        maximum_sequence = session.exec(
            select(func.max(AIMessage.sequence_number)).where(
                AIMessage.conversation_id == conversation.id
            )
        ).one()
        next_sequence = int(maximum_sequence or 0) + 1
        now = datetime.now(timezone.utc)
        user_message = AIMessage(
            status=ChatAnswerStatus.ANSWERED,
            conversation_id=conversation.id,
            sequence_number=next_sequence,
            role="user",
            content=question,
            selected_text=selected_text,
            retrieval_mode=retrieval_mode,
            suggested_followups=[],
            created_at=now,
        )
        assistant_message = AIMessage(
            status=message_status,
            conversation_id=conversation.id,
            sequence_number=next_sequence + 1,
            role="assistant",
            content=answer_markdown,
            retrieval_mode=retrieval_mode,
            suggested_followups=effective_followups,
            created_at=now,
        )
        try:
            session.add(user_message)
            session.add(assistant_message)
            session.flush()
            assistant_message_id = assistant_message.id
            for citation in citation_payloads:
                session.add(
                    AIMessageCitation(
                        message_id=assistant_message_id,
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
            conversation.updated_at = datetime.now(timezone.utc)
            session.add(conversation)
            commit_and_reassert_rls(session, clerk_user_id)
        except IntegrityError as exc:
            session.rollback()
            raise ConcurrentConversationUpdateError from exc
        except Exception:
            session.rollback()
            raise

    return ChatAnswer(
        conversation_id=conversation_id,
        message_id=assistant_message_id,
        answer_markdown=answer_markdown,
        citations=citation_payloads,
        suggested_followups=effective_followups,
        status=message_status,
    )
