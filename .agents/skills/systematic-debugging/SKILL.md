---
name: systematic-debugging
description: Diagnose StudFlow frontend, backend, data, task, configuration, build, and deployment failures through reproducible evidence and execution-path tracing before applying the smallest valid fix. Use when behavior is broken, inconsistent, flaky, unexplained, or when tests or review reveal a failure.
---

# Systematic Debugging

Follow this sequence:

```text
reproduce
→ collect evidence
→ trace the execution, render, or data path
→ form a falsifiable hypothesis
→ test the hypothesis
→ implement the smallest valid fix
→ verify the regression
```

## 1. Reproduce

- Record expected and actual behavior.
- Identify the smallest reliable reproduction.
- Capture the command, route, viewport, data state, environment, and error output that matter.
- If reproduction is impossible, state the limitation and gather the best static evidence. Do not claim a root cause prematurely.

## 2. Collect Evidence

- Inspect current Git state and applicable `AGENTS.md`.
- Read relevant logs, stack traces, tests, configuration, and implementation.
- Confirm versions and commands from manifests and CI.
- Separate facts, hypotheses, and unrelated observations.

## 3. Trace the Path

For frontend issues, trace:

```text
global styles
→ root and route-group layouts
→ wrappers and containers
→ components
→ local overrides
→ responsive rules
→ browser behavior
```

For backend issues, trace:

```text
request
→ route and validation
→ service
→ database/storage
→ background task
→ response and persisted state
```

For CI/deployment issues, trace:

```text
trigger
→ workflow job
→ environment/config
→ build artifact
→ deployment script
→ runtime service and health check
```

Locate the earliest point where actual behavior diverges from expected behavior.

## 4. Form and Test a Hypothesis

- State one concrete cause and the evidence that predicts it.
- Identify an observation or focused command that could disprove it.
- Test the hypothesis with the narrowest safe check.
- If disproved, return to evidence; do not stack speculative fixes.

## 5. Implement the Smallest Valid Fix

Only the authorized implementer changes source. Preserve architecture and contracts. Change the source of the problem, not a downstream symptom. Avoid unrelated cleanup.

Explicitly forbid:

- random CSS tweaks
- random dependency changes
- blind retries
- large speculative refactors
- fixing symptoms before locating the source
- suppressing errors or disabling validation to make tests pass

## 6. Verify

- Re-run the reproduction.
- Run the narrowest affected regression test.
- Run applicable lint, build, compile, and integration checks supported by the repository.
- Inspect the final diff for accidental changes.
- Report PASS, FAIL, NOT RUN, or NOT APPLICABLE.

If the fix changes source, return to the orchestrator for independent tester validation and reviewer inspection.
