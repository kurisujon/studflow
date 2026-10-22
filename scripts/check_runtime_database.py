#!/usr/bin/env python3
"""Fail-closed runtime database role and RLS contract verification."""

from __future__ import annotations

from sqlalchemy import text

from core.config import settings
from core.database import engine


RUNTIME_TABLES = (
    "documents", "user_preferences", "ai_conversations", "summaries",
    "flashcards", "document_chunks", "quizzes", "quiz_attempts",
    "related_videos", "study_annotations", "ai_history", "ai_messages",
    "quiz_questions", "ai_message_citations",
)


def require(condition: object, classification: str) -> None:
    if not condition:
        raise RuntimeError(f"Runtime database check failed: {classification}.")


def main() -> int:
    secret = settings.secret_key.strip()
    require(len(secret) >= 32, "signing-secret-length")
    require(secret not in {
        "change-this-secret-key",
        "change-this-to-a-strong-secret-key-in-production",
    }, "signing-secret-placeholder")
    with engine.connect() as connection:
        role = connection.execute(
            text(
                "SELECT rolcanlogin, rolsuper, rolbypassrls, rolcreatedb, "
                "rolcreaterole, rolreplication FROM pg_roles "
                "WHERE rolname=current_user"
            )
        ).one_or_none()
        require(
            role is not None
            and tuple(role) == (True, False, False, False, False, False),
            "role-attributes",
        )
        require(connection.execute(
            text(
                "SELECT count(*) FROM pg_auth_members "
                "WHERE member=(SELECT oid FROM pg_roles WHERE rolname=current_user)"
            )
        ).scalar_one() == 0, "role-membership")
        require(connection.execute(
            text("SELECT has_schema_privilege(current_user, 'public', 'USAGE')")
        ).scalar_one(), "schema-usage")
        require(not connection.execute(
            text("SELECT has_schema_privilege(current_user, 'public', 'CREATE')")
        ).scalar_one(), "schema-create")

        for table_name in RUNTIME_TABLES:
            qualified = f"public.{table_name}"
            for privilege in ("SELECT", "INSERT", "UPDATE", "DELETE"):
                require(connection.execute(
                    text(
                        "SELECT has_table_privilege(current_user, :table_name, :privilege)"
                    ),
                    {"table_name": qualified, "privilege": privilege},
                ).scalar_one(), "runtime-table-crud")
            for privilege in ("TRUNCATE", "REFERENCES", "TRIGGER"):
                require(not connection.execute(
                    text(
                        "SELECT has_table_privilege(current_user, :table_name, :privilege)"
                    ),
                    {"table_name": qualified, "privilege": privilege},
                ).scalar_one(), "runtime-table-dangerous-privilege")

        for denied_table in ("public.users", "public.alembic_version"):
            for privilege in ("SELECT", "INSERT", "UPDATE", "DELETE"):
                require(not connection.execute(
                    text(
                        "SELECT has_table_privilege(current_user, :table_name, :privilege)"
                    ),
                    {"table_name": denied_table, "privilege": privilege},
                ).scalar_one(), "denied-table-privilege")

        sequence_count = connection.execute(
            text(
                "SELECT count(*) FROM pg_class sequence "
                "WHERE sequence.relkind='S' "
                "AND sequence.relnamespace='public'::regnamespace "
                "AND EXISTS (SELECT 1 FROM pg_depend dependency "
                "JOIN pg_class runtime_table ON runtime_table.oid=dependency.refobjid "
                "WHERE dependency.objid=sequence.oid "
                "AND runtime_table.relname=ANY(:tables))"
            ),
            {"tables": list(RUNTIME_TABLES)},
        ).scalar_one()
        require(sequence_count == 0, "runtime-sequence-dependency")

        policy_contract = connection.execute(
            text(
                "SELECT count(DISTINCT class.relname) FILTER "
                "(WHERE class.relrowsecurity AND class.relforcerowsecurity), "
                "count(policy.policyname) "
                "FROM pg_class class "
                "JOIN pg_namespace namespace ON namespace.oid=class.relnamespace "
                "LEFT JOIN pg_policies policy "
                "ON policy.schemaname=namespace.nspname "
                "AND policy.tablename=class.relname "
                "WHERE namespace.nspname='public' AND class.relname=ANY(:tables)"
            ),
            {"tables": list(RUNTIME_TABLES)},
        ).one()
        require(
            tuple(policy_contract) == (len(RUNTIME_TABLES), len(RUNTIME_TABLES)),
            "rls-policy-contract",
        )
        require(connection.execute(
            text(
                "SELECT count(*) FROM pg_class "
                "WHERE relname=ANY(:tables) "
                "AND relowner=(SELECT oid FROM pg_roles WHERE rolname=current_user)"
            ),
            {"tables": list(RUNTIME_TABLES)},
        ).scalar_one() == 0, "runtime-table-ownership")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
