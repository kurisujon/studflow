from pydantic import BaseModel, Field
from eval.answer.models import ExpectedFact, FactEvaluationResult, SemanticFactJudgment
from services.llm_provider import _generate_structured

class RawSemanticFactEvaluation(BaseModel):
    judgment: SemanticFactJudgment = Field(
        description="PRESENT if the answer communicates the fact fully. "
                    "PARTIAL if it communicates part of it. "
                    "ABSENT if the fact is not in the answer. "
                    "CONTRADICTED if the answer states something logically opposing the fact."
    )
    reason: str = Field(description="Brief explanation of the judgment.")

def evaluate_semantic_fact(fact: ExpectedFact, answer_text: str) -> FactEvaluationResult:
    if not answer_text.strip():
        return FactEvaluationResult(
            fact_id=fact.id,
            match_type=fact.match_type,
            passed=False,
            judgment=SemanticFactJudgment.ABSENT,
            reason="Answer is empty."
        )

    prompt = f"""
You are an expert evaluator grading a factual answer. 
You must determine if the final answer communicates the following expected fact.

Expected Fact:
{fact.canonical}

Final Answer:
{answer_text}

Does the final answer communicate this expected fact? 
Classify as PRESENT, PARTIAL, ABSENT, or CONTRADICTED.
"""
    try:
        raw_eval = _generate_structured(
            prompt=prompt,
            response_schema=RawSemanticFactEvaluation,
            
        )
        passed = raw_eval.judgment == SemanticFactJudgment.PRESENT
        
        return FactEvaluationResult(
            fact_id=fact.id,
            match_type=fact.match_type,
            passed=passed,
            judgment=raw_eval.judgment,
            reason=raw_eval.reason
        )
    except Exception as e:
        return FactEvaluationResult(
            fact_id=fact.id,
            match_type=fact.match_type,
            passed=False,
            judgment=SemanticFactJudgment.ABSENT,
            reason=f"Evaluation error: {str(e)}"
        )
