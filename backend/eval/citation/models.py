from pydantic import BaseModel
from typing import Optional, List, Dict
from enum import Enum

class CitationCorrectnessJudgment(str, Enum):
    CORRECT = "CORRECT"
    PARTIAL = "PARTIAL"
    INCORRECT = "INCORRECT"
    MISSING = "MISSING"

class CitationEvaluationResult(BaseModel):
    case_id: str
    claim_id: str
    evidence_id: Optional[str] = None
    judgment: CitationCorrectnessJudgment
    reason: str
    infrastructure_failed: bool = False

class ClaimCitationResult(BaseModel):
    case_id: str
    claim_id: str
    claim_text: str
    citation_results: List[CitationEvaluationResult]
    
    correct_citation_count: int
    partial_citation_count: int
    incorrect_citation_count: int
    has_correct_citation: bool
    all_citations_correct: bool
    missing_citation: bool
    
    citation_precision: Optional[float]
    fully_cited: bool
    infrastructure_failed: bool = False

class CaseCitationResult(BaseModel):
    case_id: str
    claim_results: List[ClaimCitationResult]
    category: str
    infrastructure_failed: bool = False

class CitationCategoryMetrics(BaseModel):
    strict_citation_accuracy: float
    fully_cited_claim_rate: float
    missing_citation_rate: float
    partial_citation_rate: float
    incorrect_citation_rate: float
    citation_precision: float
    applicable_claim_count: int
    evaluated_citation_count: int
    infrastructure_failure_count: int

class CitationMetrics(BaseModel):
    overall: CitationCategoryMetrics
    per_category: Dict[str, CitationCategoryMetrics]
