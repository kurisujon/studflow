# CI/CD on Azure VM

This repository deploys to the Azure VM at `4.145.113.246` using Docker Compose, GitHub Actions, and GitHub Container Registry.

The deployment path is:

1. GitHub Actions runs frontend and backend CI.
2. A push to `main` builds production Docker images in GitHub Actions.
3. GitHub Actions pushes those images to GitHub Container Registry.
4. GitHub Actions uploads the release archive and production env file to the VM over SSH.
5. The VM runs `scripts/deploy.sh`, syncs the repo snapshot, logs into GHCR, pulls the tagged images, and starts the stack.

The workflow is defined in [.github/workflows/pipeline.yml](/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/studflow/.github/workflows/pipeline.yml).

## Runtime Layout

The production stack is defined in [docker-compose.yml](/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/studflow/docker-compose.yml).

It starts five services:

- `frontend`: Next.js on port `3000`
- `backend`: FastAPI internal service on port `8000`
- `worker`: Celery worker
- `postgres`: PostgreSQL 16
- `redis`: Redis 7

The browser entrypoint is:

- `http://4.145.113.246:3000`

API requests still go through `/api/...` on the same origin. The frontend proxies those requests to the backend container internally.

## Server Prerequisites

Install these packages on the Azure VM before the first deployment:

- Docker Engine
- Docker Compose plugin
- `rsync`

The SSH user used by GitHub Actions must also be allowed to run Docker commands.

## Production Env File

Use [.env.production.example](/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/studflow/.env.production.example) as the template for the server environment file.

Important production values for the current server:

- `NEXT_PUBLIC_API_BASE_URL=http://4.145.113.246:3000`
- `INTERNAL_API_BASE_URL=http://backend:8000`
- `ALLOWED_ORIGINS=["http://4.145.113.246:3000"]`
- `COMPOSE_BUILD_ON_SERVER=false`

Set real values for:

- `POSTGRES_PASSWORD`
- `SECRET_KEY`
- Clerk keys
- Supabase keys
- Gemini keys
- any optional YouTube key

Keep placeholder values for:

- `FRONTEND_IMAGE`
- `BACKEND_IMAGE`

Those image tags are written automatically by the deploy workflow before the env file is uploaded to the VM.

## GitHub Secrets

Add these repository secrets:

- `AZURE_VM_HOST`
  Set this to `4.145.113.246`
- `AZURE_VM_PORT`
  Usually `22`
- `AZURE_VM_USER`
  Your VM SSH username, for example `azureuser`
- `AZURE_VM_SSH_KEY`
  The private key content used by GitHub Actions to SSH into the VM
- `AZURE_VM_APP_PATH`
  Example: `/home/azureuser/studflow`
- `PRODUCTION_ENV_FILE`
  The full contents of your production `.env.production`
- `GHCR_USERNAME`
  Your GitHub username or org account name that owns the container packages
- `GHCR_PAT`
  A GitHub personal access token with at least `read:packages`

`PRODUCTION_ENV_FILE` should be a multiline secret copied from your final production env file.

The workflow uses the built-in GitHub Actions token to push images to GHCR. The VM uses `GHCR_USERNAME` and `GHCR_PAT` to pull those images during deployment.

## First-Time Server Setup

1. SSH into the VM.
2. Install Docker, Docker Compose plugin, and `rsync`.
3. Create the application directory, for example `/home/azureuser/studflow`.
4. Make sure `azureuser` is in the `docker` group or can otherwise run Docker without interactive sudo prompts.
5. Open port `3000` in the Azure Network Security Group for the VM.

If you want HTTPS later, put Nginx, Caddy, or Azure Application Gateway in front of port `3000`.

## GitHub Flow

- Push any branch: CI runs.
- Merge or push to `main`: CI runs, images are built and pushed, then production deploy starts automatically.

## Manual Deployment

If you need to deploy manually on the VM:

1. Copy the repo contents or a release archive to the VM.
2. Place your production env file at `<app-path>/.env.production`.
3. Log into GHCR on the VM if the images are private:

```bash
printf '%s' '<ghcr-pat>' | docker login ghcr.io -u '<github-user>' --password-stdin
```

4. Run:

```bash
APP_DIR=/home/azureuser/studflow \
ARCHIVE_PATH=/tmp/studflow-release.tgz \
ENV_PATH=/home/azureuser/studflow/.env.production \
bash /home/azureuser/studflow/scripts/deploy.sh
```

## Validation

After deployment, validate:

- `docker compose --env-file .env.production ps`
- `http://4.145.113.246:3000`
- `http://4.145.113.246:3000/api/health`

If the API health check fails but the frontend opens, inspect:

- frontend logs
- backend logs
- worker logs
- contents of `.env.production`
