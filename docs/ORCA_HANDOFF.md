# StudFlow Orca Engineering Handoff

## 1. Repository Snapshot
**CURRENT HEAD:** `28df90e` (test(eval): avoid SQLAlchemy ObjectDeletedError in RLS isolation test)
**CURRENT BRANCH:** `main`
**WORKTREE STATUS:** Dirty; contains user-owned evaluation/debug artifacts and documentation edits. Preserve them.
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
**STATUS:** ✅ Complete
*   **C1 Golden Dataset:** ✅ Complete (`c1-v1` with 24 cases).
*   **C2 Retrieval Eval:** ✅ Complete (Frozen baseline: 1.0 metrics across the board).
*   **C2.1 Threshold Analysis:** ✅ Complete (Derived 0.67, retained in eval config).
*   **C3 Answer Eval:** ✅ Complete (`c3_baseline_v2` certified at 24/24 cases, 0 infrastructure failures).
*   **C4 Groundedness Eval:** ✅ Complete (29 claims evaluated, 93.1% strict groundedness, 0 infrastructure failures).
*   **C5 Citation Eval:** ✅ Complete (29 citations evaluated, 93.1% strict accuracy, 0 infrastructure failures).
*   **C6 Regression Runner:** ✅ Complete (Automated compare engine + 13 passing unit tests).
*   **C7 CI Integration:** ✅ Complete (C6 baseline integrity gate added to `.github/workflows/pipeline.yml`).

## 8. C1–C5 Evaluation Architecture
*   **C3:** Golden Fact ↔ Final Answer (Answer Correctness).
*   **C4:** Exposed Claim ↔ All Retrieved Context (Groundedness).
*   **C5:** Exposed Claim ↔ Specific Cited Chunk (Citation Correctness).
*   Pipeline generates a `PipelineOutput` with a deterministic `content_hash`. C4 and C5 strictly consume this frozen output.

## 9. Current Live Baseline State
**Historical runs:**
*   `c3_run_01`: 22/24 partial historical run (contaminated, preserved for history).
*   `c3_certified_baseline`: Blocked at 7/24 due to retired model / harness bugs (see its `INVALID.md`).

**Canonical certified baseline: `c3_baseline_v2`**
*   24 / 24 completed cases.
*   Zero infrastructure failures.
*   Generation: `gemini-2.5-flash`
*   Judge: `gemini-3.5-flash-lite`
*   Status: `CERTIFIED_C3_BASELINE`
*   C4 groundedness: `c4_metrics.json`
*   C5 citation accuracy: `c5_metrics.json`
*   This is the frozen Phase C control baseline for all subsequent Phase D evaluations.

## 10. Provider / Quota State
*   **GENERATION_MODEL:** `gemini-2.5-flash`
*   **JUDGE_MODEL:** `gemini-3.5-flash-lite`
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

## 13. Supervised Orca Agent Roles
*   **Antigravity:** coordinator, planner, architect, task manager, reviewer, and QA authority. It owns task decomposition, approval gates, integration order, and review verdicts.
*   **Codex GPT-5.6 (medium):** primary implementer, coder, and debugger. Each implementation task must self-test with repository-supported checks and return the evidence to Antigravity.
*   **Human:** approves the plan before implementation and performs the final diff review and merge after Antigravity review passes.
*   **Deterministic Tooling:** CI/CD runners handle repeatable metric aggregation and regression assertions; their results inform, but do not replace, Antigravity QA.

The complete operating procedure, including parallel file-scope rules and the three-attempt review loop, is in `docs/codex-orchestration.md`.

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
1. Begin Phase D chunking design (comparing semantic/markdown-aware boundaries against fixed chunking).
2. Run candidate evaluation runs against the frozen `c3_baseline_v2` control baseline.
3. Compare candidate metrics using `python eval/run_c6.py --baseline eval/results/c3_baseline_v2 --candidate eval/results/candidates/<run>`.

## 18. Phase D Boundaries
*   Do NOT modify Phase B prompt contracts without comparing against frozen `c3_baseline_v2`.
*   Do NOT update the production retrieval threshold (0.50) until chunking optimizations are completed and evaluated.

---
**CURRENT PROJECT STATE:** Clean / Stable; Phase C Baseline Certified and Frozen
**CURRENT PHASE:** Phase D (Chunking Strategy & Hyperparameter Tuning)
**CURRENT BLOCKER:** None
**NEXT SAFE COMMAND:** Design Phase D chunking strategy and evaluate candidate runs against `c3_baseline_v2`
**NEXT DEVELOPMENT PHASE:** Phase D
**CAN PHASE D START:** YES
**WHY:** Canonical C1-C5 live baseline (`c3_baseline_v2`) is fully certified and frozen, and C6 regression runner is operational.
