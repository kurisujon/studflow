#!/usr/bin/env bash
set -Eeuo pipefail

FRONTEND_REPOSITORY="ghcr.io/kurisujon/studflow-frontend"
BACKEND_REPOSITORY="ghcr.io/kurisujon/studflow-backend"
APP_DIR="${APP_DIR:-}"
ENV_PATH="${ENV_PATH:-}"
STATE_DIR="${STATE_DIR:-${APP_DIR:-/nonexistent}/.rls-runtime-transition}"
CELERY_CONTROL_PATH="${CELERY_CONTROL_PATH:-}"
DATABASE_HELPER_PATH="${DATABASE_HELPER_PATH:-}"
DATABASE_CHECK_PATH="${DATABASE_CHECK_PATH:-}"
WAIT_ATTEMPTS="${RELEASE_WAIT_ATTEMPTS:-30}"
WAIT_INTERVAL="${RELEASE_WAIT_INTERVAL:-2}"
TARGET_FRONTEND="${1:-}"
TARGET_BACKEND="${2:-}"
EXPECTED_CURRENT_FRONTEND="${3:-}"
EXPECTED_CURRENT_BACKEND="${4:-}"
CURRENT_FRONTEND_SHA="${5:-}"
CURRENT_BACKEND_SHA="${6:-}"
TARGET_SHA="${7:-}"
GHCR_USERNAME="${GHCR_USERNAME:-}"

fail() { printf 'ERROR: %s\n' "$1" >&2; exit 1; }
valid_ref() { [[ "$1" =~ ^${2}@sha256:[0-9a-f]{64}$ ]]; }
valid_sha() { [[ "$1" =~ ^[0-9a-f]{40}$ ]]; }

if [ ! -d "$APP_DIR" ] || [ ! -f "$APP_DIR/docker-compose.yml" ]; then fail "APP_DIR is invalid."; fi
[ -f "$ENV_PATH" ] || fail "ENV_PATH is invalid."
[ "$(stat -c '%a' "$ENV_PATH")" = 600 ] || fail "Production environment file must have mode 600."
if [ ! -x "$CELERY_CONTROL_PATH" ] || [ ! -f "$DATABASE_HELPER_PATH" ] || [ ! -f "$DATABASE_CHECK_PATH" ]; then fail "Reviewed transition helpers are unavailable."; fi
valid_ref "$TARGET_FRONTEND" "$FRONTEND_REPOSITORY" || fail "Target frontend reference is invalid."
valid_ref "$TARGET_BACKEND" "$BACKEND_REPOSITORY" || fail "Target backend reference is invalid."
valid_ref "$EXPECTED_CURRENT_FRONTEND" "$FRONTEND_REPOSITORY" || fail "Current frontend evidence is invalid."
valid_ref "$EXPECTED_CURRENT_BACKEND" "$BACKEND_REPOSITORY" || fail "Current backend evidence is invalid."
if ! valid_sha "$CURRENT_FRONTEND_SHA" || ! valid_sha "$CURRENT_BACKEND_SHA" || ! valid_sha "$TARGET_SHA"; then fail "Source SHA evidence is invalid."; fi
[[ "$GHCR_USERNAME" =~ ^[A-Za-z0-9][A-Za-z0-9_-]*$ ]] || fail "GHCR username is invalid."

umask 077
mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"
input_file="$(mktemp "$STATE_DIR/input.XXXXXX")"
credential_file="$(mktemp "$STATE_DIR/database-credentials.XXXXXX")"
token_file="$(mktemp "$STATE_DIR/registry-token.XXXXXX")"
chmod 600 "$input_file" "$credential_file" "$token_file"
cat > "$input_file"
python3 - "$input_file" "$credential_file" "$token_file" <<'PY'
import json, os, sys
source, credentials, token = sys.argv[1:]
with open(source, encoding="utf-8") as stream:
    data = json.load(stream)
required = {"app_database_url", "migration_database_url", "ghcr_token"}
if not isinstance(data, dict) or set(data) != required:
    raise SystemExit("Transition input fields are invalid.")
if any(not isinstance(data[key], str) or not data[key] or "\n" in data[key] or "\r" in data[key] for key in required):
    raise SystemExit("Transition input is invalid.")
if data["app_database_url"] == data["migration_database_url"]:
    raise SystemExit("Runtime and migration credentials must be separate.")
with open(credentials, "w", encoding="utf-8") as output:
    json.dump({"app_database_url": data["app_database_url"], "migration_database_url": data["migration_database_url"]}, output)
with open(token, "w", encoding="utf-8") as output:
    output.write(data["ghcr_token"])
os.chmod(credentials, 0o600); os.chmod(token, 0o600)
PY
rm -f -- "$input_file"

cd "$APP_DIR"
compose() {
  if [ -n "${DOCKER_CONFIG:-}" ]; then
    DOCKER_CONFIG="$DOCKER_CONFIG" docker compose --env-file "$ENV_PATH" "$@" < /dev/null
  else
    docker compose --env-file "$ENV_PATH" "$@" < /dev/null
  fi
}
container_id() {
  local identifier
  identifier="$(compose ps --all -q "$1")"
  [[ "$identifier" =~ ^[0-9a-f]{12,64}$ ]] || fail "Service $1 container is unavailable."
  printf '%s\n' "$identifier"
}
require_running() {
  [ "$(docker inspect --format '{{.State.Status}}' "$(container_id "$1")")" = running ] || fail "Service $1 is not running."
}
immutable_digest() {
  local service="$1" repository="$2" image_id candidate
  image_id="$(docker inspect --format '{{.Image}}' "$(container_id "$service")")"
  while IFS= read -r candidate; do
    valid_ref "$candidate" "$repository" && { printf '%s\n' "$candidate"; return; }
  done < <(docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$image_id")
  fail "Service $service lacks an immutable repository digest."
}
write_images() {
  local frontend="$1" backend="$2" temporary
  temporary="$(mktemp "${ENV_PATH}.transition.XXXXXX")"
  awk -v frontend="$frontend" -v backend="$backend" '
    BEGIN { f=0; b=0 }
    /^FRONTEND_IMAGE=/ { if (!f++) print "FRONTEND_IMAGE=" frontend; next }
    /^BACKEND_IMAGE=/ { if (!b++) print "BACKEND_IMAGE=" backend; next }
    { print }
    END { if (!f) print "FRONTEND_IMAGE=" frontend; if (!b) print "BACKEND_IMAGE=" backend }
  ' "$ENV_PATH" > "$temporary"
  chmod 600 "$temporary"; mv -f "$temporary" "$ENV_PATH"
}
capture_protected() {
  : > "$1"
  local service identifier
  for service in caddy postgres redis; do
    identifier="$(container_id "$service")"
    docker inspect --format '{{.Id}}|{{range .Mounts}}{{.Type}}:{{.Name}}:{{.Destination}};{{end}}' "$identifier" >> "$1"
  done
}
wait_backend() {
  local attempt status
  for attempt in $(seq 1 "$WAIT_ATTEMPTS"); do
    : "$attempt"
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$(container_id backend)")"
    [ "$status" = healthy ] && return 0
    [ "$status" = unhealthy ] && return 1
    sleep "$WAIT_INTERVAL"
  done
  return 1
}
wait_frontend() {
  local attempt identifier
  for attempt in $(seq 1 "$WAIT_ATTEMPTS"); do
    : "$attempt"; identifier="$(container_id frontend)"
    docker exec "$identifier" node -e "fetch('http://127.0.0.1:3000/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))" >/dev/null 2>&1 && return 0
    sleep "$WAIT_INTERVAL"
  done
  return 1
}
celery_control() { STUDFLOW_COMPOSE_ENV_FILE="$ENV_PATH" python3 "$CELERY_CONTROL_PATH" "$@"; }
stop_drained_worker() {
  local identifier attempt
  identifier="$(container_id worker)"
  docker update --restart=no "$identifier" >/dev/null
  docker kill --signal=TERM "$identifier" >/dev/null
  for attempt in $(seq 1 "$WAIT_ATTEMPTS"); do
    : "$attempt"
    if [ "$(docker inspect --format '{{.State.Status}}' "$identifier")" != running ]; then
      docker update --restart=unless-stopped "$identifier" >/dev/null
      return 0
    fi
    sleep "$WAIT_INTERVAL"
  done
  docker update --restart=unless-stopped "$identifier" >/dev/null
  celery_control resume >/dev/null 2>&1 || true
  return 1
}
tag_ref() {
  local repository="$1" sha="$2" digest
  digest="$(docker manifest inspect --verbose "$repository:$sha" | python3 -c 'import json,sys; d=json.load(sys.stdin); xs=d if isinstance(d,list) else [d]; values={x.get("Descriptor",{}).get("digest") for x in xs}; values.discard(None); len(values)==1 or sys.exit(1); print(values.pop())')"
  [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]] || fail "Source tag manifest is ambiguous."
  printf '%s@%s\n' "$repository" "$digest"
}
database_helper() {
  local backend_ref="$1" mode="$2" backend_container
  backend_container="$(container_id backend)"
  docker run --rm -i --network "container:$backend_container" -v "$DATABASE_HELPER_PATH:/transition.py:ro" "$backend_ref" python /transition.py database "$mode" < "$credential_file"
}
strict_runtime_check() {
  docker exec -i "$(container_id "$1")" python - < "$DATABASE_CHECK_PATH" >/dev/null
}

for service in frontend backend worker caddy postgres redis; do require_running "$service"; done
current_frontend="$(immutable_digest frontend "$FRONTEND_REPOSITORY")"
current_backend="$(immutable_digest backend "$BACKEND_REPOSITORY")"
current_worker="$(immutable_digest worker "$BACKEND_REPOSITORY")"
[ "$current_frontend" = "$EXPECTED_CURRENT_FRONTEND" ] || fail "Frontend digest no longer matches approved evidence."
if [ "$current_backend" != "$EXPECTED_CURRENT_BACKEND" ] || [ "$current_worker" != "$current_backend" ]; then fail "Backend/worker digest no longer matches approved evidence."; fi

docker_config="$(mktemp -d "${TMPDIR:-/tmp}/studflow-transition-docker.XXXXXX")"
export DOCKER_CONFIG="$docker_config"
docker login ghcr.io --username "$GHCR_USERNAME" --password-stdin < "$token_file" >/dev/null
[ "$(tag_ref "$FRONTEND_REPOSITORY" "$CURRENT_FRONTEND_SHA")" = "$current_frontend" ] || fail "Current frontend source-to-digest attestation failed."
[ "$(tag_ref "$BACKEND_REPOSITORY" "$CURRENT_BACKEND_SHA")" = "$current_backend" ] || fail "Current backend source-to-digest attestation failed."
[ "$(tag_ref "$FRONTEND_REPOSITORY" "$TARGET_SHA")" = "$TARGET_FRONTEND" ] || fail "Target frontend source-to-digest attestation failed."
[ "$(tag_ref "$BACKEND_REPOSITORY" "$TARGET_SHA")" = "$TARGET_BACKEND" ] || fail "Target backend source-to-digest attestation failed."
for image in "$current_frontend" "$current_backend" "$TARGET_FRONTEND" "$TARGET_BACKEND"; do docker manifest inspect "$image" >/dev/null; done
docker image inspect "$current_frontend" >/dev/null
docker image inspect "$current_backend" >/dev/null
write_images "$TARGET_FRONTEND" "$TARGET_BACKEND"
compose pull frontend backend worker >/dev/null
host_arch="$(uname -m)"
case "$host_arch" in x86_64) platform=linux/amd64 ;; aarch64|arm64) platform=linux/arm64 ;; *) fail "Unsupported host architecture." ;; esac
for image in "$TARGET_FRONTEND" "$TARGET_BACKEND"; do
  [ "$(docker image inspect --format '{{.Os}}/{{.Architecture}}' "$image")" = "$platform" ] || fail "Target image architecture does not match the host."
done
write_images "$current_frontend" "$current_backend"

before_protected="$(mktemp)"; after_protected="$(mktemp)"
capture_protected "$before_protected"
celery_control inspect >/dev/null
database_helper "$current_backend" --apply-grants >/dev/null

env_backup="$STATE_DIR/legacy-environment.env"
cp --preserve=mode,ownership "$ENV_PATH" "$env_backup"
chmod 600 "$env_backup"
printf 'FRONTEND_IMAGE=%s\nBACKEND_IMAGE=%s\nFRONTEND_SOURCE_SHA=%s\nBACKEND_SOURCE_SHA=%s\n' "$current_frontend" "$current_backend" "$CURRENT_FRONTEND_SHA" "$CURRENT_BACKEND_SHA" > "$STATE_DIR/legacy-images.env"
chmod 600 "$STATE_DIR/legacy-images.env"
mutation_started=true
transition_complete=false
rollback_running=false

rollback_transition() {
  [ "$rollback_running" = false ] || return 1
  rollback_running=true
  set +e
  compose stop backend >/dev/null 2>&1
  if cmp -s "$ENV_PATH" "$env_backup" && [ "$(immutable_digest worker "$BACKEND_REPOSITORY" 2>/dev/null)" = "$current_backend" ]; then
    # drain_worker normally restores its own consumer. Verify it here because a
    # transport failure between cancellation and restoration must fail closed.
    celery_control resume >/dev/null || return 1
    write_images "$current_frontend" "$current_backend" || return 1
    compose up -d --no-deps backend || return 1
    wait_backend || return 1
    compose up -d --no-deps frontend || return 1
    wait_frontend || return 1
    return 0
  fi
  if [ "$(docker inspect --format '{{.State.Status}}' "$(container_id worker)" 2>/dev/null)" = running ]; then
    if ! celery_control drain --timeout 300 --interval 10 --consecutive 3 >/dev/null; then
      printf 'ERROR: rollback could not establish a safe worker drain; no worker was forced down.\n' >&2
      return 1
    fi
    stop_drained_worker || return 1
  fi
  # Credential restoration must precede every legacy image start.
  cp --preserve=mode,ownership "$env_backup" "$ENV_PATH" || return 1
  write_images "$current_frontend" "$current_backend" || return 1
  compose up -d --no-deps worker || return 1
  celery_control inspect >/dev/null || return 1
  compose up -d --no-deps backend || return 1
  wait_backend || return 1
  compose up -d --no-deps frontend || return 1
  wait_frontend || return 1
  return 0
}
cleanup() {
  local code=$?
  if [ "$transition_complete" != true ] && [ "$code" -eq 0 ]; then code=1; fi
  trap - EXIT HUP INT TERM
  set +e
  if [ "$transition_complete" != true ] && [ "${mutation_started:-false}" = true ]; then
    rollback_transition || printf 'ERROR: automatic transition rollback requires operator intervention.\n' >&2
  fi
  rm -f -- "$input_file" "$credential_file" "$token_file" "$before_protected" "$after_protected"
  rm -rf -- "$docker_config"
  exit "$code"
}
trap cleanup EXIT HUP INT TERM

# S0 -> S1: remove the legacy producer, drain, then start hardened code on the legacy credential.
compose stop backend >/dev/null
celery_control drain --timeout 300 --interval 10 --consecutive 3 >/dev/null
stop_drained_worker || fail "Legacy worker did not stop cleanly."
write_images "$current_frontend" "$TARGET_BACKEND"
compose up -d --no-deps worker
celery_control inspect >/dev/null
compose up -d --no-deps backend
wait_backend || fail "Hardened backend failed with the legacy credential."
if [ "$(immutable_digest worker "$BACKEND_REPOSITORY")" != "$TARGET_BACKEND" ] || [ "$(immutable_digest backend "$BACKEND_REPOSITORY")" != "$TARGET_BACKEND" ]; then fail "S1 image verification failed."; fi

# S1 -> S2: freeze the hardened producer, drain again, switch only DATABASE_URL, then attest both roles.
compose stop backend >/dev/null
celery_control drain --timeout 300 --interval 10 --consecutive 3 >/dev/null
stop_drained_worker || fail "Hardened worker did not stop cleanly."
python3 "$DATABASE_HELPER_PATH" rewrite-env "$credential_file" "$ENV_PATH" "$STATE_DIR/pre-app-user-environment.env" >/dev/null
compose up -d --no-deps worker
strict_runtime_check worker
celery_control inspect >/dev/null
compose up -d --no-deps backend
strict_runtime_check backend
wait_backend || fail "Hardened backend failed with app_user."

# S2 -> S3: frontend is replaced only after both hardened database clients attest.
write_images "$TARGET_FRONTEND" "$TARGET_BACKEND"
compose up -d --no-deps frontend
wait_frontend || fail "Target frontend failed to start."
[ "$(immutable_digest frontend "$FRONTEND_REPOSITORY")" = "$TARGET_FRONTEND" ] || fail "S3 frontend image verification failed."
curl --fail --silent --show-error --head --connect-timeout 10 --max-time 30 --retry 3 https://studflow.webcris.dev/ >/dev/null || fail "Public frontend smoke failed."
curl --fail --silent --show-error --connect-timeout 10 --max-time 30 --retry 3 https://studflow.webcris.dev/api/health |
  python3 -c 'import json,sys; raise SystemExit(0 if json.load(sys.stdin).get("status")=="ok" else 1)' || fail "Public API smoke failed."
capture_protected "$after_protected"
cmp -s "$before_protected" "$after_protected" || fail "A protected service identity or mount changed."

# Generic image-only rollback is unsafe across the credential boundary.
rm -f -- "$APP_DIR/.application-release/previous-images.env"
install -m 700 "${BASH_SOURCE[0]}" "$STATE_DIR/transition-rls-runtime.sh"
install -m 700 "$CELERY_CONTROL_PATH" "$STATE_DIR/celery-release-control.py"
transition_complete=true
# Keep both private environment snapshots. A later explicit rollback must
# restore credentials before it can ever start a legacy backend or worker.
chmod 600 "$env_backup" "$STATE_DIR/pre-app-user-environment.env"
printf 'RLS runtime transition reached S3 with hardened backend and worker roles.\n'
