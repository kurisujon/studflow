#!/usr/bin/env python3
"""Bounded, fail-closed Celery inspection and drain control for releases."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from typing import Any


DEFAULT_QUEUE = "celery"
REPAIR_TASK = "tasks.repair_document_index_task"


class ReleaseControlError(RuntimeError):
    """Raised when worker state cannot be proved safe."""


@dataclass(frozen=True)
class WorkerSnapshot:
    node: str
    active: int
    reserved: int
    scheduled: int
    repair_tasks: int
    default_queue_active: bool

    @property
    def idle(self) -> bool:
        return self.active == self.reserved == self.scheduled == 0

    def evidence(self) -> dict[str, int | str]:
        return {
            "worker_nodes": 1,
            "active": self.active,
            "reserved": self.reserved,
            "scheduled": self.scheduled,
            "repair_task_blockers": self.repair_tasks,
            "default_queue": "active" if self.default_queue_active else "paused",
            "status": "idle" if self.idle else "busy",
        }


Runner = Callable[[Sequence[str]], subprocess.CompletedProcess[str]]


def _default_runner(command: Sequence[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        list(command),
        check=False,
        capture_output=True,
        text=True,
        stdin=subprocess.DEVNULL,
        timeout=30,
    )


def _celery_command(*arguments: str) -> list[str]:
    command = [
        "docker",
        "compose",
    ]
    env_path = os.environ.get("STUDFLOW_COMPOSE_ENV_FILE")
    if env_path:
        command.extend(("--env-file", env_path))
    command.extend([
        "exec",
        "-T",
        "--interactive=false",
        "worker",
        "celery",
        "-A",
        "core.celery_app.celery_app",
        *arguments,
    ])
    return command


def _run(command: Sequence[str], runner: Runner) -> str:
    result = runner(command)
    if result.returncode != 0:
        raise ReleaseControlError("Celery control command failed.")
    return result.stdout.strip()


def _parse_single_node(payload: str, operation: str) -> tuple[str, Any]:
    try:
        parsed = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise ReleaseControlError(f"Celery {operation} returned invalid JSON.") from exc
    if not isinstance(parsed, dict) or len(parsed) != 1:
        raise ReleaseControlError(
            f"Celery {operation} must report exactly one worker node."
        )
    node, value = next(iter(parsed.items()))
    if not isinstance(node, str) or not node:
        raise ReleaseControlError(f"Celery {operation} returned an invalid node name.")
    return node, value


def _tasks_for_operation(
    operation: str, runner: Runner, expected_node: str | None = None
) -> tuple[str, list[Mapping[str, Any]]]:
    node, value = _parse_single_node(
        _run(_celery_command("inspect", operation, "--json"), runner), operation
    )
    if expected_node is not None and node != expected_node:
        raise ReleaseControlError("Celery worker identity changed during inspection.")
    if not isinstance(value, list):
        raise ReleaseControlError(f"Celery {operation} returned an invalid task list.")
    tasks: list[Mapping[str, Any]] = []
    for task in value:
        if not isinstance(task, dict):
            raise ReleaseControlError(f"Celery {operation} returned an invalid task entry.")
        tasks.append(task)
    return node, tasks


def inspect_worker(
    runner: Runner = _default_runner,
    *,
    require_default_queue: bool | None = True,
) -> WorkerSnapshot:
    ping_node, ping_value = _parse_single_node(
        _run(_celery_command("inspect", "ping", "--json"), runner), "ping"
    )
    if not isinstance(ping_value, dict) or ping_value.get("ok") != "pong":
        raise ReleaseControlError("Celery worker did not return a valid pong response.")

    task_sets: dict[str, list[Mapping[str, Any]]] = {}
    for operation in ("active", "reserved", "scheduled"):
        _, tasks = _tasks_for_operation(operation, runner, ping_node)
        task_sets[operation] = tasks

    queue_node, queue_value = _parse_single_node(
        _run(_celery_command("inspect", "active_queues", "--json"), runner),
        "active_queues",
    )
    if queue_node != ping_node or not isinstance(queue_value, list):
        raise ReleaseControlError("Celery active_queues returned an invalid response.")
    queue_names = {
        queue.get("name")
        for queue in queue_value
        if isinstance(queue, dict) and isinstance(queue.get("name"), str)
    }
    default_queue_active = DEFAULT_QUEUE in queue_names
    if require_default_queue is True and not default_queue_active:
        raise ReleaseControlError("Celery worker is not consuming the default queue.")
    if require_default_queue is False and default_queue_active:
        raise ReleaseControlError("Celery worker did not pause the default queue.")

    repair_count = sum(
        1
        for tasks in task_sets.values()
        for task in tasks
        if task.get("name") == REPAIR_TASK
        or (
            isinstance(task.get("request"), dict)
            and task["request"].get("name") == REPAIR_TASK
        )
    )
    return WorkerSnapshot(
        node=ping_node,
        active=len(task_sets["active"]),
        reserved=len(task_sets["reserved"]),
        scheduled=len(task_sets["scheduled"]),
        repair_tasks=repair_count,
        default_queue_active=default_queue_active,
    )


def _control_consumer(action: str, node: str, runner: Runner) -> None:
    if action not in {"cancel_consumer", "add_consumer"}:
        raise ValueError("Unsupported Celery consumer action.")
    _run(
        _celery_command(
            "control",
            action,
            DEFAULT_QUEUE,
            "--destination",
            node,
        ),
        runner,
    )


def resume_worker(node: str | None = None, runner: Runner = _default_runner) -> WorkerSnapshot:
    current = inspect_worker(runner, require_default_queue=None)
    if node is not None and current.node != node:
        raise ReleaseControlError("Refusing to resume an unexpected Celery worker.")
    _control_consumer("add_consumer", current.node, runner)
    return inspect_worker(runner, require_default_queue=True)


def drain_worker(
    *,
    timeout: int,
    interval: float,
    consecutive: int,
    runner: Runner = _default_runner,
    monotonic: Callable[[], float] = time.monotonic,
    sleeper: Callable[[float], None] = time.sleep,
) -> WorkerSnapshot:
    if timeout < 1 or interval <= 0 or consecutive < 2:
        raise ValueError("Drain bounds must be positive and require repeated idle samples.")

    initial = inspect_worker(runner, require_default_queue=True)
    _control_consumer("cancel_consumer", initial.node, runner)
    deadline = monotonic() + timeout
    idle_samples = 0
    try:
        while monotonic() <= deadline:
            snapshot = inspect_worker(runner, require_default_queue=False)
            if snapshot.node != initial.node:
                raise ReleaseControlError("Celery worker disconnected during drain.")
            if snapshot.repair_tasks:
                idle_samples = 0
            elif snapshot.idle:
                idle_samples += 1
                if idle_samples >= consecutive:
                    return snapshot
            else:
                idle_samples = 0
            sleeper(interval)
        raise ReleaseControlError("Celery worker did not drain before the bounded timeout.")
    except BaseException:
        try:
            _control_consumer("add_consumer", initial.node, runner)
            restored = inspect_worker(runner, require_default_queue=True)
            if restored.node != initial.node:
                raise ReleaseControlError(
                    "Celery worker identity changed while restoring queue consumption."
                )
        except Exception as resume_error:
            print(
                "ERROR: failed to restore Celery queue consumption after drain abort.",
                file=sys.stderr,
            )
            raise ReleaseControlError(
                "Drain failed and Celery queue consumption could not be restored."
            ) from resume_error
        raise


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("inspect")
    drain = subparsers.add_parser("drain")
    drain.add_argument("--timeout", type=int, default=300)
    drain.add_argument("--interval", type=float, default=10)
    drain.add_argument("--consecutive", type=int, default=3)
    resume = subparsers.add_parser("resume")
    resume.add_argument("--node")
    return parser


def main() -> int:
    arguments = _parser().parse_args()
    try:
        if arguments.command == "inspect":
            snapshot = inspect_worker()
        elif arguments.command == "drain":
            snapshot = drain_worker(
                timeout=arguments.timeout,
                interval=arguments.interval,
                consecutive=arguments.consecutive,
            )
        else:
            snapshot = resume_worker(arguments.node)
        print(json.dumps(snapshot.evidence(), sort_keys=True))
        return 0
    except (ReleaseControlError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
