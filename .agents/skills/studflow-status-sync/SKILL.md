---
name: studflow-status-sync
description: >
  Verify that work claimed as done for StudFlow is implemented and reachable in the codebase,
  then synchronize verified checklist items in docs/tasks.md and append a dated handoff entry to
  docs/roadmap.md. Also answer questions about the current phase, shipped work, remaining work, or
  next steps by reading those documents instead of guessing. Use after finishing a task or feature,
  before ending a work session when code changed without matching status-doc updates, when asked to
  mark work done or update project docs, or whenever asked for StudFlow status, phase, or progress.
---

# StudFlow Status and Docs Sync

Keep `docs/tasks.md` and `docs/roadmap.md` aligned with verified repository reality. Select the mode
that matches the request. When the user reports completed work and asks for current status, run Mode
B first and Mode A afterward.

## Mode A: Read Project Status

Use this mode for status questions. Make no file edits.

1. Read `docs/roadmap.md`, focusing on:
   - Product Snapshot
   - Current Priority Workstream
   - the most recent `### Update: <date>` entry at the bottom
2. Read `docs/tasks.md` and locate the first actionable implementation section containing unchecked
   `- [ ]` items. Do not mistake explicit non-goals or policy reminders for active implementation.
3. Return a short, direct summary containing:
   - current phase or active workstream
   - most recently shipped work from the latest Update entry
   - unchecked work in the active section
   - the latest Update entry's `What to do next`
4. If `docs/tasks.md` and `docs/roadmap.md` disagree, identify the disagreement explicitly. Do not
   silently choose one source.

## Mode B: Verify and Synchronize Completed Work

Use this mode after implementation, for requests to mark work done or update status docs, and before
ending a work session when implementation changed but status docs did not.

Never mark work complete because the conversation or an agent claims it is complete. Verify it from
the current working tree.

### 1. Complete the preflight

1. Inspect `git status --short` and preserve unrelated changes.
2. Read the current root `AGENTS.md` and every closer applicable `AGENTS.md`.
3. Read the required project documents in repository order:
   - `docs/GUARDRAILS.md`
   - `docs/architecture.md`
   - `docs/tasks.md`
   - `docs/agents.md`
   - `docs/roadmap.md`
4. Re-read the latest dated roadmap entry immediately before appending a new one.
5. Inspect manifests, CI configuration, implementation, and tests relevant to the claim. Do not rely
   on documentation or filenames alone.

### 2. Identify each completion claim

List the concrete items supposedly implemented, such as:

- API routes and service behavior
- models, fields, and migrations
- pages, components, and user-visible interactions
- checklist lines in `docs/tasks.md`
- contract changes involving APIs, schemas, environment variables, storage, or generated artifacts

Treat each item as an independent acceptance criterion.

### 3. Verify implementation and reachability

- For a backend route or model, find it under `backend/` and confirm the owning router is included in
  `backend/main.py` or another reachable parent router. Confirm reusable logic is invoked, not merely
  defined.
- For a frontend feature, find the page or component and trace its import/render path from a reachable
  route. Do not count dead components or unused helpers.
- For a migration, confirm the Alembic revision exists under `backend/alembic/versions/`, implements
  the claimed schema change, and participates in the current revision chain.
- For configuration or contract changes, trace both producers and consumers and check deployment or
  environment templates where applicable.
- Inspect relevant tests and distinguish mocked unit coverage from live integration evidence.

Run fresh, proportionate validation using commands supported by the current repository and
environment:

- Always run `git diff --check`.
- For touched backend Python files, run `python3 -m py_compile <files>` or the equivalent command with
  the repository's supported Python interpreter when the global interpreter is incompatible.
- For frontend changes, run `./node_modules/.bin/tsc --noEmit --pretty false` from `frontend/`.
- Run targeted repository tests for changed behavior when available.
- Run `npm run build` from `frontend/` only when the frontend change is broad enough to warrant a
  production build or when repository completion rules require it.
- Follow stricter checks required by `AGENTS.md`; never downgrade a required check to a lighter one.

Record each check as `PASS`, `FAIL`, `NOT RUN`, or `NOT APPLICABLE`. Never treat `NOT RUN` as `PASS`.

### 4. Stop on missing evidence

If any claimed shipped item is absent, unreachable, contradicted by tests, or insufficiently
verified, do not check it off and do not log it as shipped. Tell the user exactly what is missing,
failed, or still unverified. Preserve unrelated verified checklist state.

### 5. Update the execution checklist

Edit `docs/tasks.md` only for verified work:

- Change `- [ ]` to `- [x]` only when the corresponding acceptance criterion is satisfied.
- If verified work has no checklist line, add a concise item under the existing correct section.
- Do not force work into an unrelated section or invent a new formatting convention.
- Keep unchecked follow-up work explicit.

### 6. Append the roadmap handoff

Append after the existing dated Update log. Never rewrite, reorder, or remove earlier entries. Use
today's actual local date and match this format:

```markdown
### Update: YYYY-MM-DD — <short title>

**What Changed:**
- <bullet per verified change, with repository-relative file paths where useful>

**Contracts Changed:**
- <API/schema/environment changes, or "None.">

**Docs Stale:**
- <"No." or the exact document and section still out of date>

**What to do next:**
- <the next verified or still-unchecked work item>
```

Report validation limitations honestly in the entry. Do not describe an unrun check or unavailable
runtime as validated.

### 7. Synchronize contract documentation

When an API route, database schema, environment variable, storage contract, or other system contract
changed, inspect `docs/architecture.md`. Update the existing relevant section when necessary so it
does not drift from the verified implementation. Avoid unrelated documentation rewrites.

### 8. Review the final synchronization

Before reporting completion:

1. Re-read the changed sections of `docs/tasks.md`, `docs/roadmap.md`, and, when applicable,
   `docs/architecture.md`.
2. Confirm checklist and narrative status describe the same reality.
3. Inspect the final diff and working-tree state.
4. Report files changed, verification results, remaining unchecked work, and any known stale docs.

## Ground Rules

- Treat `docs/tasks.md` as the execution checklist and `docs/roadmap.md` as the narrative handoff log.
- Keep both documents aligned in the same pass when an edit to one changes the meaning of the other.
- Match existing headings, checklist syntax, and handoff formatting.
- Never invent implementation evidence, test results, phases, dates, or validation claims.
- Never expose secrets or private environment values while inspecting configuration.
- Preserve unrelated user changes in a dirty working tree.
