with open("backend/eval/retrieval/live_runner.py", "r") as f:
    code = f.read()

import re

old_stmt = """            stmt = select(DocumentChunk).where(DocumentChunk.document_id == doc.id).order_by(DocumentChunk.embedding.cosine_distance(q_emb)).limit(5)
            retrieved_db = session.execute(stmt).scalars().all()
            
            retrieved_matches = []
            mapper = mappers[source_id]
            for rank, chunk in enumerate(retrieved_db, 1):
                emb_array = chunk.embedding
                q_array = q_emb
                dot = sum(a*b for a,b in zip(q_array, emb_array))
                norm_q = math.sqrt(sum(a*a for a in q_array))
                norm_emb = math.sqrt(sum(a*a for a in emb_array))
                score = dot / (norm_q * norm_emb)
                score = float(score)"""

new_stmt = """            distance_col = DocumentChunk.embedding.cosine_distance(q_emb).label("distance")
            stmt = select(DocumentChunk, distance_col).where(DocumentChunk.document_id == doc.id).order_by(distance_col).limit(5)
            retrieved_db = session.execute(stmt).all()
            
            retrieved_matches = []
            mapper = mappers[source_id]
            for rank, row in enumerate(retrieved_db, 1):
                chunk = row[0]
                distance = row[1]
                score = 1.0 - float(distance)"""

code = code.replace(old_stmt, new_stmt)
with open("backend/eval/retrieval/live_runner.py", "w") as f:
    f.write(code)
