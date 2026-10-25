from __future__ import annotations

import subprocess
import json
import os
import stat
import tempfile
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).parents[2]
SCRIPT = ROOT / "scripts" / "transition-rls-runtime.sh"
WORKFLOW = ROOT / ".github" / "workflows" / "rls-runtime-transition.yml"
OLD_FRONTEND = "ghcr.io/kurisujon/studflow-frontend@sha256:" + "1" * 64
OLD_BACKEND = "ghcr.io/kurisujon/studflow-backend@sha256:" + "2" * 64
NEW_FRONTEND = "ghcr.io/kurisujon/studflow-frontend@sha256:" + "3" * 64
NEW_BACKEND = "ghcr.io/kurisujon/studflow-backend@sha256:" + "4" * 64

FAKE_DOCKER = r'''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
path=Path(os.environ["MOCK_STATE"]); state=json.loads(path.read_text()); args=sys.argv[1:]
state.setdefault("commands",[]).append(args)
def save(): path.write_text(json.dumps(state))
def env():
 d={}
 for line in Path(os.environ["ENV_PATH"]).read_text().splitlines():
  if "=" in line: k,v=line.split("=",1); d[k]=v
 return d
def byid(i):
 for n,v in state["services"].items():
  if v["id"]==i:return n,v
 raise SystemExit(1)
save()
if args[:2]==["compose","--env-file"]:
 cmd=args[3]; rest=args[4:]
 if cmd=="ps": print(state["services"][rest[-1]]["id"])
 elif cmd=="pull": pass
 elif cmd=="stop": state["services"][rest[-1]]["status"]="exited"; save()
 elif cmd=="up":
  svc=rest[-1]; key="FRONTEND_IMAGE" if svc=="frontend" else "BACKEND_IMAGE"
  state["services"][svc]["image"]=env()[key]; state["services"][svc]["status"]="running"; save()
 else: raise SystemExit(1)
elif args[0]=="inspect":
 fmt=args[2]; name,item=byid(args[3])
 if ".State.Health" in fmt: print("healthy" if item["status"]=="running" else item["status"])
 elif ".State.Status" in fmt: print(item["status"])
 elif fmt=="{{.Image}}": print("sha256:"+item["image"].split("sha256:")[-1])
 elif fmt.startswith("{{.Id}}|"): print(item["id"]+"|volume:"+name+":/data;")
 else: raise SystemExit(1)
elif args[:2]==["image","inspect"]:
 if "--format" not in args: pass
 else:
  fmt=args[3]; image=args[4]
  if ".Os" in fmt: print("linux/amd64")
  elif ".RepoDigests" in fmt:
   if image.startswith("sha256:"):
    image=next(v["image"] for v in state["services"].values() if v["image"].endswith(image[7:]))
   print(image)
elif args[:2]==["manifest","inspect"]:
 ref=args[-1]
 if ref.endswith("a"*40): digest="1"*64
 elif ref.endswith("b"*40): digest="2"*64
 elif ref.endswith("c"*40): digest=("3"*64 if "frontend" in ref else "4"*64)
 elif "sha256:" in ref: digest=ref.split("sha256:")[-1]
 else: raise SystemExit(1)
 print(json.dumps({"Descriptor":{"digest":"sha256:"+digest}}))
elif args[0]=="login": sys.stdin.read()
elif args[0]=="run":
 sys.stdin.read()
 if os.environ.get("MOCK_DATABASE_AUDIT_FAIL")=="1": raise SystemExit(1)
elif args[0]=="update": pass
elif args[0]=="kill":
 _,item=byid(args[-1]); item["status"]="exited"; save()
elif args[0]=="exec":
 name,_=byid(args[2] if args[1]=="-i" else args[1])
 sys.stdin.read()
 if os.environ.get("MOCK_STRICT_FAIL")==name: raise SystemExit(1)
else: raise SystemExit(1)
'''


class RlsRuntimeTransitionTests(unittest.TestCase):
    def _simulation(self, **extra_env: str) -> tuple[subprocess.CompletedProcess[str], dict, str]:
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); app=root/"app"; app.mkdir(); (app/"docker-compose.yml").write_text("services: {}\n")
            env_path=app/".env.production"; env_path.write_text(f"FRONTEND_IMAGE={OLD_FRONTEND}\nBACKEND_IMAGE={OLD_BACKEND}\nDATABASE_URL=postgresql://legacy\nSECRET=keep\n"); env_path.chmod(0o600)
            bindir=root/"bin"; bindir.mkdir()
            docker=bindir/"docker"; docker.write_text(FAKE_DOCKER); docker.chmod(stat.S_IRWXU)
            curl=bindir/"curl"; curl.write_text("#!/bin/sh\ncase \"$*\" in *api/health*) printf '{\"status\":\"ok\"}' ;; esac\n"); curl.chmod(stat.S_IRWXU)
            celery=root/"celery"; celery.write_text("#!/usr/bin/env python3\nimport json,os,sys\nfrom pathlib import Path\nstate_path=Path(os.environ['MOCK_STATE']); state=json.loads(state_path.read_text()); state.setdefault('commands',[]).append(['celery',*sys.argv[1:]]); state_path.write_text(json.dumps(state))\nraise SystemExit(1 if os.environ.get('MOCK_DRAIN_FAIL')=='1' and len(sys.argv)>1 and sys.argv[1]=='drain' else 0)\n"); celery.chmod(stat.S_IRWXU)
            helper=root/"database.py"; helper.write_text((ROOT/"scripts/runtime_database_transition.py").read_text()); helper.chmod(stat.S_IRWXU)
            checker=root/"check.py"; checker.write_text("raise SystemExit(0)\n")
            services={}
            for i,(name,image) in enumerate((("frontend",OLD_FRONTEND),("backend",OLD_BACKEND),("worker",OLD_BACKEND),("caddy","local@sha256:"+"5"*64),("postgres","local@sha256:"+"6"*64),("redis","local@sha256:"+"7"*64)),1):
                services[name]={"id":f"{i:x}"*12,"image":image,"status":"running"}
            state=root/"state.json"; state.write_text(json.dumps({"services":services}))
            generic=app/".application-release"; generic.mkdir(); (generic/"previous-images.env").write_text("unsafe")
            environment=os.environ.copy(); environment.update({"PATH":f"{bindir}:{environment['PATH']}","APP_DIR":str(app),"ENV_PATH":str(env_path),"STATE_DIR":str(app/".rls-runtime-transition"),"CELERY_CONTROL_PATH":str(celery),"DATABASE_HELPER_PATH":str(helper),"DATABASE_CHECK_PATH":str(checker),"GHCR_USERNAME":"reader","MOCK_STATE":str(state),"RELEASE_WAIT_ATTEMPTS":"2","RELEASE_WAIT_INTERVAL":"0.01","TMPDIR":str(root),**extra_env})
            payload=json.dumps({"app_database_url":"postgresql://app","migration_database_url":"postgresql://operator","ghcr_token":"registry-secret"})
            result=subprocess.run(["bash",str(SCRIPT),NEW_FRONTEND,NEW_BACKEND,OLD_FRONTEND,OLD_BACKEND,"a"*40,"b"*40,"c"*40],input=payload,text=True,capture_output=True,env=environment,timeout=30)
            return result,json.loads(state.read_text()),env_path.read_text()

    def test_symbolic_success_reaches_compatible_s3(self) -> None:
        result,state,environment=self._simulation()
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(tuple(state["services"][name]["image"] for name in ("frontend","backend","worker")),(NEW_FRONTEND,NEW_BACKEND,NEW_BACKEND))
        self.assertIn("DATABASE_URL=postgresql://app",environment)
        self.assertNotIn("registry-secret",result.stdout+result.stderr+json.dumps(state))

    def test_candidate_role_failure_rolls_back_credential_before_legacy_images(self) -> None:
        result,state,environment=self._simulation(MOCK_STRICT_FAIL="worker")
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(tuple(state["services"][name]["image"] for name in ("frontend","backend","worker")),(OLD_FRONTEND,OLD_BACKEND,OLD_BACKEND))
        self.assertIn("DATABASE_URL=postgresql://legacy",environment)
        commands=state["commands"]
        legacy_up=next(i for i,c in enumerate(commands) if "up" in c and c[-1]=="worker" and i>len(commands)//2)
        self.assertTrue(any(c[:2]==["compose","--env-file"] for c in commands[:legacy_up]))

    def test_database_audit_failure_precedes_all_service_mutation(self) -> None:
        result,state,environment=self._simulation(MOCK_DATABASE_AUDIT_FAIL="1")
        self.assertNotEqual(result.returncode,0)
        self.assertFalse(any("stop" in command or "up" in command for command in state["commands"]))
        self.assertIn("DATABASE_URL=postgresql://legacy",environment)

    def test_initial_drain_failure_restores_legacy_backend_without_worker_replacement(self) -> None:
        result,state,environment=self._simulation(MOCK_DRAIN_FAIL="1")
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(tuple(state["services"][name]["image"] for name in ("frontend","backend","worker")),(OLD_FRONTEND,OLD_BACKEND,OLD_BACKEND))
        self.assertEqual(state["services"]["backend"]["status"],"running")
        self.assertIn("DATABASE_URL=postgresql://legacy",environment)
        self.assertTrue(any(command[-1:] == ["resume"] for command in state["commands"]))

    def test_transition_order_and_credential_rollback_invariant(self) -> None:
        text = SCRIPT.read_text()
        s0 = text.index("# S0 -> S1")
        first_stop = text.index("compose stop backend", s0)
        first_drain = text.index("celery_control drain", first_stop)
        hardened_worker = text.index("compose up -d --no-deps worker", first_drain)
        hardened_backend = text.index("compose up -d --no-deps backend", hardened_worker)
        s1 = text.index("# S1 -> S2")
        rewrite = text.index("rewrite-env", s1)
        app_worker = text.index("compose up -d --no-deps worker", rewrite)
        worker_check = text.index("strict_runtime_check worker", app_worker)
        app_backend = text.index("compose up -d --no-deps backend", worker_check)
        backend_check = text.index("strict_runtime_check backend", app_backend)
        frontend = text.index("compose up -d --no-deps frontend", backend_check)
        self.assertTrue(s0 < first_stop < first_drain < hardened_worker < hardened_backend < s1)
        self.assertTrue(s1 < rewrite < app_worker < worker_check < app_backend < backend_check < frontend)
        rollback = text[text.index("rollback_transition()") : text.index("cleanup()")]
        credential_restore = rollback.index('cp --preserve=mode,ownership "$env_backup" "$ENV_PATH"')
        legacy_write = rollback.index('write_images "$current_frontend" "$current_backend"', credential_restore)
        self.assertLess(credential_restore, legacy_write)
        self.assertLess(legacy_write, rollback.index("compose up -d --no-deps worker", legacy_write))

    def test_worker_is_never_force_stopped_and_queue_evidence_is_bounded(self) -> None:
        text = SCRIPT.read_text()
        self.assertNotIn("docker rm", text)
        self.assertNotIn("docker compose down", text)
        self.assertNotIn("--remove-orphans", text)
        self.assertNotIn("SIGKILL", text)
        self.assertGreaterEqual(text.count("--timeout 300 --interval 10 --consecutive 3"), 3)
        celery = (ROOT / "scripts" / "celery-release-control.py").read_text()
        self.assertIn("unacked", celery)
        self.assertIn("broker_queued", celery)

    def test_source_attestation_null_owner_grants_and_role_checks_are_required(self) -> None:
        script = SCRIPT.read_text()
        helper = (ROOT / "scripts" / "runtime_database_transition.py").read_text()
        for value in ("CURRENT_FRONTEND_SHA", "CURRENT_BACKEND_SHA", "TARGET_SHA", "tag_ref"):
            self.assertIn(value, script)
        self.assertIn("null-document-owners", helper)
        self.assertIn("denied-table-privilege", helper)
        self.assertIn("runtime-sequence-privilege", helper)
        self.assertIn("rls-policy-contract", helper)
        self.assertIn("runtime-table-ownership", helper)
        self.assertIn("strict_runtime_check worker", script)
        self.assertIn("strict_runtime_check backend", script)

    def test_transition_invalidates_image_only_rollback_and_preserves_protected_services(self) -> None:
        text = SCRIPT.read_text()
        self.assertIn('rm -f -- "$APP_DIR/.application-release/previous-images.env"', text)
        self.assertIn("capture_protected", text)
        self.assertIn('for service in caddy postgres redis', text)
        self.assertIn('cmp -s "$before_protected" "$after_protected"', text)
        self.assertNotIn('rm -f -- "$env_backup" "$STATE_DIR/pre-app-user-environment.env"', text)
        self.assertIn('chmod 600 "$env_backup" "$STATE_DIR/pre-app-user-environment.env"', text)

    def test_secrets_are_stdin_only_and_private(self) -> None:
        workflow = WORKFLOW.read_text()
        script = SCRIPT.read_text()
        self.assertIn('json.dump({"app_database_url"', workflow)
        self.assertIn('|\n            ssh', workflow)
        self.assertNotIn("echo $APP_DATABASE_URL", workflow)
        self.assertNotIn("echo $MIGRATION_DATABASE_URL", workflow)
        self.assertIn('chmod 600 "$input_file" "$credential_file" "$token_file"', script)
        self.assertIn('rm -f -- "$input_file" "$credential_file" "$token_file"', script)

    def test_workflow_is_manual_main_only_protected_and_least_privilege(self) -> None:
        parsed = yaml.safe_load(WORKFLOW.read_text())
        trigger = parsed.get("on") or parsed.get(True)
        self.assertEqual(set(trigger), {"workflow_dispatch"})
        self.assertEqual(parsed["permissions"], {"contents": "read"})
        self.assertIn("github.ref == 'refs/heads/main'", parsed["jobs"]["validate"]["if"])
        self.assertEqual(parsed["jobs"]["build"]["permissions"]["packages"], "write")
        self.assertNotIn("packages", parsed["jobs"]["transition"]["permissions"])
        self.assertEqual(parsed["jobs"]["build"]["environment"]["name"], "production")
        self.assertEqual(parsed["jobs"]["transition"]["environment"]["name"], "production")
        text = WORKFLOW.read_text()
        self.assertIn("StrictHostKeyChecking=yes", text)
        self.assertNotIn("StrictHostKeyChecking=no", text)
        self.assertIn("TRANSITION RLS RUNTIME", text)
        self.assertNotIn(".env.production.example", text)

    def test_all_inline_workflow_shell_is_valid_bash(self) -> None:
        parsed = yaml.safe_load(WORKFLOW.read_text())
        for job_name, job in parsed["jobs"].items():
            for index, step in enumerate(job.get("steps", [])):
                command = step.get("run")
                if not command or step.get("shell", "bash") != "bash":
                    continue
                with tempfile.NamedTemporaryFile("w", suffix=".sh") as script:
                    script.write(command); script.flush()
                    result = subprocess.run(["bash", "-n", script.name], capture_output=True, text=True)
                self.assertEqual(result.returncode, 0, f"{job_name} step {index}: {result.stderr}")


if __name__ == "__main__":
    unittest.main()
