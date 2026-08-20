from pydantic import BaseModel
from typing import Optional
from enum import Enum

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

class ChatAnswerStatus(str, Enum):
    ANSWERED = "ANSWERED"
    PARTIALLY_ANSWERED = "PARTIALLY_ANSWERED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    FAILED = "FAILED"

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

class AnswerMetrics(BaseModel):
    overall: CategoryMetrics
    per_category: dict[str, CategoryMetrics]
