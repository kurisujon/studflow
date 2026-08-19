with open("backend/eval/retrieval/live_runner.py", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "distance_col = DocumentChunk.embedding.cosine_distance(q_emb).label(\"distance\")" in line:
        skip = True
        new_lines.append("""            # Manual python distance calculation to bypass pgvector issues
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
""")
    elif skip:
        if "top_score =" in line:
            skip = False
            new_lines.append(line)
    else:
        new_lines.append(line)

with open("backend/eval/retrieval/live_runner.py", "w") as f:
    f.writelines(new_lines)
