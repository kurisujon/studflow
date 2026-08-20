from pydantic import BaseModel
from typing import Optional, List, Dict
from enum import Enum

class GroundednessJudgment(str, Enum):
    GROUNDED = "GROUNDED"
    PARTIAL = "PARTIAL"
    UNGROUNDED = "UNGROUNDED"
    CONTRADICTED = "CONTRADICTED"

class ClaimGroundednessResult(BaseModel):
    case_id: str
    claim_id: str
    claim_text: str
    judgment: GroundednessJudgment
    reason: str
    infrastructure_failed: bool = False

class CaseGroundednessResult(BaseModel):
    case_id: str
    claim_results: List[ClaimGroundednessResult]
    grounded_claim_count: int
    partial_claim_count: int
    ungrounded_claim_count: int
    contradicted_claim_count: int
    strict_groundedness_rate: Optional[float]
    fully_grounded: Optional[bool]
    category: str

class GroundednessCategoryMetrics(BaseModel):
    strict_groundedness_rate: float
    fully_grounded_answer_rate: float
    partial_claim_rate: float
    ungrounded_claim_rate: float
    contradiction_rate: float
    applicable_case_count: int
    evaluated_claim_count: int
    infrastructure_failure_count: int

class GroundednessMetrics(BaseModel):
    overall: GroundednessCategoryMetrics
    per_category: Dict[str, GroundednessCategoryMetrics]
