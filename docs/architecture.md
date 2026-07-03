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
