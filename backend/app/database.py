import asyncio
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base
from app.config import settings

logger = logging.getLogger(__name__)


def normalize_database_url(value: str | None) -> str:
    """
    Normalise a PostgreSQL connection URL.

    Accepts:
      - postgresql://...
      - postgres://...        (heroku / Railway short form)
      - postgresql+asyncpg://...
    """
    db_url = (value or "").strip().strip("'\"")
    if not db_url or "${" in db_url:
        raise ValueError(
            "DATABASE_URL is missing or still contains an unresolved variable "
            "placeholder. Set it to a real PostgreSQL connection string "
            "(e.g. postgresql+asyncpg://user:pass@host:5432/dbname)."
        )

    # Normalise 'postgres://' short-form used by Railway / Heroku
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    try:
        parsed_url = make_url(db_url)
    except Exception as exc:
        raise ValueError(
            "DATABASE_URL is not a valid PostgreSQL connection URL. "
            "Use postgresql:// or postgresql+asyncpg://."
        ) from exc

    if parsed_url.drivername == "postgresql":
        parsed_url = parsed_url.set(drivername="postgresql+asyncpg")
    elif parsed_url.drivername != "postgresql+asyncpg":
        raise ValueError(
            "DATABASE_URL must start with postgresql://, postgres://, "
            "or postgresql+asyncpg://."
        )

    return parsed_url.render_as_string(hide_password=False)


# ── Engine ────────────────────────────────────────────────────────────────────

db_url = normalize_database_url(settings.DATABASE_URL)

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    # PostgreSQL-specific tuning
    pool_pre_ping=True,   # validate connections before checkout
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=1800,    # recycle connections every 30 minutes
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


# ── Dependency ────────────────────────────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a transactional database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Startup ───────────────────────────────────────────────────────────────────

async def init_db(max_retries: int = 10, delay: float = 2.0) -> None:
    """
    Create all tables (idempotent).
    Retries up to *max_retries* times with *delay* seconds between attempts
    so the app can gracefully wait for Postgres to become ready (e.g. Docker
    Compose start-up race).
    """
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(
                "Connecting to database (attempt %d/%d)…", attempt, max_retries
            )
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables initialised successfully.")
            return
        except Exception as exc:
            logger.warning("Database attempt %d failed: %s", attempt, exc)
            if attempt == max_retries:
                logger.error(
                    "Could not connect to the database after %d attempts.", max_retries
                )
                raise
            await asyncio.sleep(delay)


async def database_is_ready() -> bool:
    """Return whether the application can currently reach PostgreSQL."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        logger.exception("Database readiness check failed.")
        return False
