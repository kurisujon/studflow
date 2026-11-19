# Phase F: Trust and Study-Loop Depth (Spec v4, verified against code)

Status: v4 verified against `main` @ `f0b4948` (2026-11-19); F1.2 URL-policy decision confirmed. Follow the Handoff Rule: check off only what is verified in code.

Order: Prerequisite, F1 injection hardening, F2 citation Source Passage drawer, F3 tutor mode, F4 FSRS + review log, F5 exam planner.

Release-path rule (from `.github/workflows/application-release.yml:88-106`): changes to `docker-compose.yml`, `backend/alembic`, `backend/models/tables.py`, or `backend/schemas/ai_chat.py` block the migration-free release workflow. F1 and the prerequisite must stay clear of those files so they ship on the fast path. F2, F4, and F5 ship through the schema-migration release path.

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

## F3 to F5 (outline)

**F3 Tutor mode.** Third generation path beside `STRICT_DOCUMENT` and `TEACHING`: Socratic prompts, hint ladder, answer checking against retrieved evidence, citations kept. Uses the F1 system-instruction pattern from the start.

**F4 FSRS + review log.** `UserPreferences.daily_review_goal` and `sm2_aggressiveness` are saved-only today (`settings-form.tsx:68-71`), so this extends cleanly. Add `flashcard_reviews` (card, rating, timestamps, scheduled days, stability, difficulty, state) following the 1-hop-via-documents RLS pattern, add it to `RUNTIME_TABLES`, run FSRS in shadow beside SM-2, then switch per user. Schema-migration release path.

**F5 Exam planner.** No `study_sets` table exists; `/dashboard/study-sets` queries `Document`. Define `study_sets` and exams/goals (ownership, RLS, grants) first, then the scheduler combining due cards, weak quiz topics, and days remaining. Schema-migration release path.
