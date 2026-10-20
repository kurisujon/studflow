from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import unittest
from collections import deque
from pathlib import Path
from typing import Sequence


MODULE_PATH = Path(__file__).parents[1] / "celery-release-control.py"
SPEC = importlib.util.spec_from_file_location("celery_release_control", MODULE_PATH)
assert SPEC and SPEC.loader
control = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = control
SPEC.loader.exec_module(control)


class FakeRunner:
    def __init__(self, responses: list[tuple[int, str]]) -> None:
        self.responses = deque(responses)
        self.commands: list[list[str]] = []

    def __call__(self, command: Sequence[str]) -> subprocess.CompletedProcess[str]:
        self.commands.append(list(command))
        returncode, stdout = self.responses.popleft()
        return subprocess.CompletedProcess(command, returncode, stdout, "")


def response(value: object) -> tuple[int, str]:
    return 0, json.dumps(value)


def snapshot(
    node: str = "celery@worker",
    task_name: str | None = None,
    *,
    queue_active: bool = True,
) -> list[tuple[int, str]]:
    task = [] if task_name is None else [{"name": task_name, "args": ["private-id"]}]
    return [
        response({node: {"ok": "pong"}}),
        response({node: task}),
        response({node: []}),
        response({node: []}),
        response({node: [{"name": control.DEFAULT_QUEUE}] if queue_active else []}),
    ]


class CeleryReleaseControlTests(unittest.TestCase):
    def test_inspect_reports_counts_without_task_payloads(self) -> None:
        runner = FakeRunner(snapshot(task_name="tasks.process_document_task"))
        result = control.inspect_worker(runner)
        self.assertEqual(result.active, 1)
        self.assertNotIn("private-id", json.dumps(result.evidence()))

    def test_inspect_requires_exactly_one_worker(self) -> None:
        runner = FakeRunner([response({"a": {"ok": "pong"}, "b": {"ok": "pong"}})])
        with self.assertRaises(control.ReleaseControlError):
            control.inspect_worker(runner)

    def test_drain_requires_consecutive_idle_samples(self) -> None:
        runner = FakeRunner(
            snapshot()
            + [(0, "ok")]
            + snapshot(queue_active=False)
            + snapshot(queue_active=False)
            + snapshot(queue_active=False)
        )
        clock_values = iter([0, 0, 1, 2])
        result = control.drain_worker(
            timeout=10,
            interval=0.01,
            consecutive=3,
            runner=runner,
            monotonic=lambda: next(clock_values),
            sleeper=lambda _: None,
        )
        self.assertTrue(result.idle)
        self.assertIn("cancel_consumer", runner.commands[5])

    def test_repair_task_prevents_idle_drain(self) -> None:
        runner = FakeRunner(
            snapshot()
            + [(0, "ok")]
            + snapshot(task_name=control.REPAIR_TASK, queue_active=False)
            + [(0, "ok")]
            + snapshot(queue_active=True)
        )
        clock_values = iter([0, 0, 2])
        with self.assertRaises(control.ReleaseControlError):
            control.drain_worker(
                timeout=1,
                interval=0.01,
                consecutive=2,
                runner=runner,
                monotonic=lambda: next(clock_values),
                sleeper=lambda _: None,
            )
        self.assertTrue(any("add_consumer" in command for command in runner.commands))

    def test_disconnect_attempts_resume_and_fails_closed(self) -> None:
        runner = FakeRunner(
            snapshot("celery@old")
            + [(0, "ok")]
            + snapshot("celery@new", queue_active=False)
            + [(0, "ok")]
            + snapshot("celery@old", queue_active=True)
        )
        with self.assertRaises(control.ReleaseControlError):
            control.drain_worker(
                timeout=10,
                interval=0.01,
                consecutive=2,
                runner=runner,
                monotonic=lambda: 0,
                sleeper=lambda _: None,
            )
        self.assertTrue(any("add_consumer" in command for command in runner.commands))

    def test_pause_verification_failure_restores_and_verifies_consumer(self) -> None:
        runner = FakeRunner(
            snapshot()
            + [(0, "ok")]
            + snapshot(queue_active=True)
            + [(0, "ok")]
            + snapshot(queue_active=True)
        )
        with self.assertRaises(control.ReleaseControlError):
            control.drain_worker(
                timeout=10,
                interval=0.01,
                consecutive=2,
                runner=runner,
                monotonic=lambda: 0,
                sleeper=lambda _: None,
            )
        self.assertTrue(any("add_consumer" in command for command in runner.commands))


if __name__ == "__main__":
    unittest.main()
