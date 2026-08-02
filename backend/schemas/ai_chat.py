from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


MessageRole = Literal["user", "assistant", "system"]
RetrievalMode = Literal["document", "web", "hybrid"]
CitationSourceType = Literal["document", "web"]


class CreateConversationRequest(BaseModel):
    document_id: uuid.UUID
    title: str | None = Field(default=None, max_length=160)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        return value.strip() if value and value.strip() else None


class UpdateConversationRequest(BaseModel):
    title: str = Field(min_length=1, max_length=160)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("title is required.")
        return normalized


class ConversationResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID | None
    title: str | None
    created_at: datetime
    updated_at: datetime


class ConversationListResponse(BaseModel):
    conversations: list[ConversationResponse]


class CitationResponse(BaseModel):
    index: int = Field(ge=1)
    source_type: CitationSourceType
    title: str
    url: str | None = None
    document_id: uuid.UUID | None = None
    chunk_id: uuid.UUID | None = None
    page_number: int | None = Field(default=None, ge=1)
    excerpt: str | None = None


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sequence_number: int = Field(ge=1)
    role: MessageRole
    content: str
    selected_text: str | None = None
    retrieval_mode: RetrievalMode
    suggested_followups: list[str]
    citations: list[CitationResponse]
    created_at: datetime


class MessageListResponse(BaseModel):
    conversation: ConversationResponse
    messages: list[MessageResponse]
    next_before_sequence: int | None = None


class SendMessageRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    selected_text: str | None = Field(default=None, max_length=8000)

    @field_validator("question")
    @classmethod
    def normalize_question(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("question is required.")
        return normalized

    @field_validator("selected_text")
    @classmethod
    def normalize_selected_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class ChatAnswer(BaseModel):
    conversation_id: uuid.UUID
    message_id: uuid.UUID
    answer_markdown: str
    citations: list[CitationResponse]
    suggested_followups: list[str]
