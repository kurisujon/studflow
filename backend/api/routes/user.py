import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select, func
from core.database import engine
from core.auth import get_current_user, CurrentUser
from models.tables import UserPreferences, Document, Flashcard, QuizAttempt, QuizQuestion

router = APIRouter()

class UserPreferencesResponse(BaseModel):
    id: uuid.UUID
    theme: str
    daily_review_goal: int
    sm2_aggressiveness: float

class UpdatePreferencesRequest(BaseModel):
    theme: str | None = None
    daily_review_goal: int | None = None
    sm2_aggressiveness: float | None = None

class UserStatsResponse(BaseModel):
    total_documents: int
    total_flashcards: int
    avg_quiz_score: int
    streak_days: int
    streak_activity: list[bool] # last 7 days including today

class QueueItem(BaseModel):
    title: str
    subtitle: str
    badge: str
    color: str
    text_color: str

class UserQueueResponse(BaseModel):
    tasks: list[QueueItem]

@router.get("/user/preferences", response_model=UserPreferencesResponse)
def get_user_preferences(current_user: CurrentUser = Depends(get_current_user)):
    with Session(engine) as session:
        statement = select(UserPreferences).where(UserPreferences.user_id == current_user.id)
        prefs = session.exec(statement).first()
        if not prefs:
            prefs = UserPreferences(user_id=current_user.id)
            session.add(prefs)
            session.commit()
            session.refresh(prefs)
        return prefs

@router.put("/user/preferences", response_model=UserPreferencesResponse)
def update_user_preferences(
    request: UpdatePreferencesRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    with Session(engine) as session:
        statement = select(UserPreferences).where(UserPreferences.user_id == current_user.id)
        prefs = session.exec(statement).first()
        if not prefs:
            prefs = UserPreferences(user_id=current_user.id)
            session.add(prefs)
            
        if request.theme is not None:
            prefs.theme = request.theme
        if request.daily_review_goal is not None:
            prefs.daily_review_goal = request.daily_review_goal
        if request.sm2_aggressiveness is not None:
            prefs.sm2_aggressiveness = request.sm2_aggressiveness
            
        prefs.updated_at = datetime.utcnow()
        session.commit()
        session.refresh(prefs)
        return prefs

@router.get("/user/stats", response_model=UserStatsResponse)
def get_user_stats(current_user: CurrentUser = Depends(get_current_user)):
    with Session(engine) as session:
        docs = session.exec(select(Document).where(Document.user_id == current_user.id)).all()
        doc_ids = [d.id for d in docs]
        
        if not doc_ids:
            return UserStatsResponse(
                total_documents=0,
                total_flashcards=0,
                avg_quiz_score=0,
                streak_days=0,
                streak_activity=[False]*7
            )
            
        flashcards_count = session.exec(
            select(func.count(Flashcard.id)).where(Flashcard.document_id.in_(doc_ids))
        ).first() or 0
        
        attempts = session.exec(
            select(QuizAttempt).where(QuizAttempt.document_id.in_(doc_ids))
        ).all()
        
        avg_score = 0
        if attempts:
            total_pct = sum([(a.score / a.total_questions)*100 for a in attempts if a.total_questions > 0])
            avg_score = int(total_pct / len(attempts))
            
        # Very simple streak logic based on quiz attempts (could be expanded to flashcard reviews)
        today = datetime.utcnow().date()
        activity_dates = set([a.created_at.date() for a in attempts])
        
        streak_activity = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            streak_activity.append(day in activity_dates)
            
        streak_days = 0
        for i in range(7):
            if today - timedelta(days=i) in activity_dates:
                streak_days += 1
            else:
                break
                
        return UserStatsResponse(
            total_documents=len(docs),
            total_flashcards=flashcards_count,
            avg_quiz_score=avg_score,
            streak_days=streak_days,
            streak_activity=streak_activity
        )

@router.get("/user/queue", response_model=UserQueueResponse)
def get_user_queue(current_user: CurrentUser = Depends(get_current_user)):
    with Session(engine) as session:
        docs = session.exec(select(Document).where(Document.user_id == current_user.id)).all()
        doc_ids = [d.id for d in docs]
        
        if not doc_ids:
            return UserQueueResponse(tasks=[])
            
        tasks = []
        
        # Flashcards due
        due_flashcards = session.exec(
            select(func.count(Flashcard.id))
            .where(Flashcard.document_id.in_(doc_ids))
            .where(Flashcard.next_review_date <= datetime.utcnow())
        ).first() or 0
        
        if due_flashcards > 0:
            tasks.append(QueueItem(
                title="Daily Flashcard Review",
                subtitle=f"{due_flashcards} cards due",
                badge="Review",
                color="#fef2f2",
                text_color="#ef4444"
            ))
            
        # Weak topics
        attempts = session.exec(
            select(QuizAttempt)
            .where(QuizAttempt.document_id.in_(doc_ids))
            .order_by(QuizAttempt.created_at.desc())
            .limit(10)
        ).all()
        
        weak_count = 0
        for a in attempts:
            if a.incorrect_question_ids and a.incorrect_question_ids != "[]":
                weak_count += 1
                
        if weak_count > 0:
            tasks.append(QueueItem(
                title="Challenge Mode",
                subtitle=f"Weak topics from {weak_count} quizzes",
                badge="Practice",
                color="#fdf4ff",
                text_color="#d946ef"
            ))
            
        return UserQueueResponse(tasks=tasks)
