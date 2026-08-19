from schemas.domain import RetrievedEvidence, RetrievalQuality, RetrievalEvidenceSet

def evaluate_retrieval_quality(
    chunks_with_distance: list[tuple[any, float]], 
    threshold: float
) -> RetrievalEvidenceSet:
    evidence = []
    scores = []
    for chunk, distance in chunks_with_distance:
        score = 1.0 - distance  # pgvector cosine_distance is 1 - cosine_similarity
        scores.append(score)
        evidence.append(
            RetrievedEvidence(
                chunk_id=chunk.id,
                content=chunk.content,
                page_number=chunk.page_number,
                score=score
            )
        )
    
    top_score = max(scores) if scores else None
    mean_score = (sum(scores) / len(scores)) if scores else None
    
    threshold_passed = top_score is not None and top_score >= threshold

    quality = RetrievalQuality(
        top_score=top_score,
        mean_top_k_score=mean_score,
        evidence_count=len(evidence),
        threshold_passed=threshold_passed
    )
    
    return RetrievalEvidenceSet(evidence=evidence, quality=quality)
