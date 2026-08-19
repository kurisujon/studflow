import argparse
import json
import uuid
import sys
import math
from pathlib import Path

# Setup paths so we can import from backend
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "backend"))

from core.database import Session, engine
from models import User, Document, DocumentChunk, DocumentStatus
from services.document_processing import chunk_text
from services.llm_provider import _embed_contents
from services.ai_service import generate_query_embedding
from eval.retrieval.models import RetrievedChunkMatch, RetrievalCaseResult
from eval.retrieval.metrics import calculate_answerable_metrics
from eval.retrieval.threshold_analysis import calculate_confusion_matrix
from eval.retrieval.report import generate_report
from eval.retrieval.anchor_mapper import AnchorMapper
from sqlalchemy import select

def generate_embeddings_batch_mockable(chunks):
    """Local helper since generate_embeddings_batch might be in ai_service directly"""
    return _embed_contents(chunks, task_type="RETRIEVAL_DOCUMENT")

def run_live_eval(dataset_version: str):
    print("Running LIVE mode...")
    
    eval_dir = Path("backend/eval")
    manifest_path = eval_dir / "datasets" / "manifest.json"
    
    with open(manifest_path, "r") as f:
        manifest = json.load(f)
        
    with Session(engine) as session:
        # 1. Setup Eval User
        user = session.execute(select(User).where(User.email=="eval@studflow.local")).scalar_one_or_none()
        if not user:
            user = User(id=uuid.uuid4(), email="eval@studflow.local", display_name="Eval User", hashed_password="dummy")
            session.add(user)
            session.commit()
            
        # 2. Ingest Corpora
        mappers = {}
        for corpus in manifest["corpora"]:
            source_id = corpus["source_id"]
            corpus_path = eval_dir / "datasets" / corpus["path"]
            with open(corpus_path, "r") as f:
                text = f.read()
                
            mappers[source_id] = AnchorMapper(text)
            
            print(f"Finding doc for {source_id}...")
            doc = session.execute(select(Document).where(Document.user_id==user.id, Document.filename==f"eval_{source_id}.md")).scalar_one_or_none()
            if not doc:
                print(f"Ingesting {source_id}...")
                doc = Document(id=uuid.uuid4(), user_id=user.id, filename=f"eval_{source_id}.md", file_url=f"eval_{source_id}.md", status=DocumentStatus.COMPLETED)
                session.add(doc)
                session.commit()
                
                chunks = chunk_text(text)
                embeddings = generate_embeddings_batch_mockable(chunks)
                for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
                    db_chunk = DocumentChunk(document_id=doc.id, order_index=i, content=chunk, embedding=emb)
                    session.add(db_chunk)
                session.commit()
                print(f"Ingested {source_id}: {len(chunks)} chunks.")
        
        # 3. Evaluate Cases
        cases_path = eval_dir / "datasets" / "golden_cases.jsonl"
        eval_results = []
        
        with open(cases_path, "r") as f:
            lines = f.readlines()
            
        for line in lines:
            data = json.loads(line)
            case_id = data["id"]
            question = data["question"]
            should_abstain = data.get("should_abstain", False)
            source_id = data["source_id"]
            
            expected_anchors = set(ev["anchor"] for ev in data["expected_evidence"])
            
            # Generate query embedding
            q_emb = generate_query_embedding(question)
            
            print(f"Finding doc for {source_id}...")
            doc = session.execute(select(Document).where(Document.user_id==user.id, Document.filename==f"eval_{source_id}.md")).scalar_one_or_none()
            
            # Retrieve top 5
            # Manual python distance calculation to bypass pgvector issues
            stmt = select(DocumentChunk).where(DocumentChunk.document_id == doc.id)
            all_chunks = session.execute(stmt).scalars().all()
            
            scored_chunks = []
            import math
            for chunk in all_chunks:
                emb_array = chunk.embedding
                q_array = q_emb
                dot = sum(a*b for a,b in zip(q_array, emb_array))
                norm_q = math.sqrt(sum(a*a for a in q_array))
                norm_emb = math.sqrt(sum(a*a for a in emb_array))
                if norm_q > 0 and norm_emb > 0:
                    score = dot / (norm_q * norm_emb)
                else:
                    score = 0.0
                scored_chunks.append((chunk, score))
            
            scored_chunks.sort(key=lambda x: x[1], reverse=True)
            retrieved_db = scored_chunks[:5]
            
            retrieved_matches = []
            mapper = mappers[source_id]
            for rank, (chunk, score) in enumerate(retrieved_db, 1):
                anchors = mapper.map_chunk(chunk.content)
                retrieved_matches.append(RetrievedChunkMatch(
                    chunk_id=str(chunk.id), rank=rank, score=score, text=chunk.content, anchors=anchors
                ))
            top_score = retrieved_matches[0].score if retrieved_matches else 0.0
            threshold_passed = top_score >= 0.50
            
            eval_results.append(RetrievalCaseResult(
                case_id=case_id, category=data["category"], difficulty=data["difficulty"],
                expected_anchors=expected_anchors, retrieved=retrieved_matches,
                top_score=top_score, threshold_passed=threshold_passed, should_abstain=should_abstain
            ))
            print(f"Evaluated {case_id}: Top score {top_score:.3f}, Expected: {expected_anchors}, Passed: {threshold_passed}")

    # 4. Generate Report
    answerable = [c for c in eval_results if not c.should_abstain]
    metrics = calculate_answerable_metrics(answerable, k=5)
    cm = calculate_confusion_matrix(eval_results, threshold=0.50)
    
    run_id = f"live_{uuid.uuid4().hex[:8]}"
    report_dir = generate_report(
        cases=eval_results, metrics=metrics, confusion_matrix=cm,
        run_id=run_id, dataset_version=dataset_version, corpus_version=dataset_version,
        embedding_model="gemini-embedding-2", retrieval_top_k=5, retrieval_threshold=0.50,
        output_dir="backend/eval/results"
    )
    
    print(f"LIVE report generated at {report_dir}")

if __name__ == "__main__":
    run_live_eval("c1-v1")
