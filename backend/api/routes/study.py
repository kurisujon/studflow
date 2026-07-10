import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from core.database import engine
from core.auth import get_current_user, CurrentUser
import json
import random
from models.tables import Flashcard, Document, QuizAttempt, QuizQuestion, Quiz
from api.routes.documents import FlashcardResponse, ReviewFlashcardRequest, QuizQuestionResponse
from services.study_service import review_flashcard

router = APIRouter()

@router.get("/study/flashcards/due", response_model=list[FlashcardResponse])
def get_due_flashcards(current_user: CurrentUser = Depends(get_current_user)):
    """Fetch all flashcards due for review across all user documents."""
    with Session(engine) as session:
        statement = (
            select(Flashcard)
            .join(Document, Flashcard.document_id == Document.id)
            .where(Document.clerk_user_id == current_user.clerk_user_id)
            .where(Flashcard.next_review_date <= datetime.utcnow())
            .order_by(Flashcard.next_review_date.asc())
        )
        flashcards = session.exec(statement).all()
        return flashcards

@router.post("/study/flashcards/{flashcard_id}/review", response_model=FlashcardResponse)
def review_flashcard_endpoint(
    flashcard_id: uuid.UUID,
    request: ReviewFlashcardRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Update SRS stats for a flashcard based on the rating."""
    with Session(engine) as session:
        # Verify ownership
        statement = (
            select(Flashcard)
            .join(Document, Flashcard.document_id == Document.id)
            .where(Document.clerk_user_id == current_user.clerk_user_id)
            .where(Flashcard.id == flashcard_id)
        )
        flashcard = session.exec(statement).first()
        if not flashcard:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found")
            
        updated_flashcard = review_flashcard(
            session=session,
            flashcard_id=flashcard_id,
            rating=request.rating
        )
        
        return updated_flashcard

@router.get("/study/quizzes/mixed", response_model=list[QuizQuestionResponse])
def get_mixed_quiz(current_user: CurrentUser = Depends(get_current_user)):
    """Generate a cross-document quiz prioritizing weakest topics from past attempts."""
    with Session(engine) as session:
        # 1. Find all documents owned by user
        docs = session.exec(select(Document.id).where(Document.clerk_user_id == current_user.clerk_user_id)).all()
        if not docs:
            return []
            
        # Get recent incorrect question IDs
        attempts = session.exec(
            select(QuizAttempt)
            .where(QuizAttempt.document_id.in_(docs))
            .order_by(QuizAttempt.created_at.desc())
            .limit(30)
        ).all()
        
        incorrect_ids_set = set()
        for attempt in attempts:
            try:
                ids = json.loads(attempt.incorrect_question_ids)
                incorrect_ids_set.update(ids)
            except Exception:
                continue
                
        # Fetch those specific questions (weak topics)
        mixed_questions = []
        if incorrect_ids_set:
            valid_uuids = []
            for id_str in incorrect_ids_set:
                try:
                    valid_uuids.append(uuid.UUID(id_str))
                except Exception:
                    pass
            if valid_uuids:
                weak_questions = session.exec(
                    select(QuizQuestion)
                    .where(QuizQuestion.id.in_(valid_uuids))
                ).all()
                mixed_questions.extend(weak_questions)
            
        # If we have less than 10, fill up with random questions from user's documents
        if len(mixed_questions) < 10:
            limit_needed = 10 - len(mixed_questions)
            exclude_ids = [q.id for q in mixed_questions]
            
            random_statement = (
                select(QuizQuestion)
                .join(Quiz, QuizQuestion.quiz_id == Quiz.id)
                .where(Quiz.document_id.in_(docs))
            )
            if exclude_ids:
                random_statement = random_statement.where(QuizQuestion.id.not_in(exclude_ids))
                
            random_questions = session.exec(random_statement).all()
            random.shuffle(random_questions)
            mixed_questions.extend(random_questions[:limit_needed])
            
        # Limit to 10 and shuffle
        random.shuffle(mixed_questions)
        mixed_questions = mixed_questions[:10]
        
        return [
            QuizQuestionResponse(
                id=q.id,
                question=q.question,
                options=json.loads(q.options),
                correct_answer_index=q.correct_answer_index,
                explanation=q.explanation,
                order_index=q.order_index,
            )
            for q in mixed_questions
        ]
