"""
KadaiGPT - Database Configuration
Async SQLAlchemy setup with PostgreSQL (Railway) or SQLite (local dev)
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Get the async-compatible database URL
db_url = settings.get_async_database_url()
logger.info(f"[Database] Connecting to: {db_url.split('@')[-1] if '@' in db_url else 'SQLite (local)'}")

# Create async engine
engine = create_async_engine(
    db_url,
    echo=settings.debug,
    future=True,
    # PostgreSQL connection pool settings
    pool_pre_ping=True,  # Check connection health
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


class Base(DeclarativeBase):
    """Base class for all database models"""
    pass


async def init_db():
    """Initialize database - create all tables"""
    logger.info("[Database] Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("[Database] Tables created successfully!")


async def get_db() -> AsyncSession:
    """Dependency to get database session"""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

