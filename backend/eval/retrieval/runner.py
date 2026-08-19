
import argparse
import json
import uuid
import os
from pathlib import Path
from backend.eval.retrieval.models import RetrievedChunkMatch, RetrievalCaseResult, RetrievalMetrics
from backend.eval.retrieval.metrics import calculate_answerable_metrics
from backend.eval.retrieval.threshold_analysis import calculate_confusion_matrix
from backend.eval.retrieval.report import generate_report
from backend.eval.retrieval.anchor_mapper import AnchorMapper

def run_unit_test():
    print("Running UNIT mode...")
    
    # Mock data
    case1 = RetrievalCaseResult(
        case_id="case1", category="multi_chunk", difficulty="easy", expected_anchors={"A", "B"},
        should_abstain=False, top_score=0.9, threshold_passed=True,
        retrieved=[RetrievedChunkMatch(chunk_id="c1", rank=1, score=0.9, text="text", anchors={"A", "B"})]
    )
    case2 = RetrievalCaseResult(
        case_id="case2", category="insufficient_evidence", difficulty="easy", expected_anchors=set(),
        should_abstain=True, top_score=0.4, threshold_passed=False, retrieved=[]
    )
    
    cases = [case1, case2]
    metrics = calculate_answerable_metrics([c for c in cases if not c.should_abstain], k=5)
    cm = calculate_confusion_matrix(cases, threshold=0.5)
    
    report_dir = generate_report(
        cases=cases, metrics=metrics, confusion_matrix=cm,
        run_id="unit_run_001", dataset_version="c1-v1", corpus_version="c1-v1",
        embedding_model="mock", retrieval_top_k=5, retrieval_threshold=0.5,
        output_dir="backend/eval/results"
    )
    print(f"UNIT report generated at {report_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["unit", "live"], required=True)
    args = parser.add_argument("--dataset", default="c1-v1")
    args = parser.parse_args()
    
    if args.mode == "unit":
        run_unit_test()
    else:
        print("LIVE mode not fully implemented yet.")
