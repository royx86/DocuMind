import asyncio
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

def normalize_database_url(value: str | None) -> str:
    """Normalize supported Postgres URLs and reject invalid deployment values."""
    db_url = (value or "").strip().strip("'\"")
    if not db_url or "${{" in db_url or db_url.startswith("${"):
        raise ValueError(
            "DATABASE_URL is missing or still contains a Railway variable "
            "reference. Set it to Railway's resolved PostgreSQL DATABASE_URL."
        )

    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    try:
        parsed_url = make_url(db_url)
    except Exception as exc:
        raise ValueError(
            "DATABASE_URL is not a valid PostgreSQL connection URL. "
            "Use a value beginning with postgresql:// or postgresql+asyncpg://."
        ) from exc

    if parsed_url.drivername == "postgresql":
        parsed_url = parsed_url.set(drivername="postgresql+asyncpg")
    elif parsed_url.drivername != "postgresql+asyncpg":
        raise ValueError(
            "DATABASE_URL must use postgresql://, postgres://, or "
            "postgresql+asyncpg://."
        )

    return parsed_url.render_as_string(hide_password=False)


db_url = normalize_database_url(settings.DATABASE_URL)

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
