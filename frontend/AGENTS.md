<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Frontend Scope

The root `AGENTS.md` orchestration and completion policy applies here. Keep this file focused on frontend implementation.

- Preserve the Next.js App Router structure and existing route-group boundaries.
- Use strict TypeScript and existing React patterns; do not introduce a second state-management or data-fetching architecture.
- Reuse existing shadcn/ui, Base UI, Tailwind, and shared presentation primitives before creating new abstractions.
- Follow `docs/GUARDRAILS.md`, `docs/agents.md`, and `docs/ui-design-direction.md` for design decisions.
- Preserve the distinction between the product-oriented landing page and the calmer, reading-focused dashboard and study workspace.
- Verify responsive behavior, keyboard interaction, focus states, semantics, and accessible labels for affected UI.
- Inspect layout, wrapper, and global-style inheritance before applying local CSS fixes.
- Run `npm run lint` and `npm run build` when applicable. Do not invent `npm test` or `npm run typecheck` scripts; neither is currently defined in `frontend/package.json`.
