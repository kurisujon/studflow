import time
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from eval.answer.resumable_runner import C3Runner, load_data
from eval.answer.models import RunConfig

def main():
    config = RunConfig(
        dataset_version="c1-v1",
        corpus_version="v1",
        retrieval_run_id="live_72b513d6",
        retrieval_top_k=5,
        retrieval_threshold=0.67,
        generation_model="gemini-1.5-flash",
        generation_prompt_version="1.0",
        citation_evaluator_version="1.0",
        c3_evaluator_version="1.0"
    )
    
    run_dir = "backend/eval/results/c3_certified_baseline"
    runner = C3Runner(run_dir, config)
    
    # Patch the run loop to include a sleep just to be safe
    original_execute_pipeline = runner.execute_pipeline
    original_execute_c3 = runner.execute_c3
    
    def execute_pipeline_with_sleep(*args, **kwargs):
        print("Running pipeline...")
        res = original_execute_pipeline(*args, **kwargs)
        time.sleep(15)
        return res
        
    def execute_c3_with_sleep(*args, **kwargs):
        print("Running C3 judge...")
        res = original_execute_c3(*args, **kwargs)
        time.sleep(15)
        return res
        
    runner.execute_pipeline = execute_pipeline_with_sleep
    runner.execute_c3 = execute_c3_with_sleep
    
    retrieval_cases, golden_cases = load_data("backend/eval/results/live_72b513d6")
    
    print("Starting C3 Resume Run...")
    runner.run(retrieval_cases, golden_cases)
    print("Run pass finished. Check manifest for status.")

if __name__ == "__main__":
    main()
