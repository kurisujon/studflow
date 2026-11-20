#!/usr/bin/env python3
"""Boot ephemeral pgvector Postgres, migrate, grant app_role CRUD, and run RLS suites."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT / "backend"
COMPOSE_FILE = ROOT / "docker-compose.test.yml"

POSTGRES_DB = os.environ.get("POSTGRES_TEST_DB", "studflow_test")
POSTGRES_USER = os.environ.get("POSTGRES_TEST_USER", "postgres")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_TEST_PASSWORD", "testpass")
POSTGRES_PORT = os.environ.get("POSTGRES_TEST_PORT", "55432")

RUNTIME_TABLES = (
    "documents",
    "user_preferences",
    "ai_conversations",
    "summaries",
    "flashcards",
    "document_chunks",
    "quizzes",
    "quiz_attempts",
    "related_videos",
    "study_annotations",
    "ai_history",
    "ai_messages",
    "quiz_questions",
    "ai_message_citations",
)

RLS_TEST_PATHS = (
    "eval/test_rls_integration.py",
    "eval/test_rls_mid_request_commit.py",
)


def _detect_compose_command() -> list[str]:
    """Return a working `docker compose` or `docker.exe compose` invocation."""
    last_error = ""
    for candidate in ("docker", "docker.exe"):
        executable = shutil.which(candidate)
        if not executable:
            continue
        try:
            probe = subprocess.run(
                [executable, "info", "--format", "{{.ServerVersion}}"],
                capture_output=True,
                text=True,
                timeout=10,
            )
        except (subprocess.TimeoutExpired, OSError) as exc:
            last_error = f"{candidate}: {exc}"
            continue
        if probe.returncode == 0:
            return [executable, "compose"]
        detail = (probe.stderr or probe.stdout).strip()
        last_error = f"{candidate}: {detail}"
    raise RuntimeError(
        "Docker daemon is unavailable for local RLS tests"
        + (f" ({last_error})" if last_error else "")
    )


def _run(cmd: list[str], *, cwd: Path = ROOT, env: dict[str, str] | None = None) -> None:
    subprocess.run(cmd, cwd=cwd, env=env, check=True)


def _grant_runtime_tables(admin_database_url: str) -> None:
    from sqlalchemy import create_engine, text

    table_list = ", ".join(f'public."{name}"' for name in RUNTIME_TABLES)
    engine = create_engine(admin_database_url)
    try:
        with engine.begin() as connection:
            connection.execute(
                text(f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {table_list} TO app_role;")
            )
    finally:
        engine.dispose()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--keep-db",
        action="store_true",
        help="Leave the test Postgres container running after tests finish.",
    )
    args = parser.parse_args(argv)

    compose_cmd = _detect_compose_command()
    base_compose = [*compose_cmd, "--project-name", "studflow-rls-test", "-f", COMPOSE_FILE.name]
    admin_url = (
        f"postgresql+psycopg://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
        f"@127.0.0.1:{POSTGRES_PORT}/{POSTGRES_DB}"
    )
    app_url = (
        f"postgresql+psycopg://app_role:app_pw@127.0.0.1:{POSTGRES_PORT}/{POSTGRES_DB}"
    )

    try:
        # Start fresh so init scripts and migrations are deterministic every run.
        _run([*base_compose, "down", "-v", "--remove-orphans"])
        _run([*base_compose, "up", "-d", "--wait"])

        admin_env = {**os.environ, "DATABASE_URL": admin_url}
        _run([sys.executable, "-m", "alembic", "upgrade", "head"], cwd=BACKEND_DIR, env=admin_env)
        _grant_runtime_tables(admin_url)

        test_env = {
            **os.environ,
            "DATABASE_URL": app_url,
            "PYTHONPATH": str(BACKEND_DIR),
        }
        _run(
            [sys.executable, "-m", "pytest", "--import-mode=importlib", *RLS_TEST_PATHS, "-v"],
            cwd=BACKEND_DIR,
            env=test_env,
        )
    finally:
        if not args.keep_db:
            subprocess.run(
                [*base_compose, "down", "-v", "--remove-orphans"],
                cwd=ROOT,
                check=False,
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
