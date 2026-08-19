import uuid
from enum import Enum
from pydantic import BaseModel, Field

class MatchType(str, Enum):
    exact = "exact"
    semantic = "semantic"

class ExpectedFact(BaseModel):
    id: str
    canonical: str
    required_terms: list[str] = Field(default_factory=list)
    match_type: MatchType

class ExpectedEvidence(BaseModel):
    anchor: str
    fact_ids: list[str]

class QuestionCategory(str, Enum):
    single_chunk = "single_chunk"
    multi_chunk = "multi_chunk"
    exact_term = "exact_term"
    semantic = "semantic"
    insufficient_evidence = "insufficient_evidence"
    citation_sensitive = "citation_sensitive"
    adversarial = "adversarial"
    ambiguous = "ambiguous"

class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"

class ExpectedStatus(str, Enum):
    ANSWERED = "ANSWERED"
    PARTIALLY_ANSWERED = "PARTIALLY_ANSWERED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"

class GoldenCase(BaseModel):
    id: str
    dataset_version: str
    source_id: str
    category: QuestionCategory
    difficulty: Difficulty
    question: str
    expected_facts: list[ExpectedFact]
    expected_evidence: list[ExpectedEvidence]
    expected_status: ExpectedStatus
    should_abstain: bool
    tags: list[str] = Field(default_factory=list)
    expected_behavior: str | None = None
