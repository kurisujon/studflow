import time
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from eval.answer.resumable_runner import load_data
from eval.groundedness.runner import C4Runner
import eval.groundedness.runner

def main():
    run_dir = "backend/eval/results/c3_certified_baseline"
    runner = C4Runner(run_dir)
    
    original_eval = eval.groundedness.runner.evaluate_claim_groundedness
    
    def evaluate_with_sleep(*args, **kwargs):
        print(f"Running C4 evaluation for {args[0]} claim {args[1]}...")
        res = original_eval(*args, **kwargs)
        time.sleep(15)
        return res
        
    eval.groundedness.runner.evaluate_claim_groundedness = evaluate_with_sleep
    
    retrieval_cases, golden_cases = load_data("backend/eval/results/live_72b513d6")
    
    print("Starting C4 Resume Run...")
    # C4Runner.run now takes golden_cases (patched earlier)
    runner.run(golden_cases)
    print("C4 run pass finished.")

if __name__ == "__main__":
    main()
