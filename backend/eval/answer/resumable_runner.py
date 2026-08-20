import hashlib
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "backend"))

from core.database import Session, engine
from schemas.ai_chat import ChatAnswerStatus
from services.ai_service import answer_conversation_question, evaluate_citations, AIServiceError
from services.domain_validation import validate_conversation_answer, apply_semantic_validation, filter_unsupported_claims
from services.ai_chat import _render_grounded_answer, INSUFFICIENT_EVIDENCE_ANSWER

from eval.answer.models import (
    ExpectedFact, AnswerEvaluationResult, ExpectedStatus, ChatAnswerStatus as EvalChatAnswerStatus,
    RunConfig, RunManifest, RunStatus, PipelineOutput
)
from eval.answer.exceptions import InfrastructureError, ConfigMismatchError
from eval.answer.exact_matcher import evaluate_exact_fact
from eval.answer.semantic_evaluator import evaluate_semantic_fact
from eval.answer.metrics import calculate_answer_metrics
from eval.answer.report import generate_answer_report

class C3Runner:
    def __init__(self, run_dir: str, config: RunConfig):
        self.run_dir = Path(run_dir)
        self.config = config
        self.manifest_path = self.run_dir / "manifest.json"
        self.pipeline_path = self.run_dir / "pipeline_outputs.jsonl"
        self.c3_path = self.run_dir / "answer_cases.jsonl"
        self.summary_path = self.run_dir / "answer_summary.json"
        
        self.run_dir.mkdir(parents=True, exist_ok=True)
        self._verify_or_create_manifest()

    def _verify_or_create_manifest(self):
        if self.manifest_path.exists():
            with open(self.manifest_path, "r") as f:
                data = json.load(f)
            existing_config = RunConfig(**data["config"])
            if existing_config.model_dump() != self.config.model_dump():
                raise ConfigMismatchError("Existing run configuration does not match current configuration.")
        else:
            manifest = RunManifest(
                run_id=self.run_dir.name,
                config=self.config,
                status=RunStatus.PARTIAL
            )
            with open(self.manifest_path, "w") as f:
                json.dump(manifest.model_dump(), f, indent=2)

    def update_manifest_status(self, status: RunStatus):
        with open(self.manifest_path, "r") as f:
            data = json.load(f)
        data["status"] = status.value
        with open(self.manifest_path, "w") as f:
            json.dump(data, f, indent=2)

    def load_pipeline_outputs(self) -> dict[str, PipelineOutput]:
        outputs = {}
        if self.pipeline_path.exists():
            with open(self.pipeline_path, "r") as f:
                for line in f:
                    if line.strip():
                        data = json.loads(line)
                        po = PipelineOutput(**data)
                        outputs[po.case_id] = po
        return outputs

    def append_pipeline_output(self, output: PipelineOutput):
        with open(self.pipeline_path, "a") as f:
            f.write(json.dumps(output.model_dump()) + "\n")

    def load_c3_outputs(self) -> dict[str, AnswerEvaluationResult]:
        outputs = {}
        if self.c3_path.exists():
            with open(self.c3_path, "r") as f:
                for line in f:
                    if line.strip():
                        data = json.loads(line)
                        co = AnswerEvaluationResult(**data)
                        outputs[co.case_id] = co
        return outputs

    def append_c3_output(self, output: AnswerEvaluationResult):
        with open(self.c3_path, "a") as f:
            f.write(json.dumps(output.model_dump()) + "\n")

    def execute_pipeline(self, case: dict, retrieved_chunks: list) -> PipelineOutput:
        case_id = case["id"]
        try:
            if not retrieved_chunks:
                po = PipelineOutput(
                    case_id=case_id,
                    actual_status=ChatAnswerStatus.INSUFFICIENT_EVIDENCE,
                    answer_markdown=INSUFFICIENT_EVIDENCE_ANSWER,
                    retrieved_eids=[],
                    retrieved_context="",
                    evidence_map={},
                    infrastructure_failed=False,
                    surviving_claims=[]
                )
                po.content_hash = hashlib.sha256(po.model_dump_json().encode()).hexdigest()
                return po
                
            source_registry = {f"e_{i:02d}": chunk for i, chunk in enumerate(retrieved_chunks, start=1)}
            sources = [(eid, chunk["text"]) for eid, chunk in source_registry.items()]
            context_text = "

".join([text for _, text in sources])
            evidence_map = {eid: chunk["text"] for eid, chunk in source_registry.items()}
            
            raw_generated = answer_conversation_question(
                sources=sources,
                user_question=case["question"],
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
            
            surviving = [
                FrozenSurvivingClaim(
                    claim_id=f"claim_{i:02d}", 
                    claim_text=c.claim_text,
                    cited_evidence_ids=c.cited_evidence_ids
                ) 
                for i, c in enumerate(generated.claims, start=1)
            ]
            
            if b6_status == ChatAnswerStatus.INSUFFICIENT_EVIDENCE:
                po = PipelineOutput(
                    case_id=case_id,
                    actual_status=ChatAnswerStatus.INSUFFICIENT_EVIDENCE,
                    answer_markdown=INSUFFICIENT_EVIDENCE_ANSWER,
                    retrieved_eids=list(source_registry.keys()),
                    retrieved_context=context_text,
                    evidence_map=evidence_map,
                    infrastructure_failed=False,
                    surviving_claims=surviving
                )
            else:
                answer_markdown, _ = _render_grounded_answer(generated.claims)
                if not answer_markdown.strip():
                    po = PipelineOutput(
                        case_id=case_id,
                        actual_status=ChatAnswerStatus.INSUFFICIENT_EVIDENCE,
                        answer_markdown=INSUFFICIENT_EVIDENCE_ANSWER,
                        retrieved_eids=list(source_registry.keys()),
                        retrieved_context=context_text,
                        evidence_map=evidence_map,
                        infrastructure_failed=False,
                        surviving_claims=surviving
                    )
                else:
                    po = PipelineOutput(
                        case_id=case_id,
                        actual_status=b6_status,
                        answer_markdown=answer_markdown,
                        retrieved_eids=list(source_registry.keys()),
                        retrieved_context=context_text,
                        evidence_map=evidence_map,
                        infrastructure_failed=False,
                        surviving_claims=surviving
                    )
            
            po.content_hash = hashlib.sha256(po.model_dump_json().encode()).hexdigest()
            return po
            
        except AIServiceError as e:
            po = PipelineOutput(
                case_id=case_id,
                actual_status=ChatAnswerStatus.FAILED,
                answer_markdown="",
                retrieved_eids=[],
                retrieved_context=None,
                evidence_map={},
                infrastructure_failed=True,
                error_message=str(e),
                surviving_claims=[]
            )
            return po
        except Exception as e:
            po = PipelineOutput(
                case_id=case_id,
                actual_status=ChatAnswerStatus.FAILED,
                answer_markdown="",
                retrieved_eids=[],
                retrieved_context=None,
                evidence_map={},
                infrastructure_failed=True,
                error_message=f"Unknown pipeline error: {str(e)}",
                surviving_claims=[]
            )
            return po
    def execute_c3(self, case: dict, pipeline_output: PipelineOutput) -> AnswerEvaluationResult:
        case_id = case["id"]
        expected_status = ExpectedStatus(case["expected_status"])
        expected_facts = [ExpectedFact(**f) for f in case.get("expected_facts", [])]
        actual_status_enum = EvalChatAnswerStatus(pipeline_output.actual_status.value)
        
        if pipeline_output.infrastructure_failed:
            return AnswerEvaluationResult(
                case_id=case_id,
                expected_status=expected_status,
                actual_status=actual_status_enum,
                fact_results=[],
                expected_fact_count=len(expected_facts),
                matched_fact_count=0,
                fact_coverage=0.0,
                status_correct=False,
                answer_correct=False,
                category=case["category"],
                infrastructure_failed=True
            )
            
        fact_results = []
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
            try:
                passed_facts = 0
                for fact in expected_facts:
                    if fact.match_type == "exact":
                        res = evaluate_exact_fact(fact, pipeline_output.answer_markdown)
                    else:
                        res = evaluate_semantic_fact(fact, pipeline_output.answer_markdown)
                    fact_results.append(res)
                    if res.passed:
                        passed_facts += 1
                fact_coverage = (passed_facts / len(expected_facts)) if expected_facts else 0.0
                answer_correct = (fact_coverage == 1.0)
            except InfrastructureError as e:
                return AnswerEvaluationResult(
                    case_id=case_id,
                    expected_status=expected_status,
                    actual_status=actual_status_enum,
                    fact_results=[],
                    expected_fact_count=len(expected_facts),
                    matched_fact_count=0,
                    fact_coverage=0.0,
                    status_correct=False,
                    answer_correct=False,
                    category=case["category"],
                    infrastructure_failed=True
                )
                
        return AnswerEvaluationResult(
            case_id=case_id,
            expected_status=expected_status,
            actual_status=actual_status_enum,
            fact_results=fact_results,
            expected_fact_count=len(expected_facts),
            matched_fact_count=sum(1 for f in fact_results if getattr(f, "passed", False)),
            fact_coverage=fact_coverage,
            status_correct=status_correct,
            answer_correct=answer_correct,
            category=case["category"],
            infrastructure_failed=False
        )

    def run(self, retrieval_cases: list, golden_cases: dict):
        pipeline_outputs = self.load_pipeline_outputs()
        c3_outputs = self.load_c3_outputs()
        
        for rcase in retrieval_cases:
            case_id = rcase["case_id"]
            golden = golden_cases[case_id]
            
            if case_id in c3_outputs and not c3_outputs[case_id].infrastructure_failed:
                continue
                
            if case_id not in pipeline_outputs or pipeline_outputs[case_id].infrastructure_failed:
                retrieved_chunks = [chunk for chunk in rcase["retrieved"] if chunk["score"] >= self.config.retrieval_threshold]
                p_out = self.execute_pipeline(golden, retrieved_chunks)
                self.append_pipeline_output(p_out)
                pipeline_outputs[case_id] = p_out
                
            p_out = pipeline_outputs[case_id]
            if not p_out.infrastructure_failed:
                c3_out = self.execute_c3(golden, p_out)
                self.append_c3_output(c3_out)
                c3_outputs[case_id] = c3_out
                if c3_out.infrastructure_failed:
                    print(f"Infrastructure failed during C3 for {case_id}")
            else:
                c3_out = self.execute_c3(golden, p_out)
                self.append_c3_output(c3_out)
                c3_outputs[case_id] = c3_out
                print(f"Infrastructure failed during Pipeline for {case_id}")

        final_c3_outputs = self.load_c3_outputs()
        results_list = list(final_c3_outputs.values())
        
        metrics = calculate_answer_metrics(results_list)
        
        total_cases = len(golden_cases)
        completed = len(results_list)
        infra_failures = sum(1 for r in results_list if r.infrastructure_failed)
        
        if completed == total_cases and infra_failures == 0:
            final_status = RunStatus.CERTIFIED_C3_BASELINE
        elif infra_failures > 0:
            final_status = RunStatus.INFRASTRUCTURE_BLOCKED
        else:
            final_status = RunStatus.PARTIAL
            
        self.update_manifest_status(final_status)
        
        # generate_answer_report expects list of AnswerEvaluationResult, AnswerMetrics, config dict
        generate_answer_report(str(self.run_dir), results_list, metrics, self.config.model_dump())

def load_data(retrieval_dir: str):
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
            
    return retrieval_cases, golden_cases
