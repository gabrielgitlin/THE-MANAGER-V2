# The Manager V2 — Project Instructions

## Design System
**ALWAYS use the `/the-manager` skill before building any UI, component, or page.**
The full design system reference is in `DESIGN_SYSTEM.md` at the project root.

When building anything visual for this project:
1. Invoke the `the-manager` skill (or read `DESIGN_SYSTEM.md`)
2. Use existing CSS classes from `src/index.css` before writing new ones
3. Use CSS variables for all colors — never hardcode hex values
4. Follow the component pattern library (buttons, cards, tabs, tables, forms)

## Stack
- React + TypeScript + Vite
- Tailwind CSS (custom tokens in `tailwind.config.js`)
- Supabase (backend + auth + edge functions)
- All custom design tokens in `src/index.css`

## Key Files
- `src/index.css` — all design tokens and component classes
- `tailwind.config.js` — Tailwind color/font extensions
- `src/components/Layout.tsx` — main app shell
- `DESIGN_SYSTEM.md` — complete design system documentation
