from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
from sqlalchemy import delete, text, update
from sqlalchemy.exc import DBAPIError
from sqlmodel import Session

from core.database import engine, tenant_session
from core.task_provenance import HEADER_TENANT, build_task_headers
from models.tables import (
    AIConversation,
    AIMessage,
    AIMessageCitation,
    Document,
    DocumentChunk,
    DocumentStatus,
)
from tasks.document_processing import process_document_task


RUNTIME_TABLES = (
    "documents", "user_preferences", "ai_conversations", "summaries",
    "flashcards", "document_chunks", "quizzes", "quiz_attempts",
    "related_videos", "study_annotations", "ai_history", "ai_messages",
    "quiz_questions", "ai_message_citations",
)


def test_runtime_role_catalog_is_least_privilege() -> None:
    with tenant_session("catalog_probe") as session:
        role = session.execute(
            text(
                "SELECT rolcanlogin, rolsuper, rolbypassrls, rolcreatedb, "
                "rolcreaterole, rolreplication FROM pg_roles "
                "WHERE rolname = current_user"
            )
        ).one()
        assert tuple(role) == (True, False, False, False, False, False)
        assert session.execute(
            text(
                "SELECT count(*) FROM pg_auth_members "
                "WHERE member = (SELECT oid FROM pg_roles WHERE rolname = current_user)"
            )
        ).scalar_one() == 0
        assert session.execute(
            text("SELECT has_schema_privilege(current_user, 'public', 'USAGE')")
        ).scalar_one()
        assert not session.execute(
            text("SELECT has_schema_privilege(current_user, 'public', 'CREATE')")
        ).scalar_one()
        for table_name in RUNTIME_TABLES:
            for privilege in ("SELECT", "INSERT", "UPDATE", "DELETE"):
                assert session.execute(
                    text(
                        "SELECT has_table_privilege(current_user, :table_name, :privilege)"
                    ),
                    {"table_name": f"public.{table_name}", "privilege": privilege},
                ).scalar_one()
            for privilege in ("TRUNCATE", "REFERENCES", "TRIGGER"):
                assert not session.execute(
                    text(
                        "SELECT has_table_privilege(current_user, :table_name, :privilege)"
                    ),
                    {"table_name": f"public.{table_name}", "privilege": privilege},
                ).scalar_one()
        for denied_table in ("public.users", "public.alembic_version"):
            for privilege in ("SELECT", "INSERT", "UPDATE", "DELETE"):
                assert not session.execute(
                    text(
                        "SELECT has_table_privilege(current_user, :table_name, :privilege)"
                    ),
                    {"table_name": denied_table, "privilege": privilege},
                ).scalar_one()
        assert session.execute(
            text(
                "SELECT count(*) FROM pg_class s JOIN pg_namespace n ON n.oid=s.relnamespace "
                "WHERE s.relkind='S' AND n.nspname='public' AND EXISTS ("
                "SELECT 1 FROM pg_depend d JOIN pg_class t ON t.oid=d.refobjid "
                "WHERE d.objid=s.oid AND t.relname=ANY(:tables))"
            ),
            {"tables": list(RUNTIME_TABLES)},
        ).scalar_one() == 0

        policy_contract = session.execute(
            text(
                "SELECT count(DISTINCT c.relname) FILTER (WHERE c.relrowsecurity AND c.relforcerowsecurity), "
                "count(p.policyname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "
                "LEFT JOIN pg_policies p ON p.schemaname=n.nspname AND p.tablename=c.relname "
                "WHERE n.nspname='public' AND c.relname=ANY(:tables)"
            ),
            {"tables": list(RUNTIME_TABLES)},
        ).one()
        assert tuple(policy_contract) == (len(RUNTIME_TABLES), len(RUNTIME_TABLES))


def _document(document_id: uuid.UUID, owner: str, filename: str) -> Document:
    return Document(
        id=document_id,
        clerk_user_id=owner,
        filename=filename,
        file_url=f"uploads/{filename}",
        status=DocumentStatus.COMPLETED,
    )


def test_rls_enforces_owner_reads_and_cross_tenant_writes() -> None:
    owner = f"user_a_{uuid.uuid4()}"
    other = f"user_b_{uuid.uuid4()}"
    owner_document_id, other_document_id = uuid.uuid4(), uuid.uuid4()
    chunk_id, conversation_id, message_id, citation_id = (uuid.uuid4() for _ in range(4))

    with tenant_session(owner) as session:
        session.add(_document(owner_document_id, owner, "owner.pdf"))
        session.commit()
    with tenant_session(other) as session:
        session.add(_document(other_document_id, other, "other.pdf"))
        session.add(DocumentChunk(id=chunk_id, document_id=other_document_id, content="private", page_number=1, order_index=0))
        session.add(AIConversation(id=conversation_id, clerk_user_id=other, document_id=other_document_id, title="Private"))
        session.add(AIMessage(id=message_id, conversation_id=conversation_id, role="user", content="private", sequence_number=1))
        session.add(AIMessageCitation(id=citation_id, message_id=message_id, chunk_id=chunk_id, citation_index=1, source_type="document", title="Private", excerpt="private"))
        session.commit()

    with tenant_session(owner) as session:
        assert session.get(Document, owner_document_id) is not None
        assert session.get(Document, other_document_id) is None
        assert session.get(DocumentChunk, chunk_id) is None
        assert session.get(AIMessageCitation, citation_id) is None
        assert session.exec(update(Document).where(Document.id == other_document_id).values(filename="tampered.pdf")).rowcount == 0
        assert session.exec(delete(Document).where(Document.id == other_document_id)).rowcount == 0
        session.rollback()
        session.add(_document(uuid.uuid4(), other, "forged-owner.pdf"))
        with pytest.raises(DBAPIError):
            session.commit()
        session.rollback()
        session.add(DocumentChunk(document_id=other_document_id, content="forged child", order_index=1))
        with pytest.raises(DBAPIError):
            session.commit()

    with Session(engine) as identityless:
        assert identityless.get(Document, owner_document_id) is None
        assert identityless.get(Document, other_document_id) is None


def test_background_task_provenance_cannot_select_another_tenant() -> None:
    owner = f"user_owner_{uuid.uuid4()}"
    attacker = f"user_attacker_{uuid.uuid4()}"
    document_id = uuid.uuid4()
    arguments = (str(document_id),)
    with tenant_session(owner) as session:
        session.add(_document(document_id, owner, "task.pdf"))
        session.commit()

    def database_probe(raw_document_id: str, tenant_id: str) -> dict[str, str]:
        with tenant_session(tenant_id) as session:
            document = session.get(Document, uuid.UUID(raw_document_id))
            if document is None:
                raise ValueError("Document was not found.")
            return {"document_id": raw_document_id, "owner": document.clerk_user_id or ""}

    valid_headers = build_task_headers("process_document", owner, arguments)
    with patch("tasks.document_processing._run_pipeline", side_effect=database_probe):
        result = process_document_task.apply(args=arguments, headers=valid_headers, throw=True)
    assert result.result["owner"] == owner

    forged_headers = dict(valid_headers)
    forged_headers[HEADER_TENANT] = attacker
    with patch("tasks.document_processing._run_pipeline", side_effect=database_probe) as pipeline:
        result = process_document_task.apply(args=arguments, headers=forged_headers, throw=False)
    assert result.failed()
    pipeline.assert_not_called()
