import hashlib
import json
from pathlib import Path

import pytest

from eval.answer.models import (
    AnswerEvaluationResult, AnswerMetrics, CategoryMetrics, ChatAnswerStatus, ExpectedStatus,
    FrozenSurvivingClaim, PipelineOutput, RunConfig, RunManifest, RunStatus,
)
from eval.citation.models import CitationCategoryMetrics, CitationMetrics
from eval.groundedness.models import GroundednessCategoryMetrics, GroundednessMetrics
from eval.regression.compare import ThresholdConfigError, build_report, load_thresholds
from eval.regression.models import ReportStatus
from eval.retrieval.models import AggregateReport, ConfusionMatrix, RetrievalMetrics
from eval.run_c6 import main as run_c6

RETRIEVAL_RUN_ID = "live_test"
CASE_IDS = ["case_1", "case_2", "case_3"]


def _answer_category(**overrides) -> CategoryMetrics:
    values = dict(
        exact_accuracy=0.8, semantic_accuracy=0.7, overall_accuracy=0.75, mean_fact_coverage=0.8,
        complete_answer_rate=0.7, partial_answer_rate=0.1, status_accuracy=0.9, correct_abstention_rate=1.0,
        incorrect_answer_rate=0.1, contradiction_rate=0.0, case_count=3, infrastructure_failure_count=0,
    )
    values.update(overrides)
    return CategoryMetrics(**values)


def _groundedness_category(**overrides) -> GroundednessCategoryMetrics:
    values = dict(
        strict_groundedness_rate=0.8, fully_grounded_answer_rate=0.5, partial_claim_rate=0.1,
        ungrounded_claim_rate=0.1, contradiction_rate=0.0, post_b6_ungrounded_leakage_rate=0.1,
        applicable_case_count=2, evaluated_claim_count=5, infrastructure_failure_count=0,
    )
    values.update(overrides)
    return GroundednessCategoryMetrics(**values)


def _citation_category(**overrides) -> CitationCategoryMetrics:
    values = dict(
        strict_citation_accuracy=0.8, fully_cited_claim_rate=0.8, missing_citation_rate=0.0,
        partial_citation_rate=0.1, incorrect_citation_rate=0.1, citation_precision=0.85,
        applicable_claim_count=5, evaluated_citation_count=6, infrastructure_failure_count=0,
    )
    values.update(overrides)
    return CitationCategoryMetrics(**values)


def _write_retrieval_summary(root: Path, **matrix_overrides):
    matrix = dict(correct_proceed=2, false_abstention=0, missed_abstention=0, correct_abstention=1)
    matrix.update(matrix_overrides)
    report = AggregateReport(
        run_id=RETRIEVAL_RUN_ID, timestamp="2026-09-24T00:00:00Z", dataset_version="v1", corpus_version="v1",
        embedding_model="test-embed", retrieval_top_k=5, retrieval_threshold=0.5,
        answerable_metrics=RetrievalMetrics(
            hit_rate_at_k=1.0, anchor_coverage_at_k=1.0, complete_evidence_rate_at_k=1.0, mrr=1.0, precision_at_k=0.9,
        ),
        negative_confusion_matrix=ConfusionMatrix(**matrix),
    )
    (root / RETRIEVAL_RUN_ID).mkdir(exist_ok=True)
    (root / RETRIEVAL_RUN_ID / "summary.json").write_text(report.model_dump_json(indent=2))


def make_run(
    root: Path,
    name: str,
    *,
    status: RunStatus = RunStatus.CERTIFIED_C3_BASELINE,
    corpus_version: str = "v1",
    generation_model: str = "gen-model",
    answer: dict | None = None,
    groundedness: dict | None = None,
    citation: dict | None = None,
) -> Path:
    run_dir = root / name
    run_dir.mkdir()
    if not (root / RETRIEVAL_RUN_ID / "summary.json").exists():
        _write_retrieval_summary(root)

    config = RunConfig(
        dataset_version="v1", corpus_version=corpus_version, retrieval_run_id=RETRIEVAL_RUN_ID,
        retrieval_top_k=5, retrieval_threshold=0.67, generation_model=generation_model,
        generation_prompt_version="1.0", citation_evaluator_version="1.0", c3_evaluator_version="1.0",
        judge_model="judge-model",
    )
    (run_dir / "manifest.json").write_text(
        RunManifest(run_id=name, config=config, status=status).model_dump_json(indent=2)
    )

    with open(run_dir / "pipeline_outputs.jsonl", "w") as f:
        # A superseded infrastructure failure: the latest row per case wins.
        failed = PipelineOutput(
            case_id="case_1", actual_status=ChatAnswerStatus.FAILED, answer_markdown="",
            retrieved_eids=[], infrastructure_failed=True, error_message="quota",
        )
        f.write(json.dumps(failed.model_dump()) + "\n")
        for case_id in CASE_IDS:
            po = PipelineOutput(
                case_id=case_id, actual_status=ChatAnswerStatus.ANSWERED, answer_markdown=f"Answer {case_id} [1]",
                retrieved_eids=["e_01"], retrieved_context="ctx", evidence_map={"e_01": "ctx"},
                infrastructure_failed=False,
                surviving_claims=[FrozenSurvivingClaim(claim_id="claim_01", claim_text="c", cited_evidence_ids=["e_01"])],
            )
            po.content_hash = hashlib.sha256(po.model_dump_json().encode()).hexdigest()
            f.write(json.dumps(po.model_dump()) + "\n")

    with open(run_dir / "answer_cases.jsonl", "w") as f:
        for case_id in CASE_IDS:
            result = AnswerEvaluationResult(
                case_id=case_id, expected_status=ExpectedStatus.ANSWERED, actual_status=ChatAnswerStatus.ANSWERED,
                fact_results=[], expected_fact_count=1, matched_fact_count=1, fact_coverage=1.0,
                status_correct=True, answer_correct=True, category="test",
            )
            f.write(result.model_dump_json() + "\n")

    answer_metrics = AnswerMetrics(
        overall=_answer_category(**(answer or {})), per_category={"test": _answer_category(**(answer or {}))}
    )
    (run_dir / "answer_summary.json").write_text(
        json.dumps({"timestamp": "t", "config": config.model_dump(), "metrics": answer_metrics.model_dump()})
    )
    g = _groundedness_category(**(groundedness or {}))
    (run_dir / "c4_metrics.json").write_text(GroundednessMetrics(overall=g, per_category={"test": g}).model_dump_json())
    c = _citation_category(**(citation or {}))
    (run_dir / "c5_metrics.json").write_text(CitationMetrics(overall=c, per_category={"test": c}).model_dump_json())
    return run_dir


def _tamper_first_hashed_output(run_dir: Path):
    path = run_dir / "pipeline_outputs.jsonl"
    lines = path.read_text().splitlines()
    row = json.loads(lines[-1])
    row["answer_markdown"] = "edited after the fact"
    lines[-1] = json.dumps(row)
    path.write_text("\n".join(lines) + "\n")


def test_thresholds_file_matches_metric_models():
    thresholds = load_thresholds()
    assert set(thresholds.suites) == {"c2_retrieval", "c3_answer", "c4_groundedness", "c5_citation"}


def test_thresholds_reject_unknown_metric(tmp_path):
    data = json.loads(Path(__file__).with_name("thresholds.json").read_text())
    data["suites"]["c3_answer"]["rules"]["made_up_rate"] = {"direction": "higher"}
    path = tmp_path / "thresholds.json"
    path.write_text(json.dumps(data))

    with pytest.raises(ThresholdConfigError):
        load_thresholds(path)


def test_identical_runs_pass(tmp_path):
    baseline = make_run(tmp_path, "baseline")
    candidate = make_run(tmp_path, "candidate")

    report = build_report(baseline, candidate)

    assert report.status == ReportStatus.PASS, report.integrity_errors
    assert report.deltas and all(d.delta == 0 for d in report.deltas)
    assert report.config_changes == {}


def test_drop_within_one_case_tolerance_passes(tmp_path):
    baseline = make_run(tmp_path, "baseline")
    # case_count is 3, so one case's worth is 1/3.
    candidate = make_run(tmp_path, "candidate", generation_model="new-model", answer={"overall_accuracy": 0.75 - 0.3})

    report = build_report(baseline, candidate)

    assert report.status == ReportStatus.PASS
    assert report.config_changes == {"generation_model": {"baseline": "gen-model", "candidate": "new-model"}}


def test_drop_beyond_tolerance_is_regression(tmp_path):
    baseline = make_run(tmp_path, "baseline")
    candidate = make_run(tmp_path, "candidate", answer={"overall_accuracy": 0.75 - 0.4})

    report = build_report(baseline, candidate)

    assert report.status == ReportStatus.REGRESSION
    assert {(d.suite, d.metric) for d in report.regressions} == {("c3_answer", "overall_accuracy")}


def test_any_contradiction_increase_is_regression(tmp_path):
    baseline = make_run(tmp_path, "baseline")
    candidate = make_run(tmp_path, "candidate", groundedness={"contradiction_rate": 0.01})

    report = build_report(baseline, candidate)

    assert report.status == ReportStatus.REGRESSION
    assert {(d.suite, d.metric) for d in report.regressions} == {("c4_groundedness", "contradiction_rate")}


def test_info_metric_never_gates(tmp_path):
    baseline = make_run(tmp_path, "baseline")
    candidate = make_run(tmp_path, "candidate", citation={"partial_citation_rate": 0.9})

    assert build_report(baseline, candidate).status == ReportStatus.PASS


def test_tampered_hash_is_integrity_error(tmp_path):
    baseline = make_run(tmp_path, "baseline")
    _tamper_first_hashed_output(baseline)

    report = build_report(baseline, integrity_only=True)

    assert report.status == ReportStatus.INTEGRITY_ERROR
    assert any("content_hash" in e for e in report.integrity_errors)


def test_corpus_version_mismatch_is_integrity_error(tmp_path):
    baseline = make_run(tmp_path, "baseline")
    candidate = make_run(tmp_path, "candidate", corpus_version="v2")

    report = build_report(baseline, candidate)

    assert report.status == ReportStatus.INTEGRITY_ERROR
    assert any("corpus_version" in e for e in report.integrity_errors)


def test_uncertified_candidate_is_integrity_error(tmp_path):
    baseline = make_run(tmp_path, "baseline")
    candidate = make_run(tmp_path, "candidate", status=RunStatus.INFRASTRUCTURE_BLOCKED)

    report = build_report(baseline, candidate)

    assert report.status == ReportStatus.INTEGRITY_ERROR
    assert any("not CERTIFIED_C3_BASELINE" in e for e in report.integrity_errors)


def test_infrastructure_failures_in_metrics_are_integrity_errors(tmp_path):
    baseline = make_run(tmp_path, "baseline")
    candidate = make_run(tmp_path, "candidate", citation={"infrastructure_failure_count": 1})

    report = build_report(baseline, candidate)

    assert report.status == ReportStatus.INTEGRITY_ERROR
    assert any("c5_metrics.json reports 1 infrastructure failures" in e for e in report.integrity_errors)


def test_missing_metrics_file_is_integrity_error(tmp_path):
    baseline = make_run(tmp_path, "baseline")
    (baseline / "c5_metrics.json").unlink()

    report = build_report(baseline, integrity_only=True)

    assert report.status == ReportStatus.INTEGRITY_ERROR
    assert any("c5_metrics.json is missing" in e for e in report.integrity_errors)


def test_cli_exit_codes_and_report_output(tmp_path):
    baseline = make_run(tmp_path, "baseline")
    candidate = make_run(tmp_path, "candidate", answer={"contradiction_rate": 0.2})
    out_dir = tmp_path / "reports"

    # Integrity-only writes nothing into the frozen baseline.
    assert run_c6(["--baseline", str(baseline), "--integrity-only"]) == 0
    assert not (baseline / "regression_report.json").exists()

    assert run_c6(["--baseline", str(baseline), "--candidate", str(candidate), "--output-dir", str(out_dir)]) == 1
    report = json.loads((out_dir / "regression_report.json").read_text())
    assert report["status"] == ReportStatus.REGRESSION.value
    assert "REGRESSION" in (out_dir / "regression_report.md").read_text()

    _tamper_first_hashed_output(candidate)
    assert run_c6(["--baseline", str(baseline), "--candidate", str(candidate), "--output-dir", str(out_dir)]) == 2
