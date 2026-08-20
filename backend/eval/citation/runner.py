import json
from pathlib import Path
from eval.answer.models import PipelineOutput, RunConfig, RunManifest
from eval.answer.exceptions import InfrastructureError
from eval.citation.models import CitationEvaluationResult, ClaimCitationResult, CaseCitationResult, CitationCorrectnessJudgment
from eval.citation.evaluator import evaluate_citation_correctness
from eval.citation.metrics import calculate_citation_metrics

class C5Runner:
    def __init__(self, c3_run_dir: str):
        self.run_dir = Path(c3_run_dir)
        self.manifest_path = self.run_dir / "manifest.json"
        self.pipeline_path = self.run_dir / "pipeline_outputs.jsonl"
        self.citations_path = self.run_dir / "citation_evaluations.jsonl"
        
        self.config = self._load_manifest_config()

    def _load_manifest_config(self) -> RunConfig:
        if not self.manifest_path.exists():
            raise FileNotFoundError("Manifest not found. C5 must run on a C3 directory.")
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

    def load_completed_citations(self) -> dict[str, dict[str, dict[str, CitationEvaluationResult]]]:
        outputs = {}
        if self.citations_path.exists():
            with open(self.citations_path, "r") as f:
                for line in f:
                    if line.strip():
                        cr = CitationEvaluationResult(**json.loads(line))
                        if cr.case_id not in outputs:
                            outputs[cr.case_id] = {}
                        if cr.claim_id not in outputs[cr.case_id]:
                            outputs[cr.case_id][cr.claim_id] = {}
                        outputs[cr.case_id][cr.claim_id][cr.evidence_id] = cr
        return outputs

    def append_citation_output(self, output: CitationEvaluationResult):
        with open(self.citations_path, "a") as f:
            f.write(json.dumps(output.model_dump()) + "\n")

    def run(self, golden_cases: dict):
        print("RUN START")
        pipeline_outputs = self.load_pipeline_outputs()
        completed_cits = self.load_completed_citations()
            
        case_results = []
        
        for case_id, po in pipeline_outputs.items():
            if po.infrastructure_failed:
                continue
                
            golden = golden_cases.get(case_id)
            if not golden: continue
            category = golden["category"]
            
            if not po.surviving_claims:
                case_results.append(CaseCitationResult(
                    case_id=case_id,
                    claim_results=[],
                    category=category,
                    infrastructure_failed=False
                ))
                continue
                
            claim_results = []
            
            for claim in po.surviving_claims:
                if not claim.cited_evidence_ids:
                    cr = ClaimCitationResult(
                        case_id=case_id,
                        claim_id=claim.claim_id,
                        claim_text=claim.claim_text,
                        citation_results=[],
                        correct_citation_count=0,
                        partial_citation_count=0,
                        incorrect_citation_count=0,
                        has_correct_citation=False,
                        all_citations_correct=False,
                        missing_citation=True,
                        citation_precision=None,
                        fully_cited=False
                    )
                    claim_results.append(cr)
                    continue
                    
                cit_results = []
                claim_infra_failed = False
                
                for eid in claim.cited_evidence_ids:
                    if eid not in po.evidence_map:
                        cr = CitationEvaluationResult(
                            case_id=case_id,
                            claim_id=claim.claim_id,
                            evidence_id=eid,
                            judgment=CitationCorrectnessJudgment.INCORRECT,
                            reason="Artifact Error: Unknown evidence ID not found in frozen evidence map.",
                            infrastructure_failed=True
                        )
                        cit_results.append(cr)
                        claim_infra_failed = True
                        continue
                        
                    if case_id in completed_cits and claim.claim_id in completed_cits[case_id] and eid in completed_cits[case_id][claim.claim_id]:
                        cr = completed_cits[case_id][claim.claim_id][eid]
                        if not cr.infrastructure_failed:
                            cit_results.append(cr)
                            continue
                            
                    try:
                        cr = evaluate_citation_correctness(
                            case_id=case_id,
                            claim_id=claim.claim_id,
                            evidence_id=eid,
                            claim_text=claim.claim_text,
                            cited_chunk_text=po.evidence_map[eid]
                        )
                    except InfrastructureError as e:
                        cr = CitationEvaluationResult(
                            case_id=case_id,
                            claim_id=claim.claim_id,
                            evidence_id=eid,
                            judgment=CitationCorrectnessJudgment.INCORRECT,
                            reason=str(e),
                            infrastructure_failed=True
                        )
                        
                    self.append_citation_output(cr)
                    cit_results.append(cr)
                    
                    if cr.infrastructure_failed:
                        claim_infra_failed = True

                if claim_infra_failed:
                    cr = ClaimCitationResult(
                        case_id=case_id, claim_id=claim.claim_id, claim_text=claim.claim_text,
                        citation_results=cit_results, correct_citation_count=0, partial_citation_count=0,
                        incorrect_citation_count=0, has_correct_citation=False, all_citations_correct=False,
                        missing_citation=False, citation_precision=None, fully_cited=False, infrastructure_failed=True
                    )
                    claim_results.append(cr)
                    continue

                correct = sum(1 for c in cit_results if c.judgment == "CORRECT")
                partial = sum(1 for c in cit_results if c.judgment == "PARTIAL")
                incorrect = sum(1 for c in cit_results if c.judgment == "INCORRECT")
                total = len(cit_results)
                
                prec = (correct / total) if total > 0 else None
                fully = (correct == total) if total > 0 else False
                has_corr = correct > 0
                
                cr = ClaimCitationResult(
                    case_id=case_id,
                    claim_id=claim.claim_id,
                    claim_text=claim.claim_text,
                    citation_results=cit_results,
                    correct_citation_count=correct,
                    partial_citation_count=partial,
                    incorrect_citation_count=incorrect,
                    has_correct_citation=has_corr,
                    all_citations_correct=fully,
                    missing_citation=False,
                    citation_precision=prec,
                    fully_cited=fully
                )
                claim_results.append(cr)
                
            case_results.append(CaseCitationResult(
                case_id=case_id,
                claim_results=claim_results,
                category=category
            ))
            
        metrics = calculate_citation_metrics(case_results)
        with open(self.run_dir / "c5_metrics.json", "w") as f:
            f.write(json.dumps(metrics.model_dump(), indent=2))
            
        return metrics
