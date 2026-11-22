// One-off: introspect a database that holds the Supabase schema snapshot into Drizzle.
// Usage: PULL_DATABASE_URL=postgres://... pnpm drizzle-kit pull --config drizzle.pull.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  out: './pulled',
  dbCredentials: { url: process.env.PULL_DATABASE_URL ?? '' },
  schemaFilter: ['public'],
  introspect: { casing: 'camel' },
});
