from __future__ import annotations

import json
import uuid

from sqlmodel import select

from core.database import tenant_session
from models.tables import Document, DocumentStatus, QuizAttempt


def test_tenant_context_survives_commit_rollback_and_new_transactions() -> None:
    owner = f"user_a_{uuid.uuid4()}"
    other = f"user_b_{uuid.uuid4()}"
    owner_document_id, other_document_id = uuid.uuid4(), uuid.uuid4()
    with tenant_session(owner) as session:
        session.add(Document(id=owner_document_id, clerk_user_id=owner, filename="owner.pdf", file_url="uploads/owner.pdf", status=DocumentStatus.COMPLETED))
        session.commit()
        session.add(QuizAttempt(document_id=owner_document_id, score=5, total_questions=5, incorrect_question_ids=json.dumps([])))
        session.commit()
        assert session.get(Document, owner_document_id) is not None
        session.rollback()
        assert session.get(Document, owner_document_id) is not None
    with tenant_session(other) as session:
        session.add(Document(id=other_document_id, clerk_user_id=other, filename="other.pdf", file_url="uploads/other.pdf", status=DocumentStatus.COMPLETED))
        session.commit()
    with tenant_session(owner) as session:
        assert session.exec(select(Document).where(Document.id == other_document_id)).first() is None
        session.commit()
        assert session.exec(select(Document).where(Document.id == other_document_id)).first() is None
