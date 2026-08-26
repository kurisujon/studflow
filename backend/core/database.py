from typing import Generator
from sqlmodel import Session, create_engine
from sqlalchemy import text
from fastapi import Depends

from core.config import settings
from core.auth import get_current_user, CurrentUser

engine = create_engine(
    settings.database_url,
    echo=settings.db_echo,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

def get_session(current_user: CurrentUser = Depends(get_current_user)) -> Generator[Session, None, None]:
    """FastAPI dependency that yields a DB session per request, with RLS context set."""
    session = Session(engine)
    try:
        session.execute(
            text("SET LOCAL app.current_user_id = :uid"),
            {"uid": current_user.clerk_user_id}
        )
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def get_identityless_session() -> Generator[Session, None, None]:
    """Yields a DB session with NO identity context.
    
    Given FORCE ROW LEVEL SECURITY and a NOBYPASSRLS app role, this session 
    will return ZERO rows for any policy-protected table. It provides 
    'no identity context', NOT 'unrestricted access'. 
    
    If cross-tenant admin access is required, a dedicated DB role and session 
    factory must be created.
    """
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def commit_and_reassert_rls(session: Session, clerk_user_id: str) -> None:
    """
    Commits the current transaction and immediately re-establishes the RLS context.
    Use this helper instead of session.commit() inside request-scoped logic to 
    prevent subsequent DB queries from silently failing due to lost identity.
    """
    session.commit()
    session.execute(
        text("SET LOCAL app.current_user_id = :uid"),
        {"uid": clerk_user_id}
    )
