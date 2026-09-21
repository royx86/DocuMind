import asyncio
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

# Normalize DATABASE_URL for asyncpg if standard postgresql:// is provided
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Handle engine args (e.g. check_same_thread for sqlite)
engine_args = {"echo": False, "future": True}
if db_url.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    engine_args["pool_pre_ping"] = True
    engine_args["pool_size"] = 10
    engine_args["max_overflow"] = 20

engine = create_async_engine(db_url, **engine_args)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db(max_retries: int = 10, delay: float = 2.0):
    """
    Initialize database tables with connection retry logic
    (useful when starting up in Docker Compose while Postgres is booting).
    """
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Connecting to database (attempt {attempt}/{max_retries})...")
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables initialized successfully.")
            return
        except Exception as exc:
            logger.warning(f"Database connection attempt {attempt} failed: {exc}")
            if attempt == max_retries:
                logger.error("Could not connect to database after maximum retries.")
                raise exc
            await asyncio.sleep(delay)
