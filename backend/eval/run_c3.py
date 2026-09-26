import time
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.config import settings
from eval.answer.resumable_runner import C3Runner, load_data
from eval.answer.models import RunConfig
from eval.judge import JUDGE_MODEL

# Canonical Phase C baseline. `c3_certified_baseline` is retained only as an
# invalid historical record (see its INVALID.md) and must not be resumed.
RUN_DIR = "backend/eval/results/c3_baseline_v2"
RETRIEVAL_RUN_DIR = "backend/eval/results/live_72b513d6"

# Spacing between provider calls to stay under free-tier requests-per-minute.
CALL_SPACING_SECONDS = 15


def main():
    config = RunConfig(
        dataset_version="c1-v1",
        corpus_version="v1",
        retrieval_run_id="live_72b513d6",
        retrieval_top_k=5,
        retrieval_threshold=0.67,
        generation_model=settings.gemini_model,
        generation_prompt_version="1.0",
        citation_evaluator_version="1.0",
        c3_evaluator_version="1.0",
        judge_model=JUDGE_MODEL,
    )

    runner = C3Runner(RUN_DIR, config)

    original_execute_pipeline = runner.execute_pipeline
    original_execute_c3 = runner.execute_c3

    def execute_pipeline_with_sleep(case, retrieved_chunks):
        print(f"Running pipeline for {case['id']}...")
        res = original_execute_pipeline(case, retrieved_chunks)
        # Abstentions with no retrieved chunks make no provider call.
        if retrieved_chunks:
            time.sleep(CALL_SPACING_SECONDS)
        return res

    def execute_c3_with_sleep(case, pipeline_output):
        print(f"Running C3 judge for {case['id']}...")
        res = original_execute_c3(case, pipeline_output)
        if any(f.match_type == "semantic" for f in res.fact_results):
            time.sleep(CALL_SPACING_SECONDS)
        return res

    runner.execute_pipeline = execute_pipeline_with_sleep
    runner.execute_c3 = execute_c3_with_sleep

    retrieval_cases, golden_cases = load_data(RETRIEVAL_RUN_DIR)

    print(f"Starting C3 run in {RUN_DIR} (generation={settings.gemini_model}, judge={JUDGE_MODEL})...")
    runner.run(retrieval_cases, golden_cases)
    print("Run pass finished. Check manifest for status.")


if __name__ == "__main__":
    main()
