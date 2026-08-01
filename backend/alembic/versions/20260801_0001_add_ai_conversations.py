"""add persistent AI conversations, messages, and citations

Revision ID: 20260801_0001
Revises: 20260722_0001
Create Date: 2026-08-01 12:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260801_0001"
down_revision = "20260722_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_conversations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("clerk_user_id", sa.String(length=255), nullable=False),
        sa.Column("document_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=160), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name="fk_ai_conversations_document_id_documents",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_ai_conversations"),
    )
    op.create_index("ix_ai_conversations_id", "ai_conversations", ["id"])
    op.create_index(
        "ix_ai_conversations_clerk_user_id",
        "ai_conversations",
        ["clerk_user_id"],
    )
    op.create_index(
        "ix_ai_conversations_document_id",
        "ai_conversations",
        ["document_id"],
    )
    op.create_index(
        "ix_ai_conversations_owner_updated",
        "ai_conversations",
        ["clerk_user_id", "updated_at"],
    )

    op.create_table(
        "ai_messages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("conversation_id", sa.Uuid(), nullable=False),
        sa.Column("sequence_number", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("selected_text", sa.Text(), nullable=True),
        sa.Column(
            "retrieval_mode",
            sa.String(length=16),
            nullable=False,
            server_default="document",
        ),
        sa.Column(
            "suggested_followups",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "role IN ('user', 'assistant', 'system')",
            name="ck_ai_messages_role",
        ),
        sa.CheckConstraint(
            "retrieval_mode IN ('document', 'web', 'hybrid')",
            name="ck_ai_messages_retrieval_mode",
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["ai_conversations.id"],
            name="fk_ai_messages_conversation_id_ai_conversations",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_ai_messages"),
        sa.UniqueConstraint(
            "conversation_id",
            "sequence_number",
            name="uq_ai_messages_conversation_sequence",
        ),
    )
    op.create_index("ix_ai_messages_id", "ai_messages", ["id"])
    op.create_index(
        "ix_ai_messages_conversation_id",
        "ai_messages",
        ["conversation_id"],
    )
    op.create_index(
        "ix_ai_messages_conversation_created_id",
        "ai_messages",
        ["conversation_id", "created_at", "id"],
    )

    op.create_table(
        "ai_message_citations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("message_id", sa.Uuid(), nullable=False),
        sa.Column("citation_index", sa.Integer(), nullable=False),
        sa.Column("source_type", sa.String(length=16), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=True),
        sa.Column("document_id", sa.Uuid(), nullable=True),
        sa.Column("chunk_id", sa.Uuid(), nullable=True),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("excerpt", sa.Text(), nullable=True),
        sa.CheckConstraint(
            "source_type IN ('document', 'web')",
            name="ck_ai_message_citations_source_type",
        ),
        sa.CheckConstraint(
            "citation_index > 0",
            name="ck_ai_message_citations_positive_index",
        ),
        sa.CheckConstraint(
            "page_number IS NULL OR page_number > 0",
            name="ck_ai_message_citations_positive_page",
        ),
        sa.ForeignKeyConstraint(
            ["message_id"],
            ["ai_messages.id"],
            name="fk_ai_message_citations_message_id_ai_messages",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name="fk_ai_message_citations_document_id_documents",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["chunk_id"],
            ["document_chunks.id"],
            name="fk_ai_message_citations_chunk_id_document_chunks",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_ai_message_citations"),
        sa.UniqueConstraint(
            "message_id",
            "citation_index",
            name="uq_ai_message_citations_message_index",
        ),
    )
    op.create_index("ix_ai_message_citations_id", "ai_message_citations", ["id"])
    op.create_index(
        "ix_ai_message_citations_message_id",
        "ai_message_citations",
        ["message_id"],
    )
    op.create_index(
        "ix_ai_message_citations_document_id",
        "ai_message_citations",
        ["document_id"],
    )
    op.create_index(
        "ix_ai_message_citations_chunk_id",
        "ai_message_citations",
        ["chunk_id"],
    )


def downgrade() -> None:
    op.drop_table("ai_message_citations")
    op.drop_table("ai_messages")
    op.drop_table("ai_conversations")
