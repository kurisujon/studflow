from pydantic import BaseModel
from typing import Optional, List, Dict
from enum import Enum
from schemas.ai_chat import ChatAnswerStatus

class MatchType(str, Enum):
    EXACT = "exact"
    SEMANTIC = "semantic"

class SemanticFactJudgment(str, Enum):
    PRESENT = "PRESENT"
    PARTIAL = "PARTIAL"
    ABSENT = "ABSENT"
    CONTRADICTED = "CONTRADICTED"

class ExpectedStatus(str, Enum):
    ANSWERED = "ANSWERED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"

class RunStatus(str, Enum):
    CERTIFIED_C3_BASELINE = "CERTIFIED_C3_BASELINE"
    PARTIAL = "PARTIAL"
    INFRASTRUCTURE_BLOCKED = "INFRASTRUCTURE_BLOCKED"

class RunConfig(BaseModel):
    dataset_version: str
    corpus_version: str
    retrieval_run_id: str
    retrieval_top_k: int
    retrieval_threshold: float
    generation_model: str
    generation_prompt_version: str
    citation_evaluator_version: str
    c3_evaluator_version: str
    
class RunManifest(BaseModel):
    run_id: str
    config: RunConfig
    status: RunStatus

class FrozenSurvivingClaim(BaseModel):
    claim_id: str
    claim_text: str

class PipelineOutput(BaseModel):
    case_id: str
    actual_status: ChatAnswerStatus
    answer_markdown: str
    retrieved_eids: List[str]
    retrieved_context: Optional[str] = None
    infrastructure_failed: bool
    error_message: Optional[str] = None
    surviving_claims: List[FrozenSurvivingClaim] = []

class ExpectedFact(BaseModel):
    id: str
    canonical: str
    required_terms: Optional[list[str]] = None
    match_type: MatchType

class FactEvaluationResult(BaseModel):
    fact_id: str
    match_type: MatchType
    passed: bool
    score: Optional[float] = None
    reason: Optional[str] = None
    judgment: Optional[SemanticFactJudgment] = None

class AnswerEvaluationResult(BaseModel):
    case_id: str
    expected_status: ExpectedStatus
    actual_status: ChatAnswerStatus
    fact_results: list[FactEvaluationResult]
    expected_fact_count: int
    matched_fact_count: int
    fact_coverage: Optional[float]
    status_correct: bool
    answer_correct: bool
    category: str
    infrastructure_failed: bool = False

class CategoryMetrics(BaseModel):
    exact_accuracy: float
    semantic_accuracy: float
    overall_accuracy: float
    mean_fact_coverage: float
    complete_answer_rate: float
    partial_answer_rate: float
    status_accuracy: float
    correct_abstention_rate: float
    incorrect_answer_rate: float
    contradiction_rate: float
    case_count: int
    infrastructure_failure_count: int

class AnswerMetrics(BaseModel):
    overall: CategoryMetrics
    per_category: dict[str, CategoryMetrics]
