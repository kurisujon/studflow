from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlmodel import Session

from core.auth import CurrentUser, get_current_user
from core.database import get_session
from schemas.ai_chat import (
    ChatAnswer,
    ConversationListResponse,
    ConversationResponse,
    CreateConversationRequest,
    MessageListResponse,
    SendMessageRequest,
    UpdateConversationRequest,
)
from services.ai_chat import (
    ConcurrentConversationUpdateError,
    ConversationNotFoundError,
    DocumentNotReadyError,
    SearchIndexNotReadyError,
    create_conversation,
    delete_conversation,
    get_owned_conversation,
    list_conversations,
    list_messages,
    send_conversation_message,
    update_conversation_title,
)
from services.ai_service import AIServiceError
from tasks.document_processing import dispatch_document_index_repair


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai-chat"])


def _not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")


def _raise_ai_http_error(exc: AIServiceError) -> None:
    cause = exc.__cause__
    status_code = getattr(cause, "status_code", None) or getattr(cause, "code", None)
    if status_code in {429, 503, 504}:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI is temporarily unavailable due to high demand. Please try again in a moment.",
        ) from exc
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="AI could not generate a response right now. Please try again.",
    ) from exc


def _conversation_response(conversation) -> ConversationResponse:
    return ConversationResponse(
        id=conversation.id,
        document_id=conversation.document_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ai_conversation(
    payload: CreateConversationRequest,
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ConversationResponse:
    try:
        return create_conversation(
            session,
            document_id=payload.document_id,
            clerk_user_id=current_user.clerk_user_id,
            title=payload.title,
        )
    except ConversationNotFoundError as exc:
        raise _not_found() from exc
    except DocumentNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The document must finish processing before starting a conversation.",
        ) from exc


@router.get("/conversations", response_model=ConversationListResponse)
def list_ai_conversations(
    document_id: uuid.UUID | None = Query(default=None),
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ConversationListResponse:
    try:
        conversations = list_conversations(
            session,
            clerk_user_id=current_user.clerk_user_id,
            document_id=document_id,
        )
    except ConversationNotFoundError as exc:
        raise _not_found() from exc
    return ConversationListResponse(conversations=conversations)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_ai_conversation(
    conversation_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ConversationResponse:
    try:
        conversation = get_owned_conversation(
            session,
            conversation_id=conversation_id,
            clerk_user_id=current_user.clerk_user_id,
        )
    except ConversationNotFoundError as exc:
        raise _not_found() from exc
    return _conversation_response(conversation)


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
def rename_ai_conversation(
    conversation_id: uuid.UUID,
    payload: UpdateConversationRequest,
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ConversationResponse:
    try:
        return update_conversation_title(
            session,
            conversation_id=conversation_id,
            clerk_user_id=current_user.clerk_user_id,
            title=payload.title,
        )
    except ConversationNotFoundError as exc:
        raise _not_found() from exc


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_ai_conversation(
    conversation_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Response:
    try:
        delete_conversation(
            session,
            conversation_id=conversation_id,
            clerk_user_id=current_user.clerk_user_id,
        )
    except ConversationNotFoundError as exc:
        raise _not_found() from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=MessageListResponse,
)
def get_ai_conversation_messages(
    conversation_id: uuid.UUID,
    limit: int = Query(default=50, ge=1, le=100),
    before_sequence: int | None = Query(default=None, ge=1),
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> MessageListResponse:
    try:
        conversation, messages, next_before = list_messages(
            session,
            conversation_id=conversation_id,
            clerk_user_id=current_user.clerk_user_id,
            limit=limit,
            before_sequence=before_sequence,
        )
    except ConversationNotFoundError as exc:
        raise _not_found() from exc
    return MessageListResponse(
        conversation=conversation,
        messages=messages,
        next_before_sequence=next_before,
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=ChatAnswer,
    status_code=status.HTTP_201_CREATED,
)
def send_ai_conversation_message(
    conversation_id: uuid.UUID,
    payload: SendMessageRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> ChatAnswer:
    try:
        return send_conversation_message(
            conversation_id=conversation_id,
            clerk_user_id=current_user.clerk_user_id,
            question=payload.question,
            selected_text=payload.selected_text,
        )
    except ConversationNotFoundError as exc:
        raise _not_found() from exc
    except DocumentNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The document search index is not ready for this conversation.",
        ) from exc
    except SearchIndexNotReadyError as exc:
        if not exc.repairable:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The document has no extracted text to prepare for search.",
            ) from exc
        try:
            dispatch_document_index_repair(exc.document_id)
        except Exception as queue_error:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The document search index repair could not be queued. Please try again.",
            ) from queue_error
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The document search index is being prepared. Please retry shortly.",
        ) from exc
    except ConcurrentConversationUpdateError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The conversation changed while the answer was generated. Please retry.",
        ) from exc
    except AIServiceError as exc:
        logger.warning(
            "Conversation AI request failed: conversation_id=%s error_type=%s cause_type=%s",
            conversation_id,
            type(exc).__name__,
            type(exc.__cause__).__name__ if exc.__cause__ is not None else "None",
        )
        _raise_ai_http_error(exc)
        raise
