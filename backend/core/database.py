from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import NullPool

from core.config import settings
from models import tables  # noqa: F401

# Sync engine — uses psycopg2 (pre-compiled binary, no Build Tools needed on Windows)
engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    poolclass=NullPool,
    connect_args={
        "prepare_threshold": None,
    },
)


def init_db() -> None:
    """Create all tables on startup (development convenience).
    Switch to Alembic migrations before any production deployment."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a DB session per request."""
    with Session(engine) as session:
        yield session
