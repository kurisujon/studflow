# The Anti-Over-Engineering Manifesto

This document serves as the strict guardrails for the entire development lifecycle. These rules must be followed without exception to maintain velocity, simplicity, and sanity.

## 1. No Microservices
- The backend will remain a Monolithic FastAPI application.
- The frontend will remain a Monolithic Next.js application.
- Do not introduce distributed system complexities.

## 2. No Premature Optimization
- Optimize for 100 concurrent users, not 1 million.
- Do not implement complex caching layers beyond the necessary Redis setup for Celery.
- Simple, readable code is always prioritized over highly optimized but obscure algorithms.

## 3. Stick to the Stack
- No new programming languages.
- No GraphQL (Stick to RESTful JSON endpoints).
- No Kubernetes (Deploy on simple PaaS providers like Vercel/Render/Railway or use basic Docker Compose).
- Approved AI & Database extensions: `pgvector` extension for PostgreSQL and Gemini Embedding APIs (`text-embedding-004`) for RAG & semantic search.

## 4. Code Simplicity Rules (KISS)
- **KISS:** Keep It Simple, Stupid.
- Strict typing is mandatory: TypeScript on the frontend, Python type hints & Pydantic on the backend.
- Modularity: Keep routes, services, and database operations in separate, logically organized modules.

## 5. AI Boundaries & RAG Infrastructure
- **No Direct DB Access for AI:** The LLM never touches the database directly. Database queries and vector lookups are controlled via backend services.
- **Validation is Mandatory:** The backend must parse and validate all JSON outputs from Gemini using Pydantic before saving to the database. Never trust raw AI output.
- **Semantic RAG & Vector Storage:** Embeddings and `pgvector` similarity search are approved for semantic chunk retrieval, long document processing (e.g., 100+ page PDFs), and grounded Q&A.
- **AI Pipelines & Orchestration:** Background processing pipelines (Celery) and function-calling loops may be optimized for multi-step AI reasoning and long-document execution.

## 6. UI/UX Design Direction
- **Design Language:** Clean, informational, and lively. The UI must feel alive and purposeful without being distracting. Think structured clarity with warm, purposeful color accents.
- **Color Usage:** Use accent colors intentionally to communicate state, category, and hierarchy (e.g., orange for summary/AI, purple/indigo for flashcards and interactive elements, green for correct states, red for incorrect). Avoid flat, colorless UIs.
- **Typography:** Use bold, high-contrast headings paired with lighter body text. Section labels and meta-information should use smaller, muted helper copy to create clear visual hierarchy.
- **Cards & Surfaces:** Use rounded cards with subtle shadows and gentle borders. Cards should feel elevated but not heavy. Use soft background fills (e.g., light lavender, off-white) to separate surfaces.
- **Icons:** Use icons consistently as visual anchors alongside labels. Icons should be colored to match their context (e.g., orange for document, purple for flashcards, green for progress).
- **Motion & Liveliness:** Purposeful, light animations are approved and encouraged (e.g., progress bars, card reveals, state transitions). Motion should feel natural and tied to product states — not purely decorative.
- **Components:** Rely on `shadcn/ui` and Tailwind utility classes as the component foundation. Custom styling is allowed when it serves the approved design direction.
- **Data & Progress Surfaces:** Widgets, stats, progress indicators, streaks, and review queues are first-class UI elements. Dashboards should feel informational and motivating, not sparse.
- **Feedback States:** Correct/incorrect states, scoring, streaks, and completion indicators must use clear visual feedback with color and iconography (checkmarks, X marks, progress fills).
- **Avoid:** Generic gray-on-white layouts, excessive whitespace that feels empty, animation purely for decoration with no product meaning, and inconsistent icon or color usage across surfaces.
