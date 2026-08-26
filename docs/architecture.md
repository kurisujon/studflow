# System Design

## Overview
The AI Study Workflow System is architected as a Decoupled Fullstack application. This separation ensures that the client-side presentation remains fast and responsive while the computationally heavy document processing and AI orchestration are handled asynchronously on the backend.

## Frontend Specifications
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Animation Utilities:** `tw-animate-css` — imported globally in `app/globals.css`; provides Tailwind-compatible CSS animation classes used across the app
- **UI Components:** shadcn/ui built on `@base-ui/react` primitives (replaces Radix UI as the headless button primitive in `components/ui/button.tsx`)
- **Delight Interactions:** `canvas-confetti` — lazy-loaded in `components/quiz-study.tsx` to fire a confetti burst on quiz completion
- **State Management:** Zustand (for global state, study sessions, and user preferences)

## Backend Specifications
- **Framework:** FastAPI
- **Language:** Python 3.11+
- **Background Processing:** Celery
- **AI Integration:** Gemini API (via official SDK)

## Database & Storage Specifications
- **Primary Database:** PostgreSQL (managed via SQLAlchemy / SQLModel)
- **Message Broker & Cache:** Redis (for Celery task queues and rate limiting)
- **Blob Storage:** AWS S3 or Supabase Storage (for persisting raw PDF/DOCX uploads)

## Complete Workflow Diagram
1. **User Upload:** User uploads a PDF/DOCX via the Next.js frontend.
2. **Upload Endpoint:** FastAPI receives the file, uploads it to S3/Supabase Storage, and creates a database record with a `processing` status.
3. **Task Queue:** FastAPI enqueues a background job via Redis/Celery, returning a `task_id` to the frontend.
4. **Polling:** Frontend begins polling the backend using the `task_id` to check the processing status.
5. **Document Processing (Background):** Celery worker picks up the task, downloads the file, and extracts text (applying chunking logic).
6. **AI Orchestration (Background):** Celery worker sends the extracted text to the Gemini API, enforcing strict JSON output schemas for the summary, flashcards, and quiz.
7. **Persistence:** The parsed JSON responses from Gemini are validated against backend Pydantic models and saved to PostgreSQL. The document status is updated to `completed`.
8. **Completion:** The frontend polling detects the `completed` status, fetches the generated study materials, and transitions the user to the interactive Study UI.

## Persistent Document Conversation Flow

The conversational assistant remains inside the FastAPI monolith and reuses the existing document RAG pipeline:

1. The authenticated Clerk user creates a conversation for an owned, completed document.
2. The backend loads a bounded recent message history for conversational context.
3. Before embedding the question, the backend requires every stored chunk to have an embedding. An incomplete legacy index queues a targeted, embedding-only Celery repair that preserves the completed document status and existing study materials; the user must retry manually after preparation.
4. The current question and optional selected study text are embedded with `gemini-embedding-2` and matched against owned `document_chunks` with pgvector.
5. Gemini receives the bounded conversation history, optional selected text, and retrieved document sources. History and selected text guide intent but are not citation evidence.
6. The backend validates the structured answer and maps citations to real retrieved chunk UUIDs. When the retrieved evidence is insufficient, the assistant records that outcome without manufacturing a citation.
7. After successful generation, the user message, assistant message, and citation rows are committed atomically.
8. Conversation messages and citations are returned in stable sequence order and survive refresh.

Conversation ownership is stored as the existing Clerk subject string. Phase 2 remains document-only and synchronous. The frontend loads the latest conversation, persists follow-up turns, pages backward through canonical history, and renders only structured citations returned by the backend. Chat never falls back to ungrounded generation when the index is incomplete or empty. Page-aware citations, web grounding, and streaming remain later phases. The legacy Ask AI and AI History endpoints remain available during the compatibility rollout.

## AI Architecture Pipeline
The system enforces strict domain boundaries over generative outputs. It uses a **model-assisted semantic citation evaluation** step to verify whether generated claims are supported by retrieved document chunks, avoiding any false "guarantees" of absolute truth. Unsupported claims are aggressively filtered before presentation.

## Security
### Row-Level Security (RLS)
The database enforces Row-Level Security (RLS) on all user-scoped tables, keyed to the `clerk_user_id`. The application sets `app.current_user_id` as a local transaction variable via the `get_session` dependency.
**CRITICAL DEPLOYMENT REQUIREMENT:** The database role used by the FastAPI application MUST NOT be a superuser and MUST NOT have the `BYPASSRLS` attribute. PostgreSQL silently bypasses all RLS policies for roles with these privileges, even if `FORCE ROW LEVEL SECURITY` is set.
