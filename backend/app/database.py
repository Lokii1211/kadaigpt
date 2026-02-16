"""
KadaiGPT - Database Configuration
Async SQLAlchemy setup with PostgreSQL (Production) or SQLite (local dev)

Production-grade connection pooling, health checks, and index management.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text, Index, event
from app.config import settings
import logging
import os
import time

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
    # PostgreSQL production settings — optimized pool
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 20,           # Production pool size
        "max_overflow": 10,        # Extra connections under load
        "pool_recycle": 1800,      # Recycle connections every 30 min
        "pool_timeout": 30,
        "connect_args": {
            "server_settings": {
                "application_name": "kadaigpt",
                "statement_timeout": "30000",  # 30s query timeout
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
    """Initialize database - create all tables and indexes"""
    logger.info("[Database] Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("[Database] Tables created successfully!")
    await create_indexes()


async def create_indexes():
    """Create performance indexes for common query patterns"""
    index_statements = [
        # Products: frequently searched by store + name
        "CREATE INDEX IF NOT EXISTS idx_products_store_name ON products(store_id, name)",
        "CREATE INDEX IF NOT EXISTS idx_products_store_active ON products(store_id, is_active)",
        "CREATE INDEX IF NOT EXISTS idx_products_store_category ON products(store_id, category_id)",
        "CREATE INDEX IF NOT EXISTS idx_products_store_stock ON products(store_id, current_stock)",
        # Bills: frequently queried by store + date range
        "CREATE INDEX IF NOT EXISTS idx_bills_store_date ON bills(store_id, created_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_bills_store_status ON bills(store_id, status)",
        "CREATE INDEX IF NOT EXISTS idx_bills_customer_phone ON bills(customer_phone)",
        "CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number)",
        # Bill Items: join performance
        "CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id)",
        "CREATE INDEX IF NOT EXISTS idx_bill_items_product ON bill_items(product_id)",
        # Customers: phone lookup
        "CREATE INDEX IF NOT EXISTS idx_customers_store_phone ON customers(store_id, phone)",
        "CREATE INDEX IF NOT EXISTS idx_customers_store_name ON customers(store_id, name)",
        # Users: auth lookups
        "CREATE INDEX IF NOT EXISTS idx_users_store ON users(store_id)",
        # Daily Summaries: date range queries
        "CREATE INDEX IF NOT EXISTS idx_daily_summaries_store_date ON daily_summaries(store_id, summary_date DESC)",
        # Agent Logs: recent logs
        "CREATE INDEX IF NOT EXISTS idx_agent_logs_store_date ON agent_logs(store_id, created_at DESC)",
    ]
    try:
        async with engine.begin() as conn:
            for stmt in index_statements:
                try:
                    await conn.execute(text(stmt))
                except Exception as e:
                    logger.debug(f"Index already exists or skipped: {e}")
        logger.info(f"[Database] {len(index_statements)} performance indexes ensured")
    except Exception as e:
        logger.warning(f"[Database] Index creation skipped: {e}")


async def check_db_health() -> dict:
    """Check database connectivity and return health info"""
    start = time.time()
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            latency_ms = round((time.time() - start) * 1000, 2)
            pool = engine.pool
            return {
                "status": "healthy",
                "latency_ms": latency_ms,
                "pool_size": pool.size() if hasattr(pool, 'size') else "N/A",
                "checked_out": pool.checkedout() if hasattr(pool, 'checkedout') else "N/A",
            }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)[:100]}


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
