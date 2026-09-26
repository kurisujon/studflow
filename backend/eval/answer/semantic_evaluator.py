from pydantic import BaseModel, Field
from eval.answer.models import ExpectedFact, FactEvaluationResult, SemanticFactJudgment
from eval.judge import judge_structured

class RawSemanticFactEvaluation(BaseModel):
    judgment: SemanticFactJudgment = Field(
        description="Whether the fact is PRESENT, PARTIAL, ABSENT, or CONTRADICTED in the final answer."
    )
    reasoning: str = Field(
        description="A brief explanation for the judgment."
    )

def evaluate_semantic_fact(expected_fact: ExpectedFact, answer_markdown: str) -> FactEvaluationResult:
    prompt = f"""
Evaluate whether the expected fact is communicated correctly in the final answer.
Focus ONLY on whether the factual meaning is present. Do not evaluate citations or formatting.

Expected Fact:
"{expected_fact.canonical}"

Final Answer:
"{answer_markdown}"
"""
    # Judge failures raise InfrastructureError so the case is retried rather
    # than silently scored as ABSENT.
    raw_result = judge_structured(prompt, RawSemanticFactEvaluation)
    passed = (raw_result.judgment == SemanticFactJudgment.PRESENT)
    return FactEvaluationResult(
        fact_id=expected_fact.id,
        match_type="semantic",
        passed=passed,
        score=1.0 if passed else 0.0,
        reason=raw_result.reasoning,
        judgment=raw_result.judgment
    )
