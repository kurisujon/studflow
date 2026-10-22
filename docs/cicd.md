# StudFlow CI/CD and controlled application releases

Ordinary pushes and pull requests run `.github/workflows/pipeline.yml`. That workflow validates release tooling, frontend, backend, and the frozen evaluation baseline. It cannot publish images or deploy production.

Production has two manual workflows:

- `Production read-only preflight` proves the current host, service, queue, storage, and rollback state without changing application services.
- `Application production release` builds immutable frontend/backend images and updates the named `backend`, `worker`, and `frontend` services after protected-environment approval. It also provides a compatible application rollback operation.

The old frontend-only workflow and script are retired. `scripts/deploy.sh` is not part of this release path because it reconciles the wider stack, runs migrations, and performs cleanup.

## Production service contract

`docker-compose.yml` defines six services. A release may replace only:

- `backend`, selected by `BACKEND_IMAGE`
- `worker`, selected by the same `BACKEND_IMAGE`
- `frontend`, selected by `FRONTEND_IMAGE`

The release must preserve the container identities and mounts of `caddy`, `postgres`, and `redis`. It does not run migrations, change volumes, prune Docker data, recreate dependencies, or use a full-project Compose update.

The API and worker must remain on the same immutable backend digest. A rollback always treats frontend plus the backend/worker pair as one compatible application set.

## Protected production environment

The GitHub environment named `production` must:

1. require a human reviewer and prevent self-review where the repository plan supports it;
2. restrict deployments to `main`;
3. store the existing SSH credentials and a host key verified through an independent administrator channel;
4. store a GHCR credential limited to `read:packages` for the production host; and
5. store `PRODUCTION_ENV_FILE` for the whitelisted frontend build arguments.

Required environment secrets are:

- `PRODUCTION_ENV_FILE`
- `AZURE_VM_HOST`, `AZURE_VM_PORT`, `AZURE_VM_USER`, `AZURE_VM_APP_PATH`
- `AZURE_VM_SSH_KEY`, `AZURE_VM_KNOWN_HOSTS`
- `GHCR_USERNAME`, `GHCR_PAT`

The workflow's GitHub token receives `packages: write` only in the image build job. The VM receives only the separate read-only GHCR token over standard input. Both workflows use strict pinned SSH host verification. Temporary SSH and Docker credential directories are removed after each run.

## Required read-only preflight

Run **Production read-only preflight** from `main` with the exact confirmation `PREFLIGHT ONLY` and the reviewed full source SHAs expected for the running frontend and backend/worker images. Approve the protected `production` environment only after confirming the workflow source is the reviewed main revision.

The preflight fails closed unless it verifies:

- exactly one running container for frontend, backend, worker, Caddy, PostgreSQL, and Redis;
- Compose working-directory and configuration-file labels;
- immutable local GHCR digests for frontend and the matching backend/worker pair;
- read-only registry manifest access for both rollback images;
- each reviewed source SHA tag resolves to the corresponding running repository digest;
- production host architecture and at least 2 GiB of available filesystem space;
- presence, without values, of required production environment keys;
- PostgreSQL readiness and Redis `PONG`;
- independent backend and worker database connections using non-superuser, `NOBYPASSRLS` roles;
- schema usage, CRUD privileges on the 14 runtime tables, and required runtime sequence privileges;
- exactly one responding Celery worker; and
- sanitized active, reserved, scheduled, broker-queued, and early-acknowledged repair-task counts.

The preflight writes only an ephemeral helper under `/tmp`, removes it on completion, and does not pull images, alter containers, inspect task arguments, query database contents, or print environment values.

## Worker drain policy

`scripts/celery-release-control.py` controls only the default `celery` queue and requires exactly one worker node.

Before worker replacement it:

1. tells the worker to stop consuming new messages from the default queue;
2. inspects active, reserved, scheduled, and default-broker-queue counts without printing task payloads;
3. requires all four counts to be zero for three consecutive samples; and
4. treats `tasks.repair_document_index_task` as an explicit blocker because it is early acknowledged.

No task is purged, revoked, terminated, or discarded. A nonzero broker queue blocks replacement and consumption is restored. Once the safe drain is proved, the script stops the idle worker and starts the replacement worker from the same digest as the API.

## Supabase runtime RLS connection

Both `backend` and `worker` must use the Supabase pooler connection for the same dedicated `app_user` role. Configure `DATABASE_URL` with TLS and PgBouncer-compatible settings through the protected production environment; never commit or print the password. Use the pooler hostname, region, port, and custom-role username shown by the project's Supabase dashboard; a non-secret shape is `postgresql+psycopg://app_user.<project-ref>:<url-encoded-password>@<pooler-host>:6543/postgres?sslmode=require`. The role must have `LOGIN NOSUPERUSER NOBYPASSRLS`, no role memberships, `USAGE` on `public`, and CRUD only on the 14 application runtime tables. The checked schema is UUID-only and needs no sequences, so preflight rejects a runtime-table sequence dependency until its minimum privilege receives separate review.

Apply grants only through a separately approved privileged connection. The intended grant shape is:

```sql
REVOKE CREATE ON SCHEMA public FROM app_user;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM app_user;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM app_user;
GRANT CONNECT ON DATABASE postgres TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  documents, user_preferences, ai_conversations, summaries, flashcards,
  document_chunks, quizzes, quiz_attempts, related_videos, study_annotations,
  ai_history, ai_messages, quiz_questions, ai_message_citations
TO app_user;
```

Replace the database name if production does not use `postgres`. Do not grant runtime access to `users` or `alembic_version`.

Alembic uses a separate, short-lived privileged `MIGRATION_DATABASE_URL` supplied only to an explicitly approved migration operation. The application and worker must never receive it. `users` is legacy and `alembic_version` is migration-owned; runtime deny-all behavior on RLS-enabled copies is acceptable because current Clerk flows do not query either table.

Before changing runtime credentials:

1. prove there are no null/blank `documents.clerk_user_id` values using the privileged read-only operator connection;
2. prove active, reserved, scheduled, and broker-queued Celery counts are all zero and pause consumption;
3. record the current immutable frontend/backend/worker images and current protected environment version;
4. verify `app_user` with read-only role, membership, grant, policy, and sequence queries; and
5. retain the prior protected `DATABASE_URL` value for immediate credential rollback without logging it.

Update backend and worker to the tenant-aware image before or atomically with switching both services to `app_user`; never run a mixed API/worker credential state. Resume consumption only after both services attest `NOBYPASSRLS`, health checks pass, and an owner/cross-tenant acceptance probe succeeds. On failure, pause consumption, restore the previous compatible backend/worker image pair and protected environment version, recreate only those named services, verify health, then resume. Do not disable RLS, grant `BYPASSRLS`, purge Redis, or run migrations as a workaround.

If the bound expires or the worker identity changes, the helper attempts to restore queue consumption and aborts before replacement. If consumption cannot be restored, it fails with an operator-visible error and no force stop. An operator must restore the single known worker, verify `inspect ping`, and rerun the read-only preflight before another release attempt.

During automatic rollback, a busy replacement worker is never forced down. The script keeps the compatible new backend/worker pair and restores the previous frontend where safe, then fails the release for operator intervention.

## Deploy procedure

Human approval checkpoints are explicit:

1. Confirm CI passed for the full 40-character release SHA on `main`.
2. Run and approve the read-only preflight. Record its attested frontend/backend source SHAs, frontend and backend/worker rollback digests, host architecture, queue counts, and disk result.
3. Confirm both attested running source SHAs are ancestors of the release SHA. The workflow independently rejects incompatible frontend and backend contract changes from their respective running revisions.
4. Open **Application production release** from `main`, choose `deploy`, select the preflight-confirmed platform, enter the release SHA plus both attested source SHAs and digest references, and type `DEPLOY APPLICATION`.
5. Approve the build job in the protected environment. It checks out the exact release SHA and publishes frontend/backend images tagged with that SHA. Deployment uses the resulting repository digests, not the tag.
6. Review the immutable digest outputs and approve the deployment job.

The deployment script authenticates with a temporary Docker configuration, proves that the current digests still match the approved preflight evidence and source SHA tags, verifies old and new manifests, requires local rollback images, and rejects an architecture mismatch. It records the prior frontend and backend/worker digests and their source SHAs with mode `600`.

Rollout order is:

1. stop worker consumption and prove a stable idle state;
2. replace only `backend` with `docker compose up -d --no-deps backend` and wait for its health check;
3. request a warm shutdown from the drained worker without a timeout-based force kill, replace only `worker`, and require a Celery ping;
4. replace only `frontend` and require an internal HTTP response; and
5. prove Caddy, PostgreSQL, and Redis identities and mounts are unchanged.

The workflow checks the public homepage and `/api/health` before and after the service update. If the post-release public smoke fails, it immediately invokes the preserved compatible rollback set and fails the workflow even when recovery succeeds. A single-instance API/frontend restart can briefly interrupt requests, so use an announced low-traffic maintenance window.

## Rollback procedure

The release script preserves the reviewed scripts and the prior immutable image set in `.application-release`. Do not prune those images after release.

For a protected workflow rollback, choose `rollback`, supply the recorded preflight fields required by the workflow form, type `ROLLBACK APPLICATION`, and approve the production environment. The workflow invokes the preserved compatible rollback set; it does not build images and does not require the current frontend or backend to be healthy.

The rollback uses the same drain rules and order: drain the current worker, restore backend, replace the worker with the matching backend digest, then restore frontend. A successful rollback preserves the known-good rollback record rather than replacing it with the displaced failed release.

If GitHub Actions is unavailable, an authorized operator may invoke the preserved script on the VM only after a separate change approval:

```bash
cd /home/azureuser/studflow
APP_DIR=/home/azureuser/studflow \
ENV_PATH=/home/azureuser/studflow/.env.production \
STATE_DIR=/home/azureuser/studflow/.application-release \
CELERY_CONTROL_PATH=/home/azureuser/studflow/.application-release/celery-release-control.py \
GHCR_USERNAME='<read-only package account>' \
bash .application-release/deploy-application.sh rollback
```

Supply the read-only token on standard input when prompted by the approved operator procedure. Never place it in shell history or command arguments.

## Acceptance checks

After deployment or rollback, verify:

- public homepage and `/api/health` responses;
- backend health and the exact frontend/backend/worker digests;
- one Celery worker responds and consumes the default queue;
- Caddy, PostgreSQL, and Redis identities and persistent mounts match preflight; and
- upload processing remains queued and completed normally.

Authenticated AI acceptance uses a designated test account and controlled document. Verify a general formula explanation without citations, a mixed answer whose document claim has a real citation, and an explicit document-only missing fact that abstains. A live Gemini smoke test consumes provider calls and persists conversation records. It requires separate explicit authorization and is never run by either release workflow.

## Security notes

Release logs contain only sanitized counts, image digests, service health, and infrastructure identifiers. They must never include production environment values, database contents, document identifiers, Celery task arguments, SSH keys, or package tokens.

Earlier CI revisions sent diagnostics to `webhook.site`; current workflows contain no diagnostic webhooks or unexpected external transmission. Rotate credentials only if retained historical payloads prove that a credential was exposed.
