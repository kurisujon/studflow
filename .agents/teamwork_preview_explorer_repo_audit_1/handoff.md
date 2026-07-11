# Repository Audit Report — Planner/Architect

## 1. Observation

Direct observations from the repository audit:

### A. Application Structure & Configuration
* **Frontend Stack**:
  * Next.js 16.2.6 (App Router), React 19.2.4, TypeScript, TailwindCSS v4 (configured via `@tailwindcss/postcss`), and Clerk authentication (`@clerk/nextjs` v7.4.1).
  * UI component button is built on `@base-ui/react/button` in `frontend/components/ui/button.tsx`.
* **Backend Stack**:
  * FastAPI 0.115.12, SQLModel 0.0.22 / SQLAlchemy 2.0.40, Alembic 1.15.2, Celery 5.5.3, Redis (used as message broker for Celery), PostgreSQL database, and google-genai 1.16.1.
  * Supabase storage client (`supabase` v2.15.3) is used for file operations (upload, download, signed url creation) in `backend/services/storage.py`.
* **Monorepo Organization**:
  * `frontend/app/` contains page routes.
  * `frontend/components/` contains folders: `home/` (hero animations), `study/` (workspace sub-components), `theme/`, `ui/`.
  * `frontend/lib/` contains API clients: `server-api.ts` (for server-side fetches using Clerk server auth token) and `api/` directory (for individual API resource client wrappers).
  * `backend/api/routes/` houses Fast API routers for health, documents, study, upload, and user.
  * `backend/services/` contains modular helper services (e.g. `ai_service.py` for Gemini API generation logic, `study_service.py` for SM-2 spaced repetition calculation).
  * `backend/tasks/document_processing.py` contains the Celery task runner pipeline `process_document_task`.

### B. Current Feature Status
1. **User Authentication**: Implemented and working. Protected routes exist in the Next.js middleware, and backend verification is performed against the Clerk issuer JWKS pool in `backend/core/auth.py`.
2. **Document Upload**: Implemented. Front-end handles file selection and upload to `/api/upload` (`frontend/app/upload/page.tsx`), uploading to Supabase Storage and starting the asynchronous Celery processing pipeline.
3. **Asynchronous PDF/DOCX Processing**: Implemented. The Celery task in `backend/tasks/document_processing.py` downloads files, extracts text (PDF via PyMuPDF, DOCX via docx extractor), chunks the text, and persists it.
4. **AI Generation (Summary, Flashcards, Quizzes)**: Implemented. The AI worker utilizes Gemini models with structured JSON schemas (via Pydantic model schemas) to generate a comprehensive summary, 15 flashcards, and 10 quiz questions.
5. **Interactive Workspace**: Implemented. Next.js router handles query tabs for `summary`, `flashcards`, and `quiz` under `/dashboard/study/[id]`. Annotations (highlights and underlines) and Notes CRUD are fully functional.
6. **AI Follow-up & Explain Selection**: Implemented. Side panels allow students to highlight text and trigger AI simplification, definitions, or custom questions, which are saved in the user's AI history list.
7. **Spaced Repetition System (SRS)**: Implemented. Spaced repetition algorithm (SM-2) calculates reviews on the backend (`backend/services/study_service.py`) and lists them under `/dashboard/flashcards` Daily Review.
8. **Challenge Mode (Mixed Quizzes)**: Implemented. Generates cross-document quiz questions based on weak-topic history (`backend/api/routes/study.py`: `/api/study/quizzes/mixed`).
9. **User Stats and Preference Settings**: Partial. Streaks, document counts, and queues are fetched correctly. However, saving preferences is broken.

### C. Specific Bugs & Technical Debt Evidence

#### 1. Broken Preferences Update Endpoint (Bug)
In `frontend/components/settings-form.tsx`, lines 16–20:
```typescript
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_review_goal: dailyGoal, sm2_aggressiveness: sm2 }),
      });
```
In `backend/api/routes/user.py`, lines 52–56:
```python
@router.put("/user/preferences", response_model=UserPreferencesResponse)
def update_user_preferences(
    request: UpdatePreferencesRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
```
The server route expects the Authorization header to verify the user via Clerk JWT. The frontend client-side `fetch` call does not pass any auth headers.

#### 2. Incorrect Dashboard "Continue Studying" Filtering (Bug)
In `frontend/app/dashboard/page.tsx`, lines 27–29:
```typescript
        {/* Top Row: Continue Studying Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          {documents.filter(doc => doc.status !== "COMPLETED").slice(0, 3).map((doc) => {
```
The dashboard filters *out* `"COMPLETED"` documents. It lists only documents that are in a `PENDING`, `PROCESSING`, or `FAILED` state. Clicking "Continue" on these cards opens an empty workspace containing no study materials.

#### 3. Browser Performance Bottleneck (Universal CSS Transition)
In `frontend/app/globals.css`, lines 454–462:
```css
@media (prefers-reduced-motion: no-preference) {
  *,
  *::before,
  *::after {
    transition-property: background-color, border-color, color;
    transition-duration: 160ms;
    transition-timing-function: ease-out;
  }
}
```
Applying transitions to all elements (`*`) triggers paint and layout operations across the entire DOM during scrolling or updates.

#### 4. Low Component Modularity (Technical Debt)
`frontend/components/study/InteractiveSummaryReader.tsx` is a monolithic file containing **1,252 lines of code**. It mixes text selection event handling, annotation logic, local side-panels state, notes CRUD, and styling layout, making it difficult to maintain and test.

---

## 2. Logic Chain

1. **Authentication Token Missing**:
   * *Observation*: `backend/api/routes/user.py` requires a valid Clerk JWT header via `get_current_user`.
   * *Observation*: `frontend/components/settings-form.tsx` performs a client-side PUT request to `/api/user/preferences` with only `Content-Type` header, omitting `Authorization`.
   * *Conclusion*: Saving preferences will fail with an HTTP 401/403 status.
2. **Dashboard Query Filter Typo**:
   * *Observation*: `frontend/app/dashboard/page.tsx` filters `documents.filter(doc => doc.status !== "COMPLETED")` for the study cards.
   * *Observation*: Non-completed documents do not have summary data, flashcards, or quizzes populated.
   * *Conclusion*: Ready-to-study documents are hidden from the dashboard homepage, while unready or failed ones are shown and prompt a degraded study workspace interface when opened.
3. **Universal CSS Style Bottleneck**:
   * *Observation*: `frontend/app/globals.css` applies transition selectors to `*`, `*::before`, and `*::after`.
   * *Observation*: The study workspace renders large amounts of text broken down into annotatable blocks, notes, and interactive panels.
   * *Conclusion*: The browser is forced to compute transitions on hundreds of text elements and cards simultaneously, leading to frame drops during highlights, notes composing, or scrolling.

---

## 3. Caveats

* We performed a read-only codebase audit; we did not run the application locally or verify the database migrations in postgres.
* The Clerk configuration (audience, client secret, issuer URL) and Supabase settings are assumed to be correctly structured based on `.env.example` configurations.
* No unit or integration testing framework is configured in the repository (aside from the helper script `backend/test_auth.py`).

---

## 4. Conclusion

The Studflow repository contains a well-structured and highly functional core monorepo setup leveraging Next.js App Router and FastAPI. However, there are two logic bugs that degrade the user experience:
1. The dashboard "Continue Studying" card query is inverted, filtering out completed documents.
2. The user preferences settings form is broken because client-side API requests lack Clerk JWT authorization headers.

Additionally, technical debt is present in the CSS stylesheet (universal transition anti-pattern) and component modularity (`InteractiveSummaryReader.tsx` size), which will create performance issues and maintenance difficulties as features grow.

---

## 5. Verification Method

### A. Code Inspection
* Open `frontend/components/settings-form.tsx` to verify lines 16–20 do not contain Clerk auth tokens.
* Open `frontend/app/dashboard/page.tsx` to verify line 28 filters out `"COMPLETED"` documents.
* Open `frontend/app/globals.css` to verify lines 454–462 target the universal `*` selector.

### B. Command Execution
To run the project locally and reproduce the settings save failure or verify the frontend linting setup:
1. Run `npm run lint` under `frontend/` to check for any script errors.
2. Spin up FastAPI and run the auth helper `python backend/test_auth.py` to confirm the backend config.
