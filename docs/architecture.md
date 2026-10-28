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
2. The backend loads bounded authored message history. A prior text selection remains separate and is reused only when it belongs to the immediately preceding user turn and the new question is referential.
3. Before embedding the question, the backend requires every stored chunk to have an embedding. An incomplete legacy index queues a targeted, embedding-only Celery repair that preserves the completed document status and existing study materials; the user must retry manually after preparation.
4. The current question and optional selected study text are embedded with `gemini-embedding-2` and matched against owned `document_chunks` with pgvector.
5. A deterministic request-scope shell selects an isolated generation path: strict document, general teaching, source clarification, or a composite of independently validated document and teaching results.
6. Strict document generation receives the verified source registry and permits only document claims with valid evidence IDs. Teaching generation receives no source registry, raw selection, or assistant-authored history; a selection is reduced to bounded topic keywords before it can guide a formula, definition, comparison, or illustrative example.
7. The backend validates the structured answer, removes model-authored citation markers, semantically verifies every document citation, and maps supported evidence to real retrieved chunk UUIDs. Unsupported source claims fail closed. Ambiguous source notation produces a targeted clarification, while explicit document-only requests preserve deterministic abstention.
8. Mixed answers combine the two paths only after independent validation. When the document portion cannot be verified, the assistant labels that limitation and may retain the independently valid teaching portion without a document citation.
9. After successful generation, the user message, assistant message, and citation rows are committed atomically. Messages and citations return in stable sequence order and survive refresh.

Conversation ownership remains the existing Clerk subject string, and the public synchronous API contract remains unchanged. The frontend loads the latest conversation, persists follow-up turns, pages backward through canonical history, and renders only backend-validated document citations. General explanations and hypothetical examples are explicitly labeled and never receive document citation records. Verified web grounding is approved and planned as Phase E (see below) but is not yet implemented; `web` and `hybrid` retrieval modes are still rejected with a stable 409. Streaming remains a later phase. The legacy Ask AI and AI History endpoints remain available during the compatibility rollout.

### Planned: Verified Web Grounding (Phase E — approved, not implemented)
The approved design extends the conversation pipeline without weakening grounding:

1. **Conversational turns** (thanks, greetings, acknowledgements) are detected deterministically before retrieval and receive a short, claim-free, citation-free reply. They never trigger document retrieval or web search.
2. **Document mode** (default) is unchanged.
3. **Web mode** runs a Gemini Google Search grounding call using only the student's question. The backend builds a web source registry (`w_01`, `w_02`, …) exclusively from the tool's grounding metadata (URL, title, supported segments). A second structured call produces claims that may cite only those web evidence IDs, followed by the existing semantic citation evaluation and unsupported-claim filter.
4. **Hybrid mode** runs document retrieval first, then web retrieval for the remaining gap. Document and web claims are validated independently and rendered in separate, labeled sections.
5. Web citations persist as `ai_message_citations` rows with `source_type="web"`, an `https` URL, title, domain, and bounded excerpt. Model-authored links are never persisted.

The two-call design is required because the configured default model (`gemini-2.5-flash`) does not support combining the Google Search tool with a JSON response schema in a single request.

## AI Architecture Pipeline
The system enforces strict domain boundaries over generative outputs. It uses a **model-assisted semantic citation evaluation** step to verify whether generated claims are supported by retrieved document chunks, avoiding any false "guarantees" of absolute truth. Unsupported claims are aggressively filtered before presentation.

## Security
### Row-Level Security (RLS)
The database enforces Row-Level Security (RLS) on all user-scoped tables, keyed to the `clerk_user_id`. `TenantSession` stores one immutable Clerk subject and reapplies transaction-local `app.current_user_id` at every SQLAlchemy transaction begin, including after commits and rollbacks. FastAPI requests and document-processing workers use the same tenant-bound session contract.
**CRITICAL DEPLOYMENT REQUIREMENT:** The database role used by the FastAPI application MUST NOT be a superuser and MUST NOT have the `BYPASSRLS` attribute. PostgreSQL silently bypasses all RLS policies for roles with these privileges, even if `FORCE ROW LEVEL SECURITY` is set.

Celery document jobs retain their existing task names and positional arguments. Producers attach a versioned, domain-separated HMAC header that binds the operation, arguments, and authenticated Clerk subject. Workers verify it before opening a database session, preserve the authenticated headers on retry, and reject missing legacy or forged provenance without retrying or reading tenant data. A release that introduces this contract requires an empty active, reserved, scheduled, and broker queue before the backend/worker credential cutover.

The legacy `users` table is not used by authenticated Clerk runtime flows, and `alembic_version` is owned by migration tooling. If either table has RLS enabled without a policy, the resulting deny-all behavior is intentional for the runtime role. Migration access uses a separately privileged connection; runtime code must not receive privileges on `alembic_version` or rely on `users` access.

### Prompt Injection Mitigation
All untrusted document inputs and user-provided text passed to the AI models are wrapped in randomized XML-like boundary tags (e.g., `<untrusted_document_content_TOKEN>`). The backend validates the inputs against a regex pattern to ensure users cannot maliciously inject these boundary tags to spoof system directives.
