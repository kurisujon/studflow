from datetime import datetime, timedelta
import uuid
from sqlmodel import Session, select
from models.tables import Flashcard

def calculate_sm2(rating: str, interval: int, repetitions: int, easiness: float) -> tuple[int, int, float]:
    # Map text rating to SM-2 quality score
    # again = 0, hard = 3, good = 4, easy = 5
    quality_map = {
        "again": 0,
        "hard": 3,
        "good": 4,
        "easy": 5
    }
    quality = quality_map.get(rating, 0)
    
    if quality >= 3:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = int(round(interval * easiness))
        repetitions += 1
    else:
        repetitions = 0
        interval = 1

    easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if easiness < 1.3:
        easiness = 1.3

    return interval, repetitions, easiness

def review_flashcard(session: Session, flashcard_id: uuid.UUID, rating: str) -> Flashcard | None:
    # We must ensure the flashcard belongs to the user
    # but the flashcard table only has document_id. We can join or just query flashcard.
    flashcard = session.get(Flashcard, flashcard_id)
    if not flashcard:
        return None
        
    # SM-2 calculation
    interval, repetitions, easiness = calculate_sm2(
        rating=rating,
        interval=flashcard.interval,
        repetitions=flashcard.repetition,
        easiness=flashcard.easiness_factor
    )
    
    flashcard.interval = interval
    flashcard.repetition = repetitions
    flashcard.easiness_factor = easiness
    flashcard.next_review_date = datetime.utcnow() + timedelta(days=interval)
    
    session.add(flashcard)
    session.commit()
    session.refresh(flashcard)
    
    return flashcard
