from __future__ import annotations

import ast
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _extract_python_tuple(relative_path: str, symbol: str = "RUNTIME_TABLES") -> tuple[str, ...]:
    source = (ROOT / relative_path).read_text(encoding="utf-8")
    tree = ast.parse(source, filename=relative_path)
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == symbol:
                    value = ast.literal_eval(node.value)
                    if not isinstance(value, (tuple, list)):
                        raise AssertionError(f"{relative_path}:{symbol} must be a tuple/list")
                    return tuple(str(item) for item in value)
    raise AssertionError(f"Could not find {symbol} in {relative_path}")


def _extract_pipeline_runtime_tables() -> tuple[str, ...]:
    text = (ROOT / ".github/workflows/pipeline.yml").read_text(encoding="utf-8")
    match = re.search(r'RUNTIME_TABLES="([^"]+)"', text)
    if not match:
        raise AssertionError("Could not find RUNTIME_TABLES in .github/workflows/pipeline.yml")
    return tuple(item.strip() for item in match.group(1).split(",") if item.strip())


class RuntimeTablesSyncTests(unittest.TestCase):
    def test_runtime_tables_lists_agree_across_ci_scripts_and_rls_tests(self) -> None:
        sources = {
            ".github/workflows/pipeline.yml": _extract_pipeline_runtime_tables(),
            "scripts/check_runtime_database.py": _extract_python_tuple("scripts/check_runtime_database.py"),
            "scripts/runtime_database_transition.py": _extract_python_tuple("scripts/runtime_database_transition.py"),
            "backend/eval/test_rls_integration.py": _extract_python_tuple("backend/eval/test_rls_integration.py"),
            "scripts/run_local_rls_tests.py": _extract_python_tuple("scripts/run_local_rls_tests.py"),
        }
        expected = sources["backend/eval/test_rls_integration.py"]
        for path, tables in sources.items():
            with self.subTest(path=path):
                self.assertEqual(set(tables), set(expected))
                self.assertEqual(len(tables), len(set(tables)))


if __name__ == "__main__":
    unittest.main()
