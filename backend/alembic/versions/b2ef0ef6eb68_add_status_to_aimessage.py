"""Add status to AIMessage

Revision ID: b2ef0ef6eb68
Revises: 20260815_0001
Create Date: 2026-08-19 14:01:41.966788
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = 'b2ef0ef6eb68'
down_revision = '20260815_0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Safely add the column with a default for existing rows
    op.add_column('ai_messages', sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=32), server_default='ANSWERED', nullable=False))
    
    # Remove the server default now that backfill is done
    op.alter_column('ai_messages', 'status', server_default=None)


def downgrade() -> None:
    op.drop_column('ai_messages', 'status')