# StudFlow Orca Engineering Handoff

## 1. Repository Snapshot
**CURRENT HEAD:** `fe80030` (Fix C5 test assertion)
**CURRENT BRANCH:** `main`
**WORKTREE STATUS:** Clean (with some untracked patch/test artifacts from previous agents).
**UPSTREAM:** `origin/main` (Synchronized).

*Note: The commit hashes differ slightly from previous Phase C reports because of a `git pull --rebase` that was executed by the user to synchronize with `origin/main`.*

## 2. Architecture
**FRONTEND:** React / Next.js / Tailwind CSS / `shadcn/ui`.
**BACKEND:** FastAPI (Python 3.12).
**DATA:** PostgreSQL with `pgvector` for vector storage.
**BACKGROUND PROCESSING:** Celery + Redis for document indexing/embedding.
**AI PROVIDER LAYER:** Centralized in `backend/services/llm_provider.py`. Includes key rotation, retry logic, and Pydantic structured output validation.

## 3. AI/RAG Pipeline
The runtime path for documents:
1. **Upload & Parsing:** `backend/tasks/document_processing.py` extracts text via Celery.
2. **Chunking:** Text is chunked with page-awareness.
3. **Embedding:** `llm_provider._embed_contents` generates embeddings; stored in pgvector.
4. **Retrieval:** `retrieval.py` fetches top-K chunks via exact-cosine or pgvector ANN.
5. **Context & Generation:** `ai_chat.py` maps chunks to evidence IDs (`e_01`, `e_02`). Gemini (`gemini-2.5-flash`) generates structured `claim` outputs.
6. **Citation Validation (B3):** LLM evaluates citations (`SUPPORTED`, `PARTIAL`, `UNSUPPORTED`).
7. **Filtering (B6):** `PARTIAL` and `UNSUPPORTED` claims are stripped. If no claims survive, `INSUFFICIENT_EVIDENCE` is triggered.
8. **Rendering:** Markdown is deterministically rendered from the surviving claims and returned.

## 4. Trust Boundaries
**SYSTEM POLICY → USER REQUEST → RETRIEVED CONTENT → EXTERNAL OUTPUT**
*   Untrusted user documents are structurally isolated from the system prompt.
*   Outputs are coerced into Pydantic models. Raw strings are never trusted.
*   **Evidence IDs:** Only valid `e_xx` IDs mapped during retrieval are accepted by the backend. Hallucinated IDs (`e_99`) are strictly rejected by domain validation (B1).

## 5. Phase A Status
**STATUS:** ✅ Complete
*   `llm_provider.py` abstracts API usage from business logic.
*   `AIServiceError` comprehensively wraps provider faults.
*   API key rotation is implemented via `itertools.cycle` to cycle through `.env` keys.

## 6. Phase B Status
**STATUS:** ✅ Complete
*   **B1:** Evidence IDs are deterministic and strictly validated.
*   **B2:** Structured output enforced via Pydantic.
*   **B3:** Citation semantic validation implemented.
*   **B4:** Retrieval quality threshold configuration implemented (production threshold = 0.50).
*   **B5:** Abstention states (`ANSWERED`, `INSUFFICIENT_EVIDENCE`, `OUT_OF_SCOPE`) implemented.
*   **B6:** Strict unsupported-claim filtering policy implemented.

## 7. Phase C Status
**STATUS:** ⏸ Paused (Pending Live Quota Restock)
*   **C1 Golden Dataset:** ✅ Complete (`c1-v1` with 24 cases).
*   **C2 Retrieval Eval:** ✅ Complete (Frozen baseline: 1.0 metrics across the board).
*   **C2.1 Threshold Analysis:** ✅ Complete (Derived 0.67, but *not* applied to prod per rules).
*   **C3 Answer Eval:** ✅ Infrastructure Complete. 7/24 cases successfully generated pipeline outputs. Remaining cases blocked by 20 RPD Gemini 2.5-flash limit.
*   **C4 Groundedness Eval:** ✅ Infrastructure Complete. Claim-level checkpointing ready.
*   **C5 Citation Eval:** ✅ Infrastructure Complete. `MISSING` citations are deterministically resolved.

## 8. C1–C5 Evaluation Architecture
*   **C3:** Golden Fact ↔ Final Answer (Answer Correctness).
*   **C4:** Exposed Claim ↔ All Retrieved Context (Groundedness).
*   **C5:** Exposed Claim ↔ Specific Cited Chunk (Citation Correctness).
*   Pipeline generates a `PipelineOutput` with a deterministic `content_hash`. C4 and C5 strictly consume this frozen output.

## 9. Current Live Baseline State
**Historical run: `c3_run_01`**
*   22 / 24 cases successfully evaluated
*   2 provider/infrastructure failures
*   Historical partial/contaminated run
*   NOT certified
*   Preserved only for diagnostics/reproducibility
*   MUST NOT be resumed as the canonical baseline

**Current canonical run: `c3_certified_baseline`**
*   7 / 24 currently checkpointed
*   17 cases pending
*   Canonical resumable baseline
*   Configuration locked to gemini-2.5-flash
*   This is the ONLY C3 run that future Orca evaluation work should resume
*   Not certified until 24/24 and zero unresolved infrastructure failures

## 10. Provider / Quota State
*   **GENERATION_MODEL:** `gemini-2.5-flash`
*   **EVALUATOR_MODELS:** `gemini-1.5-flash`
*   **EMBEDDING_MODEL:** `gemini-embedding-2`
*   **KEYS:** 3 keys loaded. They appear to belong to the *same* Google Cloud project, sharing a **hard 20 Requests-Per-Day limit** for the 2.5-flash free tier.
*   **DAEMON:** The infinite retry loop (`run_c3_c4_loop.py`) has been killed.

## 11. Testing & Verification Commands
*   **Run Unit Tests:** `PYTHONPATH=backend backend/.venv312/bin/pytest backend/tests/ backend/eval/answer/test_resumable_runner.py backend/eval/groundedness/test_c4_runner.py backend/eval/citation/test_c5_runner.py`
*   **Check Integrity:** `PYTHONPATH=backend backend/.venv312/bin/python backend/eval/test_eval_integrity.py`

**Canonical Live Evaluation Commands:**
*   **C3:** `PYTHONPATH=backend backend/.venv312/bin/python backend/eval/run_c3.py`
*   **C4:** `PYTHONPATH=backend backend/.venv312/bin/python backend/eval/run_c4.py`
*   **C5:** `PYTHONPATH=backend backend/.venv312/bin/python backend/eval/run_c5.py`

**DO NOT** use any background infinite retry daemon.

## 12. Git / Phase Finalization Policy
*   Local commits are heavily encouraged during task loops.
*   Do NOT automatically push every substep.
*   Push to remote ONLY after a COMPLETE ROADMAP PHASE passes its holistic verification gate.

## 13. Recommended Orca Agent Roles
*   **Codex:** ARCHITECT / IMPLEMENTER. Strong at exact file modifications, deterministic testing, and multi-file refactors.
*   **Gemini/Antigravity:** AI EVALUATION SPECIALIST / TRUST-BOUNDARY REVIEWER. Ideal for reviewing RAG prompts, designing evaluation semantics (like C4/C5), and assessing hallucination boundaries.
*   **Deterministic Tooling:** CI/CD runners should handle metric aggregation and regression assertions.

## 14. Recommended Worktree Strategy
*   `feature/<task>`: General features.
*   `eval/<task>`: Strict isolation for evaluation runs (e.g., `eval/c6-regression`). Do NOT share mutable eval JSONL files across parallel worktrees.
*   **DB Migrations:** Parallel worktrees MUST NOT execute overlapping Alembic migrations.

## 15. Recommended Skills
1.  **studflow-rag-change**: Analyzes ripple effects of chunking/prompt changes on the B1-B6 pipeline.
2.  **studflow-eval-resume**: Safely triggers `run_c3.py` followed by C4 and C5 without overwriting frozen baselines.
3.  **studflow-trust-boundary-review**: Scans FastAPI routers and Pydantic schemas to ensure raw AI strings cannot reach persistence layers without structured validation.

## 16. Known Risks / Technical Debt
*   **SEVERITY HIGH:** Gemini 2.5-flash 20 RPD free-tier limit. Will heavily bottleneck Phase D iteration.
*   **SEVERITY MED:** pgvector ANN vs exact-cosine retrieval divergence. (Discovered in C2, pending resolution in Phase D).
*   **SEVERITY MED:** Uncalibrated production threshold (currently 0.50; eval derived 0.67).

## 17. Safe Next Actions
1. Wait for daily quota reset (Midnight PT).
2. Run: `PYTHONPATH=backend backend/.venv312/bin/python backend/eval/run_c3.py`
3. Wait for `CERTIFIED_C3_BASELINE`.
4. Run C4 and C5 sequentially.
5. Finalize Phase C.

## 18. Actions Explicitly Forbidden Right Now
*   **DO NOT** modify Phase B behavior.
*   **DO NOT** tune retrieval, chunking, or the 0.50 threshold.
*   **DO NOT** consume Gemini quota until reset.
*   **DO NOT** start Phase D.

---
**CURRENT PROJECT STATE:** Clean / Stable
**CURRENT PHASE:** Phase C (Paused for Quota)
**CURRENT BLOCKER:** Gemini API 20 RPD Limit
**NEXT SAFE COMMAND:** `PYTHONPATH=backend backend/.venv312/bin/python backend/eval/run_c3.py` (Tomorrow)
**NEXT DEVELOPMENT PHASE:** Phase D
**CAN PHASE D START:** NO
**WHY:** Must freeze the C1-C5 live baseline metrics to establish a control group before making generative/retrieval changes in Phase D.
