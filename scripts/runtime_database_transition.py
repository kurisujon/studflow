#!/usr/bin/env python3
"""Audit and reconcile the production runtime database role without exposing URLs."""

from __future__ import annotations

import argparse
import json
import os
import re
import stat
import sys
import tempfile
from pathlib import Path
from typing import Any


RUNTIME_TABLES = (
    "documents", "user_preferences", "ai_conversations", "summaries",
    "flashcards", "document_chunks", "quizzes", "quiz_attempts",
    "related_videos", "study_annotations", "ai_history", "ai_messages",
    "quiz_questions", "ai_message_citations",
)
DENIED_TABLES = ("users", "alembic_version")
ROLE_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]{0,62}$")


class TransitionDatabaseError(RuntimeError):
    """Raised when a database transition invariant is not satisfied."""


def require(condition: object, classification: str) -> None:
    if not condition:
        raise TransitionDatabaseError(classification)


def _read_credentials() -> tuple[str, str]:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise TransitionDatabaseError("credential-input-invalid") from exc
    require(isinstance(payload, dict), "credential-input-invalid")
    require(set(payload) == {"app_database_url", "migration_database_url"}, "credential-input-fields")
    app_url = payload["app_database_url"]
    migration_url = payload["migration_database_url"]
    require(isinstance(app_url, str) and app_url, "app-database-url-missing")
    require(isinstance(migration_url, str) and migration_url, "migration-database-url-missing")
    require("\n" not in app_url and "\r" not in app_url, "app-database-url-invalid")
    require("\n" not in migration_url and "\r" not in migration_url, "migration-database-url-invalid")
    require(app_url != migration_url, "database-roles-not-separated")
    return app_url, migration_url


def _engine(url: str):
    from sqlalchemy import create_engine

    return create_engine(url, pool_pre_ping=True, connect_args={"prepare_threshold": None})


def _role_name(connection: Any) -> str:
    from sqlalchemy import text

    role = connection.execute(text("SELECT current_user")).scalar_one()
    require(isinstance(role, str) and ROLE_PATTERN.fullmatch(role), "runtime-role-name")
    return role


def _audit_candidate(connection: Any, role: str) -> None:
    from sqlalchemy import text

    attributes = connection.execute(text(
        "SELECT rolcanlogin, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole, rolreplication "
        "FROM pg_roles WHERE rolname=current_user"
    )).one_or_none()
    require(attributes is not None and tuple(attributes) == (True, False, False, False, False, False), "role-attributes")
    memberships = connection.execute(text(
        "SELECT count(*) FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname=current_user)"
    )).scalar_one()
    require(memberships == 0, "role-membership")
    require(connection.execute(text("SELECT has_schema_privilege(current_user,'public','USAGE')")).scalar_one(), "schema-usage")
    require(not connection.execute(text("SELECT has_schema_privilege(current_user,'public','CREATE')")).scalar_one(), "schema-create")
    for table_name in RUNTIME_TABLES:
        qualified = f"public.{table_name}"
        for privilege in ("SELECT", "INSERT", "UPDATE", "DELETE"):
            require(connection.execute(text(
                "SELECT has_table_privilege(current_user,:table_name,:privilege)"
            ), {"table_name": qualified, "privilege": privilege}).scalar_one(), "runtime-table-crud")
        for privilege in ("TRUNCATE", "REFERENCES", "TRIGGER"):
            require(not connection.execute(text(
                "SELECT has_table_privilege(current_user,:table_name,:privilege)"
            ), {"table_name": qualified, "privilege": privilege}).scalar_one(), "runtime-table-dangerous-privilege")
    for table_name in DENIED_TABLES:
        for privilege in ("SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"):
            require(not connection.execute(text(
                "SELECT has_table_privilege(current_user,:table_name,:privilege)"
            ), {"table_name": f"public.{table_name}", "privilege": privilege}).scalar_one(), "denied-table-privilege")
    sequence_privileges = connection.execute(text(
        "SELECT count(*) FROM information_schema.role_usage_grants "
        "WHERE grantee=:role AND object_schema='public' AND object_type='SEQUENCE'"
    ), {"role": role}).scalar_one()
    require(sequence_privileges == 0, "runtime-sequence-privilege")
    sequence_dependencies = connection.execute(text(
        "SELECT count(*) FROM pg_class sequence "
        "WHERE sequence.relkind='S' "
        "AND sequence.relnamespace='public'::regnamespace "
        "AND EXISTS (SELECT 1 FROM pg_depend dependency "
        "JOIN pg_class runtime_table ON runtime_table.oid=dependency.refobjid "
        "WHERE dependency.objid=sequence.oid "
        "AND runtime_table.relname=ANY(:tables))"
    ), {"tables": list(RUNTIME_TABLES)}).scalar_one()
    require(sequence_dependencies == 0, "runtime-sequence-dependency")
    policy_contract = connection.execute(text(
        "SELECT count(DISTINCT class.relname) FILTER "
        "(WHERE class.relrowsecurity AND class.relforcerowsecurity), "
        "count(policy.policyname) "
        "FROM pg_class class "
        "JOIN pg_namespace namespace ON namespace.oid=class.relnamespace "
        "LEFT JOIN pg_policies policy "
        "ON policy.schemaname=namespace.nspname "
        "AND policy.tablename=class.relname "
        "WHERE namespace.nspname='public' AND class.relname=ANY(:tables)"
    ), {"tables": list(RUNTIME_TABLES)}).one()
    require(tuple(policy_contract) == (len(RUNTIME_TABLES), len(RUNTIME_TABLES)), "rls-policy-contract")
    owned_tables = connection.execute(text(
        "SELECT count(*) FROM pg_class "
        "WHERE relname=ANY(:tables) "
        "AND relowner=(SELECT oid FROM pg_roles WHERE rolname=current_user)"
    ), {"tables": list(RUNTIME_TABLES)}).scalar_one()
    require(owned_tables == 0, "runtime-table-ownership")


def _audit_operator(connection: Any) -> None:
    from sqlalchemy import text

    attributes = connection.execute(text(
        "SELECT rolsuper OR rolbypassrls OR rolcreaterole FROM pg_roles WHERE rolname=current_user"
    )).scalar_one()
    require(attributes, "migration-role-insufficient")
    null_owners = connection.execute(text(
        "SELECT count(*) FROM public.documents WHERE clerk_user_id IS NULL OR btrim(clerk_user_id)=''"
    )).scalar_one()
    require(null_owners == 0, "null-document-owners")


def _reconcile(connection: Any, role: str) -> None:
    from sqlalchemy import text

    quoted_role = '"' + role.replace('"', '""') + '"'
    runtime_tables = ", ".join(f'public."{name}"' for name in RUNTIME_TABLES)
    denied_tables = ", ".join(f'public."{name}"' for name in DENIED_TABLES)
    connection.execute(text(f"REVOKE CREATE ON SCHEMA public FROM {quoted_role}"))
    connection.execute(text(f"REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM {quoted_role}"))
    connection.execute(text(f"REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM {quoted_role}"))
    connection.execute(text(f"GRANT USAGE ON SCHEMA public TO {quoted_role}"))
    connection.execute(text(f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {runtime_tables} TO {quoted_role}"))
    connection.execute(text(f"REVOKE ALL PRIVILEGES ON TABLE {denied_tables} FROM {quoted_role}"))


def audit_and_reconcile(app_url: str, migration_url: str, apply: bool) -> None:
    app_engine = _engine(app_url)
    migration_engine = _engine(migration_url)
    try:
        with app_engine.connect() as candidate:
            role = _role_name(candidate)
        with migration_engine.begin() as operator:
            _audit_operator(operator)
            if apply:
                _reconcile(operator, role)
        with app_engine.connect() as candidate:
            require(_role_name(candidate) == role, "runtime-role-changed")
            _audit_candidate(candidate, role)
    finally:
        app_engine.dispose()
        migration_engine.dispose()


def rewrite_env(credentials_path: Path, env_path: Path, backup_path: Path) -> None:
    require(credentials_path.is_file(), "credential-file-missing")
    require(stat.S_IMODE(credentials_path.stat().st_mode) == 0o600, "credential-file-permissions")
    payload = json.loads(credentials_path.read_text(encoding="utf-8"))
    app_url = payload.get("app_database_url") if isinstance(payload, dict) else None
    require(isinstance(app_url, str) and app_url and "\n" not in app_url and "\r" not in app_url, "app-database-url-invalid")
    original = env_path.read_text(encoding="utf-8")
    lines = original.splitlines()
    indices = [index for index, line in enumerate(lines) if line.startswith("DATABASE_URL=")]
    require(len(indices) == 1, "database-url-contract")
    backup_path.write_text(original, encoding="utf-8")
    os.chmod(backup_path, 0o600)
    lines[indices[0]] = f"DATABASE_URL={app_url}"
    fd, temporary_name = tempfile.mkstemp(prefix=f".{env_path.name}.", dir=env_path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as output:
            output.write("\n".join(lines) + ("\n" if original.endswith("\n") else ""))
        os.chmod(temporary_name, 0o600)
        os.replace(temporary_name, env_path)
    finally:
        if os.path.exists(temporary_name):
            os.unlink(temporary_name)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    database = subparsers.add_parser("database")
    database.add_argument("--apply-grants", action="store_true")
    rewrite = subparsers.add_parser("rewrite-env")
    rewrite.add_argument("credentials", type=Path)
    rewrite.add_argument("environment", type=Path)
    rewrite.add_argument("backup", type=Path)
    arguments = parser.parse_args()
    try:
        if arguments.command == "database":
            app_url, migration_url = _read_credentials()
            audit_and_reconcile(app_url, migration_url, arguments.apply_grants)
        else:
            rewrite_env(arguments.credentials, arguments.environment, arguments.backup)
        print("Database transition check passed.")
        return 0
    except (TransitionDatabaseError, OSError, ValueError, json.JSONDecodeError) as exc:
        classification = str(exc) if isinstance(exc, TransitionDatabaseError) else "local-file-operation"
        print(f"ERROR: database transition failed: {classification}.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
