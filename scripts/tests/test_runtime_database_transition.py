from __future__ import annotations

import importlib.util
import io
import json
import stat
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).parents[1] / "runtime_database_transition.py"
SPEC = importlib.util.spec_from_file_location("runtime_database_transition", MODULE_PATH)
assert SPEC and SPEC.loader
transition = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(transition)


class RecordingConnection:
    def __init__(self) -> None:
        self.statements: list[str] = []

    def execute(self, statement, parameters=None):
        self.statements.append(str(statement))


class RuntimeDatabaseTransitionTests(unittest.TestCase):
    def test_credentials_require_exact_separate_fields(self) -> None:
        valid = json.dumps({"app_database_url": "postgresql://app", "migration_database_url": "postgresql://operator"})
        with patch("sys.stdin", io.StringIO(valid)):
            self.assertEqual(transition._read_credentials(), ("postgresql://app", "postgresql://operator"))
        for payload in (
            {},
            {"app_database_url": "postgresql://same", "migration_database_url": "postgresql://same"},
            {"app_database_url": "postgresql://app", "migration_database_url": "postgresql://operator", "extra": "x"},
        ):
            with self.subTest(payload=payload), patch("sys.stdin", io.StringIO(json.dumps(payload))):
                with self.assertRaises(transition.TransitionDatabaseError):
                    transition._read_credentials()

    def test_reconcile_revokes_all_before_exact_runtime_grants(self) -> None:
        connection = RecordingConnection()
        sqlalchemy = types.SimpleNamespace(text=lambda value: value)
        with patch.dict(sys.modules, {"sqlalchemy": sqlalchemy}):
            transition._reconcile(connection, "app_user")
        sql = "\n".join(connection.statements)
        self.assertIn('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM "app_user"', sql)
        self.assertIn('REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM "app_user"', sql)
        self.assertIn('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE', sql)
        self.assertIn('public."users", public."alembic_version"', sql)
        self.assertNotIn("BYPASSRLS", sql)
        self.assertLess(sql.index("REVOKE ALL PRIVILEGES ON ALL TABLES"), sql.index("GRANT SELECT"))

    def test_rewrite_env_is_atomic_private_and_preserves_unrelated_values(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            credentials = root / "credentials.json"
            environment = root / ".env.production"
            backup = root / "backup.env"
            credentials.write_text(json.dumps({"app_database_url": "postgresql://app", "migration_database_url": "postgresql://operator"}))
            credentials.chmod(0o600)
            environment.write_text("DATABASE_URL=postgresql://legacy\nSECRET_KEY=preserved\n")
            environment.chmod(0o600)
            transition.rewrite_env(credentials, environment, backup)
            self.assertEqual(environment.read_text(), "DATABASE_URL=postgresql://app\nSECRET_KEY=preserved\n")
            self.assertEqual(backup.read_text(), "DATABASE_URL=postgresql://legacy\nSECRET_KEY=preserved\n")
            self.assertEqual(stat.S_IMODE(environment.stat().st_mode), 0o600)
            self.assertEqual(stat.S_IMODE(backup.stat().st_mode), 0o600)

    def test_rewrite_rejects_duplicate_database_url_without_mutation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            credentials = root / "credentials.json"
            environment = root / ".env.production"
            backup = root / "backup.env"
            credentials.write_text(json.dumps({"app_database_url": "postgresql://app"}))
            credentials.chmod(0o600)
            original = "DATABASE_URL=one\nDATABASE_URL=two\n"
            environment.write_text(original)
            with self.assertRaises(transition.TransitionDatabaseError):
                transition.rewrite_env(credentials, environment, backup)
            self.assertEqual(environment.read_text(), original)
            self.assertFalse(backup.exists())


if __name__ == "__main__":
    unittest.main()
