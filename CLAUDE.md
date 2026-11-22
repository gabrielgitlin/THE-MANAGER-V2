# The Manager V2 — Project Instructions

## Design System
**ALWAYS use the `/the-manager` skill before building any UI, component, or page.**
The full design system reference is in `DESIGN_SYSTEM.md` at the project root.

When building anything visual for this project:
1. Invoke the `the-manager` skill (or read `DESIGN_SYSTEM.md`)
2. Use existing CSS classes from `apps/web/src/index.css` before writing new ones
3. Use CSS variables for all colors — never hardcode hex values
4. Follow the component pattern library (buttons, cards, tabs, tables, forms)

## Stack
pnpm monorepo, CLEAN architecture — see `README.md` and `docs/STACK.md`.
- `apps/web`: React + TypeScript + Vite + Tailwind (still on Supabase while modules migrate)
- `apps/api`: Fastify + Zod contracts; `apps/worker`: pg-boss
- `packages/*`: domain → application → infrastructure, Drizzle + PostgreSQL
- Backend TypeScript runs natively on Node 26: erasable syntax only, relative imports end in `.ts`
- Dependencies point inward only (domain has none; application depends only on domain)

## Key Files
- `apps/web/src/index.css` — all design tokens and component classes
- `apps/web/tailwind.config.js` — Tailwind color/font extensions
- `apps/web/src/components/Layout.tsx` — main app shell
- `DESIGN_SYSTEM.md` — complete design system documentation
- `docs/STACK.md` — stack decisions and migration plan
