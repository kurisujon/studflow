from pydantic import BaseModel, Field
from eval.groundedness.models import ClaimGroundednessResult, GroundednessJudgment
from eval.answer.exceptions import InfrastructureError
from services.llm_provider import _generate_structured, AIServiceError

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
    try:
        raw_result = _generate_structured(
            prompt=prompt,
            response_model=RawClaimGroundedness,
            model_name="gemini-1.5-flash"
        )
        return ClaimGroundednessResult(
            case_id=case_id,
            claim_id=claim_id,
            claim_text=claim_text,
            judgment=raw_result.judgment,
            reason=raw_result.reasoning,
            infrastructure_failed=False
        )
    except AIServiceError as e:
        raise InfrastructureError(str(e))
    except Exception as e:
        print(f"Groundedness evaluator exception: {e}")
        return ClaimGroundednessResult(
            case_id=case_id,
            claim_id=claim_id,
            claim_text=claim_text,
            judgment=GroundednessJudgment.UNGROUNDED,
            reason=f"Evaluation error: {str(e)}",
            infrastructure_failed=True
        )
