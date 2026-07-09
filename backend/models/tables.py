import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Enum as SAEnum
from sqlmodel import Field, Relationship, SQLModel


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class DocumentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


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
    preferences: Optional["UserPreferences"] = Relationship(back_populates="user")


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
    user_id: uuid.UUID = Field(
        foreign_key="users.id", unique=True, nullable=False, index=True
    )
    theme: str = Field(default="system")
    daily_review_goal: int = Field(default=20)
    # 2.5 is standard SM-2. Lower = harder (cards appear sooner).
    sm2_aggressiveness: float = Field(default=2.5) 
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    user: Optional[User] = Relationship(back_populates="preferences")

# ---------------------------------------------------------------------------
# Document
# ---------------------------------------------------------------------------


class Document(SQLModel, table=True):
    __tablename__ = "documents"

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
    content: str = Field(nullable=False)
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
