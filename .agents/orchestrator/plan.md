# Plan: Repository Audit and Swarm Establishment

This document outlines the step-by-step plan for the Project Orchestrator to perform a complete repository audit of Studflow and establish the 3-agent engineering team (Planner/Architect, Full Stack Coder, QA/DevOps).

## Objectives
1. Perform a thorough audit of the Studflow repository, including frontend, backend, dependencies, database models, authentication, and infrastructure.
2. Produce a comprehensive, structured audit report detailing:
   - Application structure and technology stack.
   - All package and module dependencies.
   - Infrastructure, CI/CD, and deployment strategy.
   - Implemented vs. missing features, and current project status.
   - At least 3 areas of technical debt or improvement opportunities.
3. Validate and verify that the application compiles and is ready for development.

## Swarm Topology
We will spawn three parallel `teamwork_preview_explorer` agents, each assigned to a specific role/scope:
1. **Planner/Architect** (explorer_1): Focuses on application structure, framework integration, component architecture, high-level features, and identifying technical debt/improvements.
2. **Full Stack Coder** (explorer_2): Focuses on API routes, database models/schema, SQLModel/Alembic integrations, Clerk auth, and coding/naming patterns.
3. **QA/DevOps** (explorer_3): Focuses on infrastructure (Docker, Docker Compose, hosting, CI/CD), requirements/dependencies checking, and running validation/compilation commands to ensure the repo is build-ready.

## Milestone Checklist

- [ ] **Milestone 1: Plan and Setup Initialization**
  - [x] Create Orchestrator BRIEFING.md
  - [x] Create Orchestrator plan.md
  - [x] Create Orchestrator progress.md
  - [ ] Set up directory structure for subagents under `.agents/`
  - [ ] Start heartbeat cron for orchestrator status checking

- [ ] **Milestone 2: Multi-agent Auditing**
  - [ ] Dispatch Planner/Architect agent to audit product structure, components, and technical debt.
  - [ ] Dispatch Full Stack Coder agent to audit DB schema, API routes, auth, and backend codebase.
  - [ ] Dispatch QA/DevOps agent to audit infrastructure, configuration, dependencies, and verify compilation.
  - [ ] Monitor agents' progress via heartbeat crons and liveness checks.
  - [ ] Collect completed handoffs and findings from all three subagents.

- [ ] **Milestone 3: Report Synthesis**
  - [ ] Reconcile findings across all three subagents.
  - [ ] Reconcile any conflicting information (e.g., dependency discrepancies, feature statuses).
  - [ ] Draft a comprehensive, structured audit report: `docs/audit_report.md`.
  - [ ] Verify that all claims in the report correspond to real file paths and configurations in the codebase.

- [ ] **Milestone 4: Verification and Final Delivery**
  - [ ] Verify that all acceptance criteria are met (audit report content, no broken features, clean build checks).
  - [ ] Send victory/status report to parent (sentinel) with a pointer to the synthesized audit report.
