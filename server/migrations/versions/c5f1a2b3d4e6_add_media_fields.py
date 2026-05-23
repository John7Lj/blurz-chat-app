"""add media fields to message and expand messagetype enum

Revision ID: c5f1a2b3d4e6
Revises: 8decc32a4c07
Create Date: 2026-05-23 23:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'c5f1a2b3d4e6'
down_revision: Union[str, Sequence[str], None] = '8decc32a4c07'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add media columns to message table and expand messagetype enum."""

    # 1. Expand the PostgreSQL messagetype enum with new values
    #    ALTER TYPE cannot run inside a transaction block, so we use
    #    autocommit via connection.execute
    op.execute("ALTER TYPE messagetype ADD VALUE IF NOT EXISTS 'image'")
    op.execute("ALTER TYPE messagetype ADD VALUE IF NOT EXISTS 'video'")
    op.execute("ALTER TYPE messagetype ADD VALUE IF NOT EXISTS 'audio'")
    op.execute("ALTER TYPE messagetype ADD VALUE IF NOT EXISTS 'document'")

    # 2. Add new columns to the message table
    op.add_column('message', sa.Column('file_url', sa.String(), nullable=True))
    op.add_column('message', sa.Column('file_size', sa.Integer(), nullable=True))
    op.add_column('message', sa.Column('file_mime', sa.String(), nullable=True))
    op.add_column('message', sa.Column('thumbnail_url', sa.String(), nullable=True))


def downgrade() -> None:
    """Remove media columns from message table."""
    op.drop_column('message', 'thumbnail_url')
    op.drop_column('message', 'file_mime')
    op.drop_column('message', 'file_size')
    op.drop_column('message', 'file_url')

    # Note: PostgreSQL doesn't support removing values from an enum.
    # The enum values (image, video, audio, document) will remain.
