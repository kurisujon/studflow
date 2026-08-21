---
name: requesting-code-review
description: Prepare complete, evidence-based context for an independent StudFlow code review after implementation and testing. Use before assigning the reviewer so the reviewer receives the objective, accepted plan, acceptance criteria, changed files, diff, validation results, and known concerns without reconstructing the task.
---

# Requesting Code Review

Prepare one review packet from repository evidence. Do not ask the reviewer to infer the original task from the diff alone.

## Required Context

Include:

1. **Task objective:** User-visible or technical outcome and explicit non-goals.
2. **Accepted plan:** Ordered implementation approach and any approved deviations.
3. **Acceptance criteria:** A checkable list with current status.
4. **Changed files:** Exact paths and the reason each changed.
5. **Git diff:** Final relevant diff, including configuration, tests, migrations, and documentation.
6. **Validation:** Commands, working directories, exit statuses, and PASS/FAIL/NOT RUN/NOT APPLICABLE results.
7. **Known concerns:** Remaining risks, environment limitations, pre-existing failures, compatibility questions, or areas needing special attention.

## Pre-Review Checks

- Confirm the diff reflects the current working tree.
- Separate pre-existing user changes from task changes.
- Confirm no secrets or private environment values appear.
- Confirm failed or unrun checks are disclosed.
- Identify architecture, API, authentication, data, accessibility, and deployment surfaces affected.

## Reviewer Request

Ask the `reviewer` to prioritize:

1. functional defects
2. regressions
3. security problems
4. architecture or contract violations
5. data-integrity issues
6. accessibility problems
7. missing tests
8. maintainability problems

Require exact file evidence and Critical, High, Medium, or Low severity. Require an explicit statement on whether acceptance criteria were met and whether blocking findings remain.

Do not ask for style-only review. Do not hide uncertainty or summarize failing checks as successful.
