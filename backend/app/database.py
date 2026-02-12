"""
KadaiGPT - Database Configuration
Async SQLAlchemy setup with Neon PostgreSQL (Vercel) or SQLite (local dev)

Vercel serverless functions are stateless - each request gets its own connection.
Neon's serverless driver handles connection pooling automatically.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
import logging
import os

logger = logging.getLogger(__name__)

# Get the async-compatible database URL
db_url = settings.get_async_database_url()
is_sqlite = db_url.startswith("sqlite")

# Log connection target (hide credentials)
if "@" in db_url:
    log_url = db_url.split("@")[-1]
else:
    log_url = "SQLite (local)"
logger.info(f"[Database] Connecting to: {log_url}")

# Engine configuration differs between SQLite and PostgreSQL
engine_kwargs = {
    "echo": settings.debug,
    "future": True,
}

if not is_sqlite:
    # PostgreSQL (Neon/Vercel) settings
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 5,           # Smaller pool for serverless
        "max_overflow": 10,
        "pool_recycle": 300,      # Recycle connections every 5 min
        "pool_timeout": 30,
        "connect_args": {
            "server_settings": {
                "application_name": "kadaigpt"
            }
        }
    })
    
    # Neon requires SSL
    if "neon.tech" in db_url:
        engine_kwargs["connect_args"]["ssl"] = "require"

# Create async engine
engine = create_async_engine(db_url, **engine_kwargs)

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
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
