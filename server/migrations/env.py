from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy import pool

from alembic import context

# Alembic's own config object (reads alembic.ini)
alembic_cfg = context.config

# App settings (pydantic) — imported under a different name to avoid collision
from db.config import config as app_settings

# Set up loggers from alembic.ini
if alembic_cfg.config_file_name is not None:
    fileConfig(alembic_cfg.config_file_name)

# Import all SQLModel models so their metadata is registered
from db.models import *  # noqa: F401, F403
from sqlmodel import SQLModel

target_metadata = SQLModel.metadata

# Build a synchronous DB URL from your async one
# e.g. postgresql+asyncpg://... -> postgresql+psycopg2://...
def get_sync_url() -> str:
    url: str = app_settings.DB_URL
    # Replace async driver with sync driver for alembic
    return url.replace("postgresql+asyncpg", "postgresql+psycopg2")


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no live DB connection needed)."""
    url = get_sync_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (live DB connection)."""
    connectable = create_engine(
        get_sync_url(),
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

