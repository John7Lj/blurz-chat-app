from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncEngine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from .config import config
import logging

logger = logging.getLogger(__name__)

# Create async engine with pool configuration
engine: AsyncEngine = create_async_engine(
    config.DB_URL,
    echo=config.DEBUG,
    future=True,
    pool_size=10,           # number of persistent connections
    max_overflow=20,        # extra connections beyond pool_size under load
    pool_timeout=30,        # seconds to wait for a connection before raising
    pool_recycle=1800,      # recycle connections every 30 min (avoids stale connections)
    pool_pre_ping=True,     # test connection health before using it
)

async_session = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


# Retry on transient DB errors (e.g. DB restart, network blip)
@retry(
    retry=retry_if_exception_type(OperationalError),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=5),
    reraise=True,
)
async def init_db() -> None:
    """Create all tables. Retries up to 3 times on transient errors."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        logger.info("Database tables initialized successfully.")
    except SQLAlchemyError as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


async def close_db() -> None:
    """Dispose engine — call on app shutdown."""
    await engine.dispose()
    logger.info("Database engine disposed.")


async def get_session():
    """FastAPI dependency that yields a session with basic error handling."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except SQLAlchemyError as e:
            await session.rollback()
            logger.error(f"Session error, rolling back: {e}")
            raise
        finally:
            await session.close()