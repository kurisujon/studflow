from __future__ import annotations

import json
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from core.database import engine
from models.tables import Document, DocumentChunk, DocumentStatus, Flashcard, Quiz, QuizQuestion, Summary
from services.ai_service import ComprehensiveSummary, explain_selection

router = APIRouter()


class DocumentListItem(BaseModel):
    id: uuid.UUID
    filename: str
    status: str
    created_at: datetime
    updated_at: datetime
    page_count: int | None
    summary_ready: bool
    flashcard_count: int
    quiz_ready: bool


class DocumentStatusResponse(BaseModel):
    document_id: uuid.UUID
    status: str
    processing_stage: str
    page_count: int | None = None
    summary_ready: bool
    flashcard_count: int
    quiz_ready: bool


class FlashcardResponse(BaseModel):
    id: uuid.UUID
    front: str
    back: str
    order_index: int


class QuizQuestionResponse(BaseModel):
    id: uuid.UUID
    question: str
    options: list[str]
    correct_answer_index: int
    explanation: str
    order_index: int


class StudyDocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    status: str
    created_at: datetime
    summary: str | None
    summary_data: dict | None
    flashcards: list[FlashcardResponse]
    quiz: list[QuizQuestionResponse]


class DocumentChunkResponse(BaseModel):
    id: uuid.UUID
    order_index: int
    content: str


class ExplainSelectionRequest(BaseModel):
    highlighted_text: str
    question: str | None = None


class ExplainSelectionResponse(BaseModel):
    selectedText: str
    simplifiedExplanation: str
    beginnerExplanation: str
    example: str
    relatedTerms: list[str]
    suggestedFlashcard: dict


def _infer_processing_stage(document: Document, summary: Summary | None, flashcard_count: int, quiz: Quiz | None) -> str:
    if document.status == DocumentStatus.PENDING:
        return "QUEUED"
    if document.status == DocumentStatus.FAILED:
        return "FAILED"
    if document.status == DocumentStatus.COMPLETED:
        return "COMPLETED"
    if summary is None:
        return "EXTRACTING_TEXT"
    if flashcard_count == 0:
        return "GENERATING_FLASHCARDS"
    if quiz is None:
        return "GENERATING_QUIZ"
    return "FINALIZING"


def _parse_summary_payload(content: str | None) -> ComprehensiveSummary | None:
    if not content:
        return None

    try:
        return ComprehensiveSummary.model_validate_json(content)
    except Exception:
        return None


def _format_summary_text(summary: ComprehensiveSummary | None) -> str | None:
    if summary is None:
        return None

    sections = [summary.overall_overview]
    for section in summary.detailed_sections:
        sections.append(section.topic_title)
        sections.extend(f"- {point}" for point in section.key_points)
        if section.important_terms_and_definitions:
            sections.append("Important terms:")
            sections.extend(
                f"- {term}" for term in section.important_terms_and_definitions
            )

    return "\n".join(sections)


@router.get("/documents", response_model=list[DocumentListItem])
def list_documents() -> list[DocumentListItem]:
    with Session(engine) as session:
        documents = session.exec(
            select(Document).order_by(Document.created_at.desc())
        ).all()

        items: list[DocumentListItem] = []

        for document in documents:
            summary = session.exec(
                select(Summary).where(Summary.document_id == document.id)
            ).first()
            flashcard_count = len(
                session.exec(
                    select(Flashcard).where(Flashcard.document_id == document.id)
                ).all()
            )
            quiz = session.exec(
                select(Quiz).where(Quiz.document_id == document.id)
            ).first()

            items.append(
                DocumentListItem(
                    id=document.id,
                    filename=document.filename,
                    status=document.status.value,
                    created_at=document.created_at,
                    updated_at=document.updated_at,
                    page_count=document.page_count,
                    summary_ready=summary is not None,
                    flashcard_count=flashcard_count,
                    quiz_ready=quiz is not None,
                )
            )

        return items


@router.get("/documents/{document_id}/status", response_model=DocumentStatusResponse)
def get_document_status(document_id: uuid.UUID) -> DocumentStatusResponse:
    with Session(engine) as session:
        document = session.exec(
            select(Document).where(Document.id == document_id)
        ).first()

        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )

        summary = session.exec(
            select(Summary).where(Summary.document_id == document_id)
        ).first()
        flashcards = session.exec(
            select(Flashcard).where(Flashcard.document_id == document_id)
        ).all()
        quiz = session.exec(
            select(Quiz).where(Quiz.document_id == document_id)
        ).first()

        return DocumentStatusResponse(
            document_id=document.id,
            status=document.status.value,
            processing_stage=_infer_processing_stage(
                document,
                summary,
                len(flashcards),
                quiz,
            ),
            page_count=document.page_count,
            summary_ready=summary is not None,
            flashcard_count=len(flashcards),
            quiz_ready=quiz is not None,
        )


@router.get("/documents/{document_id}/study", response_model=StudyDocumentResponse)
def get_study_document(document_id: uuid.UUID) -> StudyDocumentResponse:
    with Session(engine) as session:
        document = session.exec(
            select(Document).where(Document.id == document_id)
        ).first()

        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )

        summary = session.exec(
            select(Summary).where(Summary.document_id == document_id)
        ).first()
        flashcards = session.exec(
            select(Flashcard)
            .where(Flashcard.document_id == document_id)
            .order_by(Flashcard.order_index.asc())
        ).all()
        quiz = session.exec(
            select(Quiz).where(Quiz.document_id == document_id)
        ).first()
        quiz_questions: list[QuizQuestion] = []

        if quiz is not None:
            quiz_questions = session.exec(
                select(QuizQuestion)
                .where(QuizQuestion.quiz_id == quiz.id)
                .order_by(QuizQuestion.order_index.asc())
            ).all()

        summary_payload = _parse_summary_payload(summary.content if summary else None)

        return StudyDocumentResponse(
            id=document.id,
            filename=document.filename,
            status=document.status.value,
            created_at=document.created_at,
            summary=_format_summary_text(summary_payload),
            summary_data=summary_payload.model_dump() if summary_payload else None,
            flashcards=[
                FlashcardResponse(
                    id=flashcard.id,
                    front=flashcard.front,
                    back=flashcard.back,
                    order_index=flashcard.order_index,
                )
                for flashcard in flashcards
            ],
            quiz=[
                QuizQuestionResponse(
                    id=question.id,
                    question=question.question,
                    options=json.loads(question.options),
                    correct_answer_index=question.correct_answer_index,
                    explanation=question.explanation,
                    order_index=question.order_index,
                )
                for question in quiz_questions
            ],
        )


@router.get("/documents/{document_id}/chunks", response_model=list[DocumentChunkResponse])
def get_document_chunks(document_id: uuid.UUID) -> list[DocumentChunkResponse]:
    with Session(engine) as session:
        document = session.exec(
            select(Document).where(Document.id == document_id)
        ).first()

        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )

        chunks = session.exec(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.order_index.asc())
        ).all()

        return [
            DocumentChunkResponse(
                id=chunk.id,
                order_index=chunk.order_index,
                content=chunk.content,
            )
            for chunk in chunks
        ]


@router.post("/ai/explain-selection", response_model=ExplainSelectionResponse)
def explain_study_selection(payload: ExplainSelectionRequest) -> ExplainSelectionResponse:
    if not payload.highlighted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Highlighted text is required.",
        )

    explanation = explain_selection(
        highlighted_text=payload.highlighted_text.strip(),
        user_question=(payload.question or "").strip(),
    )
    return ExplainSelectionResponse(
        selectedText=explanation.selected_text,
        simplifiedExplanation=explanation.simplified_explanation,
        beginnerExplanation=explanation.beginner_explanation,
        example=explanation.example,
        relatedTerms=explanation.related_terms,
        suggestedFlashcard=explanation.suggested_flashcard.model_dump(),
    )
