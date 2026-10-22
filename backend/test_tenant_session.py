from __future__ import annotations

import unittest

from sqlalchemy import create_engine, text

from core.database import TenantSession


class TenantSessionTests(unittest.TestCase):
    def test_tenant_identity_is_immutable_across_commit_and_rollback(self) -> None:
        engine = create_engine("sqlite://")
        with TenantSession(engine, clerk_user_id="user_owner") as session:
            session.execute(text("SELECT 1"))
            session.commit()
            session.execute(text("SELECT 1"))
            session.rollback()
            session.execute(text("SELECT 1"))
            self.assertEqual(session.clerk_user_id, "user_owner")
            with self.assertRaises(AttributeError):
                session.clerk_user_id = "user_other"  # type: ignore[misc]

    def test_invalid_tenant_identity_is_rejected(self) -> None:
        engine = create_engine("sqlite://")
        for tenant_id in ("", "bad\nidentity", "x" * 256):
            with self.assertRaises(ValueError):
                TenantSession(engine, clerk_user_id=tenant_id)


if __name__ == "__main__":
    unittest.main()
