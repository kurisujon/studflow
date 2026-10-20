#!/usr/bin/env bash
set -Eeuo pipefail

FRONTEND_REPOSITORY="ghcr.io/kurisujon/studflow-frontend"
BACKEND_REPOSITORY="ghcr.io/kurisujon/studflow-backend"
APP_DIR="${APP_DIR:-}"
ENV_PATH="${ENV_PATH:-}"
STATE_DIR="${STATE_DIR:-${APP_DIR:-/nonexistent}/.application-release}"
CELERY_CONTROL_PATH="${CELERY_CONTROL_PATH:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/celery-release-control.py}"
WAIT_ATTEMPTS="${RELEASE_WAIT_ATTEMPTS:-30}"
WAIT_INTERVAL="${RELEASE_WAIT_INTERVAL:-2}"
MODE="${1:-}"
TARGET_FRONTEND="${2:-}"
TARGET_BACKEND="${3:-}"
EXPECTED_CURRENT_FRONTEND="${4:-}"
EXPECTED_CURRENT_BACKEND="${5:-}"
CURRENT_FRONTEND_SHA="${6:-}"
CURRENT_BACKEND_SHA="${7:-}"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

valid_ref() {
  local value="$1" repository="$2"
  [[ "$value" =~ ^${repository}@sha256:[0-9a-f]{64}$ ]]
}

valid_sha() {
  [[ "$1" =~ ^[0-9a-f]{40}$ ]]
}

[ "$MODE" = "deploy" ] || [ "$MODE" = "rollback" ] || fail "Usage: deploy-application.sh deploy FRONTEND_DIGEST BACKEND_DIGEST EXPECTED_FRONTEND EXPECTED_BACKEND CURRENT_FRONTEND_SHA CURRENT_BACKEND_SHA, or rollback."
if [ -z "$APP_DIR" ] || [ ! -d "$APP_DIR" ]; then
  fail "APP_DIR must identify the deployed Compose directory."
fi
if [ -z "$ENV_PATH" ] || [ ! -f "$ENV_PATH" ]; then
  fail "ENV_PATH must identify the existing production environment file."
fi
[ -f "$APP_DIR/docker-compose.yml" ] || fail "docker-compose.yml is unavailable."
[ -x "$CELERY_CONTROL_PATH" ] || fail "The reviewed Celery release controller is unavailable."
command -v docker >/dev/null 2>&1 || fail "Docker is unavailable."
command -v python3 >/dev/null 2>&1 || fail "Python 3 is unavailable."

cd "$APP_DIR"
compose() {
  if [ -n "${DOCKER_CONFIG:-}" ]; then
    DOCKER_CONFIG="$DOCKER_CONFIG" docker compose --env-file "$ENV_PATH" "$@"
  else
    docker compose --env-file "$ENV_PATH" "$@"
  fi
}

container_id() {
  local service="$1" identifier
  identifier="$(compose ps --all -q "$service")"
  [[ "$identifier" =~ ^[0-9a-f]{12,64}$ ]] || fail "Service $service does not have exactly one valid container."
  printf '%s\n' "$identifier"
}

require_running() {
  local service="$1" identifier state
  identifier="$(container_id "$service")"
  state="$(docker inspect --format '{{.State.Status}}' "$identifier")"
  [ "$state" = "running" ] || fail "Service $service is not running."
}

immutable_digest() {
  local service="$1" repository="$2" identifier image_id candidate
  identifier="$(container_id "$service")"
  image_id="$(docker inspect --format '{{.Image}}' "$identifier")"
  while IFS= read -r candidate; do
    if valid_ref "$candidate" "$repository"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done < <(docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$image_id")
  fail "Running $service image has no immutable digest for its expected repository."
}

capture_protected() {
  local destination="$1" service identifier
  : > "$destination"
  for service in caddy postgres redis; do
    identifier="$(container_id "$service")"
    docker inspect --format '{{.Id}}|{{range .Mounts}}{{.Type}}:{{.Name}}:{{.Destination}};{{end}}' "$identifier" >> "$destination"
  done
}

write_images() {
  local frontend_ref="$1" backend_ref="$2" temporary
  valid_ref "$frontend_ref" "$FRONTEND_REPOSITORY" || fail "Invalid immutable frontend image reference."
  valid_ref "$backend_ref" "$BACKEND_REPOSITORY" || fail "Invalid immutable backend image reference."
  temporary="$(mktemp "${ENV_PATH}.release.XXXXXX")"
  awk -v frontend="$frontend_ref" -v backend="$backend_ref" '
    BEGIN { seen_frontend=0; seen_backend=0 }
    /^FRONTEND_IMAGE=/ { if (!seen_frontend++) print "FRONTEND_IMAGE=" frontend; next }
    /^BACKEND_IMAGE=/ { if (!seen_backend++) print "BACKEND_IMAGE=" backend; next }
    { print }
    END {
      if (!seen_frontend) print "FRONTEND_IMAGE=" frontend
      if (!seen_backend) print "BACKEND_IMAGE=" backend
    }
  ' "$ENV_PATH" > "$temporary"
  chmod --reference="$ENV_PATH" "$temporary"
  chown --reference="$ENV_PATH" "$temporary" 2>/dev/null || true
  mv -f "$temporary" "$ENV_PATH"
}

wait_backend() {
  local attempt identifier health
  for attempt in $(seq 1 "$WAIT_ATTEMPTS"); do
    identifier="$(container_id backend)"
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$identifier")"
    [ "$health" = "healthy" ] && return 0
    [ "$health" = "unhealthy" ] && return 1
    sleep "$WAIT_INTERVAL"
  done
  return 1
}

wait_frontend() {
  local attempt identifier
  for attempt in $(seq 1 "$WAIT_ATTEMPTS"); do
    identifier="$(container_id frontend)"
    if docker exec "$identifier" node -e "fetch('http://127.0.0.1:3000/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$WAIT_INTERVAL"
  done
  return 1
}

verify_running_ref() {
  local service="$1" expected="$2" repository="$3" actual
  actual="$(immutable_digest "$service" "$repository")"
  [ "$actual" = "$expected" ] || fail "Service $service is not running the requested immutable image."
}

celery_control() {
  (cd "$APP_DIR" && STUDFLOW_COMPOSE_ENV_FILE="$ENV_PATH" python3 "$CELERY_CONTROL_PATH" "$@")
}

stop_drained_worker() {
  local identifier attempt state
  identifier="$(container_id worker)"
  docker update --restart=no "$identifier" >/dev/null
  docker kill --signal=TERM "$identifier" >/dev/null
  for attempt in $(seq 1 "$WAIT_ATTEMPTS"); do
    : "$attempt"
    state="$(docker inspect --format '{{.State.Status}}' "$identifier")"
    if [ "$state" != "running" ]; then
      docker update --restart=unless-stopped "$identifier" >/dev/null
      return 0
    fi
    sleep "$WAIT_INTERVAL"
  done
  docker update --restart=unless-stopped "$identifier" >/dev/null
  if ! celery_control resume >&2; then
    printf 'Celery consumption restoration could not be verified after the warm-shutdown abort.\n' >&2
  fi
  return 1
}

host_architecture="$(uname -m)"
case "$host_architecture" in
  x86_64) expected_architecture="amd64" ;;
  aarch64|arm64) expected_architecture="arm64" ;;
  *) fail "Unsupported production host architecture." ;;
esac

for service in worker caddy postgres redis; do
  require_running "$service"
done

current_frontend="$(immutable_digest frontend "$FRONTEND_REPOSITORY")"
current_backend="$(immutable_digest backend "$BACKEND_REPOSITORY")"
current_worker="$(immutable_digest worker "$BACKEND_REPOSITORY")"
current_set_compatible=false
[ "$current_backend" = "$current_worker" ] && current_set_compatible=true

# PostgreSQL variables intentionally expand inside the container shell.
# shellcheck disable=SC2016
compose exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null || fail "Current PostgreSQL service is not ready."
[ "$(compose exec -T redis redis-cli ping | tr -d '\r')" = PONG ] || fail "Current Redis service did not return PONG."
celery_control inspect >/dev/null || fail "Current Celery worker is unavailable."

if [ "$MODE" = "deploy" ]; then
  [ "$current_backend" = "$current_worker" ] || fail "Backend and worker are not running the same immutable image."
  require_running frontend
  require_running backend
  wait_backend || fail "Current backend is not healthy."
  wait_frontend || fail "Current frontend is not ready."
  valid_ref "$EXPECTED_CURRENT_FRONTEND" "$FRONTEND_REPOSITORY" || fail "Expected current frontend reference is invalid."
  valid_ref "$EXPECTED_CURRENT_BACKEND" "$BACKEND_REPOSITORY" || fail "Expected current backend reference is invalid."
  valid_sha "$CURRENT_FRONTEND_SHA" || fail "Current frontend source SHA is invalid."
  valid_sha "$CURRENT_BACKEND_SHA" || fail "Current backend source SHA is invalid."
  [ "$current_frontend" = "$EXPECTED_CURRENT_FRONTEND" ] || fail "Running frontend does not match the preflight-approved digest."
  [ "$current_backend" = "$EXPECTED_CURRENT_BACKEND" ] || fail "Running backend does not match the preflight-approved digest."
fi

if [ "$MODE" = "rollback" ]; then
  rollback_file="$STATE_DIR/previous-images.env"
  [ -f "$rollback_file" ] || fail "No verified application rollback record exists."
  # The file is written by this script with digest-only values and mode 600.
  TARGET_FRONTEND="$(sed -n 's/^FRONTEND_IMAGE=//p' "$rollback_file")"
  TARGET_BACKEND="$(sed -n 's/^BACKEND_IMAGE=//p' "$rollback_file")"
  CURRENT_FRONTEND_SHA="$(sed -n 's/^FRONTEND_SOURCE_SHA=//p' "$rollback_file")"
  CURRENT_BACKEND_SHA="$(sed -n 's/^BACKEND_SOURCE_SHA=//p' "$rollback_file")"
  valid_sha "$CURRENT_FRONTEND_SHA" || fail "Rollback frontend source evidence is invalid."
  valid_sha "$CURRENT_BACKEND_SHA" || fail "Rollback backend source evidence is invalid."
fi
valid_ref "$TARGET_FRONTEND" "$FRONTEND_REPOSITORY" || fail "Target frontend reference must be a digest-qualified GHCR image."
valid_ref "$TARGET_BACKEND" "$BACKEND_REPOSITORY" || fail "Target backend reference must be a digest-qualified GHCR image."

docker_config="$(mktemp -d "${TMPDIR:-/tmp}/studflow-release-docker.XXXXXX")"
DOCKER_CONFIG="$docker_config"
export DOCKER_CONFIG
before_protected="$(mktemp)"
after_protected="$(mktemp)"
consumer_drained=false
backend_changed=false
worker_changed=false
frontend_changed=false
env_changed=false
release_complete=false
rollback_in_progress=false

cleanup() {
  local exit_code=$?
  if [ "$release_complete" != "true" ] && [ "$exit_code" -eq 0 ]; then
    exit_code=1
  fi
  trap - EXIT HUP INT TERM
  set +e
  if [ "$release_complete" != "true" ] && [ "$MODE" = "rollback" ] && [ "$current_set_compatible" != "true" ]; then
    if [ "$consumer_drained" = "true" ] && [ "$worker_changed" != "true" ]; then
      celery_control resume >&2 || printf 'Rollback failed and Celery consumption restoration could not be verified.\n' >&2
    fi
    printf 'Rollback from an already mismatched API/worker set did not complete; preserved rollback evidence remains unchanged for operator recovery.\n' >&2
  elif [ "$release_complete" != "true" ] && [ "$rollback_in_progress" != "true" ]; then
    rollback_in_progress=true
    printf 'Application operation failed; restoring the pre-operation compatible application set.\n' >&2
    if [ "$frontend_changed" = "true" ]; then
      write_images "$current_frontend" "$TARGET_BACKEND"
      compose up -d --no-deps frontend >&2
      wait_frontend >&2
    fi
    if [ "$worker_changed" = "true" ]; then
      rollback_worker_id="$(compose ps -q worker 2>/dev/null)"
      rollback_worker_state=""
      if [ -n "$rollback_worker_id" ]; then
        rollback_worker_state="$(docker inspect --format '{{.State.Status}}' "$rollback_worker_id" 2>/dev/null)"
      fi
      if [ "$rollback_worker_state" != "running" ] || celery_control drain --timeout 300 --interval 10 --consecutive 3 >&2; then
        write_images "$current_frontend" "$current_backend"
        compose up -d --no-deps backend >&2
        wait_backend >&2
        if [ "$rollback_worker_state" != "running" ] || stop_drained_worker >&2; then
          compose up -d --no-deps worker >&2
          celery_control inspect >&2
        else
          write_images "$current_frontend" "$TARGET_BACKEND"
          printf 'Automatic backend rollback was unsafe because the drained worker did not stop cleanly.\n' >&2
        fi
      else
        # Keep the compatible new backend/worker pair; only the old frontend is restored.
        write_images "$current_frontend" "$TARGET_BACKEND"
        printf 'Automatic backend rollback was unsafe because the replacement worker did not drain.\n' >&2
      fi
    elif [ "$backend_changed" = "true" ]; then
      write_images "$current_frontend" "$current_backend"
      compose up -d --no-deps backend >&2
      wait_backend >&2
      [ "$consumer_drained" = "true" ] && celery_control resume >&2
    elif [ "$consumer_drained" = "true" ]; then
      celery_control resume >&2
    elif [ "$env_changed" = "true" ]; then
      write_images "$current_frontend" "$current_backend"
    fi
  fi
  rm -f -- "$before_protected" "$after_protected"
  if [ -d "$docker_config" ]; then
    find "$docker_config" -type f -exec chmod 600 {} + 2>/dev/null
    rm -rf -- "$docker_config"
  fi
  exit "$exit_code"
}
trap cleanup EXIT HUP INT TERM

IFS= read -r registry_token || fail "A read-only GHCR token must be provided on standard input."
[ -n "$registry_token" ] || fail "The GHCR token is empty."
registry_username="${GHCR_USERNAME:-}"
[[ "$registry_username" =~ ^[A-Za-z0-9][A-Za-z0-9_-]*$ ]] || fail "GHCR_USERNAME is invalid."
printf '%s' "$registry_token" | docker login ghcr.io -u "$registry_username" --password-stdin >/dev/null 2>&1 || fail "GHCR authentication failed."
unset registry_token

source_manifest_matches() {
  local repository="$1" source_sha="$2" immutable_ref="$3" tag_manifest digest_manifest
  tag_manifest="$(mktemp)"; digest_manifest="$(mktemp)"
  docker manifest inspect "$repository:$source_sha" > "$tag_manifest" 2>/dev/null || { rm -f -- "$tag_manifest" "$digest_manifest"; return 1; }
  docker manifest inspect "$immutable_ref" > "$digest_manifest" 2>/dev/null || { rm -f -- "$tag_manifest" "$digest_manifest"; return 1; }
  if python3 -c 'import json,sys; raise SystemExit(0 if json.load(open(sys.argv[1])) == json.load(open(sys.argv[2])) else 1)' "$tag_manifest" "$digest_manifest"; then
    result=0
  else
    result=1
  fi
  rm -f -- "$tag_manifest" "$digest_manifest"
  return "$result"
}

if [ "$MODE" = "deploy" ]; then
  source_manifest_matches "$FRONTEND_REPOSITORY" "$CURRENT_FRONTEND_SHA" "$current_frontend" || fail "Frontend source SHA does not resolve to the running digest."
  source_manifest_matches "$BACKEND_REPOSITORY" "$CURRENT_BACKEND_SHA" "$current_backend" || fail "Backend source SHA does not resolve to the running digest."
fi

for image in "$current_frontend" "$current_backend" "$TARGET_FRONTEND" "$TARGET_BACKEND"; do
  docker manifest inspect "$image" >/dev/null 2>&1 || fail "A required immutable image manifest is unavailable."
done
docker image inspect "$current_frontend" >/dev/null 2>&1 || fail "Frontend rollback image is not available locally."
docker image inspect "$current_backend" >/dev/null 2>&1 || fail "Backend rollback image is not available locally."

capture_protected "$before_protected"
write_images "$TARGET_FRONTEND" "$TARGET_BACKEND"
env_changed=true
compose pull backend worker frontend >/dev/null
for image in "$TARGET_FRONTEND" "$TARGET_BACKEND"; do
  platform="$(docker image inspect --format '{{.Os}}/{{.Architecture}}' "$image")"
  [ "$platform" = "linux/$expected_architecture" ] || fail "Target image platform does not match the production host."
done

celery_control drain --timeout 300 --interval 10 --consecutive 3
consumer_drained=true

backend_changed=true
compose up -d --no-deps backend
wait_backend || fail "Replacement backend did not become healthy."

stop_drained_worker || fail "Drained Celery worker did not stop cleanly; release aborted without replacing it."
worker_changed=true
compose up -d --no-deps worker
consumer_drained=false
celery_control inspect >/dev/null
verify_running_ref backend "$TARGET_BACKEND" "$BACKEND_REPOSITORY"
verify_running_ref worker "$TARGET_BACKEND" "$BACKEND_REPOSITORY"

frontend_changed=true
compose up -d --no-deps frontend
wait_frontend || fail "Replacement frontend did not become ready."
verify_running_ref frontend "$TARGET_FRONTEND" "$FRONTEND_REPOSITORY"

capture_protected "$after_protected"
cmp -s "$before_protected" "$after_protected" || fail "A protected service identity or mount changed during release."

mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"
rollback_temp="$(mktemp "$STATE_DIR/previous-images.XXXXXX")"
if [ "$MODE" = "deploy" ]; then
  printf 'FRONTEND_IMAGE=%s\nBACKEND_IMAGE=%s\nFRONTEND_SOURCE_SHA=%s\nBACKEND_SOURCE_SHA=%s\n' \
    "$current_frontend" "$current_backend" "$CURRENT_FRONTEND_SHA" "$CURRENT_BACKEND_SHA" > "$rollback_temp"
else
  # Keep the known-good rollback record. Never replace it with the displaced broken release.
  rm -f -- "$rollback_temp"
fi
if [ "$MODE" = "deploy" ]; then
  chmod 600 "$rollback_temp"
  mv -f "$rollback_temp" "$STATE_DIR/previous-images.env"
fi
install -m 700 "${BASH_SOURCE[0]}" "$STATE_DIR/deploy-application.sh"
install -m 700 "$CELERY_CONTROL_PATH" "$STATE_DIR/celery-release-control.py"

release_complete=true
printf 'Application release completed with immutable frontend and backend images.\n'
