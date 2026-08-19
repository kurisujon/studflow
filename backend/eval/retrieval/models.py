from pydantic import BaseModel, Field

class RetrievedChunkMatch(BaseModel):
    chunk_id: str
    rank: int
    score: float
    text: str
    anchors: set[str] = Field(default_factory=set)

class RetrievalCaseResult(BaseModel):
    case_id: str
    category: str
    difficulty: str
    expected_anchors: set[str] = Field(default_factory=set)
    retrieved: list[RetrievedChunkMatch] = Field(default_factory=list)
    top_score: float = 0.0
    threshold_passed: bool = False
    should_abstain: bool = False

class RetrievalMetrics(BaseModel):
    hit_rate_at_k: float
    anchor_coverage_at_k: float
    complete_evidence_rate_at_k: float
    mrr: float
    precision_at_k: float

class ConfusionMatrix(BaseModel):
    correct_proceed: int
    false_abstention: int
    missed_abstention: int
    correct_abstention: int

class AggregateReport(BaseModel):
    run_id: str
    timestamp: str
    dataset_version: str
    corpus_version: str
    embedding_model: str
    retrieval_top_k: int
    retrieval_threshold: float
    answerable_metrics: RetrievalMetrics
    negative_confusion_matrix: ConfusionMatrix
