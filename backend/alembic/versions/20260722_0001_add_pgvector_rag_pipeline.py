"""add pgvector embeddings and granular document pipeline states

Revision ID: 20260722_0001
Revises: 10a49d43985d
Create Date: 2026-07-22 12:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

from models.tables import Vector


revision = "20260722_0001"
down_revision = "10a49d43985d"
branch_labels = None
depends_on = None


NEW_DOCUMENT_STATUSES = (
    "EXTRACTING",
    "CHUNKING",
    "EMBEDDING",
    "ANALYZING",
    "GENERATING",
    "VALIDATING",
)


def upgrade() -> None:
    # The runtime database image must include pgvector before this migration runs.
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    for document_status in NEW_DOCUMENT_STATUSES:
        op.execute(
            f"ALTER TYPE documentstatus ADD VALUE IF NOT EXISTS '{document_status}'"
        )

    op.add_column(
        "document_chunks",
        sa.Column("embedding", Vector(768), nullable=True),
    )
    op.execute(
        "CREATE INDEX ix_document_chunks_embedding_cosine "
        "ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )


def downgrade() -> None:
    op.drop_index("ix_document_chunks_embedding_cosine", table_name="document_chunks")
    op.drop_column("document_chunks", "embedding")

    # PostgreSQL does not support removing enum values, so rebuild the legacy type.
    op.execute("ALTER TABLE documents ALTER COLUMN status TYPE varchar USING status::text")
    op.execute("DROP TYPE documentstatus")
    op.execute(
        "CREATE TYPE documentstatus AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')"
    )
    op.execute(
        "ALTER TABLE documents ALTER COLUMN status TYPE documentstatus "
        "USING (CASE WHEN status IN "
        "('EXTRACTING', 'CHUNKING', 'EMBEDDING', 'ANALYZING', 'GENERATING', 'VALIDATING') "
        "THEN 'PROCESSING' ELSE status END)::documentstatus"
    )
    op.execute("DROP EXTENSION IF EXISTS vector")
