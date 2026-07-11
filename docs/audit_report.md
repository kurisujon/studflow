# Studflow Structured Repository Audit Report

This report summarizes the complete audit of the Studflow repository, as conducted by the specialized 3-agent engineering team (Planner/Architect, Full Stack Coder, and QA/DevOps).

---

## 1. Application Structure & Folder Organization
Studflow is organized as a decoupled monorepo containing:
- **`frontend/`**: Next.js App Router application written in TypeScript and styled with Tailwind CSS v4.
  - `frontend/app/`: Route directory for the Next.js application.
  - `frontend/components/`: Modular component surfaces (`home/` animations, `study/` workspace sub-components, `theme/`, `ui/` primitives).
  - `frontend/lib/`: API client wrappers (`server-api.ts` using Clerk server auth token, `api/` resource clients).
- **`backend/`**: FastAPI application written in Python 3.11+.
  - `backend/api/routes/`: Router files separating endpoints (`documents.py`, `study.py`, `upload.py`, `user.py`, `health.py`).
  - `backend/core/`: Backend core logic (`auth.py` Clerk validator, `database.py` DB engine, `config.py` Pydantic configuration).
  - `backend/models/`: Database model definitions (`tables.py`).
  - `backend/services/`: Isolated services (`ai_service.py` Gemini interface, `storage.py` Supabase client, `study_service.py` SM-2 spacing engine).
  - `backend/tasks/`: Celery asynchronous worker tasks (`document_processing.py`).
- **`docs/`**: Markdown documentation covering guardrails, architecture, cicd, roadmap, and tasks.

---

## 2. Technology Stack & Dependencies
The core dependencies are strictly pinned to ensure environment reproducibility:

### A. Frontend Stack
- **Framework**: Next.js v16.2.6 (App Router), React 19.2.4, TypeScript.
- **Styling**: Tailwind CSS v4 and `tw-animate-css` globally imported.
- **UI Components**: `shadcn/ui` built on top of `@base-ui/react` primitives (specifically `@base-ui/react/button` in `frontend/components/ui/button.tsx`).
- **State Management**: Standard React Context (`ThemeProvider.tsx`) and local component hooks (`useState`, `useRef`, `useCallback`, `useEffect`). *Note: `docs/architecture.md` incorrectly references `zustand` which is not present in package.json.*
- **Authentication**: Managed via `@clerk/nextjs` (v7.4.1).

### B. Backend Stack
- **Framework**: FastAPI (0.115.12), Python 3.11+.
- **Database Engine**: PostgreSQL managed via SQLModel (0.0.22) and SQLAlchemy (2.0.40) using `postgresql+psycopg` and `NullPool`.
- **Async Workers**: Celery (5.5.3) backed by Redis.
- **AI Integrations**: Gemini API (via official `google-genai==1.16.1` SDK).
- **Blob Storage**: Supabase Storage (`supabase==2.15.3` client library) for raw document uploads.

---

## 3. Current Feature Status
The core user flow is fully implemented and operational:
1. **User Authentication (Clerk)**: Fully implemented. Protected routes exist in the Next.js layout middleware; backend routes are protected via token verification against Clerk's JWKS endpoint.
2. **Document Upload**: Completed. Files are uploaded to `/api/upload`, stored in Supabase Storage, and a Celery worker is spawned.
3. **Asynchronous Document Processing**: Completed. PDFs (via PyMuPDF) and DOCX (direct XML parser) are extracted, chunked, and stored.
4. **AI Generation (Summary, Flashcards, Quiz)**: Completed. The Celery worker invokes Gemini API using structured JSON schema constraints matching backend Pydantic models.
5. **Study Workspace**: Completed. Interactive summary reader, annotations (highlights and underlines), and Notes CRUD are fully functional.
6. **AI Contextual Q&A**: Completed. Highlighted selection or full document queries are processed by the AI panel and saved to AI history.
7. **Spaced Repetition System (SRS)**: Completed. SM-2 algorithm calculates next review dates and exposes cards due today in the Daily Review Hub.
8. **Challenge Mode (Mixed Quizzes)**: Completed. Cross-document quiz sessions are generated prioritizing weak-topic history.

---

## 4. Key Bugs & Technical Debt Identified
The audit identified 2 functional bugs and 2 instances of technical debt that should be addressed in subsequent milestones:

### A. Functional Bugs
1. **Broken Settings Update Endpoint**: 
   - *File*: `frontend/components/settings-form.tsx` (lines 16–20)
   - *Issue*: The client-side form update issues a PUT fetch request to `/api/user/preferences` but does not pass the Clerk Authorization header (Authorization bearer token).
   - *Impact*: Any attempt by the user to update daily review goals or SM-2 aggressiveness factor fails on the backend with an HTTP 401/403 Unauthorized status.
2. **Incorrect Dashboard "Continue Studying" Filtering**:
   - *File*: `frontend/app/dashboard/page.tsx` (line 28)
   - *Issue*: The dashboard filters out completed files using `documents.filter(doc => doc.status !== "COMPLETED")`.
   - *Impact*: Active, ready-to-study documents are hidden from the user's dashboard, whereas pending, processing, or failed documents are mistakenly displayed as cards.

### B. Technical Debt & Performance
1. **Universal CSS Transitions Paint Overhead**:
   - *File*: `frontend/app/globals.css` (lines 454–462)
   - *Issue*: Applying transitions to the universal selector (`*`, `*::before`, `*::after`) forces the browser to evaluate and compute paint/layout transitions for every DOM node on page scroll and text selection.
   - *Impact*: Framerate drops and interaction lag during study annotations.
2. **Low Component Modularity**:
   - *File*: `frontend/components/study/InteractiveSummaryReader.tsx`
   - *Issue*: Contains **1,252 lines of code** mixing mouse events, annotations CRUD, state toggles, and UI representation.
   - *Impact*: High maintenance complexity and difficulty writing unit tests.

---

## 5. Infrastructure, CI/CD, and deployment strategy
- **Docker Compose**: Uses 6 containers (`caddy`, `frontend`, `backend`, `worker`, `postgres`, `redis`).
  - *Redundancy*: The local `postgres` service is running and checked for health, but `.env.production` overrides it to connect directly to an external Supabase instance.
- **CI/CD Pipeline**: GitHub Actions (`pipeline.yml`) validates frontend builds/lints, checks backend Python compilation, builds Docker images, SCPs a release tarball to the Azure VM, and executes the remote script `scripts/deploy.sh`.
- **Azure Deployment Script**: Script executes docker prunes, pulls fresh images, and runs database migrations via `docker compose exec backend alembic upgrade head`.
- **API Key Rotation**: The backend contains custom property parsers that read a comma-separated string of Gemini keys, cycling through them automatically using `itertools.cycle` if a 403 or 429 response is encountered.

---

## 6. Verification Methods
- **Frontend Compilation**: Run `npm run build` in `frontend/` to confirm Next.js compiler output.
- **Backend Compilation**: Run `python3 -m compileall .` in `backend/` to verify Python syntax validity.
- **Settings Form**: Ensure `Authorization: Bearer <token>` is added to the fetch headers in `settings-form.tsx`.
- **Dashboard Filter**: In `dashboard/page.tsx`, change `doc.status !== "COMPLETED"` to `doc.status === "COMPLETED"` to display ready study materials.
