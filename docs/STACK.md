# The Manager — Stack decisions

Decisions for moving The Manager off Supabase into a self-hosted pnpm monorepo with CLEAN architecture.

## Stack

| Area | Choice | Why |
|---|---|---|
| Language | TypeScript on Node.js (active LTS) | Types enforce the CLEAN layer contracts; Drizzle relies on them; frontend is already TS |
| Package manager | pnpm (workspaces) + Turborepo | Fast installs, workspace protocol, cached builds/tests |
| Database | PostgreSQL | Current data and 69 migrations are already Postgres; best Drizzle support; RLS, `jsonb`, full-text search |
| ORM / migrations | Drizzle ORM + drizzle-kit | SQL-like typed queries, schema as code, reviewable SQL migrations; `drizzle-kit pull` bootstraps the schema from Supabase |
| API | Fastify | Mature, fast, rich plugin ecosystem; only the HTTP adapter layer |
| API style | REST with shared Zod contracts (`packages/contracts`), OpenAPI generated | Works for web, MCP and third parties alike |
| Auth | Better Auth (Drizzle + Postgres adapter) | Self-hosted sessions, Google OAuth, 2FA, orgs/roles, OAuth provider for the MCP |
| File storage | Hetzner Object Storage (S3-compatible) | Same provider/region as the server, off the VPS disk |
| Background jobs | pg-boss | Queues + cron on the same Postgres; retries; nothing extra to run |
| Email | Resend (+ React Email templates) | Simple API, good deliverability |
| Frontend | React + Vite SPA | Reuses the current UI; Supabase calls replaced by API calls |
| Mobile | Out of scope for now (web only) | Capacitor can be re-added later as `apps/mobile` |
| Server | Hetzner Cloud, US East (Ashburn) — start at 4 vCPU / 8 GB | Consistent performance, snapshots, firewall, private network, hourly billing |
| Deploys | Dokploy | Git autodeploy, Traefik + Let's Encrypt, one-click Postgres, scheduled backups, multi-server later |
| CI | GitHub Actions (lint, typecheck, tests) + Dokploy autodeploy on `main` | Nothing broken reaches production |
| DNS | Cloudflare | Free DNS, proxy and caching |
| Monitoring | Sentry (errors) + Uptime Kuma (uptime, Dokploy template) | |
| Backups | Daily Postgres dumps from Dokploy to Hetzner Object Storage | |

All libraries use their latest stable release at install time.

## Monorepo layout (CLEAN)

```
apps/
  web/             React + Vite SPA
  api/             Fastify HTTP adapter → application use cases
  worker/          pg-boss jobs and cron (Spotify, Bandsintown, Songkick, YouTube, emails)
  mcp/             MCP server for Claude / ChatGPT (calls the API)
packages/
  domain/          entities, value objects, business rules — no dependencies
  application/     use cases + ports (repository/service interfaces)
  infrastructure/  adapters: Drizzle repositories, S3, Resend, OpenAI, external APIs
  db/              Drizzle schema + migrations
  contracts/       Zod request/response schemas shared by web, api and mcp
  ui/              design-system tokens and components
  config/          shared tsconfig, ESLint, Vitest config
```

Dependency rule: `domain` ← `application` ← `infrastructure` / `apps`. Inner layers never import outer ones.

## Migration plan

Module by module, with the app running throughout:

1. Monorepo skeleton, tooling, CI, Dokploy on Hetzner, empty Postgres.
2. Schema: `drizzle-kit pull` from Supabase, clean up, first migration; copy data.
3. Auth: Better Auth with migrated users (existing password hashes kept), Google OAuth.
4. Modules one at a time (catalog, shows/touring, finance, legal, marketing, tasks…): domain → use cases → repositories → API → swap the web calls.
5. Storage, edge functions → API endpoints / pg-boss jobs, emails.
6. Cut over DNS, retire Supabase.
