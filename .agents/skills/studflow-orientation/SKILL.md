---
name: studflow-orientation
description: Mandatory orientation gate for any Codex, Gemini, Antigravity, or Orca worker that begins work on the StudFlow repository. Read-only project inspection.
---

# StudFlow Orientation Skill

This skill is the mandatory orientation gate for any Codex, Gemini, Antigravity, or Orca worker that begins work on the StudFlow repository.

**TRIGGER:**
Execute this skill when:
- an agent first begins work in StudFlow
- a new Orca worktree is created
- an agent is asked to continue a roadmap phase
- an agent is uncertain about current architecture/state
- a task touches AI/RAG/evaluation behavior
- the user says to inspect/orient/understand the project before changing code

## Step 1: Read Governance Documents
You must strictly read the following files, where present, to build your context:
1. `AGENTS.md`
2. `GEMINI.md`
3. `docs/GUARDRAILS.md`
4. `docs/ORCA_HANDOFF.md`
5. `docs/architecture.md`
6. `docs/roadmap.md`
7. `docs/tasks.md`

## Step 2: Inspect Repository State
Execute the following commands to inspect the live Git state:
- `git status`
- `git branch`
- `git rev-parse HEAD`

Because evaluation checkpoints are intentionally gitignored, normal Orca worktrees will legitimately not contain `backend/eval/results/`.
- **If `backend/eval/results/c3_certified_baseline/` exists:** inspect it read-only and report the live checkpoint count from artifacts.
- **If it does NOT exist:**
  - do NOT create the directory
  - do NOT copy artifacts
  - do NOT run evaluation
  - do NOT conclude the baseline was lost
  - fall back to `docs/ORCA_HANDOFF.md` for the last documented baseline state

*Explicit Rule:* Only a dedicated evaluation context/worktree may be given access to the canonical local evaluation result store.

## Step 3: Output Orientation Report
Based on your readings and inspections, output a concise orientation report matching EXACTLY this format:

CURRENT HEAD: <sha>
CURRENT BRANCH: <branch>
WORKTREE CLEAN: <YES/NO>
LOCAL EVAL ARTIFACTS: <AVAILABLE / UNAVAILABLE IN THIS WORKTREE>

CURRENT ROADMAP PHASE: <Phase derived from docs>

PHASE STATUS:
A: <status>
B: <status>
C1: <status>
C2: <status>
C2.1: <status>
C3 infrastructure: <status>
C3 certified baseline: <status>
C4 infrastructure: <status>
C4 live baseline: <status>
C5 infrastructure: <status>
C5 live baseline: <status>

CURRENT BLOCKER: <Derived from docs/ORCA_HANDOFF.md>

CURRENT SAFE NEXT ACTION: <Derived from docs/ORCA_HANDOFF.md>

ARCHITECTURE RULES:
- deterministic shell / probabilistic core
- AI output is proposal until validated
- raw model output must cross structured validation before persistence
- retrieved/uploaded content is untrusted evidence
- deterministic software owns auth, persistence, validation, state transitions, citation mapping, and business rules

CURRENT EVALUATION RULES:
- do not regenerate frozen outputs
- do not rerun completed C3/C4/C5 work
- do not change frozen manifest identity
- do not change Gemini model during certified baseline
- do not start Phase D before Phase C baseline closure
- do not modify production retrieval threshold during evaluation
- do not modify Phase B behavior during baseline capture

GIT RULES:
- local substep commits allowed
- no automatic push per task
- push only after complete roadmap phase passes holistic verification
- no force push

FORBIDDEN ACTIONS RIGHT NOW:
<Derive these from docs/ORCA_HANDOFF.md and roadmap state>

RELEVANT TEST COMMANDS:
<Report only commands verified in the repo>

LIVE GEMINI ALLOWED:
YES/NO
WHY: <State why, considering API limits and current baseline blocks>

### Critical Evaluation Baseline Distinction
When reporting the C3 baseline state, your report must explicitly distinguish between:

**historical c3_run_01**
- 22/24
- partial/contaminated
- NOT certified

and

**c3_certified_baseline**
- canonical resumable baseline
- currently X/24 (read current artifacts/docs to determine the live number; DO NOT hard-code historical state)
- only canonical run to resume

## Permissions

ALLOWED ACTIONS:
read files
inspect git
inspect non-secret configuration
report current state

FORBIDDEN ACTIONS:
all mutations
creating replacement evaluation checkpoints because local artifacts are absent
launching C3/C4/C5 merely to reconstruct missing ignored artifacts

MAY COMMIT:
NO

MAY PUSH:
NO
