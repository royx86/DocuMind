import asyncio
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncConnection
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
                await migrate_schema(conn)
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


async def migrate_schema(conn: AsyncConnection) -> None:
    """
    Bring existing tables in line with the current SQLAlchemy models.

    Strategy:
    1. Rename legacy column aliases (e.g. hashed_password → password_hash)
       so that data is preserved and NOT-NULL constraints are not violated.
    2. Add any brand-new columns that don't exist yet.
    """
    table_names = await conn.run_sync(
        lambda sync_conn: set(inspect(sync_conn).get_table_names())
    )
    quote = conn.dialect.identifier_preparer.quote

    # ── Column renames: (table, old_name, new_name) ──────────────────────────
    COLUMN_RENAMES = [
        ("users", "hashed_password", "password_hash"),
    ]

    for table_name, old_col, new_col in COLUMN_RENAMES:
        if table_name not in table_names:
            continue
        existing_cols = await conn.run_sync(
            lambda sync_conn, tn=table_name: {
                c["name"] for c in inspect(sync_conn).get_columns(tn)
            }
        )
        if old_col in existing_cols and new_col not in existing_cols:
            logger.warning(
                "Renaming legacy column %s.%s → %s.", table_name, old_col, new_col
            )
            await conn.execute(
                text(
                    f"ALTER TABLE {quote(table_name)} "
                    f"RENAME COLUMN {quote(old_col)} TO {quote(new_col)}"
                )
            )

    # ── Add missing columns ───────────────────────────────────────────────────
    for table in Base.metadata.sorted_tables:
        if table.name not in table_names:
            continue

        column_names = await conn.run_sync(
            lambda sync_conn, table_name=table.name: {
                column["name"]
                for column in inspect(sync_conn).get_columns(table_name)
            }
        )
        for column in table.columns:
            if column.name in column_names:
                continue

            column_type = column.type.compile(dialect=conn.dialect)
            logger.warning(
                "Adding missing database column %s.%s.", table.name, column.name
            )
            await conn.execute(
                text(
                    f"ALTER TABLE {quote(table.name)} "
                    f"ADD COLUMN IF NOT EXISTS {quote(column.name)} {column_type}"
                )
            )


async def database_is_ready() -> bool:
    """Return whether the application can currently reach PostgreSQL."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT password_hash FROM users LIMIT 0"))
        return True
    except Exception:
        logger.exception("Database readiness check failed.")
        return False
