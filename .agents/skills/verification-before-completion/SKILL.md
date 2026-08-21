---
name: verification-before-completion
description: Enforce fresh evidence before any StudFlow completion, fixed, working, or resolved claim. Use at the end of investigations and implementations to verify required commands, acceptance criteria, reviewer status, final diff, and working-tree state with explicit PASS, FAIL, NOT RUN, or NOT APPLICABLE outcomes.
---

# Verification Before Completion

No completion claim is valid without fresh verification.

## Build the Verification Matrix

For each applicable requirement, record:

| Check | Command or evidence | Result | Notes |
| --- | --- | --- | --- |
| Tests | Repository-supported command | PASS / FAIL / NOT RUN / NOT APPLICABLE | Exit status and scope |
| Lint | Repository-supported command | PASS / FAIL / NOT RUN / NOT APPLICABLE | Exit status and scope |
| Type/build | Type validation or production build | PASS / FAIL / NOT RUN / NOT APPLICABLE | Exit status and scope |
| Backend validation | Compile, import, or targeted test | PASS / FAIL / NOT RUN / NOT APPLICABLE | Exit status and scope |
| Acceptance criteria | Direct evidence per criterion | PASS / FAIL / NOT RUN / NOT APPLICABLE | Evidence |
| Review | Independent reviewer verdict | PASS / FAIL / NOT RUN / NOT APPLICABLE | Blocking findings |
| Git diff | Final diff inspection | PASS / FAIL / NOT RUN / NOT APPLICABLE | Intended files only |
| Working tree | `git status --short` | PASS / FAIL / NOT RUN / NOT APPLICABLE | Pre-existing versus task changes |

Use only commands confirmed by manifests, tests, scripts, or CI. Current baseline commands are documented in root `AGENTS.md` and `docs/codex-orchestration.md`; recheck the repository because they may change.

## Result Rules

- **PASS:** The check ran successfully or direct evidence proves the criterion.
- **FAIL:** The check ran and failed, or evidence disproves the criterion.
- **NOT RUN:** The check was applicable but was not executed.
- **NOT APPLICABLE:** The check does not apply; state why.

Never treat NOT RUN as PASS. Never convert an environment failure into PASS. Distinguish product failures, pre-existing failures, missing dependencies, unavailable services, and sandbox limitations.

## Blocking Conditions

Do not claim completion when:

- a required check is FAIL or NOT RUN
- an acceptance criterion is unverified
- Critical or High reviewer findings remain
- a Medium finding has no explicit disposition
- corrective code changed after the last test or review
- the final diff contains unexplained files
- the working-tree state is not understood

When blocked, return the task to the orchestrator with the exact missing evidence or failure. After corrective code changes, require affected testing and review again.

## Completion Evidence

Only after the matrix satisfies the gate, report:

- verified outcome
- files changed
- commands and results
- acceptance-criteria status
- reviewer verdict
- remaining non-blocking risks

Avoid unsupported words such as `done`, `fixed`, `complete`, `working`, or `resolved`.
