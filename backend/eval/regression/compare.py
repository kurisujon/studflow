"""C6 regression comparison.

Deterministic, LLM-free checks that a run directory is a trustworthy certified
C3/C4/C5 run, plus per-metric deltas of a candidate run against the frozen
baseline under the tolerance policy in ``thresholds.json``.
"""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, TypeVar

from pydantic import BaseModel, ValidationError

from eval.answer.models import (
    AnswerEvaluationResult, AnswerMetrics, CategoryMetrics, PipelineOutput, RunManifest, RunStatus,
)
from eval.citation.models import CitationCategoryMetrics, CitationMetrics
from eval.groundedness.models import GroundednessCategoryMetrics, GroundednessMetrics
from eval.regression.models import (
    Direction, MetricDelta, MetricRule, RegressionReport, ReportStatus, Thresholds, VerifiedRun,
    config_changes,
)
from eval.retrieval.models import AggregateReport, ConfusionMatrix, RetrievalMetrics

RESULTS_ROOT = Path(__file__).resolve().parent.parent / "results"
THRESHOLDS_PATH = Path(__file__).resolve().parent / "thresholds.json"

EXIT_CODES = {
    ReportStatus.PASS: 0,
    ReportStatus.REGRESSION: 1,
    ReportStatus.INTEGRITY_ERROR: 2,
}

# Float noise guard for rate comparisons.
EPSILON = 1e-9

_C2_DERIVED_COUNTS = ("answerable_case_count", "negative_case_count")

SUITE_FIELDS: dict[str, set[str]] = {
    "c2_retrieval": set(RetrievalMetrics.model_fields) | set(ConfusionMatrix.model_fields) | set(_C2_DERIVED_COUNTS),
    "c3_answer": set(CategoryMetrics.model_fields),
    "c4_groundedness": set(GroundednessCategoryMetrics.model_fields),
    "c5_citation": set(CitationCategoryMetrics.model_fields),
}

M = TypeVar("M", bound=BaseModel)


class ThresholdConfigError(ValueError):
    """Raised when thresholds.json references unknown suites or metrics."""


# ---------------------------------------------------------------------------
# Thresholds
# ---------------------------------------------------------------------------

def load_thresholds(path: Path = THRESHOLDS_PATH) -> Thresholds:
    try:
        thresholds = Thresholds.model_validate_json(Path(path).read_text())
    except (OSError, ValidationError) as exc:
        raise ThresholdConfigError(f"Cannot load thresholds from {path}: {exc}") from exc

    missing = set(SUITE_FIELDS) - set(thresholds.suites)
    unknown = set(thresholds.suites) - set(SUITE_FIELDS)
    if missing or unknown:
        raise ThresholdConfigError(
            f"thresholds.json suites mismatch (missing: {sorted(missing)}, unknown: {sorted(unknown)})."
        )

    for suite, config in thresholds.suites.items():
        fields = SUITE_FIELDS[suite]
        for metric, rule in config.rules.items():
            if metric not in fields:
                raise ThresholdConfigError(f"{suite}: unknown metric '{metric}'.")
            if rule.denominator and rule.denominator not in fields:
                raise ThresholdConfigError(f"{suite}.{metric}: unknown denominator '{rule.denominator}'.")
    return thresholds


# ---------------------------------------------------------------------------
# Integrity
# ---------------------------------------------------------------------------

def content_hash(output: PipelineOutput) -> str:
    """Recompute the hash exactly as the C3 runner does: over the output with
    ``content_hash`` unset."""
    unhashed = output.model_copy(update={"content_hash": None})
    return hashlib.sha256(unhashed.model_dump_json().encode()).hexdigest()


def _load_json_model(path: Path, model: type[M], errors: list[str], key: Optional[str] = None) -> Optional[M]:
    if not path.exists():
        errors.append(f"{path.name} is missing.")
        return None
    try:
        data = json.loads(path.read_text())
        return model.model_validate(data[key] if key else data)
    except (json.JSONDecodeError, KeyError, TypeError, ValidationError) as exc:
        errors.append(f"{path.name} is not a valid {model.__name__}: {exc}")
        return None


def _load_latest_rows(path: Path, model: type[M], errors: list[str]) -> dict[str, M]:
    """Load an append-only checkpoint file; the latest row per case wins."""
    rows: dict[str, M] = {}
    if not path.exists():
        errors.append(f"{path.name} is missing.")
        return rows
    with open(path, "r") as f:
        for lineno, line in enumerate(f, start=1):
            if not line.strip():
                continue
            try:
                row = model(**json.loads(line))
            except (json.JSONDecodeError, TypeError, ValidationError) as exc:
                errors.append(f"{path.name}:{lineno} is not a valid {model.__name__}: {exc}")
                continue
            rows[row.case_id] = row
    return rows


def locate_retrieval_summary(run_dir: Path, retrieval_run_id: str) -> Optional[Path]:
    for root in (run_dir.parent, RESULTS_ROOT):
        path = root / retrieval_run_id / "summary.json"
        if path.exists():
            return path
    return None


def verify_run(run_dir: str | Path) -> tuple[Optional[VerifiedRun], list[str]]:
    """Check every artifact of a run directory. Returns the verified run, or
    ``None`` with the full list of problems found."""
    run_dir = Path(run_dir)
    if not run_dir.is_dir():
        return None, [f"{run_dir}: not a directory."]

    errors: list[str] = []

    manifest = _load_json_model(run_dir / "manifest.json", RunManifest, errors)
    if manifest and manifest.status != RunStatus.CERTIFIED_C3_BASELINE:
        errors.append(f"manifest status is {manifest.status.value}, not {RunStatus.CERTIFIED_C3_BASELINE.value}.")

    pipeline = _load_latest_rows(run_dir / "pipeline_outputs.jsonl", PipelineOutput, errors)
    if (run_dir / "pipeline_outputs.jsonl").exists() and not pipeline:
        errors.append("pipeline_outputs.jsonl contains no outputs.")
    for case_id, output in sorted(pipeline.items()):
        if output.infrastructure_failed:
            errors.append(f"pipeline output {case_id} is infrastructure-failed.")
        elif output.content_hash is None:
            errors.append(f"pipeline output {case_id} has no content_hash.")
        elif output.content_hash != content_hash(output):
            errors.append(f"pipeline output {case_id} fails content_hash verification.")

    answers = _load_latest_rows(run_dir / "answer_cases.jsonl", AnswerEvaluationResult, errors)
    for case_id, result in sorted(answers.items()):
        if result.infrastructure_failed:
            errors.append(f"answer case {case_id} is infrastructure-failed.")
    if pipeline and answers and set(pipeline) != set(answers):
        errors.append(
            "answer_cases.jsonl and pipeline_outputs.jsonl cover different cases "
            f"(no answer: {sorted(set(pipeline) - set(answers))}, "
            f"no pipeline output: {sorted(set(answers) - set(pipeline))})."
        )

    answer = _load_json_model(run_dir / "answer_summary.json", AnswerMetrics, errors, key="metrics")
    groundedness = _load_json_model(run_dir / "c4_metrics.json", GroundednessMetrics, errors)
    citation = _load_json_model(run_dir / "c5_metrics.json", CitationMetrics, errors)
    for name, metrics in (
        ("answer_summary.json", answer),
        ("c4_metrics.json", groundedness),
        ("c5_metrics.json", citation),
    ):
        if metrics and metrics.overall.infrastructure_failure_count:
            errors.append(f"{name} reports {metrics.overall.infrastructure_failure_count} infrastructure failures.")
    if answer and answers and answer.overall.case_count != len(answers):
        errors.append(
            f"answer_summary.json case_count {answer.overall.case_count} != {len(answers)} answer cases."
        )

    retrieval = None
    if manifest:
        retrieval_run_id = manifest.config.retrieval_run_id
        summary_path = locate_retrieval_summary(run_dir, retrieval_run_id)
        if summary_path is None:
            errors.append(f"C2 summary.json for retrieval run {retrieval_run_id} not found.")
        else:
            retrieval = _load_json_model(summary_path, AggregateReport, errors)
            if retrieval and retrieval.run_id != retrieval_run_id:
                errors.append(f"C2 summary run_id {retrieval.run_id} != manifest retrieval_run_id {retrieval_run_id}.")
            if retrieval and retrieval.dataset_version != manifest.config.dataset_version:
                errors.append(
                    f"C2 dataset_version {retrieval.dataset_version} != "
                    f"manifest dataset_version {manifest.config.dataset_version}."
                )

    if errors:
        return None, [f"{run_dir.name}: {error}" for error in errors]

    return VerifiedRun(
        run_dir=str(run_dir),
        manifest=manifest,
        case_ids=sorted(pipeline),
        retrieval=retrieval,
        answer=answer,
        groundedness=groundedness,
        citation=citation,
    ), []


# ---------------------------------------------------------------------------
# Comparison
# ---------------------------------------------------------------------------

def _c2_values(report: AggregateReport) -> dict[str, float]:
    matrix = report.negative_confusion_matrix
    return {
        **report.answerable_metrics.model_dump(),
        **matrix.model_dump(),
        "answerable_case_count": matrix.correct_proceed + matrix.false_abstention,
        "negative_case_count": matrix.missed_abstention + matrix.correct_abstention,
    }


def _scoped(metrics: AnswerMetrics | GroundednessMetrics | CitationMetrics) -> dict[str, dict[str, float]]:
    scopes = {"overall": metrics.overall.model_dump()}
    for category, values in sorted(metrics.per_category.items()):
        scopes[f"category:{category}"] = values.model_dump()
    return scopes


def suite_scopes(run: VerifiedRun) -> dict[str, dict[str, dict[str, float]]]:
    return {
        "c2_retrieval": {"overall": _c2_values(run.retrieval)},
        "c3_answer": _scoped(run.answer),
        "c4_groundedness": _scoped(run.groundedness),
        "c5_citation": _scoped(run.citation),
    }


def evaluate_metric(
    suite: str,
    scope: str,
    metric: str,
    rule: MetricRule,
    tolerance_cases: int,
    baseline: dict[str, float],
    candidate: dict[str, float],
) -> MetricDelta:
    base_value, cand_value = float(baseline[metric]), float(candidate[metric])
    delta = cand_value - base_value

    if rule.direction == Direction.INFO:
        allowed = None
        passed = True
    else:
        if rule.direction == Direction.NO_INCREASE:
            allowed = 0.0
        elif rule.denominator:
            # Baseline denominator defines "one case's worth"; fall back to the
            # candidate's when the baseline scope was empty.
            n = baseline[rule.denominator] or candidate[rule.denominator]
            allowed = tolerance_cases / n if n else 0.0
        else:
            allowed = float(tolerance_cases)

        if rule.direction == Direction.HIGHER:
            passed = delta >= -allowed - EPSILON
        else:
            passed = delta <= allowed + EPSILON

    return MetricDelta(
        suite=suite, scope=scope, metric=metric, direction=rule.direction,
        baseline=base_value, candidate=cand_value, delta=delta, allowed=allowed, passed=passed,
    )


def compare_runs(
    baseline: VerifiedRun, candidate: VerifiedRun, thresholds: Thresholds
) -> tuple[list[MetricDelta], list[str]]:
    errors: list[str] = []
    base_config, cand_config = baseline.manifest.config, candidate.manifest.config
    for field in ("dataset_version", "corpus_version"):
        if getattr(base_config, field) != getattr(cand_config, field):
            errors.append(
                f"{field} mismatch: baseline {getattr(base_config, field)} vs candidate {getattr(cand_config, field)}."
            )
    if set(baseline.case_ids) != set(candidate.case_ids):
        errors.append(
            "baseline and candidate cover different cases "
            f"(candidate missing: {sorted(set(baseline.case_ids) - set(candidate.case_ids))}, "
            f"candidate extra: {sorted(set(candidate.case_ids) - set(baseline.case_ids))})."
        )
    if errors:
        return [], errors

    deltas: list[MetricDelta] = []
    base_scopes, cand_scopes = suite_scopes(baseline), suite_scopes(candidate)
    for suite, config in thresholds.suites.items():
        for scope, base_values in base_scopes[suite].items():
            cand_values = cand_scopes[suite].get(scope)
            if cand_values is None:
                errors.append(f"{suite}: candidate has no '{scope}' metrics.")
                continue
            for metric, rule in config.rules.items():
                deltas.append(
                    evaluate_metric(suite, scope, metric, rule, config.tolerance_cases, base_values, cand_values)
                )
    return deltas, errors


def build_report(
    baseline_dir: str | Path,
    candidate_dir: Optional[str | Path] = None,
    *,
    integrity_only: bool = False,
    thresholds: Optional[Thresholds] = None,
) -> RegressionReport:
    if candidate_dir is None and not integrity_only:
        raise ValueError("A candidate run is required unless integrity_only is set.")

    thresholds = thresholds or load_thresholds()
    baseline, errors = verify_run(baseline_dir)
    candidate = None
    if candidate_dir is not None:
        candidate, candidate_errors = verify_run(candidate_dir)
        errors.extend(candidate_errors)

    deltas: list[MetricDelta] = []
    changes = {}
    if not errors and candidate is not None and not integrity_only:
        changes = config_changes(baseline.manifest.config, candidate.manifest.config)
        deltas, compare_errors = compare_runs(baseline, candidate, thresholds)
        errors.extend(compare_errors)

    if errors:
        status = ReportStatus.INTEGRITY_ERROR
    elif any(not d.passed for d in deltas):
        status = ReportStatus.REGRESSION
    else:
        status = ReportStatus.PASS

    return RegressionReport(
        status=status,
        generated_at=datetime.now(timezone.utc),
        baseline_run=str(baseline_dir),
        candidate_run=str(candidate_dir) if candidate_dir is not None else None,
        integrity_only=integrity_only,
        integrity_errors=errors,
        config_changes=changes,
        deltas=deltas,
    )


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def render_markdown(report: RegressionReport) -> str:
    lines = [
        f"# C6 Regression Report: {report.status.value}",
        "",
        f"- Baseline: `{report.baseline_run}`",
        f"- Candidate: `{report.candidate_run or 'n/a (integrity only)'}`",
        f"- Generated: {report.generated_at.isoformat()}",
        "",
    ]
    if report.integrity_errors:
        lines += ["## Integrity Errors", ""] + [f"- {error}" for error in report.integrity_errors] + [""]
    if report.config_changes:
        lines += ["## Config Changes", "", "| Field | Baseline | Candidate |", "|---|---|---|"]
        lines += [f"| {k} | {v['baseline']} | {v['candidate']} |" for k, v in report.config_changes.items()]
        lines.append("")
    if report.deltas:
        lines += [
            "## Metric Deltas",
            "",
            "| Suite | Scope | Metric | Baseline | Candidate | Delta | Allowed | Result |",
            "|---|---|---|---|---|---|---|---|",
        ]
        for d in report.deltas:
            allowed = "info" if d.allowed is None else f"{d.allowed:.4f}"
            result = "PASS" if d.passed else "**REGRESSION**"
            lines.append(
                f"| {d.suite} | {d.scope} | {d.metric} | {d.baseline:.4f} | {d.candidate:.4f} "
                f"| {d.delta:+.4f} | {allowed} | {result} |"
            )
        lines.append("")
    return "\n".join(lines)


def write_report(report: RegressionReport, output_dir: str | Path) -> tuple[Path, Path]:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / "regression_report.json"
    md_path = output_dir / "regression_report.md"
    json_path.write_text(report.model_dump_json(indent=2))
    md_path.write_text(render_markdown(report))
    return json_path, md_path
