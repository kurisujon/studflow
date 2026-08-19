
from typing import List
from .models import RetrievalCaseResult, RetrievalMetrics

def calculate_answerable_metrics(cases: List[RetrievalCaseResult], k: int) -> RetrievalMetrics:
    if not cases:
        return RetrievalMetrics(
            hit_rate_at_k=0.0,
            anchor_coverage_at_k=0.0,
            complete_evidence_rate_at_k=0.0,
            mrr=0.0,
            precision_at_k=0.0
        )

    hits = 0
    total_coverage = 0.0
    complete_evidence = 0
    rr_sum = 0.0
    precision_sum = 0.0

    for case in cases:
        expected = case.expected_anchors
        if not expected:
            continue
            
        retrieved_matches = case.retrieved[:k]
        
        # Collect all unique retrieved anchors from the top K chunks
        retrieved_anchors = set()
        for r in retrieved_matches:
            retrieved_anchors.update(r.anchors)
            
        # Hit Rate
        if expected.intersection(retrieved_anchors):
            hits += 1
            
        # Coverage
        intersection = expected.intersection(retrieved_anchors)
        total_coverage += len(intersection) / len(expected)
        
        # Complete Evidence
        if expected.issubset(retrieved_anchors):
            complete_evidence += 1
            
        # MRR
        first_hit_rank = 0
        for r in retrieved_matches:
            if expected.intersection(r.anchors):
                first_hit_rank = r.rank
                break
        if first_hit_rank > 0:
            rr_sum += 1.0 / first_hit_rank
            
        # Precision
        relevant_chunks = 0
        for r in retrieved_matches:
            if expected.intersection(r.anchors):
                relevant_chunks += 1
        
        effective_k = min(k, len(retrieved_matches)) if retrieved_matches else 1
        precision_sum += relevant_chunks / effective_k

    n = len(cases)
    return RetrievalMetrics(
        hit_rate_at_k=hits / n,
        anchor_coverage_at_k=total_coverage / n,
        complete_evidence_rate_at_k=complete_evidence / n,
        mrr=rr_sum / n,
        precision_at_k=precision_sum / n
    )
