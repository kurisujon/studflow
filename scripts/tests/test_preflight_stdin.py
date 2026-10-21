from __future__ import annotations

import subprocess
import tempfile
import time
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[2]
WORKFLOW = ROOT / ".github" / "workflows" / "production-preflight.yml"
CELERY_CONTROL = ROOT / "scripts" / "celery-release-control.py"


def run_streamed_bash(consumer: str) -> tuple[int, bool, str]:
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        process = subprocess.Popen(
            ["bash", "-s"],
            cwd=root,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        assert process.stdin is not None
        process.stdin.write(
            "set -e\n"
            "printf ready > consumer-started\n"
            f"{consumer}\n"
        )
        process.stdin.flush()

        deadline = time.monotonic() + 5
        while not (root / "consumer-started").exists():
            if time.monotonic() >= deadline:
                process.kill()
                raise AssertionError("Stream consumer did not start.")
            time.sleep(0.01)

        process.stdin.write("printf complete > inspection.evidence\n")
        process.stdin.close()
        returncode = process.wait(timeout=5)
        if process.stdout is not None:
            process.stdout.read()
            process.stdout.close()
        stderr = process.stderr.read() if process.stderr is not None else ""
        if process.stderr is not None:
            process.stderr.close()
        return returncode, (root / "inspection.evidence").exists(), stderr


class PreflightStdinTests(unittest.TestCase):
    def test_child_inheriting_stdin_consumes_remaining_bash_script(self) -> None:
        returncode, evidence_exists, stderr = run_streamed_bash("cat >/dev/null")
        self.assertEqual(returncode, 0, stderr)
        self.assertFalse(evidence_exists)

    def test_child_with_devnull_cannot_consume_remaining_bash_script(self) -> None:
        returncode, evidence_exists, stderr = run_streamed_bash(
            "cat </dev/null >/dev/null"
        )
        self.assertEqual(returncode, 0, stderr)
        self.assertTrue(evidence_exists)

    def test_remote_compose_and_celery_commands_are_noninteractive(self) -> None:
        workflow = WORKFLOW.read_text(encoding="utf-8")
        celery_control = CELERY_CONTROL.read_text(encoding="utf-8")
        self.assertIn(
            'compose() { docker compose --env-file "$env_path" "$@" < /dev/null; }',
            workflow,
        )
        self.assertEqual(workflow.count("compose exec -T --interactive=false"), 3)
        self.assertIn(
            'test -f "$remote_evidence" </dev/null || { echo "::error::Production evidence file was not created."',
            workflow,
        )
        self.assertIn('"--interactive=false"', celery_control)
        self.assertIn("stdin=subprocess.DEVNULL", celery_control)


if __name__ == "__main__":
    unittest.main()
