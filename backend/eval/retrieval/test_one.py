import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "backend"))
from core.database import Session, engine
from models import Document, DocumentChunk, User
from services.ai_service import generate_query_embedding
from sqlmodel import select

with Session(engine) as session:
    user = session.execute(select(User).where(User.email=="eval@studflow.local")).scalar_one_or_none()
    source_id = "biology-cellular-respiration-v1"
    
    doc = session.execute(select(Document).where(Document.user_id==user.id, Document.filename==f"eval_{source_id}.md")).scalar_one_or_none()
    print("Doc found:", doc.id if doc else "NONE")
    
    chunks = session.execute(select(DocumentChunk).where(DocumentChunk.document_id == doc.id)).scalars().all()
    print("Chunks in DB for doc:", len(chunks))
    
    q_emb = generate_query_embedding("What are the stages of cellular respiration?")
    print("Query emb length:", len(q_emb))
    
    distance_col = DocumentChunk.embedding.cosine_distance(q_emb).label("distance")
    stmt = select(DocumentChunk, distance_col).where(DocumentChunk.document_id == doc.id).order_by(distance_col).limit(5)
    retrieved = session.execute(stmt).all()
    
    print("Retrieved via pgvector:", len(retrieved))
