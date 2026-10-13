# StudFlow CI/CD and frontend releases

StudFlow uses two separate GitHub Actions workflows:

- `.github/workflows/pipeline.yml` runs frontend and backend validation for every branch push and pull request. It never builds images or deploys production.
- `.github/workflows/frontend-release.yml` is a manual, approval-gated frontend release. It builds one immutable frontend image and updates only the production `frontend` Compose service.

Merging or pushing to `main` runs CI only. Production does not change until a maintainer manually dispatches the frontend release workflow and a required reviewer approves the `production` environment job.

## Production architecture

The production stack remains defined by `docker-compose.yml`:

- `caddy`: public reverse proxy
- `frontend`: Next.js on internal port 3000
- `backend`: FastAPI on internal port 8000
- `worker`: Celery worker
- `postgres`: PostgreSQL with pgvector
- `redis`: Celery broker and result backend

The Compose frontend service selects its image through `FRONTEND_IMAGE`. A frontend-only release changes that one environment value and runs:

```bash
docker compose --env-file .env.production up -d --no-deps frontend
```

The release does not run migrations, reconcile the full Compose project, restart Caddy, or operate on backend, worker, PostgreSQL, or Redis.

## Required GitHub production environment

Create a GitHub environment named `production` and configure required reviewers. Disable self-review when the repository plan supports it. Restrict deployment branches to `main`.

Store these environment secrets:

- `PRODUCTION_ENV_FILE`: current production environment file used only to obtain frontend build arguments
- `AZURE_VM_HOST`: production VM hostname or IP
- `AZURE_VM_PORT`: SSH port, normally `22`
- `AZURE_VM_USER`: SSH account used for deployment
- `AZURE_VM_SSH_KEY`: private deployment key
- `AZURE_VM_APP_PATH`: deployed Compose directory, such as `/home/azureuser/studflow`
- `AZURE_VM_KNOWN_HOSTS`: pinned SSH host-key line for the exact host and port
- `GHCR_USERNAME`: account permitted to pull the frontend package
- `GHCR_PAT`: package token scoped to `read:packages` only

Generate the `AZURE_VM_KNOWN_HOSTS` value from a trusted host-key fingerprint obtained through the Azure portal, VM console, or an independently verified administrator channel. Compare the fingerprint before storing the OpenSSH known-hosts line. Do not populate this secret from an unverified `ssh-keyscan` during a release.

For port 22 the line starts with the hostname or IP. For a nonstandard port it must use `[host]:port`. The workflow requires a matching pinned entry and enables strict host-key checking.

The workflow uses its short-lived GitHub token only to publish the repository's GHCR frontend image. The VM login uses `GHCR_USERNAME` and a separate `GHCR_PAT` environment secret that must have `read:packages` only. The packages-write workflow token is never sent to the VM.

## Frontend build-time configuration

The production frontend image requires these values from `PRODUCTION_ENV_FILE`:

- `NEXT_PUBLIC_API_BASE_URL`
- `INTERNAL_API_BASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (defaults to `/sign-in`)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (defaults to `/sign-up`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` (defaults to `/dashboard`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` (defaults to `/dashboard`)

The runtime production environment file remains on the VM and is not replaced by the frontend release workflow. `CLERK_SECRET_KEY` continues to be supplied to the frontend container by Compose at runtime.

## Safe publication and release procedure

1. Commit the V2.1 frontend changes separately from the CI/CD hardening changes.
2. Push the feature branch. The corrected `Pipeline` workflow runs CI and cannot deploy.
3. Open and review a pull request. Confirm both Frontend CI and Backend CI pass.
4. Merge the approved commits into `main`. The merge runs CI only.
5. Copy the full 40-character merge commit SHA from `main`.
6. In GitHub Actions, open **Frontend production release**, choose **Run workflow** from `main`, enter that SHA, and enter `DEPLOY FRONTEND` as the confirmation.
7. A required reviewer approves the `production` environment job.
8. The workflow verifies the SHA is reachable from `origin/main`, confirms the existing public site is healthy, builds only `frontend/Dockerfile`, and publishes only `ghcr.io/<owner>/studflow-frontend:<40-character-sha>`.
9. Deployment uses the registry digest returned by the build, in the form `ghcr.io/<owner>/studflow-frontend@sha256:<digest>`. The script refuses mutable tags.
10. The workflow captures the actual running frontend image's GHCR repository digest, deploys the new digest with `--no-deps`, verifies Caddy, backend, worker, PostgreSQL, and Redis container IDs are unchanged, and checks the frontend from inside its container.
11. The workflow checks the public home page and `/api/health` after deployment. A failure automatically runs the preserved rollback script, repeats the smoke checks, and leaves the workflow failed even when rollback succeeds.

No `latest` tag is written. The commit tag identifies the source, while the resolved registry digest is the deployment and rollback identity.

## Frontend-only deployment script

The manual workflow uploads `scripts/deploy-frontend.sh` to a temporary VM path and executes it with the existing application directory and environment file. The script:

- refuses to deploy unless frontend, Caddy, backend, worker, PostgreSQL, and Redis are already running
- resolves the running frontend container's image ID to an immutable GHCR repository digest and refuses deployment if it cannot establish that rollback identity
- stores that value in `.frontend-release/previous-image` with restricted permissions
- preserves the reviewed release script at `.frontend-release/deploy-frontend.sh`
- changes only `FRONTEND_IMAGE` in `.env.production`
- pulls only the requested frontend image when it is not already present
- runs `docker compose up -d --no-deps frontend`
- verifies Caddy, backend, worker, PostgreSQL, and Redis container IDs did not change
- verifies the frontend responds over `127.0.0.1:3000` inside its container
- restores the previous frontend image automatically if deployment validation fails

It performs no Docker pruning or migration command.

## Rollback prerequisites and procedure

Before release approval, verify the currently running frontend image has a GHCR repository digest and is available locally or in GHCR. The deployment script derives that digest from the running container's image ID before replacement and refuses the release if it cannot preserve an immutable rollback target. Do not prune images before or immediately after a release.

To roll back on the VM:

```bash
cd /home/azureuser/studflow
APP_DIR=/home/azureuser/studflow \
ENV_PATH=/home/azureuser/studflow/.env.production \
bash .frontend-release/deploy-frontend.sh rollback
```

The deploy operation preserves the exact reviewed script used for the release in `.frontend-release`, so rollback does not depend on the VM repository checkout being updated. Rollback updates only the frontend service, performs the same protected-service and internal-response checks, and records the displaced image as the next rollback target.

After rollback, verify:

```bash
curl -fsSI https://studflow.webcris.dev/
curl -fsS https://studflow.webcris.dev/api/health
```

## CI security notes

The CI workflow has global `contents: read` permission only. `packages: write` is granted only to the manual frontend release job. CI logs migration failures and RLS results inside GitHub Actions; it does not send diagnostics to third-party webhook endpoints.

Earlier workflow revisions posted test-database migration errors and RLS table flags to a fixed `webhook.site` URL. The RLS output contains schema security flags but no credential values. Migration errors can contain SQL and connection diagnostics, although the CI database used hardcoded test credentials. Review access logs for that webhook if they are available. Current repository evidence does not show production credentials being transmitted, so production credential rotation is not required solely because of those calls. Rotate a credential if a retained webhook payload or Actions log proves that credential was present.

The release workflow makes only these expected outbound connections: GitHub checkout and action dependencies, GHCR image publication and pull, the pinned production SSH endpoint, and public StudFlow smoke checks.
