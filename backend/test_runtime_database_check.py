from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path


CHECKER = Path(__file__).parents[1] / "scripts" / "check_runtime_database.py"


class RuntimeDatabaseCheckTests(unittest.TestCase):
    def test_optimized_python_rejects_every_privileged_role_attribute(self) -> None:
        for privileged_index in (1, 2, 3, 4, 5):
            role = [True, False, False, False, False, False]
            role[privileged_index] = True
            bootstrap = f"""
import runpy, sys, types
sqlalchemy = types.ModuleType('sqlalchemy')
sqlalchemy.text = lambda value: value
sys.modules['sqlalchemy'] = sqlalchemy
core = types.ModuleType('core')
core.__path__ = []
sys.modules['core'] = core
config = types.ModuleType('core.config')
config.settings = types.SimpleNamespace(secret_key='s' * 40)
sys.modules['core.config'] = config
database = types.ModuleType('core.database')
class Result:
    def one_or_none(self): return {tuple(role)!r}
class Connection:
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def execute(self, *args, **kwargs): return Result()
class Engine:
    def connect(self): return Connection()
database.engine = Engine()
sys.modules['core.database'] = database
runpy.run_path(sys.argv[1], run_name='__main__')
"""
            result = subprocess.run(
                [sys.executable, "-O", "-c", bootstrap, str(CHECKER)],
                capture_output=True,
                text=True,
                check=False,
            )
            with self.subTest(privileged_index=privileged_index):
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("role-attributes", result.stderr)
                self.assertNotIn("ssss", result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
