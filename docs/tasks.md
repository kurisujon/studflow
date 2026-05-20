# The Development Roadmap

## Phase 1: Foundation
- [ ] Initialize Next.js (App Router) project with TypeScript, TailwindCSS, and shadcn/ui.
- [ ] Initialize FastAPI project with Python 3.11+.
- [ ] Setup PostgreSQL database and define core SQLAlchemy/SQLModel schemas.
- [ ] Implement basic Authentication (frontend & backend).

## Phase 2: Document Processing
- [ ] Configure AWS S3 or Supabase Storage for raw file persistence.
- [ ] Build FastAPI file upload endpoint.
- [ ] Setup Redis and Celery for background task management.
- [ ] Implement PDF/DOCX parsing logic (e.g., using PyMuPDF).
- [ ] Implement document chunking logic.

## Phase 3: AI Orchestration
- [ ] Integrate Gemini API using the official SDK.
- [ ] Develop optimized prompts and enforce strict JSON schemas for Summary, Flashcards, and Quizzes.
- [ ] Implement database persistence logic for validated AI outputs.
- [ ] Build frontend polling mechanism to check background job status.

## Phase 4: Study UI
- [ ] Develop user Dashboard showing uploaded documents and study progress.
- [ ] Build Document Summary View.
- [ ] Build Interactive Flashcard UI (with flip animations and progress tracking).
- [ ] Build Multiple-Choice Quiz UI (with instant feedback and scoring).
