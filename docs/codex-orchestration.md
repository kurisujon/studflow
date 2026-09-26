# StudFlow Supervised Antigravity + Codex Workflow

## Purpose and Authority

This is the required engineering workflow for StudFlow work performed in Orca. It governs agent collaboration only; it does not change application behavior, architecture, runtime configuration, commits, or deployment.

| Role | Authority and responsibility |
| --- | --- |
| Antigravity | Coordinator, planner, architect, task manager, reviewer, and QA authority. |
| Codex GPT-5.6 (medium) | Primary implementer, coder, and debugger. |
| Human | Approves the plan before implementation; performs the final diff review and merge after QA passes. |
| CI and deterministic tools | Provide repeatable validation evidence; they do not replace Antigravity review or human approval. |

Antigravity owns task state, specifications, review verdicts, and the decision to return work for correction. Codex implements only the approved specification and does not self-approve a task or merge changes.

## Required Lifecycle

```text
Antigravity context and investigation
        ↓
Written specification and task plan
        ↓
Human plan approval
        ↓
Codex implementation + self-test
        ↓
Fresh Antigravity review against approved specification
        ↓
Human final diff review and merge approval
```

1. **Orient and investigate.** Antigravity inspects the current Git state, applicable `AGENTS.md` files, required project documents, affected code, contracts, tests, and CI. It preserves pre-existing user changes and explicitly records scope and non-goals.
2. **Plan.** Antigravity produces a written, testable specification: objective, affected files and systems, ordered tasks, acceptance criteria, repository-supported self-test commands, risks, rollback notes, and any parallel ownership boundaries.
3. **Human approval gate.** Antigravity obtains human approval of the plan before any implementation task begins. Material scope, contract, or architecture changes require a revised plan and fresh human approval.
4. **Implement and self-test.** Codex GPT-5.6 with medium reasoning effort implements only its assigned specification. Before returning, it self-tests using the planned, repository-supported checks and reports changed files, commands, exit statuses, results, deviations, and blockers.
5. **Review and QA.** Antigravity opens a fresh review context. It compares the implementation, final diff, and self-test evidence directly against the approved specification and checks architecture, contracts, security, regressions, accessibility where applicable, data integrity, and test adequacy.
6. **Human final gate.** After Antigravity records a passing review, the human reviews the final diff and decides whether to merge. No agent commits, pushes, or merges application changes unless separately authorized by the human.

## Parallel Implementation Policy

Read-only investigation may run in parallel when independent. Implementation may run in parallel only when Antigravity records all of the following before dispatch:

- each task's explicitly non-overlapping file scope;
- a named Codex owner for each scope;
- no shared API, schema, migration, generated artifact, or configuration contract is being concurrently changed; and
- the integration and verification order.

If any scope overlaps or a shared contract changes, Antigravity serializes the work or revises the approved plan. Each Codex task self-tests its own scope; integration receives the additional checks identified in the approved plan.

## Review Failure Loop

Review is independent of the implementation context. A failing review routes only to the owning Codex implementation task with the finding, affected acceptance criterion, and required verification evidence.

```text
Fresh Antigravity review fails
        ↓
Owning Codex task corrects and self-tests
        ↓
Fresh Antigravity review repeats
```

Antigravity tracks attempts per implementation task. It may return a task for correction at most three times; if it still does not pass, Antigravity stops implementation and escalates to the human with the evidence, remaining risks, and a recommended scope or plan decision. Every corrective change requires fresh self-test evidence and another fresh Antigravity review.

## StudFlow Safety Gates

- The current evaluation constraints in `docs/ORCA_HANDOFF.md`, `docs/tasks.md`, and `docs/roadmap.md` remain binding.
- Do not start Phase D until Phase C's baseline closure and formal gate are complete.
- Do not consume Gemini quota, alter Phase B behavior, alter the production retrieval threshold, or regenerate frozen evaluation outputs unless the approved task explicitly permits it and existing evaluation rules allow it.
- Workflow setup is documentation and agent-governance work only. It must not change application behavior and must not commit or push application changes.

## Required Handoff Record

For every implementation dispatch, Antigravity supplies: the approved specification reference, task objective, explicit file scope, acceptance criteria, self-test commands, known pre-existing changes, and attempt number. Codex returns: changed files, self-test evidence, deviations, blockers, and unresolved risks.

For every review, Antigravity records: the approved specification reference, reviewed diff, self-test evidence, verdict, findings by severity, acceptance-criteria status, and next owner. A passing review is necessary but does not replace the human final diff review and merge decision.
