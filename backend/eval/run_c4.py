import time
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from eval.answer.resumable_runner import load_data
from eval.groundedness.runner import C4Runner
import eval.groundedness.runner

RUN_DIR = "backend/eval/results/c3_baseline_v2"
RETRIEVAL_RUN_DIR = "backend/eval/results/live_72b513d6"

# Spacing between judge calls to stay under free-tier requests-per-minute.
CALL_SPACING_SECONDS = 15


def main():
    runner = C4Runner(RUN_DIR)

    original_eval = eval.groundedness.runner.evaluate_claim_groundedness

    def evaluate_with_sleep(case_id, claim_id, claim_text, context):
        print(f"Running C4 evaluation for {case_id} claim {claim_id}...")
        res = original_eval(case_id, claim_id, claim_text, context)
        time.sleep(CALL_SPACING_SECONDS)
        return res

    eval.groundedness.runner.evaluate_claim_groundedness = evaluate_with_sleep

    _, golden_cases = load_data(RETRIEVAL_RUN_DIR)

    print(f"Starting C4 run on {RUN_DIR}...")
    metrics = runner.run(golden_cases)
    if metrics is None:
        print("C4 paused before completion; c4_metrics.json not written.")
    else:
        print("C4 complete; c4_metrics.json written.")


if __name__ == "__main__":
    main()
