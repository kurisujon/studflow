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
- **Active Phase**: Phase E — Verified Web Grounding & Conversational Turns (implemented & verified behind `WEB_GROUNDING_ENABLED=false`; pending PR merge and production rollout)
- **Status**: Phase D is Completed, Dashboard UI evolution (Phases 12-15) is complete, V2.1.1 RLS runtime transition tooling is merged (PR #8), and Phase E (`E1`–`E6`) is implemented on `feature/verified-web-grounding` with independent security review completed. Production has not yet executed the V2.1.1 transition or enabled `WEB_GROUNDING_ENABLED`.
- **Recent Landings**: Conversational turn fast-path (`E1`), Gemini Google Search retrieval + SSRF-guarded excerpt verification (`E2`), `WEB`/Hybrid claim validation & provenance separation (`E3`–`E4`), capability-gated Web/Hybrid UI + sandboxed Search attribution (`E5`), and full unit/eval/C6/build/security verification (`E6`).
- **Next Steps**: Human PR review and merge of `feature/verified-web-grounding`, execute the V2.1.1 `S0 -> S3` RLS runtime transition in an approved maintenance window, then deploy and enable `WEB_GROUNDING_ENABLED=true` after separate deployment approval.
- **Build Status**: Clean (`npm run lint`, `npm run build`, 170 backend unit tests, 43 offline eval tests, C6 baseline integrity check, and 65 release-tooling tests passing).

