# Studflow Roadmap and Handoff

Last updated: 2026-08-13

## Purpose

This document is the fastest way for a new agent to understand:

- what Studflow currently does
- what has actually been implemented in code
- what is currently in progress
- which existing docs are still valid
- what should happen next

Use this as the working snapshot of the repository state. For architecture and guardrails, the original docs still apply unless this file explicitly calls out a mismatch.

## Required Reading Order

Before making changes, read these in order:

1. `docs/GUARDRAILS.md`
2. `docs/architecture.md`
3. `docs/tasks.md`
4. `docs/agents.md`
5. `docs/roadmap.md`

Important note:

- `docs/tasks.md` now acts as the actionable execution checklist.
- This file remains the higher-level implementation snapshot and handoff document.
- If `docs/tasks.md` and the repo diverge again, update both together.

## Product Snapshot

Studflow is a monorepo with:

- `frontend/`: Next.js App Router app with TypeScript, Tailwind, shadcn/ui patterns, and Clerk auth
- `backend/`: FastAPI app with SQLModel, Alembic, Celery, Redis, Gemini integration, Supabase Storage, and YouTube enrichment
- `docs/`: product, architecture, guardrails, and process documentation

Core user flow currently implemented:

1. User signs in with Clerk.
2. User uploads a PDF or DOCX.
3. Backend stores the file and creates a document record.
4. Celery processes the document asynchronously.
5. Gemini generates summary, flashcards, and quiz content.
6. User can open the dashboard and study workspace.
7. Study workspace supports summary reading, flashcards, quiz, annotations, notes, AI explain, AI history, and related videos.
8. The study assistant supports persistent, document-grounded conversations with structured citations and canonical message history.

## Current System State

### Frontend

Current user-facing routes:

- `/`: homepage
- `/sign-in`
- `/sign-up`
- `/upload`
- `/dashboard`
- `/dashboard/study/[id]`
- `/dashboard/upload`

Current frontend status:

- Clerk auth is wired in and route protection is active in `frontend/proxy.ts`.
- `/dashboard/*` and `/upload/*` are protected.
- The real upload flow lives at `/upload`.
- `/dashboard/upload` is currently a lightweight redirect alias to `/upload`.
- Dashboard fetches user-owned documents from the backend.
- Study workspace loads a specific processed document and supports tab navigation for summary, flashcards, and quiz.
- The summary view is not a static text block; it uses the interactive study components already present under `frontend/components/study/`.
- The AI study panel loads and persists document-scoped conversations, supports conversation switching and backward history pagination, and renders structured source citations.

### Backend

Current backend status:

- FastAPI app boots from `backend/main.py`.
- File upload endpoint exists at `POST /api/upload`.
- Document endpoints exist for:
  - document list
  - processing status
  - study payload
  - extracted chunks
  - related videos
  - annotations
  - notes
  - AI history
  - AI explanation for selected content
- Persistent conversation CRUD, message history, and synchronous document-grounded messaging are mounted under `/api/ai`.
- Celery task `process_document_task` handles:
  - storage download
  - PDF/DOCX text extraction
  - chunking
  - summary generation
  - flashcard generation
  - quiz generation
  - optional related video enrichment
  - final document status updates

## Implemented Features vs Original Plan

The original docs describe a clean Phase 1 to Phase 4 progression. The repo has already progressed beyond that checklist.

Implemented or substantially present in code:

- authentication
- upload flow
- async document processing
- dashboard document listing
- study workspace
- summary, flashcards, and quiz
- annotations and notes
- AI history
- AI explain-selection flow
- related videos
- theme settings

Current emphasis in `docs/tasks.md`:

- finish the outstanding responsive validation for the widened summary shell
- extend the persistent conversational assistant in controlled phases
- add page-aware extraction and controlled reindexing before exposing page labels
- preserve the current upload, authentication, and document-only conversation contracts until an explicit later phase changes them

## Current Priority Workstream

### Persistent Conversational Assistant — Later Phases

Current product state:
- Phase 1 conversation persistence and backend contracts are complete.
- Phase 2 persistent conversation UI is complete.
- The next implementation phase is page-aware PDF chunking with controlled legacy-document reindexing.
- Verified web grounding follows page-aware extraction; authenticated streaming remains last in the current sequence.

Workstream constraints:
- Do not display page labels until page-aware extraction and controlled reindexing are implemented.
- Do not expose web or hybrid retrieval modes until grounding is verified.
- Keep the existing synchronous, document-only conversation contract stable while later phases are added.
- Preserve the legacy Ask AI and AI History endpoints during the compatibility rollout.

### Residual Study Workspace Validation

The UI refinement implementation is complete, but one validation item remains unchecked in `docs/tasks.md`:

- re-verify the widened summary shell at 1440px, 1024px, 768px, and 390px after the 2026-08-01 container adjustment

This validation should be completed before claiming the study-workspace refinement workstream fully closed. It does not require an API or backend contract change.

## Latest Completed Update

### Persistent Conversation Interface (2026-08-02)

- The AI study panel now uses durable, document-scoped conversation history instead of isolated report cards.
- Users can create and switch conversations, page backward through canonical history, and send selected highlight or note context.
- Answers render safe formatted content, verified structured citations, follow-up prompts, and copy, retry, and save-as-flashcard actions.
- The interface remains synchronous and document-only, preserving legacy Ask AI and AI History compatibility.

### Earlier Completed Work: Phase 4 Semantic RAG Infrastructure

- PostgreSQL now runs with pgvector support through the `pgvector/pgvector:pg16` Compose image.
- Alembic migration `20260722_0001` enables the extension, adds 768-dimension chunk embeddings,
  creates a cosine-distance index, and adds granular durable pipeline statuses.
- The Celery pipeline now checkpoints extraction, chunking, embeddings, analysis, generation, and
  validation. Retries resume from persisted chunks and only embed chunks still missing vectors.
- Long-document synthesis groups embedded chunks into bounded semantic clusters, then performs
  hierarchical summary synthesis before generating flashcards and quizzes from the resulting guide.
- Document Ask AI now embeds the question, retrieves the nearest five chunk vectors with pgvector
  cosine distance, and only sends that grounded context to Gemini.
- Deterministic quality checks run after Pydantic validation, and `backend/test_phase4_rag.py`
  covers vector query compilation, semantic clustering, resumable embedding checkpoints, and the
  quality gate.

Other previously implemented changes:

- New dedicated homepage motion components were added in `frontend/components/home/`:
  - `FloatingStudyIcons.tsx`
  - `AnimatedWorkflowLine.tsx`
  - `AnimatedHeroUploadCard.tsx`
  - `AnimatedStudyPreview.tsx`
  - `icon-registry.tsx`
- Homepage landing page was enhanced in `frontend/app/page.tsx` with:
  - stronger product hero upload preview
  - animated `Upload -> Generate -> Study` workflow section
  - richer bento-style feature layout
  - upgraded study-workspace preview
  - dashboard preview strip
- Dashboard page was enhanced in `frontend/app/dashboard/page.tsx` with:
  - top-level summary widgets
  - clearer empty state with upload CTAs
- Grounded document-level Q&A was added through:
  - `backend/services/ai_service.py`
  - `backend/api/routes/documents.py`
- Frontend document-Q&A integration was added in:
  - `frontend/lib/api/annotations.ts`
  - `frontend/components/study/AIStudyAssistantPanel.tsx`
  - `frontend/components/study/StudySidePanel.tsx`
- Quiz attempt history and weak-topic review were added through:
  - `backend/models/tables.py`
  - `backend/api/routes/documents.py`
  - `backend/alembic/versions/20260614_0001_add_quiz_attempts.py`
- Frontend quiz-attempt integration was added in:
  - `frontend/lib/api/quiz-attempts.ts`
  - `frontend/components/quiz-study.tsx`
  - `frontend/components/study/StudyWorkspace.tsx`
- Suggested AI answers can now be saved into the document flashcard set through a new backend flashcard-create path:
  - `backend/api/routes/documents.py`
  - `backend/services/documents.py`
- Frontend flashcard-save integration was added in:
  - `frontend/lib/api/flashcards.ts`
  - `frontend/components/study/AIStudyAssistantPanel.tsx`
- Mobile study side-panel behavior was adapted toward bottom-sheet presentation in `frontend/components/study/StudySidePanel.tsx`.
- Annotation note markers were made keyboard-focusable in `frontend/components/study/AnnotatableTextBlock.tsx`.
- Shared interaction helpers for pills, cards, annotation states, and mobile workspace controls were added in `frontend/app/globals.css`.
- Shortcut helper copy and `aria-keyshortcuts` hints were added across study views in:
  - `frontend/components/study/StudyWorkspace.tsx`
  - `frontend/components/flashcard-study.tsx`
  - `frontend/components/quiz-study.tsx`
- Notes, related videos, quiz options, and AI history cards were given more consistent interaction styling in:
  - `frontend/components/study/NotesPanel.tsx`
  - `frontend/components/study/RelatedLearningVideos.tsx`
  - `frontend/components/quiz-study.tsx`
  - `frontend/components/study/AIStudyAssistantPanel.tsx`
- Flashcard and quiz views were visually aligned to the same study shell system in:
  - `frontend/components/flashcard-study.tsx`
  - `frontend/components/quiz-study.tsx`
- Shared study typography and utility classes were expanded in `frontend/app/globals.css`.
- AI assistant panel surfaces, labels, empty states, and action pills were visually normalized in `frontend/components/study/AIStudyAssistantPanel.tsx`.
- Study tab controls were aligned with the shared pill system in `frontend/components/study/StudyWorkspace.tsx`.
- Study workspace summary tab was visually rebalanced around reading-first layout in `frontend/components/study/InteractiveSummaryReader.tsx`.
- Focused reading mode was added to the summary workspace in `frontend/components/study/InteractiveSummaryReader.tsx`.
- Summary-tab shell styling was separated from flashcard and quiz shells in `frontend/components/study/StudyWorkspace.tsx`.
- Study page background and header tone were softened in `frontend/app/dashboard/study/[id]/page.tsx`.
- Reusable study workspace presentation classes were added in `frontend/app/globals.css`.
- Study side panel and floating study-tools button were visually toned down in:
  - `frontend/components/study/StudySidePanel.tsx`
  - `frontend/components/study/FloatingNotesButton.tsx`
- Related videos were repositioned as a secondary support surface in `frontend/components/study/RelatedLearningVideos.tsx`.
- Summary Overview, Detailed Topic, and Further Study now share a 1080px outer shell while their long-form prose uses a centered, justified 88ch reading measure.
- Further Study uses a deterministic two-column desktop layout that collapses to one column on screens at or below 768px.
- Notes panel typography was slightly refined in `frontend/components/study/NotesPanel.tsx`.
- Homepage upload card added to the hero section in `frontend/app/page.tsx`.
- New alias route added at `frontend/app/dashboard/upload/page.tsx`.
- Supported file type badges added below the homepage hero section in `frontend/app/page.tsx`.
- Feature grid section added to the homepage in `frontend/app/page.tsx`.
- `How Studflow works` section added to the homepage in `frontend/app/page.tsx`.
- Static study workspace preview section added to the homepage in `frontend/app/page.tsx`.
- FAQ section added to the homepage in `frontend/app/page.tsx`.
- Landing page layout isolation and CSS override resolution completed:
  - Created dedicated route group `frontend/app/(landing)/layout.tsx` with Google Font `Manrope` integration, cleanly bypassing dashboard navbar and ghost top-padding.
  - Created dedicated route group `frontend/app/(app)/layout.tsx` for dashboard, upload, and auth routes.
  - Removed destructive `!important` padding rules and scoped global element transitions in `frontend/app/globals.css`.
  - Rebuilt landing sections (`HeroSection`, `FeaturesSection`, `HowItWorksSection`, `BenefitsSection`, `FAQSection`, `CTASection`, `ComparisonSection`, `LandingFooter`) with unified design system styling (`max-w-[1400px]`, `rounded-[24px]/[32px]`, `#0F172A`/`#475569` text, soft indigo drop shadows).

Behavior of those changes:

- The hero now feels more alive through floating study icons and animated product-state previews instead of static blocks only.
- The workflow section now explains the upload-to-study path more clearly with motion tied to the product flow.
- The workspace preview now stages summary, note, AI, and related-video elements more intentionally.
- The homepage now feels more alive through product-based motion instead of generic decorative animation.
- The upload flow, generated outputs, and study workflow are more legible on the landing page.
- The feature section now reads more like a product capability system than a flat card grid.
- The dashboard now gives stronger guidance when empty and more useful at-a-glance information when populated.
- The AI panel can now answer questions about the full uploaded document even when no text is selected.
- Document-level answers are grounded in extracted document chunks and return supporting chunk references to show where the answer came from.
- Grounded document answers still flow through the existing AI panel and history experience instead of creating a separate chat surface.
- Completed quiz runs are now persisted as attempt history with score, total questions, and incorrect question IDs.
- The quiz results screen now shows recent attempts and a weak-topic review section listing the missed questions from the current run.
- Users can now retry only the incorrect questions from the current attempt or from saved attempt history without leaving the quiz flow.
- The AI panel now exposes a `Save as Flashcard` action using the suggested flashcard already returned by the explain-selection flow.
- Saving a suggested flashcard appends it to the current document’s flashcard set instead of introducing a separate custom-flashcard model.
- After saving, the study route refreshes so the flashcard becomes part of the existing flashcards tab data.
- The study side panel now behaves more naturally on narrow screens instead of remaining a strict desktop side drawer.
- Notes embedded in annotated text are now keyboard-accessible, not mouse-only.
- Hover, focus, and selected states are more consistent across annotation-linked UI, quiz choices, notes, related videos, and study controls.
- Study shortcuts are now surfaced more explicitly inside the workspace instead of being purely hidden behavior.
- Flashcards, quiz, and summary now share a closer visual system instead of feeling like separate study tools.
- Empty states, meta labels, and primary utility controls are more consistent across the workspace.
- The AI assistant panel now better matches the newer study workspace surfaces and typography.
- The summary tab now uses a narrower, calmer reading surface instead of sharing the same heavy shell styling as the other study tabs.
- The study workspace now includes a `Focused Reading` toggle that hides overview and related-video support content while preserving notes and AI access through the floating button.
- Related videos are still available, but they now appear after the main reading flow as secondary support material.
- The notes/AI side panel remains functionally the same, but uses lighter visual treatment and less intrusive placement.
- The homepage now shows a large upload card with:
  - upload icon
  - `Drop your study file here`
  - `PDF and DOCX supported`
  - `Choose file`
- Clicking the card routes to `/dashboard/upload`.
- `/dashboard/upload` redirects to `/upload`.
- Because `/dashboard/*` is protected, unauthenticated users should be sent through the existing Clerk auth flow before reaching upload.
- A supported file types row now appears below the hero with:
  - active badges for `PDF` and `DOCX`
  - disabled `PPT soon` and `TXT soon` badges
  - helper text: `Supports PDF and DOCX. More formats coming soon.`
- A feature grid section now appears on the homepage with six cards:
  - `Concise Summary`
  - `Flashcards`
  - `Quiz`
  - `Smart Notes`
  - `Ask AI`
  - `Related Videos`
- A `How Studflow works` section now appears on the homepage with three steps:
  - `Upload your file`
  - `Let AI process it`
  - `Review actively`
- A static study workspace preview section now appears on the homepage showing:
  - summary content
  - a highlighted phrase
  - a note marker
  - an AI bubble
  - a related video card
  - flashcard and quiz indicators
- A FAQ section now appears on the homepage with five product-accurate cards covering:
  - supported file types
  - study expectations
  - AI questions
  - embedded related videos
  - saved notes, highlights, and underlines
- A final CTA section now appears at the bottom of the homepage with:
  - `Start Studying` linking to `/dashboard/upload`
  - `Go to Dashboard` linking to `/dashboard`
  - the existing auth behavior preserved through protected routes
- No backend upload logic was changed.

Reason for the alias:

- Existing upload implementation already lives at `/upload`.
- The landing page requirement asked for `/dashboard/upload`.
- The alias preserves the current upload contract and avoids duplicating or moving upload logic.

## Landing Page Workstream Status

Requested landing page items:

- [x] 1. Homepage upload card
- [x] 2. Supported file type badges
- [x] 3. Feature grid
- [x] 4. How it works
- [x] 5. Study workspace preview
- [x] 6. FAQ
- [x] 7. Final CTA

Current guidance for this workstream:

- Keep changes inside the frontend unless explicitly requested otherwise.
- Do not redesign the entire app.
- Do not change backend logic for marketing-page work.
- Preserve current auth and upload behavior.
- Stay minimalist and consistent with the existing visual language.

Homepage and dashboard enhancement guidance now completed:

- use existing stack only: shadcn-style patterns, Tailwind, Lucide-style iconography, and Motion
- avoid heavy animation libraries
- avoid fake testimonials, fake social proof, and generic AI landing-page tropes
- prefer product previews and useful widgets over decorative effects
- keep motion tied to product states such as upload, processing, study, notes, and review

Study-workspace UI refinement status:

- completed:
  - constrained summary reading width
  - defined a shared study typography and utility system
  - reduced summary-tab visual noise
  - restored the summary pane as the primary visual anchor
  - added focused reading mode
  - introduced reusable study surface/meta-label classes
  - aligned summary, flashcards, and quiz into a closer visual system
  - normalized empty states and study utility pills
  - refined spacing between the major study surfaces
  - improved mobile panel behavior
  - tightened hover, focus, and keyboard affordances
- still pending:
  - responsive revalidation of the widened summary shell at 1440px, 1024px, 768px, and 390px

## Important Contracts and Constraints

Future agents should not silently change these without explicit approval:

- Supported upload file types: PDF and DOCX only
- Main upload flow implementation: `/upload`
- Homepage upload entry path: `/dashboard/upload` alias is now part of the current frontend behavior
- Auth provider: Clerk
- Frontend stack: Next.js App Router + TypeScript + Tailwind + `tw-animate-css` (animation utilities) + `@base-ui/react` (button primitive) + `canvas-confetti` (quiz delight)
- Backend stack: FastAPI + Celery + Redis + SQLModel + Alembic
- Storage/AI integrations: Supabase Storage, Gemini, YouTube enrichment

## Known Documentation Gaps

These are the main mismatches a new agent should know immediately:

- architecture docs still describe the original high-level system, not every implemented study-workspace capability
- this file is still the main repo-reality handoff document for active workstreams

## Working Tree Status

Do not use this file as a substitute for checking git status directly.

- inspect the working tree before editing
- assume user changes are intentional unless they directly conflict with the requested task

## Recommended Next Steps

If continuing the landing page work:

1. Treat the homepage landing-page scope as complete unless the user asks for refinement.
2. Keep upload-entry routing aligned with `/dashboard/upload` and the existing auth flow.
3. Avoid coupling homepage marketing work to backend or study-workspace refactors.
4. If new sections are requested, update this roadmap after each meaningful change.

If continuing core product work instead:

1. Complete the outstanding widened-summary-shell validation at 1440px, 1024px, 768px, and 390px.
2. Add page-aware PDF chunking and controlled legacy-document reindexing before displaying page labels.
3. Add verified Google Search grounding with document, web, and hybrid modes.
4. Add authenticated streaming only after the synchronous contract remains stable through those phases.

## Validation Notes

Validation completed for the latest homepage change:

- route structure reviewed
- auth protection path reviewed
- backend untouched for the upload-card change
- feature grid content and icon mapping reviewed
- how-it-works copy and step order reviewed
- workspace preview remains static and does not connect to real study data
- FAQ answers reviewed against the implemented AI, notes, annotations, and related-video flows
- final CTA links reviewed against the protected `/dashboard` and `/dashboard/upload` routes

Validation not fully completed:

- local eslint execution timed out in this environment, so lint was inconclusive during the last homepage update

## Documentation Update

Latest documentation update completed on 2026-08-13:

- `docs/tasks.md` now distinguishes recently completed workstreams from the current persistent-assistant workstream.
- this roadmap now reflects the completed Active Learning Hubs, study-workspace implementation, and persistent conversation Phase 2 work.
- the outstanding responsive viewport validation and later conversation phases remain explicitly unchecked.
- no code contracts changed as part of this documentation update.

Latest product update completed on 2026-08-02:

- persistent conversation Phase 2 shipped in the frontend against the synchronous, document-only Phase 1 API
- conversation selection, new-chat creation, canonical history, structured citations, and contextual messaging are implemented
- legacy Ask AI and AI History compatibility remains available
- later page-aware extraction, verified web grounding, and authenticated streaming remain unchecked in `docs/tasks.md`

Validation completed for the latest study-workspace UI batches:

- `git diff --check` passed
- frontend production build completed successfully with `npm run build`
- backend route/service compile check passed with `python3 -m py_compile`

Validation completed for the quiz-attempt feature:

- `git diff --check` passed
- backend syntax check passed with `python3 -m py_compile`
- frontend TypeScript check passed with `tsc --noEmit`

Validation note:

- a full frontend production build was started and reached successful compile/TypeScript stages before being interrupted once the narrower typecheck had already passed

Validation completed for the grounded document-Q&A feature:

- `git diff --check` passed
- backend syntax check passed with `python3 -m py_compile`
- frontend TypeScript check passed with `tsc --noEmit`

Validation completed for the homepage and dashboard enhancement:

- `git diff --check` passed
- frontend TypeScript check passed with `tsc --noEmit`
- targeted ESLint check passed for `frontend/app/page.tsx` and `frontend/app/dashboard/page.tsx`
- targeted ESLint check passed for the new `frontend/components/home/*` motion components

## Validation still not fully completed:

- The widened summary shell still needs fresh verification at 1440px, 1024px, 768px, and 390px after the 2026-08-01 container adjustment.

## Handoff Rule

When a future agent completes a meaningful feature, they should update this file with:

- the date
- what changed
- whether contracts changed
- whether docs became stale
- what the next agent should do next

---

### Update: 2026-07-10
**What Changed:**
- Phase 3 was successfully completed. Created the `UserPreferences` DB model and `/api/user/preferences`, `/api/user/stats`, and `/api/user/queue` backend endpoints.
- Removed mock data on the dashboard and connected real-time user stats and queue functionality to `/dashboard/page.tsx`.
- Created `/dashboard/settings` UI page allowing users to tweak their SRS algorithm aggressiveness and daily study goals.
- Fixed a Legacy Authentication bug where `study.py` queried with `user_id` instead of `clerk_user_id`, causing a Server Error.
- Completed the UI Refinement workstream. Added responsive tailwind layouts and `max-w-[70ch]` constraints for mobile optimization and desktop reading comfort.

**Contracts Changed:**
- Replaced backend queries using `Document.user_id` and `UserPreferences.id` with `clerk_user_id` to match the Clerk Auth system.

**Docs Stale:**
- No. `docs/tasks.md` was checked off, leaving 0 pending tasks on the original roadmap.

**What to do next:**
- Wait for user direction to define the goals of Phase 4 (e.g. Gamification, YouTube Processing, or Multi-Document AI Chat).

---

### Update: 2026-07-18
**What Changed:**
- Completely redesigned the Landing Page (`/`) to adhere strictly to the StudFlow brand identity (Primary Blue, Indigo, Purple, clean UI).
- Implemented `Inter` font in `layout.tsx` for modern SaaS typography.
- Replaced the landing page sections with responsive, animated versions using `framer-motion`: `HeroSection`, `LandingNavbar`, `FeaturesSection`, `HowItWorksSection`, `BenefitsSection`, `FAQSection`, and `LandingFooter`.
- Resolved `lucide-react` typing errors by safely ignoring mismatched types or replacing with standard SVG icons where needed.
- Re-built successfully without TS errors.

**Contracts Changed:**
- None. Backend and API contracts remain untouched. Authentication flow remains the same.

**Docs Stale:**
- No. 

**What to do next:**
- Proceed with Phase 4 feature requests or any further user refinements on the Workspace UI.

---

### Update: 2026-07-22
**What Changed:**
- Updated [GUARDRAILS.md](file:///mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/studflow/docs/GUARDRAILS.md) to explicitly permit **Embeddings** (now using Gemini `gemini-embedding-2`), **Vector Databases** (via PostgreSQL `pgvector`), **Semantic RAG**, and **Agent Orchestration** (Celery multi-step agent pipeline) to support large 100+ page document uploads.
- Updated [tasks.md](file:///mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/studflow/docs/tasks.md) with the **Phase 4 Execution Checklist**: `pgvector` migration, vector chunk storage, embedding generation pipeline, Celery-native agent orchestrator (Analysis Agent → RAG Retrieval Agent → Synthesis & QC Agent), semantic RAG Q&A retrieval, and Celery task timeout tuning for long-document processing.

**Contracts Changed:**
- None yet (Documentation & Architectural Governance updated).

**Docs Stale:**
- No.

**What to do next:**
- Implement Phase 4 starting with PostgreSQL `pgvector` migration and embedding generation service in the backend.

---

### Update: 2026-08-01
**What Changed:**
- Rebalanced the summary workspace around a shared 1080px content shell for Overall Overview, Detailed Topic, topic navigation, and Further Study.
- Preserved a centered 88ch measure inside the Overview and Detailed Topic surfaces, with justified paragraph and list copy for balanced use of the wider cards.
- Standardized Further Study to two columns on desktop and one column on mobile, with content-driven card and section heights.

**Contracts Changed:**
- None. This update changes presentation only and preserves existing study data and interaction APIs.

**Docs Stale:**
- No. The study-workspace layout guidance and validation checklist were updated with the current container behavior.

**What to do next:**
- Complete the pending responsive viewport validation before beginning the conversational AI workstream.

---

### Update: 2026-08-01 — Persistent Conversation Foundation
**What Changed:**
- Added additive persistence for Clerk-owned AI conversations, ordered user/assistant messages, and structured citations.
- Added document-only conversation CRUD, message-history, and synchronous send endpoints under `/api/ai`.
- Conversation answers reuse pgvector document retrieval, bounded recent history, and `gemini-embedding-2` query embeddings.
- Successful turns persist the user message, assistant answer, and real document-chunk citations in one commit after generation.
- Added conversation cleanup to terminal document deletion and backend unittest discovery to CI.

**Contracts Changed:**
- New additive `/api/ai/conversations` contracts and three database tables were introduced.
- Existing Ask AI, explain-selection, and AI History contracts remain unchanged for compatibility.

**Docs Stale:**
- No. Architecture, task, design, and CI/CD documentation describe the Phase 1 boundary.

**What to do next:**
- Build the persistent conversational frontend against the new synchronous document-only API.
- Do not display page numbers until page-aware extraction and controlled reindexing ship.

---

### Update: 2026-08-02 — Persistent Conversation Interface
**What Changed:**
- Replaced the report-style AI panel with persistent user and assistant messages backed by the Phase 1 conversation API.
- Added latest-conversation loading, explicit New chat creation, conversation switching, canonical history refresh, and scroll-preserving older-message pagination.
- Added selected-highlight and note context to document retrieval and persisted user turns while keeping citations restricted to verified retrieved chunks.
- Added safe formatted-answer rendering, structured source cards, suggested follow-ups, copy, save-as-flashcard, stop/reload/retry states, and a sticky composer within one internal message scroll region.
- Added responsive and accessible tab, launcher, keyboard-composer, status, and panel behavior without introducing a frontend dependency.

**Contracts Changed:**
- The synchronous send-message request now accepts optional `selected_text` (trimmed and limited to 8,000 characters).
- Existing response payloads, legacy Ask AI/AI History endpoints, authentication, and document-only retrieval mode remain compatible.

**Docs Stale:**
- No. Architecture, task, roadmap, and design documentation describe the Phase 2 boundary.

**What to do next:**
- Add page-aware extraction and controlled reindexing before displaying document page labels.
- Add verified web grounding before exposing web or hybrid retrieval modes.

---

### Update: 2026-08-13 — Status Documentation Sync

**What Changed:**
- Reclassified Active Learning Hubs and the study-workspace refinement under completed implementation and residual validation in `docs/tasks.md`.
- Updated the current roadmap priority to the persistent conversational assistant's later phases while preserving the outstanding widened-summary-shell viewport validation.
- Updated the product snapshot, latest-completed summary, recommended next steps, validation limitations, and roadmap date to match the verified implementation and checklist.

**Contracts Changed:**
- None. Documentation only.

**Docs Stale:**
- No known status-document mismatch remains between `docs/tasks.md` and `docs/roadmap.md`.

**What to do next:**
- Re-verify the widened summary shell at 1440px, 1024px, 768px, and 390px.
- Then add page-aware PDF chunking and controlled legacy-document reindexing before displaying page labels.

---

### Update: 2026-08-13 — Legacy Chat Index Repair

**What Changed:**
- Added complete-index readiness checks before query embedding so partially indexed completed documents cannot enter grounded chat with incomplete evidence.
- Added a concurrency-safe, batched, embedding-only Celery repair for eligible completed legacy documents; repair success, retry, failure, and no-op paths preserve completed status and existing summaries, flashcards, quizzes, videos, and other study data.
- Updated the chat route to queue targeted repair and distinguish index preparation, zero extracted chunks, and queue failure; the frontend retains the draft and requires an explicit manual retry without an ungrounded fallback or automatic repeat POST.
- Validation evidence: targeted backend tests 28 PASS; full backend tests 48 PASS; scoped Python compile and FastAPI import PASS; frontend lint PASS with 5 pre-existing unrelated warnings; frontend production build PASS; diff check PASS. Independent review found no Critical or High issues and recorded one Medium gap for live PostgreSQL, Redis, Celery, and authenticated-chat integration.

**Contracts Changed:**
- No API schema or endpoint changed. Existing error behavior now distinguishes repair preparation, zero-chunk documents, and repair queue failure.

**Docs Stale:**
- No known documentation mismatch remains after this update.

**What to do next:**
- Deploy the API, Celery worker, and frontend together.
- Exercise a real PostgreSQL/Redis/Celery embedding repair and authenticated chat retry against an affected completed document.
- Verify every eligible completed document chunk has an embedding after repair. Page-aware extraction and controlled reindexing remain separate, incomplete later-phase work.

---

### Update: 2026-08-13 — Chat Panel Scroll Containment

**What Changed:**
- Updated `frontend/app/globals.css` so the study assistant shell has definite viewport-bounded heights on desktop and mobile, restoring the existing internal message scroller and persistent composer layout contract for long conversations.
- Validation evidence: TypeScript validation PASS; frontend lint PASS with 5 pre-existing unrelated warnings; frontend production build PASS; diff check PASS. Live authenticated visual testing was NOT RUN.

**Contracts Changed:**
- None.

**Docs Stale:**
- No.

**What to do next:**
- Deploy and authenticate-test a long assistant response at desktop, mobile, and short viewport heights, confirming the message history scrolls while the composer remains visible.

---
