"""initial schema - create all tables

Revision ID: 057b7a3cf270
Revises: 
Create Date: 2026-03-27 19:27:54.889549

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '057b7a3cf270'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all tables from scratch."""

    # Enums
    messagetype = pg.ENUM('text', 'file', name='messagetype', create_type=True)
    messagestatus = pg.ENUM('sent', 'delivered', 'read', name='messagestatus', create_type=True)
    messagetype.create(op.get_bind(), checkfirst=True)
    messagestatus.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'user',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True),
        sa.Column('username', sa.String(), nullable=False, unique=True),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('phone', sa.String(), nullable=False, unique=True),
        sa.Column('first_name', sa.String(), nullable=False, server_default='new_user'),
        sa.Column('last_name', sa.String(), nullable=False, server_default='new_user'),
        sa.Column('profile_url', sa.String(), nullable=True),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', pg.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', pg.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_user_username', 'user', ['username'])
    op.create_index('ix_user_email', 'user', ['email'])

    op.create_table(
        'chat',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', pg.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', pg.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        'chat_participants',
        sa.Column('chat_id', pg.UUID(as_uuid=True), sa.ForeignKey('chat.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('user_id', pg.UUID(as_uuid=True), sa.ForeignKey('user.id', ondelete='CASCADE'), primary_key=True),
    )

    op.create_table(
        'message',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True),
        sa.Column('content', sa.String(), nullable=True),
        sa.Column('file_key', sa.String(), nullable=True),
        sa.Column('file_name', sa.String(), nullable=True),
        sa.Column('sender_id', pg.UUID(as_uuid=True), sa.ForeignKey('user.id'), nullable=False),
        sa.Column('chat_id', pg.UUID(as_uuid=True), sa.ForeignKey('chat.id'), nullable=False, index=True),
        sa.Column('msg_type', pg.ENUM('text', 'file', name='messagetype', create_type=False), nullable=True),
        sa.Column('status', pg.ENUM('sent', 'delivered', 'read', name='messagestatus', create_type=False), nullable=True),
        sa.Column('sent_at', pg.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', pg.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_message_chat_id', 'message', ['chat_id'])


def downgrade() -> None:
    """Drop all tables."""
    op.drop_table('message')
    op.drop_table('chat_participants')
    op.drop_table('chat')
    op.drop_table('user')
    op.execute("DROP TYPE IF EXISTS messagetype")
    op.execute("DROP TYPE IF EXISTS messagestatus")
