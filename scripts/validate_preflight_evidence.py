#!/usr/bin/env python3
"""Validate and publish sanitized production-preflight evidence."""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path


EXPECTED_FIELDS = (
    "host_architecture",
    "compose_project",
    "postgres_ready",
    "database_role",
    "redis_ping",
    "environment_prerequisites",
    "available_kb",
    "celery_active",
    "celery_reserved",
    "celery_scheduled",
    "repair_task_blockers",
    "frontend_digest",
    "backend_digest",
    "worker_digest",
    "local_rollback_images",
)
EXPECTED_SET = frozenset(EXPECTED_FIELDS)
OK_FIELDS = frozenset(
    {
        "compose_project",
        "postgres_ready",
        "database_role",
        "redis_ping",
        "environment_prerequisites",
        "local_rollback_images",
    }
)
COUNTER_FIELDS = frozenset(
    {"celery_active", "celery_reserved", "celery_scheduled", "repair_task_blockers"}
)
FRONTEND_DIGEST = re.compile(
    r"ghcr\.io/kurisujon/studflow-frontend@sha256:[0-9a-f]{64}"
)
BACKEND_DIGEST = re.compile(
    r"ghcr\.io/kurisujon/studflow-backend@sha256:[0-9a-f]{64}"
)
MAX_EVIDENCE_BYTES = 8192
MIN_AVAILABLE_KB = 2_097_152
MAX_INTEGER_DIGITS = 20


@dataclass(frozen=True)
class EvidenceError(ValueError):
    classification: str
    line_number: int | None = None

    def safe_message(self) -> str:
        if self.line_number is None:
            return f"preflight evidence set: {self.classification}."
        return f"preflight evidence line {self.line_number}: {self.classification}."


def _is_unsigned_integer(value: str) -> bool:
    return (
        0 < len(value) <= MAX_INTEGER_DIGITS
        and value.isascii()
        and value.isdecimal()
    )


def validate_lines(lines: list[str]) -> dict[str, str]:
    values: dict[str, str] = {}
    for line_number, line in enumerate(lines, start=1):
        if "=" not in line:
            raise EvidenceError("unclassified-line", line_number)
        key, value = line.split("=", 1)
        if key not in EXPECTED_SET:
            raise EvidenceError("unexpected-field", line_number)
        if key in values:
            raise EvidenceError("duplicate-field", line_number)

        valid = False
        if key == "host_architecture":
            valid = value in {"linux/amd64", "linux/arm64"}
        elif key in OK_FIELDS:
            valid = value == "ok"
        elif key == "available_kb":
            valid = _is_unsigned_integer(value) and int(value) >= MIN_AVAILABLE_KB
        elif key in COUNTER_FIELDS:
            valid = _is_unsigned_integer(value)
        elif key == "frontend_digest":
            valid = FRONTEND_DIGEST.fullmatch(value) is not None
        elif key in {"backend_digest", "worker_digest"}:
            valid = BACKEND_DIGEST.fullmatch(value) is not None
        if not valid:
            raise EvidenceError("malformed-value", line_number)
        values[key] = value

    missing = EXPECTED_SET.difference(values)
    if missing:
        raise EvidenceError("missing-fields")
    if len(values) != len(EXPECTED_FIELDS):
        raise EvidenceError("field-count-mismatch")
    if values["backend_digest"] != values["worker_digest"]:
        raise EvidenceError("inconsistent-backend-worker-digest")
    return values


def load_and_validate(path: Path) -> dict[str, str]:
    if not path.is_file():
        raise EvidenceError("missing-evidence-file")
    payload = path.read_bytes()
    if not payload or len(payload) > MAX_EVIDENCE_BYTES:
        raise EvidenceError("invalid-evidence-size")
    try:
        text = payload.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise EvidenceError("invalid-encoding") from exc
    if "\x00" in text:
        raise EvidenceError("invalid-encoding")
    return validate_lines(text.splitlines())


def append_outputs(values: dict[str, str], output_path: Path) -> None:
    with output_path.open("a", encoding="utf-8", newline="\n") as output:
        for key in EXPECTED_FIELDS:
            output.write(f"{key}={values[key]}\n")


def main() -> int:
    if len(sys.argv) != 3:
        print("ERROR: expected evidence and output paths.", file=sys.stderr)
        return 2
    try:
        values = load_and_validate(Path(sys.argv[1]))
        append_outputs(values, Path(sys.argv[2]))
    except EvidenceError as exc:
        print(f"ERROR: {exc.safe_message()}", file=sys.stderr)
        return 1
    except OSError:
        print("ERROR: preflight evidence file operation failed.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
