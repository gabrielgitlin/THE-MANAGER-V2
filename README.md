# The Manager

All-in-one platform for artist managers and independent artists. pnpm monorepo with a CLEAN architecture.
Decisions and migration plan: [`docs/STACK.md`](docs/STACK.md).

## Layout

```
apps/
  web/        React + Vite SPA (current app, still on Supabase while modules migrate)
  api/        Fastify HTTP adapter (REST + Zod contracts, OpenAPI at /openapi.json)
  worker/     pg-boss jobs and schedules
  mcp/        MCP server for Claude / ChatGPT
packages/
  domain/          entities and business rules — no dependencies
  application/     use cases + ports (repository interfaces)
  infrastructure/  adapters (Drizzle repositories, …)
  db/              Drizzle schema, client and migrations
  contracts/       Zod request/response schemas shared by web, api and mcp
  config/          shared tsconfig
```

Dependencies point inward only: `domain` ← `application` ← `infrastructure` / `apps`. ESLint enforces it.

## Requirements

- Node.js 26 (LTS) — see `.nvmrc`
- pnpm 12 (`corepack enable`)
- Docker for the local Postgres

Backend code is TypeScript run directly by Node (type stripping): no build step for `api` and `worker`.
Write erasable TypeScript only (no `enum`, no constructor parameter properties) and import relative files with `.ts`.

## Getting started

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm db:up                         # Postgres 19 on localhost:5432
pnpm --filter @the-manager/db db:push
pnpm dev                           # web, api and worker in watch mode
```

API: http://localhost:3000 (`/health`, `/ready`, `/v1/artists`, `/openapi.json`).

## Scripts

| Command | What |
|---|---|
| `pnpm check` | lint + typecheck + test across the workspace |
| `pnpm --filter @the-manager/db db:generate` | create a SQL migration from the schema |
| `pnpm --filter @the-manager/db db:migrate` | apply migrations |
| `pnpm --filter @the-manager/db db:pull` | introspect an existing database (Supabase) into Drizzle |

## Adding a module

Follow `artists` end to end: rules in `packages/domain`, port + use cases in `packages/application`,
table in `packages/db/src/schema`, repository in `packages/infrastructure`, Zod schemas in `packages/contracts`,
routes in `apps/api/src/routes`, wiring in `apps/api/src/server.ts`.

## Deploy (Dokploy)

- `apps/api/Dockerfile` and `apps/worker/Dockerfile`, build context = repository root.
- Env: `DATABASE_URL` (Dokploy Postgres), `CORS_ORIGIN`, `API_PORT`, `LOG_LEVEL`.
- Health check: `GET /ready`.
