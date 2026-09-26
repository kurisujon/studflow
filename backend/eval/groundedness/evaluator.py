from pydantic import BaseModel, Field
from eval.groundedness.models import ClaimGroundednessResult, GroundednessJudgment
from eval.judge import judge_structured

class RawClaimGroundedness(BaseModel):
    judgment: GroundednessJudgment = Field(
        description="Whether the claim is GROUNDED, PARTIAL, UNGROUNDED, or CONTRADICTED by the context."
    )
    reasoning: str = Field(
        description="A brief explanation for the judgment."
    )

def evaluate_claim_groundedness(case_id: str, claim_id: str, claim_text: str, retrieved_context: str) -> ClaimGroundednessResult:
    prompt = f"""
Evaluate whether the following claim is supported by the provided retrieved context.

Claim:
"{claim_text}"

Retrieved Context:
{retrieved_context}

Evaluate the entire claim. Use these strict definitions:
- GROUNDED: the retrieved context fully supports the factual meaning of the entire claim.
- PARTIAL: some material portion is supported, but at least one meaningful part is not established.
- UNGROUNDED: retrieved context does not establish the claim.
- CONTRADICTED: retrieved context provides evidence inconsistent with the claim.
"""
    raw_result = judge_structured(prompt, RawClaimGroundedness)
    return ClaimGroundednessResult(
        case_id=case_id,
        claim_id=claim_id,
        claim_text=claim_text,
        judgment=raw_result.judgment,
        reason=raw_result.reasoning,
        infrastructure_failed=False
    )
