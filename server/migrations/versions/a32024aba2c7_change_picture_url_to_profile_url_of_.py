"""squashed into initial migration - no-op

Revision ID: a32024aba2c7
Revises: 057b7a3cf270
Create Date: 2026-04-10 20:07:42.729834

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = 'a32024aba2c7'
down_revision: Union[str, Sequence[str], None] = '057b7a3cf270'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No-op: profile_url already included in initial migration."""
    pass


def downgrade() -> None:
    """No-op."""
    pass
