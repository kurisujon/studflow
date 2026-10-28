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

Conversation ownership remains the existing Clerk subject string, and the public synchronous API contract remains backward-compatible. The frontend loads the latest conversation, persists follow-up turns, pages backward through canonical history, and renders only backend-validated citations. General explanations and hypothetical examples are explicitly labeled and never receive citation records. Verified web grounding is implemented in Phase E (see below) behind a default-disabled `WEB_GROUNDING_ENABLED=false` rollout flag; while disabled, `web` and `hybrid` retrieval modes continue to return a stable 409. Streaming remains a later phase. The legacy Ask AI and AI History endpoints remain available during the compatibility rollout.

### Verified Web Grounding & Conversational Turns (Phase E — implemented behind `WEB_GROUNDING_ENABLED=false`)
Phase E extends the conversation pipeline without weakening grounding:

1. **Conversational turns** (thanks, greetings, acknowledgements, and closings such as `"that was good thanks"`) are detected deterministically before embedding, retrieval, or Gemini calls and receive a short, claim-free, citation-free reply (`ANSWERED`). Conversational turns never inherit or erase prior source-specific scope.
2. **Document mode** (default) is unchanged.
3. **Web mode** runs a two-call pipeline:
   - A Gemini Google Search grounding call (`_generate_with_search`) receives **only** the student's question wrapped in `UntrustedDataBoundary`. Its generated prose is discarded; only `grounding_chunks` metadata and `search_entry_point` attribution HTML are extracted.
   - Candidate `https` URLs (port `443` only, capped at `WEB_GROUNDING_MAX_SOURCES=5`) are fetched server-side through an SSRF-safe `httpx` client (`_PublicDNSBackend`) that verifies every resolved DNS record is globally routable (blocking private, loopback, link-local/metadata, CGNAT, IPv6 site-local, and IPv4-mapped private ranges), connects directly to the verified IP to eliminate TOCTOU DNS rebinding, enforces a 4-hop manual redirect cap and 512 KB streaming byte limit, and extracts bounded visible text (`<= 4,000` chars) into a `w_01..w_05` source registry.
   - A second structured `ConversationAnswer` call (`generation_path="web"`) receives only `w_XX` sources wrapped in `UntrustedDataBoundary`. Model-authored URLs, markdown links, and citation markers are stripped; cross-provenance and unknown IDs are rejected; `evaluate_citations` verifies every claim against the fetched page excerpt; and `filter_unsupported_claims` fails closed to `INSUFFICIENT_EVIDENCE` when support is absent.
4. **Hybrid mode** runs the strict document path (`e_XX`) first and the verified web path (`w_XX`) second, validates each independently, offsets web citation indices after the highest cited document index, and renders separate **"From your document"** and **"From the web"** sections. Explicit document-only requests never trigger a web search or consume daily web quota.
5. **Persistence, attribution, and limits:** Web citations persist as `ai_message_citations` rows (`source_type="web"`, validated `https` URL, sanitized title, and `<= 500`-char excerpt; display domain is derived on read). Google Search attribution HTML is sanitized with an allowlist HTML serializer (`sanitize_search_attribution_html`) and rendered client-side inside `<iframe sandbox="" referrerPolicy="no-referrer" srcDoc={...} />`. `GET /api/ai/capabilities` reports flag availability, and `WEB_GROUNDING_DAILY_LIMIT` (default `30` turns/user/UTC day, counted from `ai_messages` with a PostgreSQL per-user transaction advisory lock at commit time) returns HTTP 429 when reached.

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
