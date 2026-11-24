## Agent Team & Workflow

StudFlow uses the Nexora agent team (**Vikir**, planner/engineer lead; **Kayden**, programmer; **Selene**, QA/tester). See `docs/agents.md` as the single source of truth for team roles, engineering standards, UI/UX directives, system fidelity, tiered plan and deploy gates, serial handoff loop, dispatch/review schemas, QA test matrix, and model/quota rules.

# Agent Instructions

Before making architectural or product changes, review these documents in order:

1. `docs/GUARDRAILS.md`
2. `docs/architecture.md`
3. `docs/tasks.md`
4. `docs/agents.md`
5. `docs/roadmap.md`

Constraints:
- Keep the monorepo structure with `frontend/`, `backend/`, and `docs/`.
- Do not introduce microservices.
- Do not move `docs/` inside frontend or backend.
- Do not change business logic unless explicitly requested.

## Current System State
- **Active Phase:** Phase F: Trust & Study-Loop Depth, in progress (PR-0 merged; see `docs/phase-f-spec.md`). Phase E (Verified Web Grounding & Conversational Turns) is merged on `main`.
- **Live Status & Next Steps:** Treat `docs/roadmap.md` (dated updates and latest verification evidence) and `docs/tasks.md` (checked/unchecked checklist items) — together with `git log origin/main` — as the live source of truth rather than duplicating point-in-time build counts or recent landings here.
- **Production & Rollout Status:** See `docs/roadmap.md` (do not assume production deploy, V2.1.1 RLS cutover, or runtime flag state from this file).
