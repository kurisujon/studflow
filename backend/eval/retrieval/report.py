
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List

from .models import AggregateReport, RetrievalCaseResult, RetrievalMetrics, ConfusionMatrix

def generate_report(
    cases: List[RetrievalCaseResult],
    metrics: RetrievalMetrics,
    confusion_matrix: ConfusionMatrix,
    run_id: str,
    dataset_version: str,
    corpus_version: str,
    embedding_model: str,
    retrieval_top_k: int,
    retrieval_threshold: float,
    output_dir: str = "backend/eval/results"
):
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    report = AggregateReport(
        run_id=run_id,
        timestamp=timestamp,
        dataset_version=dataset_version,
        corpus_version=corpus_version,
        embedding_model=embedding_model,
        retrieval_top_k=retrieval_top_k,
        retrieval_threshold=retrieval_threshold,
        answerable_metrics=metrics,
        negative_confusion_matrix=confusion_matrix
    )
    
    run_dir = Path(output_dir) / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. summary.json
    with open(run_dir / "summary.json", "w") as f:
        f.write(report.model_dump_json(indent=2))
        
    # 2. retrieval_cases.jsonl
    with open(run_dir / "retrieval_cases.jsonl", "w") as f:
        for case in cases:
            f.write(case.model_dump_json() + "\n")
            
    # 3. metadata.json
    metadata = {
        "run_id": run_id,
        "timestamp": timestamp,
        "dataset_version": dataset_version,
        "corpus_version": corpus_version,
        "embedding_model": embedding_model,
        "retrieval_top_k": retrieval_top_k,
        "retrieval_threshold": retrieval_threshold,
        "total_cases_run": len(cases)
    }
    with open(run_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
        
    return run_dir
