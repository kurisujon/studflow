from typing import Generator

from sqlalchemy import event, text
from sqlalchemy.engine import Connection
from sqlalchemy.orm import SessionTransaction
from sqlmodel import Session, create_engine
from fastapi import Depends

from core.config import settings
from core.auth import get_current_user, CurrentUser

engine = create_engine(
    settings.database_url,
    echo=settings.db_echo,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args={"prepare_threshold": None},
)

_TENANT_INFO_KEY = "studflow.clerk_user_id"

class TenantSession(Session):
    """Session whose immutable tenant identity is restored for every transaction."""

    def __init__(self, *args: object, clerk_user_id: str, **kwargs: object) -> None:
        tenant_id = clerk_user_id.strip()
        if not tenant_id or len(tenant_id) > 255 or any(
            character in tenant_id for character in ("\x00", "\r", "\n")
        ):
            raise ValueError("A valid tenant identity is required.")
        super().__init__(*args, **kwargs)
        self.info[_TENANT_INFO_KEY] = tenant_id

    @property
    def clerk_user_id(self) -> str:
        return str(self.info[_TENANT_INFO_KEY])


@event.listens_for(TenantSession, "after_begin")
def _set_tenant_context(
    session: TenantSession,
    transaction: SessionTransaction,
    connection: Connection,
) -> None:
    """Apply transaction-local RLS context after begin, commit, and rollback."""
    del transaction
    if connection.dialect.name == "postgresql":
        connection.execute(
            text("SELECT set_config('app.current_user_id', :uid, true)"),
            {"uid": session.clerk_user_id},
        )


def tenant_session(clerk_user_id: str) -> TenantSession:
    return TenantSession(engine, clerk_user_id=clerk_user_id)


def get_session(current_user: CurrentUser = Depends(get_current_user)) -> Generator[Session, None, None]:
    """Yield a request session that restores RLS context on each transaction."""
    session = tenant_session(current_user.clerk_user_id)
    try:
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
    if isinstance(session, TenantSession) and session.clerk_user_id != clerk_user_id:
        raise ValueError("Session tenant identity cannot be changed.")
    session.commit()
    # Legacy plain sessions still need an explicit context for their next
    # transaction. TenantSession reapplies it in the after_begin hook.
    if not isinstance(session, TenantSession):
        session.execute(
            text("SELECT set_config('app.current_user_id', :uid, true)"),
            {"uid": clerk_user_id},
        )
