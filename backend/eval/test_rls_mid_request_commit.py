import pytest
from sqlalchemy import text
from sqlmodel import Session, select
import uuid
import json

from core.database import engine, commit_and_reassert_rls
from models.tables import Document, DocumentStatus, QuizAttempt

@pytest.fixture
def db_session():
    with Session(engine) as session:
        yield session

def test_rls_persists_after_intermediate_commit(db_session):
    user_a_id = f"user_a_{uuid.uuid4()}"
    user_b_id = f"user_b_{uuid.uuid4()}"
    
    doc_a_id = uuid.uuid4()
    doc_b_id = uuid.uuid4()
    
    # 1. Setup users and docs properly by context-switching to owner for insert
    db_session.execute(text("SELECT set_config('app.current_user_id', :uid, true)"), {"uid": user_a_id})
    db_session.add(Document(id=doc_a_id, clerk_user_id=user_a_id, filename="A.pdf", file_url="uploads/A.pdf", status=DocumentStatus.COMPLETED))
    db_session.flush()

    db_session.execute(text("SELECT set_config('app.current_user_id', :uid, true)"), {"uid": user_b_id})
    db_session.add(Document(id=doc_b_id, clerk_user_id=user_b_id, filename="B.pdf", file_url="uploads/B.pdf", status=DocumentStatus.COMPLETED))
    db_session.commit()
    
    # 2. Enter User A's context
    db_session.execute(text("SELECT set_config('app.current_user_id', :uid, true)"), {"uid": user_a_id})
    
    # 3. Perform a write and intermediate commit USING THE FIX
    attempt_a = QuizAttempt(
        document_id=doc_a_id,
        score=100,
        total_questions=5,
        incorrect_question_ids=json.dumps([])
    )
    db_session.add(attempt_a)
    commit_and_reassert_rls(db_session, user_a_id)
    
    # 4. Perform a read for User B's document WITHOUT any app-layer filter
    result_b = db_session.exec(select(Document).where(Document.id == doc_b_id)).first()
    assert result_b is None, "RLS context was lost! Cross-tenant read succeeded."
    
    # 5. Sanity check: Read User A's own document
    result_a = db_session.exec(select(Document).where(Document.id == doc_a_id)).first()
    assert result_a is not None, "RLS denied own tenant access. Policy or context is broken."
