#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/studflow}"
ARCHIVE_PATH="${ARCHIVE_PATH:-/tmp/studflow-release.tgz}"
ENV_PATH="${ENV_PATH:-$APP_DIR/.env.production}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required on the target server." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin is required on the target server." >&2
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required on the target server." >&2
  exit 1
fi

if [ ! -f "$ARCHIVE_PATH" ]; then
  echo "Release archive not found at $ARCHIVE_PATH." >&2
  exit 1
fi

mkdir -p "$APP_DIR"
tar -xzf "$ARCHIVE_PATH" -C "$TMP_DIR"
rsync -a --delete --exclude ".env.production" "$TMP_DIR"/ "$APP_DIR"/

if [ ! -f "$ENV_PATH" ]; then
  echo "Environment file not found at $ENV_PATH." >&2
  exit 1
fi

cd "$APP_DIR"
compose_build_on_server="$(
  grep -m1 '^COMPOSE_BUILD_ON_SERVER=' "$ENV_PATH" | cut -d= -f2- | tr -d '\r' | tr '[:upper:]' '[:lower:]' || true
)"

echo "Disk usage before Docker cleanup:"
df -h

# Free unused Docker artifacts before pulling new images on the VM.
docker container prune -f || true
docker image prune -af || true
docker builder prune -af || true

echo "Disk usage after Docker cleanup:"
df -h

if [ -n "${GHCR_USERNAME:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
fi

if [ "$compose_build_on_server" = "true" ]; then
  echo "Building images on server..."
  docker compose --env-file "$ENV_PATH" build
else
  echo "Pulling pre-built images..."
  docker compose --env-file "$ENV_PATH" pull frontend backend worker postgres redis
fi

echo "Starting database services..."
docker compose --env-file "$ENV_PATH" up -d postgres redis

echo "Waiting for PostgreSQL to accept connections..."
postgres_ready=false
for attempt in $(seq 1 30); do
  if docker compose --env-file "$ENV_PATH" exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; then
    postgres_ready=true
    break
  fi
  sleep 2
done

if [ "$postgres_ready" != "true" ]; then
  echo "PostgreSQL did not become ready before the migration timeout." >&2
  exit 1
fi

echo "Running database migrations..."
docker compose --env-file "$ENV_PATH" run --rm backend alembic upgrade head

echo "Starting application services..."
docker compose --env-file "$ENV_PATH" up -d --remove-orphans

docker compose --env-file "$ENV_PATH" ps
