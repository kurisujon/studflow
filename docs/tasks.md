# Studflow Execution Checklist

This file tracks the current implementation state and the next practical work to ship.

Read it alongside:

1. `docs/GUARDRAILS.md`
2. `docs/architecture.md`
3. `docs/agents.md`
4. `docs/roadmap.md`

## Implemented Foundation

### Frontend
- [x] Next.js App Router project with TypeScript, TailwindCSS, and shadcn/ui patterns
- [x] Clerk authentication and route protection
- [x] Homepage, upload flow, dashboard, and study workspace routes
- [x] Dashboard document listing
- [x] Processing-status polling and upload completion flow

### Backend
- [x] FastAPI application bootstrapped and routed from `backend/main.py`
- [x] PostgreSQL-backed persistence with SQLModel and Alembic
- [x] Redis and Celery async document processing
- [x] Supabase Storage upload and download pipeline
- [x] PDF/DOCX extraction and chunking

### AI Study Flow
- [x] Gemini integration with structured schema validation
- [x] Summary generation
- [x] Flashcard generation
- [x] Quiz generation
- [x] Study payload persistence and retrieval

### Study Workspace
- [x] Summary tab
- [x] Interactive flashcard UI
- [x] Multiple-choice quiz UI with instant scoring
- [x] Annotations and highlights
- [x] Notes and note restore/delete flow
- [x] AI explain-selection flow
- [x] AI history
- [x] Related learning videos
- [x] Theme settings

## Current Priority

### Active Learning Hubs (Global Study Center)

Goal: Evolve the global sidebar pages (Flashcards and Quizzes) from static, redundant lists into dynamic, spaced-repetition and mixed-practice hubs.

#### Backend: Spaced Repetition & Mixed Practice
- [ ] Add SRS (Spaced Repetition System) fields to the Flashcard model (`interval`, `repetition`, `easiness_factor`, `next_review_date`)
- [ ] Create `GET /api/study/flashcards/due` endpoint to fetch global flashcards due for review across all documents
- [ ] Create `POST /api/study/flashcards/{id}/review` endpoint to update SRS stats based on user rating (Again, Hard, Good, Easy)
- [ ] Create `GET /api/study/quizzes/mixed` endpoint to generate a cross-document quiz (prioritizing weakest topics from past attempts)

#### Frontend: Daily Review & Challenge Mode
- [ ] Redesign `/dashboard/flashcards/page.tsx` into a Daily Review Hub (showing cards due today)
- [ ] Implement SRS review interface (flashcard flipper with rating buttons: Again, Hard, Good, Easy)
- [ ] Redesign `/dashboard/quizzes/page.tsx` into a Challenge Mode Hub
- [ ] Implement multi-document mixed quiz UI leveraging the weakest-topic history

### Study Workspace UI Refinement

Goal: make Studflow feel calmer, more editorial, and more focused for long-form reading before adding new backend scope.

#### Reading Surface
- [x] Constrain summary reading width so long-form content feels document-like instead of dashboard-wide
- [x] Define a dedicated typography scale for study content: headings, section labels, paragraph text, terms, and helper copy
- [x] Reduce visual noise in the study workspace background and keep the reading surface visually primary
- [x] Standardize spacing between topic sections, notes, AI panels, and related-video areas

#### Workspace Hierarchy
- [x] Make the summary pane the main visual anchor of the study screen
- [x] Demote secondary tools so notes, AI, and videos support reading instead of competing with it
- [x] Standardize meta labels, tab labels, empty states, and utility actions across the workspace
- [x] Review mobile behavior so side panels and tool surfaces collapse cleanly without clutter

#### Interaction Polish
- [x] Add a focused reading mode that reduces non-essential chrome while studying
- [x] Tighten hover, focus, and selected states for annotations, tabs, and study controls
- [x] Ensure transitions stay subtle and purposeful inside the study workspace
- [x] Audit keyboard interaction affordances so shortcuts still feel intentional after layout cleanup

#### Component Cleanup
- [x] Replace repeated inline visual patterns with reusable workspace presentation primitives where practical
- [x] Align summary, flashcard, and quiz containers to one visual system
- [x] Keep homepage styling decisions from leaking into the actual study-reading experience

#### Validation
- [ ] Verify desktop reading comfort on long summaries
- [ ] Verify mobile layout for `/dashboard/study/[id]`
- [x] Confirm no backend API contract changes are introduced by UI refinement
- [x] Run frontend lint/validation after each meaningful UI batch

## Next Features After UI

These are intentionally sequenced after the UI refinement workstream:

- [x] Save AI answer as flashcard
- [x] Quiz attempt history with weak-topic review
- [x] Document-level Q&A grounded in extracted document chunks

## Explicit Non-Goals For This Workstream

- [ ] Do not turn Studflow into a general-purpose AI toolbox
- [ ] Do not add image, voice, slide, or generic writing tools
- [ ] Do not broaden upload contracts beyond PDF and DOCX without explicit approval
- [ ] Do not introduce new dependencies or architecture layers without explicit approval

## Recent Frontend Enhancement

### Homepage and Dashboard Enhancement

- [x] Enhance homepage hero with a more product-like upload preview
- [x] Add animated `Upload -> Generate -> Study` workflow section using the current motion stack
- [x] Upgrade homepage feature cards into a stronger bento-style layout
- [x] Add floating study icons around the hero section
- [x] Add staged motion to the study workspace preview section
- [x] Add a richer homepage dashboard preview section
- [x] Improve dashboard empty state with clearer upload guidance
- [x] Add useful dashboard summary widgets without changing backend contracts
