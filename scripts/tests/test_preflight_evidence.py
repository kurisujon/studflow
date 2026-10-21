from __future__ import annotations

import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "validate_preflight_evidence.py"
SPEC = importlib.util.spec_from_file_location("validate_preflight_evidence", MODULE_PATH)
assert SPEC and SPEC.loader
validator = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = validator
SPEC.loader.exec_module(validator)

FRONTEND_DIGEST = "ghcr.io/kurisujon/studflow-frontend@sha256:" + "1" * 64
BACKEND_DIGEST = "ghcr.io/kurisujon/studflow-backend@sha256:" + "2" * 64


def valid_lines() -> list[str]:
    return [
        "host_architecture=linux/amd64",
        "compose_project=ok",
        "postgres_ready=ok",
        "database_role=ok",
        "redis_ping=ok",
        "environment_prerequisites=ok",
        "available_kb=4194304",
        "celery_active=0",
        "celery_reserved=0",
        "celery_scheduled=0",
        "repair_task_blockers=0",
        f"frontend_digest={FRONTEND_DIGEST}",
        f"backend_digest={BACKEND_DIGEST}",
        f"worker_digest={BACKEND_DIGEST}",
        "local_rollback_images=ok",
    ]


class PreflightEvidenceTests(unittest.TestCase):
    def test_valid_evidence_is_returned_in_canonical_order(self) -> None:
        values = validator.validate_lines(list(reversed(valid_lines())))
        self.assertEqual(list(values), list(reversed(validator.EXPECTED_FIELDS)))
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "github-output"
            validator.append_outputs(values, output)
            self.assertEqual(
                [line.split("=", 1)[0] for line in output.read_text().splitlines()],
                list(validator.EXPECTED_FIELDS),
            )

    def test_session_banner_is_rejected_without_echoing_content(self) -> None:
        banner = "private administrative login banner"
        with tempfile.TemporaryDirectory() as directory:
            evidence = Path(directory) / "evidence"
            output = Path(directory) / "github-output"
            evidence.write_text("\n".join([banner, *valid_lines()]) + "\n")
            result = subprocess.run(
                [sys.executable, str(MODULE_PATH), str(evidence), str(output)],
                capture_output=True,
                text=True,
                check=False,
            )
            output_exists = output.exists()
        self.assertEqual(result.returncode, 1)
        self.assertIn("line 1: unclassified-line", result.stderr)
        self.assertNotIn(banner, result.stdout + result.stderr)
        self.assertFalse(output_exists)

    def test_duplicate_field_is_rejected(self) -> None:
        lines = valid_lines()
        lines.insert(2, "compose_project=ok")
        with self.assertRaisesRegex(validator.EvidenceError, "duplicate-field"):
            validator.validate_lines(lines)

    def test_unknown_field_is_rejected(self) -> None:
        lines = valid_lines()
        lines.append("unapproved_field=ok")
        with self.assertRaisesRegex(validator.EvidenceError, "unexpected-field"):
            validator.validate_lines(lines)

    def test_missing_field_is_rejected(self) -> None:
        lines = [line for line in valid_lines() if not line.startswith("redis_ping=")]
        with self.assertRaisesRegex(validator.EvidenceError, "missing-fields"):
            validator.validate_lines(lines)

    def test_malformed_value_is_rejected(self) -> None:
        lines = valid_lines()
        lines[7] = "celery_active=-1"
        with self.assertRaisesRegex(validator.EvidenceError, "malformed-value"):
            validator.validate_lines(lines)

    def test_oversized_integer_is_rejected_without_traceback(self) -> None:
        lines = valid_lines()
        lines[6] = "available_kb=" + "9" * 5000
        with tempfile.TemporaryDirectory() as directory:
            evidence = Path(directory) / "evidence"
            output = Path(directory) / "github-output"
            evidence.write_text("\n".join(lines) + "\n")
            result = subprocess.run(
                [sys.executable, str(MODULE_PATH), str(evidence), str(output)],
                capture_output=True,
                text=True,
                check=False,
            )
        self.assertEqual(result.returncode, 1)
        self.assertIn("line 7: malformed-value", result.stderr)
        self.assertNotIn("Traceback", result.stderr)

    def test_inconsistent_backend_worker_digest_is_rejected(self) -> None:
        lines = valid_lines()
        lines[13] = (
            "worker_digest=ghcr.io/kurisujon/studflow-backend@sha256:" + "3" * 64
        )
        with self.assertRaisesRegex(
            validator.EvidenceError, "inconsistent-backend-worker-digest"
        ):
            validator.validate_lines(lines)


if __name__ == "__main__":
    unittest.main()
