# StudFlow Codex CLI Orchestration

## Overview

StudFlow Codex CLI Orchestration v1 provides a small project-local workflow for investigating, planning, implementing, testing, reviewing, and verifying development tasks. It uses native Codex multi-agent support, custom agents, and repository skills. It does not add an external orchestrator or change application behavior.

The main Codex session is the orchestrator. `$project-orchestrator` is the authoritative reusable workflow for complex work.

## Architecture

```text
User
 ↓
Main Codex session
 ↓
$project-orchestrator
 ↓
Task classification and context gathering
 ↓
Read-only explorers
 ↓
Architect
 ↓
Implementer
 ↓
Tester
 ↓
Reviewer
 ↓
$verification-before-completion
 ↓
Completion
```

Read-only requests stop after investigation, synthesis, and verification. They do not invoke the implementer.

## Agent Roles

### Explorer

Locate relevant files, trace frontend/backend/data/configuration paths, distinguish symptoms from root causes, and return exact evidence. Explorer is read-only.

### Architect

Turn verified findings into an ordered implementation plan with affected files, dependencies, acceptance criteria, verification commands, risks, and rollback considerations. Architect is read-only and never implements.

### Implementer

Execute the accepted plan through focused changes that follow existing architecture. One implementer may write to the primary worktree at a time.

### Tester

Independently run applicable validation and report command, exit status, and relevant failure output. Tester may create build/test artifacts but must not edit application source.

### Reviewer

Independently review the final diff, architecture, security, accessibility where applicable, regression risk, tests, and acceptance criteria. Reviewer is read-only and categorizes findings as Critical, High, Medium, or Low.

## Permissions

| Agent | Source writes | Test/build artifacts | Parallel safe |
| --- | ---: | ---: | ---: |
| Explorer | No | No | Yes |
| Architect | No | No | Yes |
| Implementer | Yes | Yes | Only isolated |
| Tester | No source changes | Yes | Usually |
| Reviewer | No | No | Yes |

Sandbox configuration lives in `.codex/agents/*.toml`. Runtime permission choices made by the parent session can still constrain child agents.

## Task Lifecycle

1. **Classify:** Identify task type, scope, risk, affected systems, useful parallel investigation, and whether worktree isolation is required.
2. **Gather context:** Read applicable `AGENTS.md`, required project documents, Git state, relevant implementation, tests, package scripts, and CI.
3. **Investigate:** Run independent read-only explorer tasks in parallel when scopes do not depend on each other.
4. **Plan:** Have the architect synthesize verified findings into a coherent plan and acceptance criteria.
5. **Implement:** Use one implementer in the primary worktree unless isolated worktrees and non-overlapping ownership are established.
6. **Test:** Have the tester run repository-supported validation independently.
7. **Review:** Have the reviewer inspect the final diff and verification evidence.
8. **Verify:** Apply `$verification-before-completion`; report PASS, FAIL, NOT RUN, or NOT APPLICABLE for each required check.
9. **Complete:** Report objective/root cause, changes, files, validation, review outcome, remaining risks, and next action.

Small, isolated, low-risk changes may bypass the full agent sequence, but cannot bypass applicable preflight and verification.

## Failure Loops

### Test failure

```text
tester failure report
→ orchestrator
→ $systematic-debugging
→ implementer
→ tester rerun
```

Do not proceed to final review while required validation fails.

### Review failure

```text
reviewer blocking finding
→ orchestrator
→ implementer
→ tester
→ reviewer
```

Critical and High findings block completion. Medium findings require explicit disposition. Low findings may be documented for follow-up.

### Architecture concern

Return the concern and evidence to the architect. Revise the plan before implementation continues. Do not solve an architecture disagreement through unplanned code changes.

### Implementation blocker

The implementer reports the exact blocker, affected step, evidence, and authority or input needed. The orchestrator may narrow, re-plan, or request user direction; it must not silently broaden scope.

## Parallelism

Parallel reading is encouraged for independent frontend, backend, database, test/CI, and configuration investigations. The orchestrator waits for all required findings before planning.

Parallel writing is prohibited in the same working tree. It is allowed only when:

- tasks are independent
- file ownership does not overlap
- each writer has an isolated Git worktree
- integration and verification order is defined first

## Git Worktrees

V1 documents worktree isolation but does not create or clean up worktrees automatically. A future isolated implementation may begin with a user-approved command such as:

```bash
git worktree add ../studflow-feature-x -b feature/x
```

Before creating one, inspect `git worktree list`, branch state, uncommitted changes, target path, and ownership. Never move existing user changes into a worktree without explicit direction.

## Invocation

Explicit skill invocation:

```text
$project-orchestrator fix the inconsistent landing-page spacing.
```

Natural-language invocation:

```text
Use the project orchestrator to investigate this backend/frontend bug.
```

Read-only investigation:

```text
$project-orchestrator audit the landing-page container hierarchy and report which files control horizontal width and section spacing. Do not modify anything.
```

## Verification

Local verification should match CI whenever applicable.

Current CI baselines:

| Area | Working directory | Command |
| --- | --- | --- |
| Frontend lint | `frontend/` | `npm run lint` |
| Frontend production build | `frontend/` | `npm run build` |
| Backend compilation | `backend/` | `python -m compileall .` |
| FastAPI import smoke test | `backend/` | `python -c "from main import app; print(app.title)"` |

Additional checks are selected only after inspecting repository support. `frontend/package.json` currently has no `test` or `typecheck` script. `backend/test_phase4_rag.py` uses `unittest`; run targeted backend tests only when their dependencies and required environment are available.

Before completion, confirm:

- required commands ran and exited successfully
- acceptance criteria were checked
- blocking review findings were resolved
- the final diff contains only intended files
- the working-tree state, including pre-existing changes, is understood

`NOT RUN` is never equivalent to `PASS`.

## Historical `.agents` Records

Tracked UUID-based briefings, handoffs, progress files, and one-off orchestrator records predate v1. Some are already deleted in the working tree. They remain recoverable from Git history and are not restored or deleted by this setup.

The only active reusable meaning of `.agents/` going forward is `.agents/skills/`.

## MCP

MCP is not required for orchestration v1.

Add MCP only when an external service integration has a demonstrated need. V1 does not configure `.mcp.json`, MCP servers, Codex MCP-server automation, or an Agents SDK.
