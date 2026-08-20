import json
import sys
from pathlib import Path
from eval.answer.models import PipelineOutput, RunConfig, RunManifest, RunStatus
from eval.answer.exceptions import ConfigMismatchError, InfrastructureError
from eval.groundedness.models import ClaimGroundednessResult, CaseGroundednessResult, GroundednessJudgment
from eval.groundedness.evaluator import evaluate_claim_groundedness
from eval.groundedness.metrics import calculate_groundedness_metrics

class C4Runner:
    def __init__(self, c3_run_dir: str):
        self.run_dir = Path(c3_run_dir)
        self.manifest_path = self.run_dir / "manifest.json"
        self.pipeline_path = self.run_dir / "pipeline_outputs.jsonl"
        self.claims_path = self.run_dir / "groundedness_claims.jsonl"
        
        self.config = self._load_manifest_config()

    def _load_manifest_config(self) -> RunConfig:
        if not self.manifest_path.exists():
            raise FileNotFoundError("Manifest not found. C4 must run on a C3 directory.")
        with open(self.manifest_path, "r") as f:
            data = json.load(f)
        return RunConfig(**data["config"])

    def load_pipeline_outputs(self) -> dict[str, PipelineOutput]:
        outputs = {}
        if self.pipeline_path.exists():
            with open(self.pipeline_path, "r") as f:
                for line in f:
                    if line.strip():
                        po = PipelineOutput(**json.loads(line))
                        outputs[po.case_id] = po
        return outputs

    def load_completed_claims(self) -> dict[str, dict[str, ClaimGroundednessResult]]:
        outputs = {}
        if self.claims_path.exists():
            with open(self.claims_path, "r") as f:
                for line in f:
                    if line.strip():
                        cr = ClaimGroundednessResult(**json.loads(line))
                        if cr.case_id not in outputs:
                            outputs[cr.case_id] = {}
                        outputs[cr.case_id][cr.claim_id] = cr
        return outputs

    def append_claim_output(self, output: ClaimGroundednessResult):
        with open(self.claims_path, "a") as f:
            f.write(json.dumps(output.model_dump()) + "\n")

    def run(self, golden_cases: dict):
        pipeline_outputs = self.load_pipeline_outputs()
        completed_claims = self.load_completed_claims()
            
        case_results = []
        
        for case_id, po in pipeline_outputs.items():
            if po.infrastructure_failed:
                continue
                
            golden = golden_cases[case_id]
            category = golden["category"]
            
            if not po.surviving_claims:
                case_results.append(CaseGroundednessResult(
                    case_id=case_id,
                    claim_results=[],
                    grounded_claim_count=0,
                    partial_claim_count=0,
                    ungrounded_claim_count=0,
                    contradicted_claim_count=0,
                    strict_groundedness_rate=None,
                    fully_grounded=None,
                    category=category
                ))
                continue
                
            claim_results_for_case = []
            context = po.retrieved_context or ""
            
            for frozen_claim in po.surviving_claims:
                claim_id = frozen_claim.claim_id
                
                # Resumability check
                if case_id in completed_claims and claim_id in completed_claims[case_id]:
                    cr = completed_claims[case_id][claim_id]
                    if not cr.infrastructure_failed:
                        claim_results_for_case.append(cr)
                        continue
                        
                # Evaluate missing or failed claim
                try:
                    cr = evaluate_claim_groundedness(case_id, claim_id, frozen_claim.claim_text, context)
                except InfrastructureError as e:
                    cr = ClaimGroundednessResult(
                        case_id=case_id, claim_id=claim_id, claim_text=frozen_claim.claim_text,
                        judgment=GroundednessJudgment.UNGROUNDED, reason=str(e), infrastructure_failed=True
                    )
                
                self.append_claim_output(cr)
                claim_results_for_case.append(cr)
                
            # If all claims in case evaluated successfully, build Case result
            if all(not cr.infrastructure_failed for cr in claim_results_for_case):
                grounded = sum(1 for c in claim_results_for_case if c.judgment == "GROUNDED")
                partial = sum(1 for c in claim_results_for_case if c.judgment == "PARTIAL")
                ungrounded = sum(1 for c in claim_results_for_case if c.judgment == "UNGROUNDED")
                contradicted = sum(1 for c in claim_results_for_case if c.judgment == "CONTRADICTED")
                
                rate = grounded / len(claim_results_for_case) if claim_results_for_case else None
                fully = (rate == 1.0) if rate is not None else None
                
                case_results.append(CaseGroundednessResult(
                    case_id=case_id,
                    claim_results=claim_results_for_case,
                    grounded_claim_count=grounded,
                    partial_claim_count=partial,
                    ungrounded_claim_count=ungrounded,
                    contradicted_claim_count=contradicted,
                    strict_groundedness_rate=rate,
                    fully_grounded=fully,
                    category=category
                ))
                
        metrics = calculate_groundedness_metrics(case_results)
        
        with open(self.run_dir / "c4_metrics.json", "w") as f:
            f.write(json.dumps(metrics.model_dump(), indent=2))
            
        return metrics
