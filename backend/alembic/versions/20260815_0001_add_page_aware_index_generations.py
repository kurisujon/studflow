"""add page-aware document index generations

Revision ID: 20260815_0001
Revises: 20260801_0001
Create Date: 2026-08-15 12:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260815_0001"
down_revision = "20260801_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "documents",
        sa.Column(
            "active_index_generation",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("1"),
        ),
    )
    op.add_column(
        "documents",
        sa.Column(
            "active_index_page_cursor",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    op.add_column(
        "documents",
        sa.Column("pending_index_generation", sa.Integer(), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("pending_index_started_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("pending_index_heartbeat_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("pending_index_lease_token", sa.Uuid(), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("pending_index_page_cursor", sa.Integer(), nullable=True),
    )
    op.create_check_constraint(
        "ck_documents_active_index_page_cursor_nonnegative",
        "documents",
        "active_index_page_cursor >= 0",
    )
    op.create_check_constraint(
        "ck_documents_pending_index_generation_newer",
        "documents",
        "pending_index_generation IS NULL OR "
        "pending_index_generation > active_index_generation",
    )
    op.create_check_constraint(
        "ck_documents_pending_index_lease_consistent",
        "documents",
        "(pending_index_generation IS NULL AND "
        "pending_index_started_at IS NULL AND "
        "pending_index_heartbeat_at IS NULL AND "
        "pending_index_lease_token IS NULL AND "
        "pending_index_page_cursor IS NULL) OR "
        "(pending_index_generation IS NOT NULL AND "
        "pending_index_started_at IS NOT NULL AND "
        "pending_index_heartbeat_at IS NOT NULL AND "
        "pending_index_lease_token IS NOT NULL AND "
        "pending_index_page_cursor IS NOT NULL AND "
        "pending_index_page_cursor >= 0)",
    )

    op.add_column(
        "document_chunks",
        sa.Column(
            "index_generation",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("1"),
        ),
    )
    op.add_column(
        "document_chunks",
        sa.Column("page_number", sa.Integer(), nullable=True),
    )
    op.create_check_constraint(
        "ck_document_chunks_positive_generation",
        "document_chunks",
        "index_generation > 0",
    )
    op.create_check_constraint(
        "ck_document_chunks_positive_page",
        "document_chunks",
        "page_number IS NULL OR page_number > 0",
    )
    op.create_unique_constraint(
        "uq_document_chunks_document_generation_order",
        "document_chunks",
        ["document_id", "index_generation", "order_index"],
    )
    op.create_index(
        "ix_document_chunks_document_generation",
        "document_chunks",
        ["document_id", "index_generation"],
    )


def downgrade() -> None:
    # Multiple retained generations can reuse order indexes. Keep only the active
    # generation before removing the discriminator so the legacy schema remains valid.
    # Citation foreign keys use ON DELETE SET NULL and retain their title/excerpt.
    op.execute(
        "DELETE FROM document_chunks AS chunks "
        "USING documents AS documents "
        "WHERE chunks.document_id = documents.id "
        "AND chunks.index_generation <> documents.active_index_generation"
    )
    op.drop_index(
        "ix_document_chunks_document_generation",
        table_name="document_chunks",
    )
    op.drop_constraint(
        "uq_document_chunks_document_generation_order",
        "document_chunks",
        type_="unique",
    )
    op.drop_constraint(
        "ck_document_chunks_positive_page",
        "document_chunks",
        type_="check",
    )
    op.drop_constraint(
        "ck_document_chunks_positive_generation",
        "document_chunks",
        type_="check",
    )
    op.drop_column("document_chunks", "page_number")
    op.drop_column("document_chunks", "index_generation")

    op.drop_constraint(
        "ck_documents_active_index_page_cursor_nonnegative",
        "documents",
        type_="check",
    )
    op.drop_constraint(
        "ck_documents_pending_index_generation_newer",
        "documents",
        type_="check",
    )
    op.drop_constraint(
        "ck_documents_pending_index_lease_consistent",
        "documents",
        type_="check",
    )
    op.drop_column("documents", "pending_index_page_cursor")
    op.drop_column("documents", "pending_index_lease_token")
    op.drop_column("documents", "pending_index_heartbeat_at")
    op.drop_column("documents", "pending_index_started_at")
    op.drop_column("documents", "pending_index_generation")
    op.drop_column("documents", "active_index_page_cursor")
    op.drop_column("documents", "active_index_generation")
