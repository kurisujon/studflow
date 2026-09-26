from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from eval.answer.models import AnswerMetrics, RunConfig, RunManifest
from eval.citation.models import CitationMetrics
from eval.groundedness.models import GroundednessMetrics
from eval.retrieval.models import AggregateReport


class Direction(str, Enum):
    HIGHER = "higher"            # higher is better; may drop by tolerance
    LOWER = "lower"              # lower is better; may rise by tolerance
    NO_INCREASE = "no_increase"  # safety metric; any increase is a regression
    INFO = "info"                # reported only, never gated


class MetricRule(BaseModel):
    direction: Direction
    # Count field (in the same metrics block) that the rate is computed over.
    # Tolerance is `tolerance_cases / denominator`. When unset the metric is an
    # absolute count and tolerance is `tolerance_cases` itself.
    denominator: Optional[str] = None


class SuiteThresholds(BaseModel):
    tolerance_cases: int = Field(default=1, ge=0)
    rules: Dict[str, MetricRule]


class Thresholds(BaseModel):
    suites: Dict[str, SuiteThresholds]


class ReportStatus(str, Enum):
    PASS = "PASS"
    REGRESSION = "REGRESSION"
    INTEGRITY_ERROR = "INTEGRITY_ERROR"


class MetricDelta(BaseModel):
    suite: str
    scope: str
    metric: str
    direction: Direction
    baseline: float
    candidate: float
    delta: float
    allowed: Optional[float]
    passed: bool


class VerifiedRun(BaseModel):
    """A run directory whose artifacts passed every integrity check."""
    run_dir: str
    manifest: RunManifest
    case_ids: List[str]
    retrieval: AggregateReport
    answer: AnswerMetrics
    groundedness: GroundednessMetrics
    citation: CitationMetrics


class RegressionReport(BaseModel):
    status: ReportStatus
    generated_at: datetime
    baseline_run: str
    candidate_run: Optional[str] = None
    integrity_only: bool
    integrity_errors: List[str] = Field(default_factory=list)
    config_changes: Dict[str, Dict[str, Optional[str]]] = Field(default_factory=dict)
    deltas: List[MetricDelta] = Field(default_factory=list)

    @property
    def regressions(self) -> List[MetricDelta]:
        return [d for d in self.deltas if not d.passed]


def config_changes(baseline: RunConfig, candidate: RunConfig) -> Dict[str, Dict[str, Optional[str]]]:
    base, cand = baseline.model_dump(), candidate.model_dump()
    return {
        key: {"baseline": _str_or_none(base.get(key)), "candidate": _str_or_none(cand.get(key))}
        for key in sorted(set(base) | set(cand))
        if base.get(key) != cand.get(key)
    }


def _str_or_none(value) -> Optional[str]:
    return None if value is None else str(value)
