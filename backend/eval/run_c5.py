import time
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from eval.answer.resumable_runner import load_data
from eval.citation.runner import C5Runner
import eval.citation.runner

RUN_DIR = "backend/eval/results/c3_baseline_v2"
RETRIEVAL_RUN_DIR = "backend/eval/results/live_72b513d6"

# Spacing between judge calls to stay under free-tier requests-per-minute.
CALL_SPACING_SECONDS = 15


def main():
    runner = C5Runner(RUN_DIR)

    original_eval = eval.citation.runner.evaluate_citation_correctness

    # C5Runner calls the evaluator with keyword arguments only.
    def evaluate_with_sleep(**kwargs):
        print(f"Running C5 evaluation for {kwargs['case_id']} claim {kwargs['claim_id']} evidence {kwargs['evidence_id']}...")
        res = original_eval(**kwargs)
        time.sleep(CALL_SPACING_SECONDS)
        return res

    eval.citation.runner.evaluate_citation_correctness = evaluate_with_sleep

    _, golden_cases = load_data(RETRIEVAL_RUN_DIR)

    print(f"Starting C5 run on {RUN_DIR}...")
    metrics = runner.run(golden_cases)
    if metrics is None:
        print("C5 paused before completion; c5_metrics.json not written.")
    else:
        print("C5 complete; c5_metrics.json written.")


if __name__ == "__main__":
    main()
