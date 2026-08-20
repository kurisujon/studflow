import json
import sys
import time
from pathlib import Path

# Setup paths so we can import from backend
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "backend"))

from core.database import Session, engine
from schemas.ai_chat import ChatAnswerStatus
from services.ai_service import answer_conversation_question, evaluate_citations, AIServiceError
from services.domain_validation import validate_conversation_answer, apply_semantic_validation, filter_unsupported_claims
from services.ai_chat import _render_grounded_answer, INSUFFICIENT_EVIDENCE_ANSWER

from eval.answer.models import ExpectedFact, AnswerEvaluationResult, ExpectedStatus, ChatAnswerStatus as EvalChatAnswerStatus
from eval.answer.exact_matcher import evaluate_exact_fact
from eval.answer.semantic_evaluator import evaluate_semantic_fact
from eval.answer.metrics import calculate_answer_metrics
from eval.answer.report import generate_answer_report

RETRIEVAL_THRESHOLD = 0.67
EVAL_CASE_DELAY_SECONDS = 30

def run_answer_eval(retrieval_dir: str, output_dir: str):
    retrieval_cases_file = Path(retrieval_dir) / "retrieval_cases.jsonl"
    golden_cases_file = Path("backend/eval/datasets/golden_cases.jsonl")
    
    golden_cases = {}
    with open(golden_cases_file, "r") as f:
        for line in f:
            case = json.loads(line)
            golden_cases[case["id"]] = case
            
    retrieval_cases = []
    with open(retrieval_cases_file, "r") as f:
        for line in f:
            retrieval_cases.append(json.loads(line))
            
    eval_results = []
    failed_case_count = 0
    
    for rcase in retrieval_cases:
        case_id = rcase["case_id"]
        golden = golden_cases[case_id]
        
        expected_status_str = golden["expected_status"]
        expected_status = ExpectedStatus(expected_status_str)
        
        retrieved_chunks = [chunk for chunk in rcase["retrieved"] if chunk["score"] >= RETRIEVAL_THRESHOLD]
        
        if not retrieved_chunks:
            answer_markdown = INSUFFICIENT_EVIDENCE_ANSWER
            actual_status = ChatAnswerStatus.INSUFFICIENT_EVIDENCE
        else:
            source_registry = {f"e_{i:02d}": chunk for i, chunk in enumerate(retrieved_chunks, start=1)}
            sources = [(eid, chunk["text"]) for eid, chunk in source_registry.items()]
            
            try:
                raw_generated = answer_conversation_question(
                    sources=sources,
                    user_question=golden["question"],
                    conversation_history=[],
                )
                
                valid_ids = set(source_registry.keys())
                generated = validate_conversation_answer(raw_generated, valid_ids)
                
                if generated.evidence_sufficient:
                    eval_batch = []
                    for claim in generated.claims:
                        for eid in claim.cited_evidence_ids:
                            eval_batch.append((claim.claim_text, eid, source_registry[eid]["text"]))
                    evaluations = evaluate_citations(eval_batch)
                    generated = apply_semantic_validation(generated, evaluations)
                else:
                    generated = apply_semantic_validation(generated, [])
                    
                generated, b6_status = filter_unsupported_claims(generated)
                
                if b6_status == ChatAnswerStatus.INSUFFICIENT_EVIDENCE:
                    answer_markdown = INSUFFICIENT_EVIDENCE_ANSWER
                    actual_status = ChatAnswerStatus.INSUFFICIENT_EVIDENCE
                else:
                    answer_markdown, _ = _render_grounded_answer(generated.claims)
                    if not answer_markdown.strip():
                        answer_markdown = INSUFFICIENT_EVIDENCE_ANSWER
                        actual_status = ChatAnswerStatus.INSUFFICIENT_EVIDENCE
                    else:
                        actual_status = b6_status
                        
            except Exception as e:
                print(f"Error evaluating case {case_id}: {e}")
                answer_markdown = ""
                actual_status = ChatAnswerStatus.FAILED
                
        actual_status_enum = EvalChatAnswerStatus(actual_status.value)
        
        if actual_status_enum == EvalChatAnswerStatus.FAILED:
            failed_case_count += 1
            status_correct = False
            answer_correct = False
            fact_coverage = 0.0
            fact_results = []
        else:
            fact_results = []
            expected_facts = [ExpectedFact(**f) for f in golden.get("expected_facts", [])]
            
            if expected_status == ExpectedStatus.INSUFFICIENT_EVIDENCE and actual_status_enum == EvalChatAnswerStatus.INSUFFICIENT_EVIDENCE:
                status_correct = True
                answer_correct = True
                fact_coverage = None
            elif expected_status == ExpectedStatus.INSUFFICIENT_EVIDENCE and actual_status_enum != EvalChatAnswerStatus.INSUFFICIENT_EVIDENCE:
                status_correct = False
                answer_correct = False
                fact_coverage = None
            else:
                status_correct = (expected_status.value == actual_status_enum.value)
                
                passed_facts = 0
                for fact in expected_facts:
                    if fact.match_type == "exact":
                        res = evaluate_exact_fact(fact, answer_markdown)
                    else:
                        res = evaluate_semantic_fact(fact, answer_markdown)
                    fact_results.append(res)
                    if res.passed:
                        passed_facts += 1
                        
                fact_coverage = (passed_facts / len(expected_facts)) if expected_facts else 0.0
                answer_correct = (fact_coverage == 1.0)
            
        result = AnswerEvaluationResult(
            case_id=case_id,
            expected_status=expected_status,
            actual_status=actual_status_enum,
            fact_results=fact_results,
            expected_fact_count=len(golden.get("expected_facts", [])),
            matched_fact_count=sum(1 for f in fact_results if getattr(f, "passed", False)),
            fact_coverage=fact_coverage,
            status_correct=status_correct,
            answer_correct=answer_correct,
            category=golden["category"]
        )
        
        print(f"Evaluated {case_id}: status={actual_status_enum.value}, expected={expected_status.value}, coverage={fact_coverage}")
        eval_results.append(result)
        time.sleep(EVAL_CASE_DELAY_SECONDS)
        
    metrics = calculate_answer_metrics(eval_results)
    
    config = {
        "dataset_version": "c1-v1",
        "corpus_version": "c1-v1",
        "retrieval_mode": "exact_cosine_eval",
        "retrieval_top_k": 5,
        "retrieval_threshold": RETRIEVAL_THRESHOLD,
        "threshold_status": "provisional",
        "generation_model": "gemini-1.5-flash",
        "rate_limit_delay_seconds": EVAL_CASE_DELAY_SECONDS,
        "failed_case_count": failed_case_count,
    }
    
    generate_answer_report(output_dir, eval_results, metrics, config)
    
if __name__ == "__main__":
    if len(sys.argv) > 2:
        retrieval_dir = sys.argv[1]
        output_dir = sys.argv[2]
    else:
        print("Usage: python runner.py <retrieval_dir> <output_dir>")
        sys.exit(1)
    run_answer_eval(retrieval_dir, output_dir)
