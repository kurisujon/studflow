# Phase F: Trust and Study-Loop Depth (Spec v4, verified against code)

Status: v4 verified against `main` @ `f0b4948` (2026-11-19); F1.2 URL-policy decision confirmed; F3 section verified against `origin/main` @ `397dd36` (2026-11-26) with human amendments confirmed. Follow the Handoff Rule: check off only what is verified in code.

Order: Prerequisite, F1 injection hardening, F2 citation Source Passage drawer, F3 tutor mode, F4 FSRS + review log, F5 exam planner.

Release-path rule (from `.github/workflows/application-release.yml:88-106`): changes to `docker-compose.yml`, `backend/alembic`, `backend/models/tables.py`, `backend/core/config.py`, or `backend/schemas/ai_chat.py` block the migration-free release workflow. F1 and the prerequisite must stay clear of those files so they ship on the fast path. F2, F3, F4, and F5 ship through the schema-migration release path.

---

## Prerequisite: local RLS test environment

Current state: a Linux `.venv` runs the unit and offline eval tests. Only the live `app_role` RLS suites (`backend/eval/test_rls_integration.py`, `backend/eval/test_rls_mid_request_commit.py`) need Postgres. `docker-compose.yml:147-162` runs `pgvector/pgvector:pg16` with no test profile.

Design:
- Put the test Postgres in a **new `docker-compose.test.yml`**, not in `docker-compose.yml`, to avoid tripping the release guard. Verified: `application-release.yml:88-106` and `rls-runtime-transition.yml:77` check the exact path `docker-compose.yml`, not a wildcard, so `docker-compose.test.yml` does not trip the guard.
- Reuse the CI role setup from `pipeline.yml:135-152` (`app_role`, `LOGIN NOSUPERUSER NOBYPASSRLS`) via a mounted init script, and the same environment variable names CI uses.
- Note the naming difference: CI and tests use `app_role`; production docs (`docs/cicd.md:79-129`) use `app_user`. `test_rls_integration.py:32-86` checks `current_user` dynamically and asserts exact grants on the 14 `RUNTIME_TABLES`, with no CREATE, no sequences, and no access to `public.users` or `public.alembic_version`.
- Grant contract for later phases: any new runtime table (F4 `flashcard_reviews`, F5 `study_sets`/exams) needs `ENABLE` + `FORCE ROW LEVEL SECURITY` and CRUD-only grants. Verified: Alembic migrations do not issue `GRANT`/`REVOKE`. Grants live in four places that must be updated together for every new table (F2 only alters `ai_message_citations`, so it needs none):
  1. `.github/workflows/pipeline.yml:150-152` (CI `RUNTIME_TABLES` + grants to `app_role`)
  2. `scripts/runtime_database_transition.py:17-156` (`_reconcile` for production `app_user`)
  3. `scripts/check_runtime_database.py:12-128` (production preflight)
  4. `backend/eval/test_rls_integration.py:23-86` (live RLS catalog contract)
  Add a unit test or CI check that fails when these four lists disagree.

Checklist:
- [ ] `docker-compose.test.yml` with healthcheck and init script for the test role.
- [ ] Documented one-command run in `docs/cicd.md`.
- [ ] Both RLS suites pass locally.

---

## F1: Prompt-injection hardening (remaining gaps)

### Already on main
- `UntrustedDataBoundary` (nonce tags, tag-breakout escaping), tested in `test_prompt_injection.py`, applied across the `ai_service.py` prompt sites and web search.
- Frontend renderers are safe: no `dangerouslySetInnerHTML`, `innerHTML`, markdown or HTML packages, `<img>` or `<a>` in study components; flashcards, quizzes, and annotatable text render plain React text nodes; `SafeMessageContent.tsx` and `AIConversationSources.tsx` are hardened.

### F1.1 System-instruction separation
Verified safe: `_generate_structured` (`llm_provider.py:125-162`) sends `contents=prompt` with `GenerateContentConfig(response_mime_type, response_schema)`. Adding `system_instruction: str | None = None` does not affect key rotation or cooldowns.
- Apply to all 12 `_generate_structured` call sites in `ai_service.py`.
- Also `_generate_with_search` (`llm_provider.py:322-353`, called from `ai_service.py:146`). Exposure is low because it discards model prose and keeps only grounding metadata, but use the same pattern for consistency.
- Per call site, split the prompt into a fixed instruction string (goes to `system_instruction`) and the question plus boundary-wrapped data (stays in `contents`).

### F1.2 Output sanitizer coverage
Gap found: `validate_conversation_answer` (`domain_validation.py:233-236`) calls `_strip_model_urls_and_links` only for `WEB` generation path or web-provenance claims. `STRICT_DOCUMENT`, `TEACHING`, `CLARIFICATION`, `clarification_question`, and `suggested_followups` are not sanitized.
- Create one sanitizer entry point and apply it to every chat path and field above, plus `validate_summary`, `validate_flashcards`, `validate_quiz`, and `explain_selection`.
- Fix `_MARKDOWN_LINK_RE` (`domain_validation.py:139-142`): it matches `[alt](https://...)` inside `![alt](https://...)` and leaves a stray `!`. Handle image syntax first. Block `data:`, `javascript:`, and protocol-relative targets.
- **Confirmed policy (locked in 2026-11-19):** everywhere (all chat paths/fields, summaries, flashcards, quizzes, and selection explanations), strip markdown images (`![alt](...)`), unwrap `[text](url)` to `text`, and block `data:`, `javascript:`, and protocol-relative (`//...`) targets; on chat paths only (`STRICT_DOCUMENT`, `WEB`, `TEACHING`, `CLARIFICATION`, `clarification_question`, and `suggested_followups`), also strip bare `http(s)://` and `www.` URLs, preserving legitimate bare reference URLs in summaries and flashcards.
- Since renderers are plain text, this is defense in depth, not a live exploit. Keep it, but it ranks below F1.1.

### F1.3 Eval cases (offline vs live)
- Offline pytest (`test_prompt_injection.py`, `test_eval_integrity.py` style): boundary breakout strings, sanitizer parametrized cases (images, `data:` links, bare URLs, forged `e_99`/`w_99`).
- Live checks: canary-follows-injection cases need a model call. `run_c3.py`, `run_c4.py`, `run_c5.py` call Gemini (15 s spacing); `run_c6.py` does not, it compares a pre-generated candidate run against `c3_baseline_v2`.
- Verified: `regression/compare.py:282-295` returns `INTEGRITY_ERROR` (exit code 2) if `dataset_version` or `corpus_version` differs, or if `set(baseline.case_ids) != set(candidate.case_ids)`. So do not append canary cases to `c1-v1`: PR-1 needs a clean candidate comparison against `c3_baseline_v2`. Put the live canary cases in a separate injection eval suite and runner (plus mocked-provider unit tests), or bump the dataset version and re-baseline as `c3_baseline_v3`. Prefer the separate suite.

### F1.4 Per-source tags: optional, deprioritized
Forged IDs are already rejected by registry validation. Do this only if F1.1 shows a quality benefit.

### Implementation plan (PRs, all migration-free)
1. **PR-0 Prerequisite.** `docker-compose.test.yml`, init script, docs, RLS suites green locally.
2. **PR-1 F1.1.** Add `system_instruction` to both provider functions; convert call sites in 2 or 3 commits grouped by output type (summary/flashcards/quiz/explain, conversation/chat, citation evaluation/YouTube/search). Add a mocked-client unit test asserting the config carries the instruction and `contents` no longer does. Then one live C3 run compared to `c3_baseline_v2` through `run_c6.py` to catch quality regressions.
3. **PR-2 F1.2.** Sanitizer entry point, regex fix, coverage for all chat paths and non-chat outputs, parametrized offline tests.
4. **PR-3 F1.3.** Offline fixtures plus a small separate injection eval suite for the live canary cases, leaving `c1-v1` and `c3_baseline_v2` untouched.
5. Update `docs/architecture.md` (Security), `docs/tasks.md`, `docs/roadmap.md`.

Acceptance: Linux `.venv` unit and offline eval tests pass; C3 candidate vs baseline passes `run_c6.py`; `application-release.yml` classifies the changes as migration-free.

---

## F2: Citation Source Passage drawer

Decision: Option A. Clicking a document citation opens a drawer showing the cited passage with the supporting quote highlighted. The summary reader renders `summary_data`, not raw text, so in-place highlighting is not possible, and chats live only in `/dashboard/study/[id]`, so no `?cite=` routing.

### F2.1 Supporting quote from the existing evaluation step
- Schema: add `supporting_quote: str | None = None` to `RawCitationEvaluation` (`ai_service.py:394-401`). `ConversationAnswer` is unchanged.
- Coverage verified: `evaluate_citations` already runs for `STRICT_DOCUMENT`, the document branch of `MIXED` (`ai_chat.py:1389-1409`), and the document branch of `HYBRID` (`ai_chat.py:1261-1268`). The web paths also run it, but web citations need no quote.
- Mapping: `apply_semantic_validation` (`domain_validation.py:402-442`) works per (claim, evidence). `_build_citation_payloads` (`ai_chat.py:860-917`) emits one row per unique evidence ID. Build an `{eid: quote}` map from the validated claims and pass it into `_build_citation_payloads`, choosing one quote per row (first verified, or longest).
- Validate server-side with whitespace- and case-tolerant matching; compute `quote_start` and `quote_end` against the exact `DocumentChunk.content` string the endpoint returns.

### F2.2 Schema and contracts
- Additive migration: nullable `quote TEXT`, `quote_start INT`, `quote_end INT` on `ai_message_citations`, with a check that `quote_end > quote_start` when set. Existing 2-hop RLS covers the table; confirm grants against the grant contract above.
- `CitationResponse`, `_citation_response`, and the frontend `AIChatCitation` type currently lack `id`. Add `id` (the `AIMessageCitation` id) beside the quote fields. Verified: `_build_citation_payloads` (`ai_chat.py:860-917`) runs before `_persist_conversation_turn` (`ai_chat.py:1054-1086`), which returns `citation_payloads` directly in `ChatAnswer`. Generate `id=uuid.uuid4()` in `_build_citation_payloads`, pass `id=citation.id` into `AIMessageCitation(...)`, and include it in `_citation_response`, so POST responses and GET history pages carry the same id.

### F2.3 Passage endpoint
`GET /api/ai/citations/{citation_id}/passage` under the existing `/ai` prefix (`api/routes/ai_chat.py:44`). `GET /api/documents/{document_id}/chunks` already exists but does not handle stale generations or deleted chunks, so keep the dedicated endpoint.
- Returns `document_id`, `chunk_id`, `page_number`, `order_index`, a content window around the quote (for example ±1,200 characters, offsets rebased), and a `stale` flag when the chunk's `index_generation` differs from the document's active generation.
- Runs under `TenantSession`; user B receives 404 for user A's citation.
- No quote: return `excerpt` only. `chunk_id` null: return `excerpt` with a "source was re-indexed" note.

### F2.4 Frontend
- `SafeMessageContent.tsx` (`:16-23`): render verified `[n]` markers as buttons; document citations open the drawer, web citations keep the https new-tab behavior.
- `AIConversationSources.tsx`: document sources open the same drawer.
- New `SourcePassageDrawer` in the study workspace: React text nodes with a `<mark>` over the quote range, page number when present, Esc to close, focus trap, focus returns to the chip.
- Update `types/ai-chat.ts` and the API client.

### Tests and checklist
- Backend: quote validation, offsets index the real chunk string, migration up/down, endpoint authorization and stale handling.
- Live RLS suite: new columns and the passage endpoint.
- Eval: "quote verbatim rate" metric with a no-regression gate.
- Frontend: `tsc`, lint, build; 1440/1024/768/390 px; keyboard-only; one PDF and one non-PDF; a re-indexed document.
- Ships via the schema-migration release path.

---

## F3: Tutor mode

Verified against `origin/main` @ `397dd36`.

**Sequencing & Release Path:** F3 implementation waits for **F1.1, F1.2, and F2-A** to land on `main`. F3's Alembic migration chains after **F2-A's revision** (`down_revision` = F2-A's revision ID; current Alembic head on `origin/main` is `cdadb6e6d15a`). F3 ships via the **schema-migration release path** (`.github/workflows/application-release.yml:88-106` guards `backend/alembic`, `backend/models/tables.py`, `backend/core/config.py`, and `backend/schemas/ai_chat.py`).

### Design decisions (confirmed)
- **Separate `interaction_mode` from `retrieval_mode`:** Keep `retrieval_mode` (`"document" | "web" | "hybrid"` in `backend/schemas/ai_chat.py:12` and `ck_ai_messages_retrieval_mode` in `backend/models/tables.py:535-538`) orthogonal to `interaction_mode: Literal["explain", "tutor"] = "explain"`.
- **Document-only v1:** Tutor mode runs strictly with `retrieval_mode="document"`. Requests with `interaction_mode="tutor"` and `retrieval_mode != "document"` return HTTP `409 Conflict` (`web`/`hybrid` tutoring is out of scope for v1).
- **Server-owned deterministic hint ladder & state machine (`MAX_HINTS = 3`):** The backend owns pedagogical state transitions (`stage` in `probe | check | hint | reveal`, `hint_level` in `0..3`: `0` = Socratic probe, `1` = broad conceptual cue, `2` = narrower structural/passage clue, `3` = near-complete scaffold with explicit offer to reveal) and deterministically computes `allow_hint`, `allow_reveal`, and `allow_new_question` (no LLM intent self-routing).
- **Server-computed action-gate enforcement (HTTP `409`):** `POST /api/ai/conversations/{conversation_id}/messages` returns HTTP **`409 Conflict`** when `tutor_action` (`"hint"`, `"reveal"`, `"new_question"`) is not allowed by the server-computed `allow_*` flags on the active ladder state; returns HTTP `422` when `tutor_action != "auto"` in Explain mode; returns HTTP `409` when `tutor_mode_enabled` is `False`.
- **`auto`-mode clarifying-question trade-off & v1 handling:** In `tutor_action="auto"` mode, if a student asks a clarifying question mid-ladder while an unresolved tutor turn is active, the deterministic state machine routes the turn to `check` and grades it as an attempt (v1 avoids LLM intent self-routing). In v1, the student can switch to **Explain mode** for a direct explanation, click **Need a hint** (`tutor_action="hint"`), or click **Next question** (`tutor_action="new_question"`). An explicit clarifying-question action or deterministic detector is deferred to v2.
- **Fail-closed `INSUFFICIENT_EVIDENCE` with carry-forward metadata:** When document retrieval fails (`not retrieval_passed`) or `filter_unsupported_claims` drops all claims in Tutor mode, fail closed to `INSUFFICIENT_EVIDENCE` with a user-facing message pointing the student to **Explain mode**, and **carry the previous `tutor_metadata` forward** on the persisted assistant message instead of `None` so the student keeps their active ladder position, `target_concept`, and hint count.
- **Dedicated `TutorTurnAnswer` & `generate_tutor_turn(...)`:** Leave `ConversationAnswer` (`backend/services/ai_service.py:76-82`) and existing Explain/Web/Hybrid prompts untouched to protect `c3_baseline_v2`. Add `ConversationGenerationPath.TUTOR = "tutor"` and `ConversationAnswerMode.TUTOR = "tutor"` in `backend/schemas/domain.py`.
- **Same fail-closed evidence & citation pipeline as `STRICT_DOCUMENT`:** `e_XX`-only `provenance="document"` claims -> `validate_tutor_answer` (applying the F1.2 unified sanitizer across `claims`, `guiding_question`, and `target_concept`) -> `evaluate_citations` (automatic F2 `supporting_quote` / `SourcePassageDrawer` compatibility) -> `apply_semantic_validation` -> `filter_unsupported_claims`.
- **Verified `backend/services/ai_chat.py` integration traps handled:**
  - Bypass `_is_conversational_turn` (`backend/services/ai_chat.py:527-536, 1100, 1163`) when `interaction_mode == "tutor"` so short student attempts (`"yes"`, `"no"`, `"ok"`, `"option b"`) are not hijacked by deterministic greetings/closings.
  - Add `_tutor_retrieval_query(...)` incorporating active `target_concept`, `guiding_question`, current student attempt, and `selected_text` (replacing `_retrieval_query` at `backend/services/ai_chat.py:597-620` for tutor turns).
  - Scope active tutor state strictly to `current_messages` (`backend/services/ai_chat.py:1127-1132`), never `prior_session_messages` (`backend/services/ai_chat.py:1133-1149`), so cross-session memory does not leak an unresolved ladder across threads.

### F3.1 Prompt, provider integration, and structured contract
- `backend/schemas/domain.py`: add `ConversationGenerationPath.TUTOR = "tutor"` (`:122-127`) and `ConversationAnswerMode.TUTOR = "tutor"` (`:106-112`), plus `TutorStage = Literal["probe", "check", "hint", "reveal"]`, `TutorAssessment = Literal["correct", "partial", "incorrect"]`, and `TutorMetadata` / `TutorTurnAnswer` structured schema (`claims: list[RawGroundedClaim]`, `evidence_sufficient: bool`, `assessment: TutorAssessment | None`, `guiding_question: str | None`, `target_concept: str`, `suggested_followups: list[str]`).
- `backend/services/ai_service.py` & `backend/services/llm_provider.py`: add `generate_tutor_turn(...)` using the post-F1.1 `system_instruction` parameter (fixed tutor persona, anti-sycophancy rubric, no-answer-leak guard at `hint_level` `0..2`, and `e_XX`-only citation contract in `system_instruction`; `UntrustedDataBoundary`-wrapped document chunks, bounded `current_history`, server-assigned `stage` / `hint_level`, and student input in `contents`).

### F3.2 Validation, sanitization, and orchestration
- `backend/services/domain_validation.py`: add `validate_tutor_answer(...)` enforcing `e_XX`-only `provenance="document"` claims (rejecting unknown or cross-provenance `w_XX` IDs), applying the F1.2 unified sanitizer across `claims`, `guiding_question`, and `target_concept`, and enforcing stage/assessment invariants (`probe`/`hint`/`reveal` do not forge `check` assessments).
- `backend/services/ai_chat.py`:
  - Bypass `_is_conversational_turn` in Tutor mode and build retrieval queries via `_tutor_retrieval_query(...)`.
  - Compute the next state (`stage`, `hint_level`, `allow_hint`, `allow_reveal`, `allow_new_question`) from the latest assistant `tutor_metadata` in `current_messages` (`:1127-1132`) and requested `tutor_action`, raising an explicit error mapped to HTTP `409` when `tutor_action` violates the server-computed `allow_*` flags.
  - Execute `_generate_validated_tutor_path(...)` -> `evaluate_citations` -> `apply_semantic_validation` -> `filter_unsupported_claims` (`backend/services/domain_validation.py:402-500`).
  - Render deterministic Markdown via `_render_tutor_answer(...)` (evidence claims with `[n]` citation markers + guiding question / scaffold).
  - On `INSUFFICIENT_EVIDENCE` (`not retrieval_passed` or all claims dropped), persist the fail-closed response pointing the student to **Explain mode** while carrying the previous `tutor_metadata` forward unchanged instead of `None`.

### F3.3 Schema, contracts, feature flag, and RLS/grants
- **Database (`backend/models/tables.py`, planned Alembic migration):**
  - Additive migration (chaining `down_revision` after F2-A's revision) on `ai_messages`:
    - `interaction_mode VARCHAR(16) NOT NULL DEFAULT 'explain'` with `CheckConstraint("interaction_mode IN ('explain', 'tutor')", name="ck_ai_messages_interaction_mode")`
    - `tutor_metadata JSON NULL`
- **RLS & grants:** **No new runtime table.** `ai_messages` is already in all four synced `RUNTIME_TABLES` lists (`backend/eval/test_rls_integration.py:24-29`, `.github/workflows/pipeline.yml:150-152`, `scripts/runtime_database_transition.py`, `scripts/check_runtime_database.py`), already enforces `ENABLE` + `FORCE ROW LEVEL SECURITY` with 1-hop `tenant_isolation_policy` via `ai_conversations` (`backend/alembic/versions/c00000000000_enable_rls_and_policies.py:51-63`), and already has CRUD-only grants for `app_role`/`app_user`. Verify existing live RLS suites read and write both new columns under `app_role`.
- **Feature flag & API (`backend/core/config.py`, `backend/schemas/ai_chat.py`, `backend/api/routes/ai_chat.py`, `backend/.env.example`):**
  - Add `tutor_mode_enabled: bool = False` (`TUTOR_MODE_ENABLED`, **defaults off** until PR-F3.2 frontend QA and a live tutor spot-check pass) in `backend/core/config.py`, exposed via `AICapabilitiesResponse.tutor_mode_enabled` (`GET /api/ai/capabilities`, `backend/schemas/ai_chat.py:121-123`).
  - Add `InteractionMode = Literal["explain", "tutor"]`, `TutorAction = Literal["auto", "hint", "reveal", "new_question"]`, and `TutorMetadataResponse` to `backend/schemas/ai_chat.py`; extend `SendMessageRequest` (`:89-93`) with `interaction_mode: InteractionMode = "explain"` and `tutor_action: TutorAction = "auto"`, and extend `MessageResponse` (`:69-80`) and `ChatAnswer` (`:111-118`) with `interaction_mode` and `tutor_metadata`.
  - Route validation in `POST /api/ai/conversations/{conversation_id}/messages` (`backend/api/routes/ai_chat.py:211-233`): return `409 Conflict` when `interaction_mode="tutor"` and `not settings.tutor_mode_enabled` (mirroring `:221-225`), `409 Conflict` when `interaction_mode="tutor"` and `retrieval_mode != "document"`, `409 Conflict` when `tutor_action` is disallowed by the server-computed `allow_*` flags, and `422` when `tutor_action != "auto"` in Explain mode.

### F3.4 Frontend
- `frontend/types/ai-chat.ts` & `frontend/lib/api/ai-chat.ts`: add `AIInteractionMode`, `AITutorAction`, `AITutorMetadata`, and `tutor_mode_enabled` on `AICapabilities`; parse/validate them strictly in `getAICapabilities()` and conversation message responses/requests.
- `frontend/components/study/AIStudyAssistantPanel.tsx`: add an **Explain / Tutor** segmented toggle in the header (`:608-804`) gated by `capabilities.tutor_mode_enabled`; in Tutor mode, lock Sources to **Document** with inline/screen-reader helper copy, switch empty-state starters to tutor prompts, and render contextual Tutor action chips (`Need a hint (N/3)`, `Show answer`, `Next question`) gated by `allow_hint`, `allow_reveal`, and `allow_new_question` (sending non-empty readable user prompts with `tutor_action`).
- `frontend/components/study/AIConversationMessage.tsx` & `frontend/app/globals.css`: render `"Tutor"` pill (purple/indigo accent per `docs/GUARDRAILS.md` §6), assessment pill on `check` (`Correct` / `Partially right` / `Not quite`), hint counter badge on `hint` (`Hint N of 3`), `"Answer revealed"` badge on `reveal`, and **disable `"Save as flashcard"` on `probe` turns** (keep enabled on `check`, `hint`, and `reveal`). Keep `SafeMessageContent.tsx` and `AIConversationSources.tsx` plain React text nodes (no HTML injection surfaces, full F2 `SourcePassageDrawer` compatibility).

### Implementation plan (PR breakdown)
1. **PR-F3.1a (Tier 2, schema-migration path):** Additive Alembic migration (chained after F2-A's revision), `backend/models/tables.py`, Pydantic contracts (`backend/schemas/ai_chat.py`, `backend/schemas/domain.py`), `TUTOR_MODE_ENABLED` flag (default `false`) + `GET /api/ai/capabilities`, and persistence plumbing (`interaction_mode`, `tutor_metadata`) — **no behavior change** for existing Explain/Web/Hybrid turns.
2. **PR-F3.1b (Tier 2):** Tutor prompt (`system_instruction`), `TutorTurnAnswer`, `generate_tutor_turn`, `validate_tutor_answer`, orchestration (`_generate_validated_tutor_path`, `_tutor_retrieval_query`, `_render_tutor_answer`, `409` mode/action guards, carry-forward `tutor_metadata` on insufficient evidence), backend unit tests, plus offline/live tutor eval cases (separate from `c1-v1` and `c3_baseline_v2`) — **`TUTOR_MODE_ENABLED` stays `false`** until PR-F3.2 frontend QA and a live tutor spot-check pass.
3. **PR-F3.2 (Tier 1 if frontend-only):** Frontend Tutor Mode UI (`AIStudyAssistantPanel.tsx`, `AIConversationMessage.tsx`, `types/ai-chat.ts`, `lib/api/ai-chat.ts`, `globals.css`), responsive/keyboard QA, and live tutor spot-check before enabling `TUTOR_MODE_ENABLED=true`.
4. **PR-F3.3 (Tier 0 docs / or folded after flip):** Update `docs/architecture.md`, `docs/tasks.md`, and `docs/roadmap.md`.

### Tests, risk tier, and unverified items
- **Backend & offline eval (WSL `.venv/bin/python`):** full `unittest` suite (including new `backend/test_tutor_mode.py` covering hint ladder `0..3`, `409` on disallowed `tutor_action` / non-`document` retrieval / disabled flag, `422` in Explain mode, `auto`-mode clarifying question graded as `check`, `INSUFFICIENT_EVIDENCE` carrying forward `tutor_metadata` and pointing to Explain mode, `_is_conversational_turn` bypass, `_tutor_retrieval_query`, `current_messages`-only scope, `e_XX` + F1.2 sanitizer + `system_instruction` checks), offline `backend/eval/` pytest, `backend/eval/run_c6.py --integrity-only`, and `backend/eval/test_prompt_injection.py`.
- **Migration & live RLS (PR-F3.1a):** Alembic `upgrade head -> downgrade -1 -> upgrade head` against `docker-compose.test.yml`, `scripts/run_local_rls_tests.py` (both live `app_role` RLS suites covering the new `ai_messages` columns), and `scripts/tests/test_runtime_tables_sync.py`.
- **Live evals (human-authorized once per merge candidate):** live `C3 -> C5 -> C6` vs `c3_baseline_v2` (zero regression on `STRICT_DOCUMENT`) plus separate live tutor spot-check (anti-sycophancy on wrong attempts and zero answer leaks at `hint_level` `0..2`) without modifying `c1-v1` or `c3_baseline_v2`.
- **Frontend (PR-F3.2):** `tsc --noEmit`, `npm run lint`, `npm run build` (CI placeholder Clerk env vars), responsive/keyboard QA (`1440 / 1024 / 768 / 390 px`), reload persistence, and `"Save as flashcard"` disabled on `probe`.
- **Risk tier:** **Tier 2** for PR-F3.1a / PR-F3.1b (schema-migration release path; touches `backend/alembic/**`, `backend/models/tables.py`, `backend/schemas/ai_chat.py`, `backend/core/config.py`, and prompt/eval-sensitive services); **Tier 1** for frontend-only PR-F3.2; **Tier 0** for docs-only PR-F3.3.
- **Unverified on `origin/main` @ `397dd36` (could not verify in code yet):**
  - Exact F1.1/F1.2 helper names and signatures (`system_instruction` parameter on `backend/services/llm_provider.py` and the F1.2 unified sanitizer in `backend/services/domain_validation.py` are not yet merged onto `origin/main`).
  - Exact F2-A Alembic revision ID that F3's migration will chain from (F2-A is not yet merged onto `origin/main`; current head is `cdadb6e6d15a`).
  - Live `gemini-2.5-flash` anti-sycophancy and no-answer-leak adherence under `TutorTurnAnswer` (requires live spot-check/eval after implementation).

---

## F4 and F5 (outline)

**F4 FSRS + review log.** `UserPreferences.daily_review_goal` and `sm2_aggressiveness` are saved-only today (`settings-form.tsx:68-71`), so this extends cleanly. Add `flashcard_reviews` (card, rating, timestamps, scheduled days, stability, difficulty, state) following the 1-hop-via-documents RLS pattern, add it to `RUNTIME_TABLES`, run FSRS in shadow beside SM-2, then switch per user. Schema-migration release path.

**F5 Exam planner.** No `study_sets` table exists; `/dashboard/study-sets` queries `Document`. Define `study_sets` and exams/goals (ownership, RLS, grants) first, then the scheduler combining due cards, weak quiz topics, and days remaining. Schema-migration release path.
