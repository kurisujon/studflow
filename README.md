# Studflow

Studflow is an AI-powered study workflow system for turning PDF and DOCX learning materials into a structured study experience.

It combines:

- AI-generated summaries
- flashcards
- quizzes
- annotations and notes
- explain-with-AI workflows
- recent AI history
- related learning videos

The project is built as a monorepo with a Next.js frontend and a FastAPI backend, backed by PostgreSQL, Redis, Celery, Supabase Storage, and Gemini.

## What Studflow Does

The current product flow is:

1. Sign in with Clerk.
2. Upload a PDF or DOCX.
3. Store the source file and create a document record.
4. Process the document asynchronously with Celery.
5. Extract text and generate:
   - a summary
   - flashcards
   - a quiz
   - related video suggestions
6. Open the study workspace and review the generated material.
7. Highlight text, add notes, ask AI follow-up questions, and return to saved AI sessions later.

## Core Features

- Authentication with Clerk
- PDF and DOCX upload flow
- Asynchronous document processing
- AI-generated summary
- AI-generated flashcards
- AI-generated quiz
- Interactive study workspace
- Highlights, underlines, and notes
- AI explain-selection flow
- AI history inside the study tools bubble
- Related learning videos
- Theme settings with light/dark appearance support

## Monorepo Structure

```text
studflow/
├── frontend/   # Next.js App Router, TypeScript, Tailwind, Clerk
├── backend/    # FastAPI, SQLModel, Alembic, Celery, Redis, Gemini
├── docs/       # Architecture, guardrails, roadmap, CI/CD notes
├── deploy/     # Reverse proxy config
└── docker-compose.yml
```

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui patterns
- Clerk authentication

### Backend

- FastAPI
- Python 3.12 runtime in CI and local virtualenv workflow
- SQLModel / SQLAlchemy
- Alembic
- Celery
- Redis

### AI and Storage

- Gemini for study material generation and explain-selection flows
- Supabase Storage for uploaded files
- YouTube API for related learning videos

### Infrastructure

- PostgreSQL
- Docker Compose
- Caddy reverse proxy
- GitHub Actions CI/CD
- Azure VM deployment
- GitHub Container Registry for production images

## Current Routes

### Frontend

- `/`
- `/sign-in`
- `/sign-up`
- `/upload`
- `/dashboard`
- `/dashboard/study/[id]`
- `/dashboard/upload`

### Backend API

The FastAPI app is mounted under `/api` and currently includes endpoints for:

- health checks
- upload
- document listing
- processing status
- study payload retrieval
- extracted document chunks
- related videos
- annotations
- notes
- AI history
- explain-selection AI actions

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL
- Redis
- Supabase project and storage bucket
- Gemini API key
- Clerk application keys

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv312
source .venv312/bin/activate
pip install -r requirements.txt
.venv312/bin/python -m alembic upgrade head
uvicorn main:app --reload
```

### Celery Worker

Run the worker in a separate terminal:

```bash
cd backend
source .venv312/bin/activate
celery -A core.celery_app.celery_app worker --loglevel=info
```

## Environment Overview

Studflow requires environment values for:

- database connection
- Redis / Celery
- Clerk auth
- Supabase storage
- Gemini
- optional YouTube enrichment
- allowed frontend origins

Relevant backend settings live in [backend/core/config.py](backend/core/config.py).

For production deployment details, see [docs/cicd.md](docs/cicd.md).

## Database Migrations

Studflow uses Alembic for schema changes.

Run migrations with:

```bash
cd backend
.venv312/bin/python -m alembic upgrade head
```

If `alembic` is not available on your PATH, use the virtualenv Python module form above.

## Docker Compose Runtime

The production stack defined in [docker-compose.yml](docker-compose.yml) runs:

- `caddy`
- `frontend`
- `backend`
- `worker`
- `postgres`
- `redis`

This keeps the app as a single monorepo deployment while still separating web, API, queue, and data services cleanly.

## CI/CD and Deployment

This repository currently deploys to an Azure VM using:

- GitHub Actions
- Docker Compose
- GitHub Container Registry
- Caddy as the public reverse proxy

The pipeline:

1. runs frontend and backend CI
2. builds production images on pushes to `main`
3. pushes images to GHCR
4. uploads the release bundle and env file to the VM
5. runs the remote deployment script

Detailed instructions are in [docs/cicd.md](docs/cicd.md).

## Product Status

Studflow is beyond the initial upload-and-summary prototype stage.

Implemented foundation includes:

- authenticated upload flow
- async processing pipeline
- study workspace
- annotations and notes
- AI history
- related videos
- theme settings

The current product focus is study-workspace refinement and continued improvement of the reading and review experience.

See:

- [docs/tasks.md](docs/tasks.md)
- [docs/roadmap.md](docs/roadmap.md)
- [docs/architecture.md](docs/architecture.md)

## Guardrails

This project intentionally avoids unnecessary complexity.

Key constraints:

- monolithic frontend and backend
- REST only
- no microservices
- no Kubernetes
- no new dependencies without a real need
- strict typing and schema validation

See [docs/GUARDRAILS.md](docs/GUARDRAILS.md).

## License

No license file is currently present in this repository.
