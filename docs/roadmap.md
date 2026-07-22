# Studflow Roadmap and Handoff

Last updated: 2026-06-11

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

- UI refinement before new backend feature expansion
- preserving the current upload and study contracts
- improving the study workspace reading experience without widening product scope

## Current Priority Workstream

### Active Learning Hubs (Global Study Center)

Current product decision:
- Evolve the global sidebar pages (Flashcards and Quizzes) from static, redundant lists into dynamic, spaced-repetition and mixed-practice hubs.
- Flashcards will become a Daily Review Hub powered by a Spaced Repetition System (SRS).
- Quizzes will become a Challenge Mode Hub that targets a user's weakest topics across all documents.

Workstream constraints:
- Backend needs to support SRS metrics (interval, easiness factor, next review date) on the existing Flashcard model.
- Frontend needs a new Daily Review UI and a Multi-Document Quiz UI.

### Study Workspace UI Refinement

Current product decision:
- prioritize study-workspace UI refinement before starting the next backend-heavy feature
- improve reading comfort, workspace hierarchy, and visual consistency
- keep the work inside the frontend unless a task explicitly requires backend support

Current implementation checklist lives in `docs/tasks.md`, but the active themes are:

- make the summary reader feel more editorial and less dashboard-like
- reduce visual competition between reading, notes, AI, and related videos
- tighten typography, spacing, and component consistency
- add a focused reading mode only if it can be shipped without adding architectural complexity

Workstream constraints:

- do not change API contracts just to support visual changes
- do not redesign the whole product around the homepage
- keep shadcn/ui and Tailwind as the frontend system foundation
- follow the approved design direction defined in `docs/ui-design-direction.md`
- color, motion, and data surfaces are approved — use them purposefully

## Latest Completed Update

Most recent implemented changes:

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

Study-workspace UI refinement progress so far:

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
  - explicit validation passes

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

1. Execute the study-workspace UI refinement checklist in `docs/tasks.md`.
2. Validate desktop and mobile reading comfort before adding new backend scope.
3. After UI refinement, choose the next smallest product win:
   - save AI answer as flashcard
   - quiz attempt history
   - document-level Q&A

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

Latest documentation update completed on 2026-06-11:

- `docs/tasks.md` was rewritten as the current execution checklist
- the next product workstream was made explicit: study-workspace UI refinement
- no code contracts changed as part of this documentation update

Latest product update completed on 2026-06-11:

- homepage and dashboard enhancement pass shipped using the current frontend stack only
- first study-workspace UI refinement batch shipped in the frontend
- second study-workspace UI refinement batch extended the shared visual system to flashcards, quiz, and AI panel
- first post-UI product feature shipped: save AI answer as flashcard
- second post-UI product feature shipped: quiz attempt history with weak-topic review
- third post-UI product feature shipped: grounded document-level Q&A
- no backend contracts changed
- the UI checklist in `docs/tasks.md` was advanced to reflect completed items

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

- NONE. Desktop and mobile reading comfort reviews were completed and deployed.

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
- Updated [GUARDRAILS.md](file:///mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/studflow/docs/GUARDRAILS.md) to explicitly permit **Embeddings** (via Gemini `text-embedding-004`), **Vector Databases** (via PostgreSQL `pgvector`), **Semantic RAG**, and **Agent Orchestration** (Celery multi-step agent pipeline) to support large 100+ page document uploads.
- Updated [tasks.md](file:///mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/studflow/docs/tasks.md) with the **Phase 4 Execution Checklist**: `pgvector` migration, vector chunk storage, embedding generation pipeline, Celery-native agent orchestrator (Analysis Agent → RAG Retrieval Agent → Synthesis & QC Agent), semantic RAG Q&A retrieval, and Celery task timeout tuning for long-document processing.

**Contracts Changed:**
- None yet (Documentation & Architectural Governance updated).

**Docs Stale:**
- No.

**What to do next:**
- Implement Phase 4 starting with PostgreSQL `pgvector` migration and embedding generation service in the backend.


