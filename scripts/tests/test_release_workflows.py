from __future__ import annotations

import re
import subprocess
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).parents[2]
WORKFLOWS = ROOT / ".github" / "workflows"


class GithubLoader(yaml.SafeLoader):
    pass


for first_character, resolvers in list(GithubLoader.yaml_implicit_resolvers.items()):
    GithubLoader.yaml_implicit_resolvers[first_character] = [
        resolver for resolver in resolvers if resolver[0] != "tag:yaml.org,2002:bool"
    ]


def load_workflow(name: str) -> tuple[dict, str]:
    text = (WORKFLOWS / name).read_text(encoding="utf-8")
    parsed = yaml.load(text, Loader=GithubLoader)
    if not isinstance(parsed, dict):
        raise AssertionError(f"{name} did not parse as a mapping")
    return parsed, text


class ReleaseWorkflowPolicyTests(unittest.TestCase):
    def test_release_and_preflight_are_manual_main_only(self) -> None:
        for name in ("application-release.yml", "production-preflight.yml"):
            workflow, text = load_workflow(name)
            self.assertEqual(set(workflow["on"]), {"workflow_dispatch"})
            self.assertIn("refs/heads/main", text)
            self.assertNotIn("pull_request:", text)
            self.assertEqual(
                workflow["concurrency"]["group"],
                "production-application-operations",
            )

    def test_production_environment_guards_mutating_jobs(self) -> None:
        workflow, _ = load_workflow("application-release.yml")
        self.assertEqual(workflow["jobs"]["build"]["environment"]["name"], "production")
        self.assertEqual(workflow["jobs"]["deploy"]["environment"]["name"], "production")
        self.assertEqual(
            workflow["jobs"]["build"]["permissions"].get("packages"), "write"
        )
        for name, job in workflow["jobs"].items():
            if name != "build":
                self.assertNotEqual(job.get("permissions", {}).get("packages"), "write")

    def test_release_binds_compatibility_to_preflight_attested_images(self) -> None:
        workflow, text = load_workflow("application-release.yml")
        inputs = workflow["on"]["workflow_dispatch"]["inputs"]
        self.assertTrue(inputs["release_sha"]["required"])
        for name in (
            "current_frontend_sha",
            "current_backend_sha",
            "expected_current_frontend_digest",
            "expected_current_backend_digest",
        ):
            self.assertTrue(inputs[name]["required"])
        self.assertNotIn("compatibility_base_sha", text)
        self.assertIn("DEPLOY APPLICATION", text)
        self.assertIn("ROLLBACK APPLICATION", text)
        self.assertIn("merge-base --is-ancestor", text)
        for guarded_path in (
            "backend/alembic",
            "backend/models/tables.py",
            "backend/requirements.txt",
            "docker-compose.yml",
            ".env.production.example",
            "frontend/package-lock.json",
        ):
            self.assertIn(guarded_path, text)
        self.assertIn("persist-credentials: false", text)
        self.assertIn("Checked-out source does not match release_sha", text)
        self.assertIn("Running frontend does not match the preflight-approved digest", (ROOT / "scripts" / "deploy-application.sh").read_text())
        self.assertIn("source SHA does not resolve to the running digest", (ROOT / "scripts" / "deploy-application.sh").read_text())
        self.assertIn("CURRENT_FRONTEND_SHA..$RELEASE_SHA", text)
        self.assertIn("CURRENT_BACKEND_SHA..$RELEASE_SHA", text)

    def test_public_smoke_failure_invokes_compatible_rollback(self) -> None:
        _, text = load_workflow("application-release.yml")
        self.assertIn("Public smoke failed; restoring", text)
        self.assertIn('"$remote_command" rollback', text)
        self.assertIn("Release failed public smoke and was rolled back successfully", text)
        smoke_block = text[text.index("smoke() {") : text.index("if ! smoke;")]
        self.assertEqual(smoke_block.count("--connect-timeout 10"), 2)
        self.assertEqual(smoke_block.count("--max-time 30"), 2)
        self.assertNotIn("--retry 5", smoke_block)

    def test_forbidden_full_stack_operations_are_absent(self) -> None:
        paths = [
            WORKFLOWS / "application-release.yml",
            ROOT / "scripts" / "deploy-application.sh",
        ]
        combined = "\n".join(path.read_text(encoding="utf-8") for path in paths)
        forbidden = (
            "scripts/deploy.sh",
            "alembic upgrade",
            "docker system prune",
            "docker image prune",
            "compose down",
            "compose stop worker",
            "--remove-orphans",
            "compose up -d\n",
        )
        for value in forbidden:
            self.assertNotIn(value, combined)
        for service in ("backend", "worker", "frontend"):
            self.assertIn(f"--no-deps {service}", combined)

    def test_old_frontend_only_release_path_is_retired(self) -> None:
        self.assertFalse((WORKFLOWS / "frontend-release.yml").exists())
        self.assertFalse((ROOT / "scripts" / "deploy-frontend.sh").exists())

    def test_no_external_diagnostic_webhook_or_secret_printing(self) -> None:
        texts = "\n".join(
            path.read_text(encoding="utf-8")
            for path in [
                WORKFLOWS / "pipeline.yml",
                WORKFLOWS / "production-preflight.yml",
                WORKFLOWS / "application-release.yml",
            ]
        )
        self.assertNotIn("webhook.site", texts)
        self.assertNotRegex(texts, r"echo\s+\$\{?(GHCR_PAT|AZURE_VM_SSH_KEY)")
        self.assertNotIn("StrictHostKeyChecking=no", texts)

    def test_pipeline_remains_ci_only(self) -> None:
        workflow, text = load_workflow("pipeline.yml")
        self.assertIn("release-tooling", workflow["jobs"])
        self.assertNotIn("environment", text)
        self.assertNotRegex(text, re.compile(r"workflow_dispatch|docker/build-push|\bssh\b"))

    def test_all_inline_bash_blocks_parse(self) -> None:
        for workflow_name in (
            "pipeline.yml",
            "production-preflight.yml",
            "application-release.yml",
        ):
            workflow, _ = load_workflow(workflow_name)
            for job_name, job in workflow.get("jobs", {}).items():
                for index, step in enumerate(job.get("steps", [])):
                    script = step.get("run")
                    if not isinstance(script, str):
                        continue
                    sanitized = re.sub(r"\$\{\{.*?\}\}", "github_expression", script)
                    result = subprocess.run(
                        ["bash", "-n"],
                        input=sanitized,
                        text=True,
                        capture_output=True,
                    )
                    self.assertEqual(
                        result.returncode,
                        0,
                        f"{workflow_name}:{job_name}:step {index}: {result.stderr}",
                    )

    def test_preflight_checks_architecture_services_permissions_and_task_state(self) -> None:
        _, text = load_workflow("production-preflight.yml")
        for required in (
            "compose config --services",
            "Production environment file must not be group/world accessible",
            "{{.Os}}/{{.Architecture}}",
            "database_role=ok",
            "celery_active",
            "celery_reserved",
            "celery_scheduled",
            "repair_task_blockers",
            "registry_manifests=ok",
            "source_revisions=ok",
            "current_frontend_sha",
            "current_backend_sha",
        ):
            self.assertIn(required, text)


if __name__ == "__main__":
    unittest.main()
