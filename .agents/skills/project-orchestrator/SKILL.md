---
name: project-orchestrator
description: Coordinate complex StudFlow investigation, bug fixes, features, refactors, UI/design work, architecture, database, security, performance, deployment, and cross-frontend/backend tasks through evidence gathering, planning, controlled implementation, independent testing, review, and verification. Use for multi-file or elevated-risk work; skip the full lifecycle only for genuinely small, isolated, low-risk tasks.
---

# Project Orchestrator

Use the main Codex session as the orchestrator. Preserve user authority, repository instructions, existing architecture, and the current working tree. Use native custom agents named `explorer`, `architect`, `implementer`, `tester`, and `reviewer`.

## Stage 1: Classify

Classify the request as one or more of:

- investigation
- bug fix
- feature
- refactor
- UI/design
- architecture
- database
- documentation
- security
- performance
- deployment

Record:

- objective and explicit non-goals
- scope and risk
- affected frontend, backend, database, infrastructure, documentation, or contracts
- whether independent read-only investigation can run in parallel
- whether any write tasks are independent
- whether isolated worktrees are required

Use the full lifecycle for multi-file, cross-system, security-sensitive, database, deployment, architecture, or high-regression-risk work. A small isolated change may bypass subagents, but never bypass applicable context gathering and verification.

For a read-only request, prohibit implementation and stop after investigation, synthesis, and evidence verification.

## Stage 2: Gather Context

Before implementation:

1. Inspect `git status --short` and `git worktree list`.
2. Read root `AGENTS.md` and every applicable nested `AGENTS.md`.
3. Read the required project documents named by `AGENTS.md`.
4. Inspect the relevant implementation, tests, manifests, configuration, and CI.
5. Identify pre-existing user changes and protect them.
6. Confirm commands, files, APIs, and behavior from the repository; never assume them.

Do not use historical UUID-based files directly under `.agents/` as active agent definitions. Active skills live under `.agents/skills/`; custom agents live under `.codex/agents/`.

## Stage 3: Investigate in Parallel

Spawn `explorer` agents when multiple independent areas need evidence. Suitable scopes include:

```text
Explorer A → frontend structure and render/layout path
Explorer B → backend request/service/task path
Explorer C → persistence, migrations, and data contracts
Explorer D → tests, CI, deployment, and configuration
```

The configured limit allows at most four subagent threads in addition to the primary. Run a second batch if more scopes are necessary.

Parallelize read-only work only when scopes are independent. Give each explorer a bounded question and require:

- inspected scope
- exact file and symbol evidence
- verified findings
- symptom versus root-cause distinction
- hypotheses labeled by confidence
- risks and unknowns
- recommended area of change

Wait for every required explorer before planning. Reconcile contradictions by inspecting the source or sending a targeted follow-up; do not choose a convenient answer.

## Stage 4: Plan

Send the consolidated evidence—not raw noisy logs—to `architect`.

Require:

- problem statement
- verified root cause or clearly labeled unresolved assumption
- exact affected files and systems
- ordered implementation steps
- dependencies and rollout order
- acceptance criteria
- repository-supported verification commands
- risks, compatibility constraints, and rollback considerations
- worktree and file-ownership requirements, if applicable

Reject plans that introduce unnecessary dependencies, parallel architectures, broad rewrites, or unverified files. Do not implement until the plan is coherent.

## Stage 5: Implement

Assign the accepted plan to `implementer`.

Default policy:

```text
one write agent
one primary worktree
```

Allow parallel implementation only when all conditions hold:

- tasks are independent
- files do not overlap
- each writer has an isolated Git worktree
- integration and verification order is explicit
- existing user changes are not displaced

Never assign concurrent writes to the same file or shared contract. V1 does not automatically create worktrees; obtain user authority before creating or cleaning them.

Require the implementer to report changed files, plan deviations, and blockers. Do not let the implementer self-approve completion.

## Stage 6: Test

After implementation, send the plan, acceptance criteria, changed files, and expected validation to `tester`.

Have the tester inspect current support before selecting commands. Current CI baselines are:

Frontend, from `frontend/`:

```bash
npm run lint
npm run build
```

Backend, from `backend/`:

```bash
python -m compileall .
python -c "from main import app; print(app.title)"
```

Do not invent `npm test` or `npm run typecheck`; those scripts are not currently defined. Inspect backend tests and installed dependencies before running targeted test commands.

Require PASS, FAIL, NOT RUN, or NOT APPLICABLE for every check. Capture the command, working directory, exit status, relevant output, and acceptance criterion covered.

## Stage 7: Test Failure Loop

If required validation fails:

```text
tester
→ failure report
→ main orchestrator
→ $systematic-debugging
→ implementer when a code change is required
→ tester rerun
```

Do not proceed to final review while required tests fail. Distinguish implementation failures from environment limitations, missing services, absent dependencies, and pre-existing failures.

Every corrective code change requires fresh affected validation.

## Stage 8: Request and Perform Review

Use `$requesting-code-review` to package:

- task objective
- accepted plan
- acceptance criteria
- changed files
- final diff
- tests already run
- known concerns

Send that context to `reviewer`. Require review of:

- functional correctness
- regressions
- security
- architecture and contracts
- data integrity
- accessibility when applicable
- test adequacy
- maintainability

Require findings to be categorized as Critical, High, Medium, or Low with exact file evidence.

## Stage 9: Review Failure Loop

Critical and High findings block completion. Medium findings require explicit disposition.

When a blocking finding exists:

```text
reviewer
→ main orchestrator
→ implementer
→ tester
→ reviewer
```

Never bypass re-testing after a review-driven code change. Repeat review until blocking findings are resolved or the user explicitly changes scope.

## Stage 10: Verify Before Completion

Invoke `$verification-before-completion`.

Require fresh evidence for every applicable item:

- tests
- lint
- type validation or production build
- backend validation
- acceptance criteria
- review status
- final Git diff
- working-tree state

Never treat NOT RUN as PASS. Never say `done`, `fixed`, `complete`, `working`, or `resolved` without evidence.

## Stage 11: Report

Return conclusions and evidence without internal chain-of-thought.

Include:

- objective or root cause
- what changed
- files changed
- tests and verification performed
- independent review result
- known remaining risks
- recommended next action when needed

If work is blocked or only partially verified, say so explicitly and identify the exact missing evidence or authority.
