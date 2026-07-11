# Original User Request

## Initial Request — 2026-07-11T05:00:38Z

Studflow is an AI-powered study workflow platform deployed on Azure. Perform a complete repository audit, then establish a 3-agent engineering team to analyze, maintain, and improve the codebase. The repository is the single source of truth — never assume features exist without verifying in code.

Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/studflow
Integrity mode: development

## Requirements

### R1. Repository Analysis (First Task)
Perform a complete audit of the Studflow repository before any other work. Analyze: application structure (frontend/backend frameworks, folder organization, component architecture), technology stack (languages, UI libraries, styling, state management, database, auth, AI integrations), all dependencies (package.json, requirements.txt, Docker files, workflow files), infrastructure (Docker, CI/CD, hosting, deployment strategy), and current feature status (implemented, in-progress, missing, broken). Produce a structured audit report.

### R2. System Architect / Product Planner Agent
Create an agent responsible for understanding the system and planning improvements. This agent analyzes current architecture, understands existing patterns, identifies limitations, and recommends improvements. For every requested feature it must provide: purpose, current system impact, user value, implementation complexity, affected areas (frontend/backend/database), required dependencies, potential risks, implementation plan, and testing requirements. This agent does NOT write production code — it produces implementation plans only.

### R3. Full Stack Engineer / Debugger Agent
Create an agent responsible for implementation. Before coding, it must review related components, existing APIs, database models, configuration, and dependencies. It follows existing architecture, reuses components, maintains clean code, adds proper error handling and documentation. For every change it provides: implementation summary, files changed, why those files, code changes, dependencies added, testing steps, possible issues, and rollback plan. For debugging: error analysis, root cause, solution, and prevention.

### R4. QA / DevOps Engineer Agent
Create an agent responsible for system reliability and production deployment. QA responsibilities: validate features, UI behavior, API responses, edge cases, and regression issues. Create test scenarios, acceptance criteria, and bug reports with severity, reproduction steps, expected/actual results, and suggested fixes. DevOps responsibilities: analyze Docker configuration, CI/CD pipelines (GitHub Actions), production environment (env vars, server config, reverse proxy, SSL). For deployment failures: problem analysis, log analysis, root cause, fix, verification steps, and prevention.

### R5. Team Workflow Enforcement
All tasks follow this process: (1) Planner Agent analyzes requirement and creates technical plan, (2) Coder Agent implements approved changes, (3) QA/DevOps Agent tests implementation and checks deployment readiness, (4) If problems exist, return to Coder Agent, fix, and retest. No agent should override another agent's responsibilities.

## Post-Analysis Workflow

After completing repository analysis, the team must follow this cycle:

**Analyze → Plan → Review → Implement → Test → Deploy → Document**

### Step 1: Technical Assessment Report
- Summarize the current system architecture.
- Identify existing features, modules, dependencies, and workflows.
- Document the current technology stack and development patterns.
- Identify technical debt, bugs, missing functionality, and improvement opportunities.

### Step 2: Implementation Strategy (Planner/Architect)
- Define the problem clearly.
- Explain the recommended solution.
- Identify affected frontend, backend, database, and infrastructure components.
- Consider compatibility with the existing architecture.
- Provide a step-by-step implementation plan.

### Step 3: Review Before Coding
- Validate that the solution aligns with existing documentation.
- Confirm that changes are minimal and necessary.
- Identify possible risks and rollback strategies.

### Step 4: Implementation (Coder/Debugger)
- Follow existing coding conventions.
- Reuse existing components and utilities.
- Avoid unnecessary refactoring.
- Maintain backward compatibility.

### Step 5: Validation (QA/DevOps)
- Test affected features.
- Check integration between frontend and backend.
- Verify build and deployment processes.
- Report issues and recommend fixes.

## Restricted Approaches

The team must NOT use the following approaches unless explicitly approved:

### 1. Do Not Rewrite the Existing System Without Justification
- Do not replace existing modules, frameworks, libraries, or architecture patterns when a targeted improvement is possible.
- Do not perform large-scale refactoring without first analyzing dependencies, current usage, and potential impact.
- Preserve existing working features and avoid unnecessary migrations.

### 2. Do Not Introduce New Technologies Without Approval
- Do not add new frameworks, libraries, services, databases, APIs, or infrastructure tools unless:
  - The current stack cannot reasonably solve the problem.
  - The new dependency provides significant value.
  - The impact on deployment, maintenance, and performance is evaluated.

The team must prioritize the existing repository technology stack documented in:
- package.json
- README.md
- environment configuration
- architecture documentation
- existing source code patterns

### 3. Do Not Ignore Existing Project Documentation
- All decisions must be based on the repository documentation and implementation.
- Agents must inspect:
  - Project structure
  - Existing components
  - API routes
  - Database schema
  - Authentication flow
  - Environment variables
  - Deployment configuration
  - Coding conventions

Do not assume a generic architecture.

### 4. Do Not Create Duplicate Implementations
Avoid:
- Creating new components when existing components can be extended.
- Creating duplicate API endpoints.
- Creating parallel authentication systems.
- Creating separate state management solutions.
- Creating duplicate utility functions.

Reuse and improve existing code whenever possible.

### 5. Do Not Prioritize Speed Over Stability
The team must not:
- Apply quick hacks that introduce technical debt.
- Disable error handling.
- Remove validation.
- Bypass security checks.
- Hardcode sensitive values.
- Modify production configurations without verification.

### 6. Do Not Make UI Changes Without Considering Existing Design System
For frontend changes:
- Preserve existing design tokens.
- Maintain consistency with current UI components.
- Avoid adding random styles, animations, or visual patterns.
- Follow the existing Studflow design language.

### 7. Do Not Modify Deployment Infrastructure Without Validation
The DevOps agent must not:
- Change deployment providers unnecessarily.
- Modify Docker, CI/CD, cloud configuration, or environment variables without testing.
- Remove existing deployment steps without understanding their purpose.

Any deployment change must include:
- Reason
- Expected impact
- Rollback plan
- Verification steps

### 8. Do Not Assume Features Exist
Agents must verify implementation before referencing:
- APIs
- Database tables
- Components
- Authentication flows
- AI integrations
- Storage systems

Never fabricate existing functionality.

### 9. Do Not Skip Testing
Before recommending completion:
- Validate affected functionality.
- Check existing test patterns.
- Perform regression checks.
- Verify frontend/backend integration.

### 10. Do Not Optimize Prematurely
Do not focus on:
- Micro-optimizations
- Complex caching
- Advanced architecture patterns
- Scaling solutions

unless there is evidence of an actual performance issue.

Prioritize:
1. Correctness
2. Maintainability
3. User experience
4. Security
5. Performance

### 11. Do Not Work Independently Without Agent Collaboration
Agents must communicate findings:

Planner/Architect:
- Defines approach based on repository analysis.

Coder/Debugger:
- Implements only approved changes.

QA/DevOps:
- Validates functionality, testing, and deployment readiness.

No agent should override another agent's responsibilities.

## Studflow-Specific Restrictions

- Do not remove or replace the current AI study workflow concept.
- Do not simplify the system into a generic chatbot or document summarizer.
- Preserve the core workflow:
  Upload Document → AI Processing → Summary → Flashcards → Quiz → Notes/Highlights → Contextual AI Assistance.

- Do not remove document grounding/context mechanisms.
- Do not introduce AI responses without source context.
- Do not redesign the UI away from the current calm minimalist study experience.

- Avoid unnecessary AI model/provider changes.
- Maintain compatibility with the existing backend API contracts.
- Preserve current Next.js/Tailwind/TypeScript architecture.

The goal is improving Studflow, not rebuilding it.

## Quality Standard

The team's work must meet a production-quality engineering standard.

### Code Quality
- Follow the existing project architecture and coding conventions.
- Write clean, readable, maintainable code.
- Avoid unnecessary complexity.
- Use reusable components and modular design.
- Remove unused code and dependencies.
- Include proper error handling.

### Functional Quality
- Features must work according to requirements.
- Existing features must not regress.
- Frontend and backend communication must remain stable.
- Edge cases should be considered.
- User workflows should be tested.

### Security Quality
- Never expose secrets or credentials.
- Validate user input.
- Follow secure authentication and authorization practices.
- Avoid unsafe shortcuts.

### Performance Quality
- Avoid unnecessary API calls.
- Optimize only where measurable improvements are needed.
- Maintain good loading performance.
- Consider scalability without overengineering.

### UI/UX Quality
- Maintain the calm minimalist learning experience.
- Preserve the existing design system.
- Keep interfaces intuitive and accessible.
- Animations should improve understanding, not distract users.
- Maintain visual consistency across pages.

### Deployment Quality
Before considering work complete:
- Application must build successfully.
- Environment variables must be documented.
- Deployment configuration must remain stable.
- Changes must be tested in an environment similar to production.

### Documentation Quality
Every significant change should include:
- What changed.
- Why it changed.
- Files affected.
- How to test it.
- Possible future improvements.

### Product Quality Principle
Do not optimize only for "working code". Every improvement should strengthen Studflow as an AI-powered study workflow system.

The team should prioritize:
1. Student learning experience
2. Reliability of AI-generated outputs
3. Clear document-grounded assistance
4. Smooth study workflow
5. Maintainable engineering foundation

The goal is to evolve the existing Studflow product, not create an unrelated replacement.

The final standard: The solution should be maintainable by another developer who has never worked on the project before.

## Acceptance Criteria

### Repository Audit
- [ ] Audit report correctly identifies the frontend framework, backend framework, and all major dependencies
- [ ] Audit report lists all implemented features with their current status (working, broken, partial)
- [ ] Audit report identifies at least 3 areas of technical debt or improvement opportunities
- [ ] All claims in the audit are verifiable by inspecting the actual repository files

### Agent Team Functionality
- [ ] System Architect produces structured implementation plans before any code changes
- [ ] Full Stack Engineer's changes follow existing code patterns and architecture conventions found in the repo
- [ ] QA/DevOps Agent validates changes against existing CI/CD pipeline (`npm run build` passes, `npm run lint` passes)
- [ ] No agent introduces new dependencies without documented justification

### Code Quality
- [ ] All frontend changes compile successfully (`npm run build` in frontend/)
- [ ] All backend changes are valid Python (`python -m compileall .` in backend/)
- [ ] No existing features are broken by new changes (regression check)
- [ ] Changes are committed with descriptive conventional commit messages

### Production Readiness
- [ ] Changes pass the existing GitHub Actions CI pipeline
- [ ] Docker images build successfully
- [ ] No hardcoded secrets or environment values in committed code
