import pytest
from sqlalchemy import text
from sqlmodel import Session, select
import uuid

from core.database import engine
from models.tables import Document, DocumentChunk, AIConversation, AIMessage, AIMessageCitation, DocumentStatus

@pytest.fixture
def db_session():
    with Session(engine) as session:
        yield session

def test_rls_denies_cross_tenant_access_at_db_layer(db_session):
    user_a = f"user_a_{uuid.uuid4()}"
    user_b = f"user_b_{uuid.uuid4()}"
    
    # Setup User A's Data
    db_session.execute(text("SET LOCAL app.current_user_id = :uid"), {"uid": user_a})
    doc_a = Document(id=uuid.uuid4(), clerk_user_id=user_a, filename="A.pdf", status=DocumentStatus.COMPLETED)
    db_session.add(doc_a)
    db_session.flush()

    # Setup User B's Data (doc, chunk, conversation, message, citation)
    db_session.execute(text("SET LOCAL app.current_user_id = :uid"), {"uid": user_b})
    doc_b = Document(id=uuid.uuid4(), clerk_user_id=user_b, filename="B.pdf", status=DocumentStatus.COMPLETED)
    chunk_b = DocumentChunk(id=uuid.uuid4(), document_id=doc_b.id, content="Secret B", page_number=1, chunk_index=0)
    conv_b = AIConversation(id=uuid.uuid4(), clerk_user_id=user_b, document_id=doc_b.id, title="B's Chat")
    msg_b = AIMessage(id=uuid.uuid4(), conversation_id=conv_b.id, role="user", content="msg B")
    cit_b = AIMessageCitation(id=uuid.uuid4(), message_id=msg_b.id, chunk_id=chunk_b.id, claim_text="secret", exact_quote="sec")
    
    db_session.add_all([doc_b, chunk_b, conv_b, msg_b, cit_b])
    db_session.commit()

    # Open Session as User A
    db_session.execute(text("SET LOCAL app.current_user_id = :uid"), {"uid": user_a})

    # DIRECT TABLE TEST
    result_doc_b = db_session.exec(select(Document).where(Document.id == doc_b.id)).first()
    assert result_doc_b is None, "RLS failed on direct table (documents)."

    # SANITY CHECK
    result_doc_a = db_session.exec(select(Document).where(Document.id == doc_a.id)).first()
    assert result_doc_a is not None, "RLS denied owner access (documents)."

    # 1-HOP SUBQUERY TEST
    result_chunk_b = db_session.exec(select(DocumentChunk).where(DocumentChunk.id == chunk_b.id)).first()
    assert result_chunk_b is None, "RLS failed on 1-hop subquery table (document_chunks)."

    # 2-HOP SUBQUERY TEST
    result_cit_b = db_session.exec(select(AIMessageCitation).where(AIMessageCitation.id == cit_b.id)).first()
    assert result_cit_b is None, "RLS failed on 2-hop subquery table (ai_message_citations)."
