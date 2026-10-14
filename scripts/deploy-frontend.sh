#!/usr/bin/env bash
set -euo pipefail

operation="${1:-}"
SCRIPT_PATH="$(cd -- "$(dirname -- "$0")" && pwd)/$(basename -- "$0")"
APP_DIR="${APP_DIR:?APP_DIR is required}"
ENV_PATH="${ENV_PATH:-$APP_DIR/.env.production}"
IMAGE="${IMAGE:-}"
STATE_DIR="${STATE_DIR:-$APP_DIR/.frontend-release}"
ROLLBACK_IMAGE_PATH="$STATE_DIR/previous-image"

if [ "$operation" != "deploy" ] && [ "$operation" != "rollback" ]; then
  echo "Usage: APP_DIR=/path ENV_PATH=/path IMAGE=ghcr.io/...@sha256:<digest> $0 deploy" >&2
  echo "   or: APP_DIR=/path ENV_PATH=/path $0 rollback" >&2
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required on the target server." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin is required on the target server." >&2
  exit 1
fi

if [ ! -d "$APP_DIR" ]; then
  echo "Application directory not found at $APP_DIR." >&2
  exit 1
fi

if [ ! -f "$APP_DIR/docker-compose.yml" ]; then
  echo "docker-compose.yml not found in $APP_DIR." >&2
  exit 1
fi

if [ ! -f "$ENV_PATH" ]; then
  echo "Production environment file not found at $ENV_PATH." >&2
  exit 1
fi

cd "$APP_DIR"

compose() {
  docker compose --env-file "$ENV_PATH" "$@"
}

container_id() {
  compose ps -q "$1"
}

capture_protected_services() {
  local output_path="$1"
  local service
  local id

  : > "$output_path"
  for service in caddy backend worker postgres redis; do
    id="$(container_id "$service")"
    if [ -z "$id" ]; then
      echo "Protected service $service is not running; refusing frontend release." >&2
      exit 1
    fi
    printf '%s=%s\n' "$service" "$id" >> "$output_path"
  done
}

write_frontend_image() {
  local image="$1"
  local temp_env
  temp_env="$(mktemp "${ENV_PATH}.XXXXXX")"

  awk -v image="$image" '
    BEGIN { written = 0 }
    /^FRONTEND_IMAGE=/ {
      if (!written) {
        print "FRONTEND_IMAGE=" image
        written = 1
      }
      next
    }
    { print }
    END {
      if (!written) print "FRONTEND_IMAGE=" image
    }
  ' "$ENV_PATH" > "$temp_env"

  chmod --reference="$ENV_PATH" "$temp_env"
  mv "$temp_env" "$ENV_PATH"
}

wait_for_frontend() {
  local attempt
  for attempt in $(seq 1 30); do
    if compose exec -T frontend node -e '
      fetch("http://127.0.0.1:3000/")
        .then((response) => {
          if (!response.ok) process.exit(1);
        })
        .catch(() => process.exit(1));
    ' >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done

  echo "Frontend did not respond successfully inside its container." >&2
  return 1
}

frontend_container="$(container_id frontend)"
if [ -z "$frontend_container" ]; then
  echo "Frontend service is not running; refusing release because no rollback image can be captured." >&2
  exit 1
fi

if [ "$operation" = "deploy" ]; then
  if [[ ! "$IMAGE" =~ ^ghcr\.io/[a-z0-9._/-]+@sha256:[0-9a-f]{64}$ ]]; then
    echo "IMAGE must be an immutable digest-qualified GHCR frontend image." >&2
    exit 1
  fi
else
  if [ ! -s "$ROLLBACK_IMAGE_PATH" ]; then
    echo "Rollback image record not found at $ROLLBACK_IMAGE_PATH." >&2
    exit 1
  fi
  IMAGE="$(tr -d '\r\n' < "$ROLLBACK_IMAGE_PATH")"
  if [ -z "$IMAGE" ]; then
    echo "Rollback image record is empty." >&2
    exit 1
  fi
fi

image_repository="${IMAGE%@sha256:*}"
current_image_id="$(docker inspect --format '{{.Image}}' "$frontend_container")"
current_image="$(
  docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$current_image_id" |
    awk -v prefix="${image_repository}@sha256:" 'index($0, prefix) == 1 { print; exit }'
)"
if [[ ! "$current_image" =~ ^ghcr\.io/[a-z0-9._/-]+@sha256:[0-9a-f]{64}$ ]]; then
  echo "Could not establish an immutable GHCR digest for the running frontend image." >&2
  exit 1
fi

mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"

before_services="$(mktemp)"
after_services="$(mktemp)"
release_started=false
release_succeeded=false

finish() {
  local exit_code=$?
  trap - EXIT
  set +e

  if [ "$release_started" = "true" ] && [ "$release_succeeded" != "true" ]; then
    echo "Frontend release failed; restoring the previously running image." >&2
    write_frontend_image "$current_image"
    compose up -d --no-deps frontend >&2
    wait_for_frontend >&2
  fi

  rm -f "$before_services" "$after_services"
  exit "$exit_code"
}

trap finish EXIT

capture_protected_services "$before_services"
release_started=true
write_frontend_image "$IMAGE"

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  compose pull frontend
fi
compose up -d --no-deps frontend
wait_for_frontend
capture_protected_services "$after_services"

if ! diff -u "$before_services" "$after_services"; then
  echo "A protected service container changed during the frontend-only release." >&2
  exit 1
fi

deployed_container="$(container_id frontend)"
deployed_image_id="$(docker inspect --format '{{.Image}}' "$deployed_container")"
if ! docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' \
  "$deployed_image_id" | grep -Fx "$IMAGE" >/dev/null; then
  echo "Frontend container is not running the requested immutable image digest." >&2
  exit 1
fi

rollback_temp="$(mktemp "$STATE_DIR/previous-image.XXXXXX")"
printf '%s\n' "$current_image" > "$rollback_temp"
chmod 600 "$rollback_temp"
mv "$rollback_temp" "$ROLLBACK_IMAGE_PATH"
if [ "$SCRIPT_PATH" != "$STATE_DIR/deploy-frontend.sh" ]; then
  install -m 700 "$SCRIPT_PATH" "$STATE_DIR/deploy-frontend.sh"
fi

release_succeeded=true

printf 'Frontend release succeeded.\n'
printf 'Running image: %s\n' "$IMAGE"
printf 'Rollback image: %s\n' "$current_image"
