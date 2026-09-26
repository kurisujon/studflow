from pydantic import BaseModel, Field
from eval.citation.models import CitationEvaluationResult, CitationCorrectnessJudgment
from eval.judge import judge_structured

class RawCitationCorrectness(BaseModel):
    judgment: CitationCorrectnessJudgment = Field(
        description="Whether the citation is CORRECT, PARTIAL, INCORRECT, or MISSING."
    )
    reasoning: str = Field(
        description="A brief explanation for the judgment."
    )

def evaluate_citation_correctness(case_id: str, claim_id: str, evidence_id: str, claim_text: str, cited_chunk_text: str) -> CitationEvaluationResult:
    prompt = f"""
Evaluate whether the following cited evidence supports the specific claim.

Claim:
"{claim_text}"

Cited Evidence:
{cited_chunk_text}

Evaluate strictly based on the cited evidence provided.
- CORRECT: the cited evidence fully supports the claim.
- PARTIAL: the citation supports only part of the claim.
- INCORRECT: the evidence exists but does not support the claim.
"""
    raw_result = judge_structured(prompt, RawCitationCorrectness)
    return CitationEvaluationResult(
        case_id=case_id,
        claim_id=claim_id,
        evidence_id=evidence_id,
        judgment=raw_result.judgment,
        reason=raw_result.reasoning,
        infrastructure_failed=False
    )
