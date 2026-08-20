import json
import os
from datetime import datetime
from eval.answer.models import AnswerMetrics, AnswerEvaluationResult

def generate_answer_report(
    run_dir: str,
    results: list[AnswerEvaluationResult],
    metrics: AnswerMetrics,
    config: dict
):
    os.makedirs(run_dir, exist_ok=True)
    
    # Write summary
    summary_path = os.path.join(run_dir, "answer_summary.json")
    with open(summary_path, "w") as f:
        summary_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "config": config,
            "metrics": metrics.model_dump()
        }
        json.dump(summary_data, f, indent=2)
        
    # Write cases
    cases_path = os.path.join(run_dir, "answer_cases.jsonl")
    with open(cases_path, "w") as f:
        for r in results:
            f.write(r.model_dump_json() + "\n")
            
    print(f"C3 report generated at {run_dir}")
