import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "backend"))
from core.database import Session, engine
from models import Document, DocumentChunk, User
from sqlmodel import select

with Session(engine) as session:
    user = session.execute(select(User).where(User.email=="eval@studflow.local")).scalar_one_or_none()
    
    with open("backend/eval/datasets/golden_cases.jsonl", "r") as f:
        for line in f:
            data = json.loads(line)
            source_id = data["source_id"]
            doc = session.execute(select(Document).where(Document.user_id==user.id, Document.filename==f"eval_{source_id}.md")).scalar_one_or_none()
            
            chunks = session.execute(select(DocumentChunk).where(DocumentChunk.document_id == doc.id)).scalars().all()
            print(f"Case {data['id']}: Doc {doc.id}, Chunks {len(chunks)}")
