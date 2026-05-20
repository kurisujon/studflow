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
- Do not add new libraries unless absolutely necessary and discussed first.

## 4. Code Simplicity Rules (KISS)
- **KISS:** Keep It Simple, Stupid.
- Strict typing is mandatory: TypeScript on the frontend, Python type hints & Pydantic on the backend.
- Modularity: Keep routes, services, and database operations in separate, logically organized modules.

## 5. AI Boundaries
- **No Direct DB Access for AI:** The LLM never touches the database directly.
- **Validation is Mandatory:** The backend must parse and validate all JSON outputs from Gemini using Pydantic before saving to the database. Never trust raw AI output.

## 6. UI/UX Boundaries
- **Minimalist Aesthetic:** Stick strictly to clean, modern, minimalist design.
- **Components:** Rely exclusively on `shadcn/ui` and Tailwind utility classes.
- **No Excessive Animations:** Motion should be purposeful (e.g., subtle state changes) and never distracting.
