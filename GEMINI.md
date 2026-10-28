# StudFlow AI Configuration & Constraints

## Current Phase
**Phase E — Verified Web Grounding & Conversational Turns (Implemented Behind `WEB_GROUNDING_ENABLED=false` — Pending Rollout)**

*Note: Phase D (Chunking Strategy & Hyperparameter Tuning) was evaluated and marked as Completed, as the current chunking mechanisms perfectly satisfy the C3/C4/C5 evaluation baseline. The frontend Dashboard UI evolution (Phases 12-15) and V2.1.1 RLS runtime transition tooling (PR #8) are complete. Phase E (`E1`–`E6`) is implemented and verified on `feature/verified-web-grounding` under the rules in `docs/GUARDRAILS.md`: conversational turns reply naturally without retrieval, and cited Web/Hybrid modes use Gemini Google Search grounding + SSRF-safe server-side page verification behind `WEB_GROUNDING_ENABLED=false` pending PR merge, the V2.1.1 production transition, and deployment approval.*

- **C1: Golden evaluation dataset** (Complete)
- **C2: Retrieval evaluation** (Complete)
- **C2.1: Threshold analysis** (Complete)
- **C3: Answer evaluation** (Complete — Certified 24/24 baseline frozen)
- **C4: Groundedness evaluation** (Complete — 29 claims evaluated, 0 failures)
- **C5: Citation accuracy evaluation** (Complete — 29 citations evaluated, 0 failures)
- **C6: Regression runner** (Complete — automated compare suite and tests)
- **C7: CI integration** (Complete — C6 integrity gate integrated in pipeline)

*Note: Phase A, Phase B, and Phase C are fully completed. Frozen Phase C baseline is canonical at `backend/eval/results/c3_baseline_v2`.*
