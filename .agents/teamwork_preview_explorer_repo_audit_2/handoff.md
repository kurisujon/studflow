# Repository Audit Handoff Report — Studflow

## 1. Observation
This read-only audit of the Studflow repository explored all relevant frontend, backend, database, and configuration files. Below are the exact locations, file paths, and verbatim code details observed:

### A. Codebase Details & Stack
- **Languages**: The project is a fullstack decoupled monolith containing Python 3.11+ on the backend and TypeScript on the frontend (packages listed in `frontend/package.json` line 35: `"typescript": "^5"`).
- **UI Components**: Built using React 19 (`frontend/package.json` line 20: `"react": "19.2.4"`) and `@base-ui/react` headless components as the button primitive in `frontend/components/ui/button.tsx` (line 1: `import { Button as ButtonPrimitive } from "@base-ui/react/button"`).
- **Styling**: Powered by Tailwind CSS v4 (`frontend/package.json` line 34: `"tailwindcss": "^4"`) combined with `tw-animate-css` globally imported in `frontend/app/globals.css` (line 1-3):
  ```css
  @import "tailwindcss";
  @import "tw-animate-css";
  @import "shadcn/tailwind.css";
  ```
  Theme customizability resides in custom CSS variables mapping multiple colors (`system`, `sage`, `blue`, `rose`, `teal`, `lavender`, `stone`) under `[data-theme-color="..."]` selectors (lines 74-135) and a `.dark` selector (lines 568-607).
- **State Management**: Zustand is listed in `docs/architecture.md` (line 13) but is **not** present in `frontend/package.json` dependencies and is not imported in the codebase. Instead, global settings (theme preferences) are managed via standard React Context in `frontend/components/theme/ThemeProvider.tsx` (line 29: `const ThemeContext = createContext<ThemeContextValue | null>(null)`), and interactive views use standard React Hooks (`useState`, `useRef`, `useCallback`, `useEffect` in `frontend/components/flashcard-study.tsx` line 3).

### B. Data Flow & Database Schemas
- **Database Engine & Connection**: Configured in `backend/core/database.py` (lines 10-18) using SQLModel/SQLAlchemy sync engine on PostgreSQL (`postgresql+psycopg` driver) with `NullPool` to support Celery background workers.
- **SQLModel Models**: Defined in `backend/models/tables.py` containing the following schemas:
  - `User`: Standard user table (left over from previous local authentication phase, currently unused in API routes).
  - `UserPreferences`: Custom settings (theme preference, daily goal, SM-2 aggressiveness factor) mapped to `clerk_user_id` (line 58: `clerk_user_id: str = Field(unique=True, index=True, nullable=False)`).
  - `Document`: Reference tracking files, page count, and status mapped to `clerk_user_id` (line 86).
  - `Summary`, `Flashcard`, `DocumentChunk`, `Quiz`, `QuizQuestion`, `QuizAttempt`, `RelatedVideo`, `StudyAnnotation`, `AIHistory`: Standard child models referencing `Document` tables.
- **Migrations**: Alembic revisions are in `backend/alembic/versions/`. Transition to Clerk is captured in `10a49d43985d_update_user_preferences_to_clerk.py` (line 23: `op.add_column('user_preferences', sa.Column('clerk_user_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False))`) and `d4a688b06ebc_add_clerk_user_id_to_document.py` (line 23).
- **Celery Tasks**: Located in `backend/tasks/document_processing.py`. The asynchronous handler `process_document_task` manages downloading documents from Supabase Storage (relies on signed URLs via `backend/services/storage.py`), parsing (`fitz` PyMuPDF for PDF; direct zip archive XML parsing for DOCX), splitting into semantic chunks (`chunk_text`), generating materials, and saving results.

### C. Authentication Flow
- **Clerk Integration**:
  - **Frontend Layout**: The root layout wraps children in `ClerkProvider` (`frontend/app/layout.tsx` line 62).
  - **Client Token Retrieval**: Clerk's client SDK is utilized to get access tokens (e.g. `frontend/components/quiz-study.tsx` line 22: `const { getToken } = useAuth();`).
  - **Server-side actions / API calls**: Access tokens are fetched via Next.js headers (`frontend/lib/server-api.ts` line 7-8: `const { getToken } = await auth(); const token = await getToken();`) and sent in `Authorization: Bearer <token>` headers.
  - **Backend Verification**: Implemented in `backend/core/auth.py`. Verifies bearer tokens on each route dependency check (`get_current_user` in line 154) against Clerk's JWKS endpoint (JWKS URL retrieved in lines 63-71 using the publishable key or issuer config). Signature algorithm `RS256` is validated using `jose.jwt` (line 128) and parsed claims verify the `sub` user identifier.

### D. AI Integration & Schema Validation
- **Gemini API SDK**: Backend utilizes the official `google-genai` SDK (`backend/services/ai_service.py` line 7: `from google import genai`).
- **Structured Output Constraints**: Enabled using generation configurations (lines 160-163):
  ```python
  config=types.GenerateContentConfig(
      response_mime_type="application/json",
      response_schema=response_schema,
  )
  ```
- **Pydantic Model Schema Validation**: Strictly enforced at runtime. Models in `backend/services/ai_service.py` (such as `ComprehensiveSummary`, `FlashcardPayload`, `QuizQuestionPayload`) define output types, counts, and descriptions. Responses are validated using `model_validate_json(response.text)` (line 230).
- **API Key Rotation**: Implemented in `backend/services/ai_service.py` (lines 112-121). A cycle iterator parses a comma-separated key string (`itertools.cycle(keys)`) and rotates keys immediately when 403 (Forbidden) or 429 (Rate Limit) errors occur (lines 167-172).

### E. Code Conventions
- **Routing**:
  - **Frontend**: Next.js App Router structure. Directory pages map routes:
    - `/dashboard` -> `frontend/app/dashboard/page.tsx`
    - `/dashboard/study/[id]` -> `frontend/app/dashboard/study/[id]/page.tsx`
  - **Backend**: FastAPI APIRouter structure. Routes are separated into modules under `backend/api/routes/` (`documents.py`, `study.py`, `upload.py`, `user.py`, `health.py`).
- **Modular Services**: Storage, document processing, spaced repetition (SM-2 implementation in `backend/services/study_service.py`), and AI generation are completely decoupled from endpoints into utility modules under `backend/services/`.

---

## 2. Logic Chain
1. We verified the codebase configuration by viewing `frontend/package.json` and `backend/core/config.py`, identifying the strict typescript/python environments, Next.js 16/React 19, and the packages used for rendering, styling, and databases.
2. In auditing state management, we discovered that `zustand` is mentioned in `docs/architecture.md` but not imported or present in dependencies. Instead, `ThemeContext` (React Context) in `ThemeProvider.tsx` and standard local React state are the single sources of state management in the frontend.
3. In tracing the authentication flow, `frontend/lib/server-api.ts` extracts the Clerk auth token and attaches it to authorization headers. The backend's `backend/core/auth.py` interceptor (`get_current_user`) decodes the JWT using jose/cryptography, cross-checking the `sub` identifier. This allows us to confirm that database entries are associated with `clerk_user_id` columns in `Document` and `UserPreferences` tables.
4. Reviewing AI integration in `backend/services/ai_service.py` confirmed that `google-genai` is configured with structured schemas mapping directly to Pydantic models. This ensures raw JSON is returned and parsed correctly, failing parsing if it doesn't match the schema bounds.
5. Reviewing the folder structures confirms the project uses Next.js App Router for frontend views and modular FastAPI APIRouter modules for backend services.

---

## 3. Caveats
- **Testing**: No formal automated testing framework (like `pytest` or Jest) is configured or running. Only a simple token check script exists in `backend/test_auth.py`.
- **Clerk Middleware**: The frontend currently does not utilize a Next.js `middleware.ts` configuration to block unauthenticated access at the routing layer; instead, security is enforced when fetches fail with 401/403 (which triggers redirect to `/sign-in` in `frontend/lib/server-api.ts` line 24).

---

## 4. Conclusion
The repository represents a highly structured, clean, production-grade decoupled monolith. The frontend strictly adheres to the UI guidelines (Tailwind CSS v4 with extensive CSS theme variables, shadcn/ui on `@base-ui/react` primitives, and clean motion transitions via `framer-motion`). 
The backend handles heavy loads asynchronously using Celery background tasks, and has a robust AI orchestration service using Gemini structured JSON outputs, client key rotation, and strict Pydantic parsing.
All database schemas are migrated to Clerk identifier columns (`clerk_user_id`). The old `users` table is currently unused.

---

## 5. Verification Method
To independently verify the audit details without running server processes:
1. **Frontend Dependencies**: Run `cat frontend/package.json` to confirm the Next.js, React, and `@base-ui/react` configurations.
2. **Missing Zustand**: Run a recursive search:
   ```bash
   grep -rn "zustand" frontend/
   ```
   (Should return no imports/usages).
3. **Alembic migrations**: Inspect `backend/alembic/versions/` files to verify `clerk_user_id` alterations.
4. **Key Rotation & Schema Validation**: Review `backend/services/ai_service.py` to inspect Pydantic models, genai client config, and `_generate_structured` error handler retry scopes.
