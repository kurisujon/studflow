import enum
import uuid
from datetime import datetime
from collections.abc import Sequence
from typing import Optional

from sqlalchemy import (
    JSON,
    CheckConstraint,
    Column,
    Enum as SAEnum,
    Float,
    Index,
    UniqueConstraint,
    bindparam,
)
from sqlalchemy.types import UserDefinedType
from sqlmodel import Field, Relationship, SQLModel


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class DocumentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"  # Retained for documents created before Phase 4.
    EXTRACTING = "EXTRACTING"
    CHUNKING = "CHUNKING"
    EMBEDDING = "EMBEDDING"
    ANALYZING = "ANALYZING"
    GENERATING = "GENERATING"
    VALIDATING = "VALIDATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Vector(UserDefinedType):
    """Minimal PostgreSQL pgvector type with cosine-distance support.

    Keeping this local avoids adding another ORM dependency while preserving typed
    bindings and preventing malformed embeddings from reaching PostgreSQL.
    """

    cache_ok = True

    def __init__(self, dimensions: int) -> None:
        self.dimensions = dimensions

    def get_col_spec(self, **_kwargs: object) -> str:
        return f"vector({self.dimensions})"

    @property
    def python_type(self) -> type[list[float]]:
        return list

    def bind_processor(self, dialect: object):
        def process(value: Sequence[float] | None) -> str | None:
            if value is None:
                return None

            values = [float(item) for item in value]
            if len(values) != self.dimensions:
                raise ValueError(
                    f"Expected a {self.dimensions}-dimension embedding, got {len(values)}."
                )

            return "[" + ",".join(format(item, ".10g") for item in values) + "]"

        return process

    def result_processor(self, dialect: object, coltype: object):
        def process(value: object) -> list[float] | None:
            if value is None:
                return None
            if isinstance(value, (list, tuple)):
                return [float(item) for item in value]

            raw_value = str(value).strip().strip("[]")
            return [float(item) for item in raw_value.split(",") if item]

        return process

    class comparator_factory(UserDefinedType.Comparator):
        def cosine_distance(self, value: Sequence[float]):
            return self.expr.op("<=>", return_type=Float())(
                bindparam(None, value, type_=self.type),
            )


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    email: str = Field(unique=True, index=True, max_length=255, nullable=False)
    hashed_password: str = Field(nullable=False)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    documents: list["Document"] = Relationship(back_populates="user")


# ---------------------------------------------------------------------------
# User Preferences
# ---------------------------------------------------------------------------

class UserPreferences(SQLModel, table=True):
    __tablename__ = "user_preferences"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    clerk_user_id: str = Field(unique=True, index=True, nullable=False)
    theme: str = Field(default="system")
    daily_review_goal: int = Field(default=20)
    # 2.5 is standard SM-2. Lower = harder (cards appear sooner).
    sm2_aggressiveness: float = Field(default=2.5) 
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

# ---------------------------------------------------------------------------
# Document
# ---------------------------------------------------------------------------


class Document(SQLModel, table=True):
    __tablename__ = "documents"
    __table_args__ = (
        CheckConstraint(
            "active_index_page_cursor >= 0",
            name="ck_documents_active_index_page_cursor_nonnegative",
        ),
        CheckConstraint(
            "pending_index_generation IS NULL OR "
            "pending_index_generation > active_index_generation",
            name="ck_documents_pending_index_generation_newer",
        ),
        CheckConstraint(
            "(pending_index_generation IS NULL AND "
            "pending_index_started_at IS NULL AND "
            "pending_index_heartbeat_at IS NULL AND "
            "pending_index_lease_token IS NULL AND "
            "pending_index_page_cursor IS NULL) OR "
            "(pending_index_generation IS NOT NULL AND "
            "pending_index_started_at IS NOT NULL AND "
            "pending_index_heartbeat_at IS NOT NULL AND "
            "pending_index_lease_token IS NOT NULL AND "
            "pending_index_page_cursor IS NOT NULL AND "
            "pending_index_page_cursor >= 0)",
            name="ck_documents_pending_index_lease_consistent",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    user_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="users.id",
        nullable=True,
        index=True,
    )
    clerk_user_id: Optional[str] = Field(default=None, index=True)
    filename: str = Field(max_length=255, nullable=False)
    file_url: str = Field(max_length=1024, nullable=False)
    status: DocumentStatus = Field(
        default=DocumentStatus.PENDING,
        sa_column=Column(SAEnum(DocumentStatus), nullable=False),
    )
    page_count: Optional[int] = Field(default=None)
    file_size_bytes: Optional[int] = Field(default=None)
    active_index_generation: int = Field(default=1, ge=1, nullable=False)
    active_index_page_cursor: int = Field(default=0, ge=0, nullable=False)
    pending_index_generation: Optional[int] = Field(default=None, ge=1, nullable=True)
    pending_index_started_at: Optional[datetime] = Field(default=None, nullable=True)
    pending_index_heartbeat_at: Optional[datetime] = Field(default=None, nullable=True)
    pending_index_lease_token: Optional[uuid.UUID] = Field(default=None, nullable=True)
    pending_index_page_cursor: Optional[int] = Field(default=None, ge=0, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    user: Optional[User] = Relationship(back_populates="documents")
    summary: Optional["Summary"] = Relationship(back_populates="document")
    chunks: list["DocumentChunk"] = Relationship(back_populates="document")
    flashcards: list["Flashcard"] = Relationship(back_populates="document")
    quiz: Optional["Quiz"] = Relationship(back_populates="document")
    quiz_attempts: list["QuizAttempt"] = Relationship(back_populates="document")
    related_videos: list["RelatedVideo"] = Relationship(back_populates="document")
    annotations: list["StudyAnnotation"] = Relationship(back_populates="document")
    ai_history_items: list["AIHistory"] = Relationship(back_populates="document")
    ai_conversations: list["AIConversation"] = Relationship(back_populates="document")


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------


class Summary(SQLModel, table=True):
    __tablename__ = "summaries"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    document_id: uuid.UUID = Field(
        foreign_key="documents.id", unique=True, nullable=False, index=True
    )
    content: str = Field(nullable=False)  # Plain text summary from Gemini
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    document: Optional[Document] = Relationship(back_populates="summary")


# ---------------------------------------------------------------------------
# Flashcard
# ---------------------------------------------------------------------------


class Flashcard(SQLModel, table=True):
    __tablename__ = "flashcards"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    document_id: uuid.UUID = Field(
        foreign_key="documents.id", nullable=False, index=True
    )
    front: str = Field(nullable=False)  # Question / concept
    back: str = Field(nullable=False)   # Answer / explanation
    order_index: int = Field(default=0, nullable=False)
    
    # Spaced Repetition System (SRS) fields
    next_review_date: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    interval: int = Field(default=0, nullable=False)  # Days until next review
    repetition: int = Field(default=0, nullable=False) # Number of consecutive successful reviews
    easiness_factor: float = Field(default=2.5, nullable=False) # SM-2 easiness factor multiplier
    
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    document: Optional[Document] = Relationship(back_populates="flashcards")


# ---------------------------------------------------------------------------
# DocumentChunk
# ---------------------------------------------------------------------------


class DocumentChunk(SQLModel, table=True):
    __tablename__ = "document_chunks"
    __table_args__ = (
        CheckConstraint(
            "index_generation > 0",
            name="ck_document_chunks_positive_generation",
        ),
        CheckConstraint(
            "page_number IS NULL OR page_number > 0",
            name="ck_document_chunks_positive_page",
        ),
        UniqueConstraint(
            "document_id",
            "index_generation",
            "order_index",
            name="uq_document_chunks_document_generation_order",
        ),
        Index(
            "ix_document_chunks_document_generation",
            "document_id",
            "index_generation",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    document_id: uuid.UUID = Field(
        foreign_key="documents.id", nullable=False, index=True
    )
    order_index: int = Field(default=0, nullable=False)
    index_generation: int = Field(default=1, ge=1, nullable=False)
    page_number: Optional[int] = Field(default=None, ge=1, nullable=True)
    content: str = Field(nullable=False)
    embedding: list[float] | None = Field(
        default=None,
        sa_column=Column(Vector(768), nullable=True),
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    document: Optional[Document] = Relationship(back_populates="chunks")


# ---------------------------------------------------------------------------
# Quiz
# ---------------------------------------------------------------------------


class Quiz(SQLModel, table=True):
    __tablename__ = "quizzes"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    document_id: uuid.UUID = Field(
        foreign_key="documents.id", unique=True, nullable=False, index=True
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    document: Optional[Document] = Relationship(back_populates="quiz")
    questions: list["QuizQuestion"] = Relationship(back_populates="quiz")


# ---------------------------------------------------------------------------
# QuizQuestion
# ---------------------------------------------------------------------------


class QuizQuestion(SQLModel, table=True):
    __tablename__ = "quiz_questions"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    quiz_id: uuid.UUID = Field(foreign_key="quizzes.id", nullable=False, index=True)
    question: str = Field(nullable=False)
    # Stored as JSON array string: ["Option A", "Option B", "Option C", "Option D"]
    options: str = Field(nullable=False)
    correct_answer_index: int = Field(nullable=False)  # 0-based index
    explanation: str = Field(nullable=False)
    order_index: int = Field(default=0, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    quiz: Optional[Quiz] = Relationship(back_populates="questions")


# ---------------------------------------------------------------------------
# QuizAttempt
# ---------------------------------------------------------------------------


class QuizAttempt(SQLModel, table=True):
    __tablename__ = "quiz_attempts"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    document_id: uuid.UUID = Field(
        foreign_key="documents.id", nullable=False, index=True
    )
    score: int = Field(nullable=False)
    total_questions: int = Field(nullable=False)
    incorrect_question_ids: str = Field(nullable=False, default="[]")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    document: Optional[Document] = Relationship(back_populates="quiz_attempts")


# ---------------------------------------------------------------------------
# RelatedVideo
# ---------------------------------------------------------------------------


class RelatedVideo(SQLModel, table=True):
    __tablename__ = "related_videos"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    document_id: uuid.UUID = Field(
        foreign_key="documents.id", nullable=False, index=True
    )
    title: str = Field(nullable=False)
    channel_title: str = Field(nullable=False)
    video_id: str = Field(nullable=False)
    url: str = Field(nullable=False)
    thumbnail_url: str = Field(nullable=False)
    description: str = Field(nullable=False)
    relevance_reason: str = Field(nullable=False)
    published_at: str = Field(default="", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    document: Optional[Document] = Relationship(back_populates="related_videos")


# ---------------------------------------------------------------------------
# StudyAnnotation
# ---------------------------------------------------------------------------


class StudyAnnotation(SQLModel, table=True):
    __tablename__ = "study_annotations"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    document_id: uuid.UUID = Field(
        foreign_key="documents.id", nullable=False, index=True
    )
    block_id: str = Field(nullable=False)
    selected_text: str = Field(nullable=False)
    start_offset: int = Field(nullable=False)
    end_offset: int = Field(nullable=False)
    type: str = Field(nullable=False)  # highlight, underline, note
    color: Optional[str] = Field(default=None)
    underline_color: Optional[str] = Field(default=None)
    note_content: Optional[str] = Field(default=None)
    deleted_at: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    document: Optional[Document] = Relationship(back_populates="annotations")


# ---------------------------------------------------------------------------
# AIHistory
# ---------------------------------------------------------------------------


class AIHistory(SQLModel, table=True):
    __tablename__ = "ai_history"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    document_id: uuid.UUID = Field(
        foreign_key="documents.id", nullable=False, index=True
    )
    source: str = Field(nullable=False)  # selection, highlight, underline, note, general
    source_text: str = Field(default="", nullable=False)
    note_content: Optional[str] = Field(default=None)
    question: str = Field(nullable=False)
    mode: str = Field(nullable=False)
    answer: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    document: Optional[Document] = Relationship(back_populates="ai_history_items")


# ---------------------------------------------------------------------------
# Persistent AI conversations
# ---------------------------------------------------------------------------


class AIConversation(SQLModel, table=True):
    __tablename__ = "ai_conversations"
    __table_args__ = (
        Index("ix_ai_conversations_owner_updated", "clerk_user_id", "updated_at"),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    clerk_user_id: str = Field(max_length=255, nullable=False, index=True)
    document_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="documents.id",
        ondelete="CASCADE",
        nullable=True,
        index=True,
    )
    title: Optional[str] = Field(default=None, max_length=160, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    document: Optional[Document] = Relationship(back_populates="ai_conversations")
    messages: list["AIMessage"] = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={"passive_deletes": True},
    )


class AIMessage(SQLModel, table=True):
    __tablename__ = "ai_messages"
    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'assistant', 'system')",
            name="ck_ai_messages_role",
        ),
        CheckConstraint(
            "retrieval_mode IN ('document', 'web', 'hybrid')",
            name="ck_ai_messages_retrieval_mode",
        ),
        CheckConstraint(
            "status IN ('ANSWERED', 'PARTIALLY_ANSWERED', 'INSUFFICIENT_EVIDENCE', 'OUT_OF_SCOPE', 'FAILED')",
            name="ck_ai_messages_status",
        ),
        UniqueConstraint(
            "conversation_id",
            "sequence_number",
            name="uq_ai_messages_conversation_sequence",
        ),
        Index(
            "ix_ai_messages_conversation_created_id",
            "conversation_id",
            "created_at",
            "id",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    conversation_id: uuid.UUID = Field(
        foreign_key="ai_conversations.id",
        ondelete="CASCADE",
        nullable=False,
        index=True,
    )
    sequence_number: int = Field(ge=1, nullable=False)
    role: str = Field(max_length=16, nullable=False)
    content: str = Field(nullable=False)
    selected_text: Optional[str] = Field(default=None, nullable=True)
    retrieval_mode: str = Field(default="document", max_length=16, nullable=False)
    status: str = Field(default="ANSWERED", max_length=32, nullable=False)
    suggested_followups: list[str] = Field(
        default_factory=list,
        sa_column=Column(JSON, nullable=False, default=list),
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    conversation: Optional[AIConversation] = Relationship(back_populates="messages")
    citations: list["AIMessageCitation"] = Relationship(
        back_populates="message",
        sa_relationship_kwargs={"passive_deletes": True},
    )


class AIMessageCitation(SQLModel, table=True):
    __tablename__ = "ai_message_citations"
    __table_args__ = (
        CheckConstraint(
            "source_type IN ('document', 'web')",
            name="ck_ai_message_citations_source_type",
        ),
        CheckConstraint(
            "citation_index > 0",
            name="ck_ai_message_citations_positive_index",
        ),
        CheckConstraint(
            "page_number IS NULL OR page_number > 0",
            name="ck_ai_message_citations_positive_page",
        ),
        UniqueConstraint(
            "message_id",
            "citation_index",
            name="uq_ai_message_citations_message_index",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    message_id: uuid.UUID = Field(
        foreign_key="ai_messages.id",
        ondelete="CASCADE",
        nullable=False,
        index=True,
    )
    citation_index: int = Field(ge=1, nullable=False)
    source_type: str = Field(max_length=16, nullable=False)
    title: str = Field(max_length=255, nullable=False)
    url: Optional[str] = Field(default=None, max_length=2048, nullable=True)
    document_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="documents.id",
        ondelete="SET NULL",
        nullable=True,
        index=True,
    )
    chunk_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="document_chunks.id",
        ondelete="SET NULL",
        nullable=True,
        index=True,
    )
    page_number: Optional[int] = Field(default=None, ge=1, nullable=True)
    excerpt: Optional[str] = Field(default=None, nullable=True)

    message: Optional[AIMessage] = Relationship(back_populates="citations")
