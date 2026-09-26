"""C6 regression gate.

Usage (from backend/):
    python eval/run_c6.py --baseline eval/results/c3_baseline_v2 --integrity-only
    python eval/run_c6.py --baseline eval/results/c3_baseline_v2 --candidate eval/results/candidates/<run>

Exit codes: 0 PASS, 1 metric regression, 2 integrity or configuration error.
No provider calls are made.
"""
import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from eval.regression.compare import EXIT_CODES, ThresholdConfigError, build_report, load_thresholds, write_report
from eval.regression.models import ReportStatus


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compare a candidate eval run against the frozen Phase C baseline.")
    parser.add_argument("--baseline", required=True, help="Certified baseline run directory.")
    parser.add_argument("--candidate", help="Candidate run directory to compare against the baseline.")
    parser.add_argument(
        "--integrity-only", action="store_true",
        help="Only verify artifact integrity (baseline, plus candidate if given); skip metric comparison.",
    )
    parser.add_argument("--thresholds", type=Path, help="Override the tolerance policy file.")
    parser.add_argument(
        "--output-dir", type=Path,
        help="Where to write regression_report.{json,md}. Defaults to the candidate directory; "
             "integrity-only runs write nothing unless this is set.",
    )
    args = parser.parse_args(argv)
    if not args.candidate and not args.integrity_only:
        parser.error("--candidate is required unless --integrity-only is set.")
    return args


def main(argv=None) -> int:
    args = parse_args(argv)

    try:
        thresholds = load_thresholds(args.thresholds) if args.thresholds else load_thresholds()
    except ThresholdConfigError as exc:
        print(f"C6 configuration error: {exc}")
        return EXIT_CODES[ReportStatus.INTEGRITY_ERROR]

    report = build_report(
        args.baseline, args.candidate, integrity_only=args.integrity_only, thresholds=thresholds,
    )

    print(f"C6 {report.status.value}: baseline={report.baseline_run} candidate={report.candidate_run or 'n/a'}")
    for error in report.integrity_errors:
        print(f"  integrity: {error}")
    for delta in report.regressions:
        print(
            f"  regression: {delta.suite} {delta.scope} {delta.metric} "
            f"{delta.baseline:.4f} -> {delta.candidate:.4f} (allowed {delta.allowed:.4f})"
        )
    if not report.integrity_only:
        print(f"  {len(report.deltas)} metrics compared, {len(report.regressions)} regressions.")

    output_dir = args.output_dir or (Path(args.candidate) if args.candidate and not args.integrity_only else None)
    if output_dir is not None:
        json_path, md_path = write_report(report, output_dir)
        print(f"  report: {json_path} / {md_path}")

    return EXIT_CODES[report.status]


if __name__ == "__main__":
    sys.exit(main())
