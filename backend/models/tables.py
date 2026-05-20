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

    # Relationships
    quiz: Optional[Quiz] = Relationship(back_populates="questions")
