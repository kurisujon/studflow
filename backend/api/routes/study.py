import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from core.database import engine
from core.auth import get_current_user, CurrentUser
from models.tables import Flashcard, Document
from api.routes.documents import FlashcardResponse, ReviewFlashcardRequest
from services.study_service import review_flashcard

router = APIRouter()

@router.get("/study/flashcards/due", response_model=list[FlashcardResponse])
def get_due_flashcards(current_user: CurrentUser = Depends(get_current_user)):
    """Fetch all flashcards due for review across all user documents."""
    with Session(engine) as session:
        statement = (
            select(Flashcard)
            .join(Document, Flashcard.document_id == Document.id)
            .where(Document.user_id == current_user.id)
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
            .where(Document.user_id == current_user.id)
            .where(Flashcard.id == flashcard_id)
        )
        flashcard = session.exec(statement).first()
        if not flashcard:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found")
            
        updated_flashcard = review_flashcard(
            session=session,
            flashcard_id=flashcard_id,
            user_id=current_user.id,
            rating=request.rating
        )
        
        return updated_flashcard
