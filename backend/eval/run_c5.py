import time
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from eval.answer.resumable_runner import load_data
from eval.citation.runner import C5Runner
import eval.citation.runner

def main():
    run_dir = "backend/eval/results/c3_certified_baseline"
    runner = C5Runner(run_dir)
    
    # Just in case evaluate_citation_correctness is imported differently, 
    # we patch it at the source of usage or within the runner module namespace.
    # The runner uses `evaluate_citation_correctness` directly or imports it.
    try:
        original_eval = eval.citation.runner.evaluate_citation_correctness
        
        def evaluate_with_sleep(*args, **kwargs):
            print(f"Running C5 evaluation for {args[0]} claim {args[1]} evidence {args[2]}...")
            res = original_eval(*args, **kwargs)
            time.sleep(15)
            return res
            
        eval.citation.runner.evaluate_citation_correctness = evaluate_with_sleep
    except AttributeError:
        pass # It might be imported directly into the file. If so, patching here might fail.
    
    retrieval_cases, golden_cases = load_data("backend/eval/results/live_72b513d6")
    
    print("Starting C5 Resume Run...")
    runner.run(golden_cases)
    print("C5 run pass finished.")

if __name__ == "__main__":
    main()
