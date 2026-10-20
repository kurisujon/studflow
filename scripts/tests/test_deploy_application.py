from __future__ import annotations

import json
import os
import stat
import subprocess
import tempfile
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]
SCRIPT = ROOT / "deploy-application.sh"
OLD_FRONTEND = "ghcr.io/kurisujon/studflow-frontend@sha256:" + "1" * 64
OLD_BACKEND = "ghcr.io/kurisujon/studflow-backend@sha256:" + "2" * 64
NEW_FRONTEND = "ghcr.io/kurisujon/studflow-frontend@sha256:" + "3" * 64
NEW_BACKEND = "ghcr.io/kurisujon/studflow-backend@sha256:" + "4" * 64
OLD_FRONTEND_SHA = "a" * 40
OLD_BACKEND_SHA = "b" * 40


FAKE_DOCKER = r'''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path

state_path = Path(os.environ["MOCK_DOCKER_STATE"])
state = json.loads(state_path.read_text())
args = sys.argv[1:]

def save(): state_path.write_text(json.dumps(state))
state.setdefault("commands", []).append(args)
save()
def env_images():
    values = {}
    for line in Path(os.environ["MOCK_ENV_PATH"]).read_text().splitlines():
        if "=" in line:
            key, value = line.split("=", 1); values[key] = value
    return values
def service_from_id(identifier):
    for name, item in state["services"].items():
        if item["id"] == identifier: return name, item
    raise SystemExit(1)

if args[:2] == ["compose", "--env-file"]:
    command = args[3]
    rest = args[4:]
    if command == "ps":
        service = rest[-1]
        print(state["services"][service]["id"])
    elif command == "pull":
        pass
    elif command == "up":
        service = rest[-1]
        images = env_images()
        key = "FRONTEND_IMAGE" if service == "frontend" else "BACKEND_IMAGE"
        if service == "worker" and os.environ.get("MOCK_FAIL_WORKER_UP") == "1" and images[key].endswith("4" * 64):
            raise SystemExit(1)
        if service == "worker" and os.environ.get("MOCK_FAIL_ROLLBACK_WORKER_UP") == "1" and images[key].endswith("2" * 64):
            state["services"][service]["image"] = images[key]
            state["services"][service]["status"] = "running"
            state["services"][service]["id"] = state["next_ids"][service]
            save()
            raise SystemExit(1)
        if service == "backend" and os.environ.get("MOCK_FAIL_BACKEND_UP") == "1" and images[key].endswith("4" * 64):
            raise SystemExit(1)
        state["services"][service]["image"] = images[key]
        state["services"][service]["status"] = "running"
        state["services"][service]["id"] = state["next_ids"][service]
        if service == "frontend" and os.environ.get("MOCK_MUTATE_PROTECTED") == "1":
            state["services"]["caddy"]["id"] = "dddddddddddd"
        save()
        if service == "backend" and os.environ.get("MOCK_MUTATE_THEN_FAIL_BACKEND") == "1" and images[key].endswith("4" * 64):
            raise SystemExit(1)
        if service == "frontend" and os.environ.get("MOCK_MUTATE_THEN_FAIL_FRONTEND") == "1" and images[key].endswith("3" * 64):
            raise SystemExit(1)
        if service == "backend" and os.environ.get("MOCK_MUTATE_THEN_FAIL_ROLLBACK_BACKEND") == "1" and images[key].endswith("2" * 64):
            raise SystemExit(1)
        if service == "frontend" and os.environ.get("MOCK_MUTATE_THEN_FAIL_ROLLBACK_FRONTEND") == "1" and images[key].endswith("1" * 64):
            raise SystemExit(1)
    elif command == "stop":
        state["services"][rest[-1]]["status"] = "exited"; save()
    elif command == "exec":
        if "redis" in rest: print("PONG")
    else: raise SystemExit(1)
elif args[0] == "inspect":
    fmt = args[2]; identifier = args[3]
    name, item = service_from_id(identifier)
    if ".State.Health" in fmt: print("healthy" if name == "backend" and item["status"] == "running" else item["status"])
    elif ".State.Status" in fmt: print(item["status"])
    elif fmt == "{{.Image}}": print("sha256:" + item["image"].split("sha256:")[1])
    elif fmt.startswith("{{.Id}}|"): print(item["id"] + "|volume:" + name + ":/data;")
    else: raise SystemExit(1)
elif args[:2] == ["image", "inspect"]:
    if "--format" in args:
        fmt = args[3]; image = args[4]
        if ".Os" in fmt and ".Architecture" in fmt: print("linux/amd64")
        elif ".Architecture" in fmt: print("amd64")
        elif ".RepoDigests" in fmt:
            digest = image
            if image.startswith("sha256:"):
                digest = next(item["image"] for item in state["services"].values() if item["image"].endswith(image[7:]))
            print(digest)
        else: raise SystemExit(1)
elif args[:2] == ["manifest", "inspect"]:
    image = args[2]
    if image.endswith("a" * 40): digest = "1" * 64
    elif image.endswith("b" * 40): digest = "2" * 64
    elif "sha256:" in image: digest = image.split("sha256:", 1)[1]
    else: raise SystemExit(1)
    print(json.dumps({"schemaVersion": 2, "digest-key": digest}))
elif args[0] == "login":
    if not sys.stdin.read(): raise SystemExit(1)
elif args[0] == "update": pass
elif args[0] == "kill":
    name, item = service_from_id(args[-1]); item["status"] = "exited"; save()
elif args[0] == "exec":
    if os.environ.get("MOCK_FAIL_FRONTEND") == "1" and state["services"]["frontend"]["image"].endswith("3" * 64):
        raise SystemExit(1)
else: raise SystemExit(1)
'''


class DeployApplicationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.app = self.root / "app"
        self.app.mkdir()
        (self.app / "docker-compose.yml").write_text("services: {}\n")
        self.env_file = self.app / ".env.production"
        self.env_file.write_text(
            f"FRONTEND_IMAGE={OLD_FRONTEND}\nBACKEND_IMAGE={OLD_BACKEND}\nSECRET=value\n"
        )
        self.env_file.chmod(0o600)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        docker = self.bin / "docker"
        docker.write_text(FAKE_DOCKER)
        docker.chmod(stat.S_IRWXU)
        self.celery = self.root / "celery-control"
        self.celery.write_text(
            "#!/usr/bin/env python3\n"
            "import os, sys\n"
            "from pathlib import Path\n"
            "if os.environ.get('MOCK_CELERY_FAIL_SECOND_DRAIN') == '1' and 'drain' in sys.argv:\n"
            "    path = Path(os.environ['MOCK_CELERY_STATE'])\n"
            "    count = int(path.read_text()) + 1 if path.exists() else 1\n"
            "    path.write_text(str(count))\n"
            "    if count >= 2: raise SystemExit(1)\n"
            "if os.environ.get('MOCK_CELERY_FAIL_DRAIN') == '1' and 'drain' in sys.argv:\n"
            "    raise SystemExit(1)\n"
            "raise SystemExit(0)\n"
        )
        self.celery.chmod(stat.S_IRWXU)
        self.state_path = self.root / "docker-state.json"
        services = {}
        refs = {
            "frontend": OLD_FRONTEND,
            "backend": OLD_BACKEND,
            "worker": OLD_BACKEND,
            "caddy": "local@sha256:" + "5" * 64,
            "postgres": "local@sha256:" + "6" * 64,
            "redis": "local@sha256:" + "7" * 64,
        }
        for index, (name, image) in enumerate(refs.items(), 1):
            services[name] = {"id": f"{index:x}" * 12, "image": image, "status": "running"}
        state = {
            "services": services,
            "next_ids": {"frontend": "aaaaaaaaaaaa", "backend": "bbbbbbbbbbbb", "worker": "cccccccccccc"},
        }
        self.state_path.write_text(json.dumps(state))

    def tearDown(self) -> None:
        self.temp.cleanup()

    def run_script(self, *arguments: str, **extra_env: str) -> subprocess.CompletedProcess[str]:
        environment = os.environ.copy()
        environment.update(
            {
                "PATH": f"{self.bin}:{environment['PATH']}",
                "APP_DIR": str(self.app),
                "ENV_PATH": str(self.env_file),
                "STATE_DIR": str(self.app / ".application-release"),
                "CELERY_CONTROL_PATH": str(self.celery),
                "GHCR_USERNAME": "release-reader",
                "MOCK_DOCKER_STATE": str(self.state_path),
                "MOCK_ENV_PATH": str(self.env_file),
                "MOCK_CELERY_STATE": str(self.root / "celery-state"),
                "RELEASE_WAIT_ATTEMPTS": "2",
                "RELEASE_WAIT_INTERVAL": "0.01",
                "TMPDIR": str(self.root),
                **extra_env,
            }
        )
        script_arguments = list(arguments)
        if script_arguments and script_arguments[0] == "deploy" and len(script_arguments) == 3:
            script_arguments.extend(
                [OLD_FRONTEND, OLD_BACKEND, OLD_FRONTEND_SHA, OLD_BACKEND_SHA]
            )
        return subprocess.run(
            ["bash", str(SCRIPT), *script_arguments],
            input="super-secret-token\n",
            capture_output=True,
            text=True,
            env=environment,
            timeout=60,
        )

    def refs(self) -> tuple[str, str, str]:
        state = json.loads(self.state_path.read_text())
        return tuple(state["services"][name]["image"] for name in ("frontend", "backend", "worker"))

    def commands(self) -> list[list[str]]:
        return json.loads(self.state_path.read_text()).get("commands", [])

    def test_deploy_and_full_rollback_simulation(self) -> None:
        deployed = self.run_script("deploy", NEW_FRONTEND, NEW_BACKEND)
        self.assertEqual(deployed.returncode, 0, deployed.stderr)
        self.assertEqual(self.refs(), (NEW_FRONTEND, NEW_BACKEND, NEW_BACKEND))
        up_services = [
            command[-1]
            for command in self.commands()
            if len(command) > 4 and command[0] == "compose" and "up" in command
        ]
        self.assertEqual(up_services, ["backend", "worker", "frontend"])
        for command in self.commands():
            rendered = " ".join(command)
            self.assertNotIn("prune", rendered)
            self.assertNotIn("down", rendered)
            self.assertNotIn("--remove-orphans", rendered)
            if " up " in f" {rendered} ":
                self.assertIn("--no-deps", command)
                self.assertNotIn(command[-1], {"caddy", "postgres", "redis"})
        self.assertEqual(stat.S_IMODE(self.env_file.stat().st_mode), 0o600)
        self.assertIn("SECRET=value", self.env_file.read_text())
        rolled_back = self.run_script("rollback")
        self.assertEqual(rolled_back.returncode, 0, rolled_back.stderr)
        self.assertEqual(self.refs(), (OLD_FRONTEND, OLD_BACKEND, OLD_BACKEND))

    def test_frontend_failure_restores_compatible_old_set(self) -> None:
        result = self.run_script(
            "deploy", NEW_FRONTEND, NEW_BACKEND, MOCK_FAIL_FRONTEND="1"
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.refs(), (OLD_FRONTEND, OLD_BACKEND, OLD_BACKEND))

    def test_worker_start_failure_restores_compatible_old_set(self) -> None:
        result = self.run_script(
            "deploy", NEW_FRONTEND, NEW_BACKEND, MOCK_FAIL_WORKER_UP="1"
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.refs(), (OLD_FRONTEND, OLD_BACKEND, OLD_BACKEND))

    def test_backend_start_failure_restores_original_set(self) -> None:
        result = self.run_script(
            "deploy", NEW_FRONTEND, NEW_BACKEND, MOCK_FAIL_BACKEND_UP="1"
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.refs(), (OLD_FRONTEND, OLD_BACKEND, OLD_BACKEND))

    def test_backend_mutate_then_failure_restores_original_set(self) -> None:
        result = self.run_script(
            "deploy", NEW_FRONTEND, NEW_BACKEND, MOCK_MUTATE_THEN_FAIL_BACKEND="1"
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.refs(), (OLD_FRONTEND, OLD_BACKEND, OLD_BACKEND))

    def test_frontend_mutate_then_failure_restores_original_set(self) -> None:
        result = self.run_script(
            "deploy", NEW_FRONTEND, NEW_BACKEND, MOCK_MUTATE_THEN_FAIL_FRONTEND="1"
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.refs(), (OLD_FRONTEND, OLD_BACKEND, OLD_BACKEND))

    def test_drain_failure_aborts_before_service_replacement(self) -> None:
        result = self.run_script(
            "deploy", NEW_FRONTEND, NEW_BACKEND, MOCK_CELERY_FAIL_DRAIN="1"
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.refs(), (OLD_FRONTEND, OLD_BACKEND, OLD_BACKEND))
        self.assertFalse((self.app / ".application-release" / "previous-images.env").exists())

    def test_stalled_rollback_keeps_new_backend_worker_and_old_frontend(self) -> None:
        result = self.run_script(
            "deploy",
            NEW_FRONTEND,
            NEW_BACKEND,
            MOCK_FAIL_FRONTEND="1",
            MOCK_CELERY_FAIL_SECOND_DRAIN="1",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.refs(), (OLD_FRONTEND, NEW_BACKEND, NEW_BACKEND))

    def test_malformed_digest_is_rejected(self) -> None:
        malformed = (
            "ghcr.io/example/frontend:latest",
            "ghcr.io/kurisujon/studflow-frontend@sha256:" + "A" * 64,
            "ghcr.io/kurisujon/studflow-frontend@sha256:" + "1" * 63,
            "ghcr.io/other/studflow-frontend@sha256:" + "1" * 64,
        )
        for reference in malformed:
            with self.subTest(reference=reference):
                result = self.run_script("deploy", reference, NEW_BACKEND)
                self.assertNotEqual(result.returncode, 0)

    def test_token_is_never_written_to_output(self) -> None:
        result = self.run_script("deploy", NEW_FRONTEND, NEW_BACKEND)
        self.assertNotIn("super-secret-token", result.stdout + result.stderr)
        self.assertNotIn("super-secret-token", self.state_path.read_text())
        self.assertEqual(list(self.root.glob("studflow-release-docker.*")), [])

    def test_mismatched_running_backend_worker_digests_fail_closed(self) -> None:
        state = json.loads(self.state_path.read_text())
        state["services"]["worker"]["image"] = NEW_BACKEND
        self.state_path.write_text(json.dumps(state))
        result = self.run_script("deploy", NEW_FRONTEND, NEW_BACKEND)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Backend and worker are not running the same immutable image", result.stderr)

    def test_preflight_digest_mismatch_aborts_before_mutation(self) -> None:
        result = self.run_script(
            "deploy",
            NEW_FRONTEND,
            NEW_BACKEND,
            NEW_FRONTEND,
            OLD_BACKEND,
            OLD_FRONTEND_SHA,
            OLD_BACKEND_SHA,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("preflight-approved digest", result.stderr)
        self.assertFalse(any("up" in command for command in self.commands()))

    def test_release_sha_cannot_impersonate_running_source_revision(self) -> None:
        result = self.run_script(
            "deploy",
            NEW_FRONTEND,
            NEW_BACKEND,
            OLD_FRONTEND,
            OLD_BACKEND,
            "c" * 40,
            "c" * 40,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("source SHA does not resolve", result.stderr)
        self.assertFalse(any("up" in command for command in self.commands()))

    def test_rollback_recovers_stopped_unhealthy_application_containers(self) -> None:
        deployed = self.run_script("deploy", NEW_FRONTEND, NEW_BACKEND)
        self.assertEqual(deployed.returncode, 0, deployed.stderr)
        state = json.loads(self.state_path.read_text())
        state["services"]["frontend"]["status"] = "exited"
        state["services"]["backend"]["status"] = "unhealthy"
        self.state_path.write_text(json.dumps(state))
        rolled_back = self.run_script("rollback")
        self.assertEqual(rolled_back.returncode, 0, rolled_back.stderr)
        self.assertEqual(self.refs(), (OLD_FRONTEND, OLD_BACKEND, OLD_BACKEND))

    def test_rollback_backend_mutation_failure_restores_preoperation_set(self) -> None:
        deployed = self.run_script("deploy", NEW_FRONTEND, NEW_BACKEND)
        self.assertEqual(deployed.returncode, 0, deployed.stderr)
        failed = self.run_script("rollback", MOCK_MUTATE_THEN_FAIL_ROLLBACK_BACKEND="1")
        self.assertNotEqual(failed.returncode, 0)
        self.assertEqual(self.refs(), (NEW_FRONTEND, NEW_BACKEND, NEW_BACKEND))

    def test_rollback_worker_mutation_failure_restores_preoperation_set(self) -> None:
        deployed = self.run_script("deploy", NEW_FRONTEND, NEW_BACKEND)
        self.assertEqual(deployed.returncode, 0, deployed.stderr)
        failed = self.run_script("rollback", MOCK_FAIL_ROLLBACK_WORKER_UP="1")
        self.assertNotEqual(failed.returncode, 0)
        self.assertEqual(self.refs(), (NEW_FRONTEND, NEW_BACKEND, NEW_BACKEND))

    def test_rollback_frontend_mutation_failure_restores_preoperation_set(self) -> None:
        deployed = self.run_script("deploy", NEW_FRONTEND, NEW_BACKEND)
        self.assertEqual(deployed.returncode, 0, deployed.stderr)
        failed = self.run_script("rollback", MOCK_MUTATE_THEN_FAIL_ROLLBACK_FRONTEND="1")
        self.assertNotEqual(failed.returncode, 0)
        self.assertEqual(self.refs(), (NEW_FRONTEND, NEW_BACKEND, NEW_BACKEND))

    def test_protected_service_change_fails(self) -> None:
        result = self.run_script(
            "deploy", NEW_FRONTEND, NEW_BACKEND, MOCK_MUTATE_PROTECTED="1"
        )
        self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
