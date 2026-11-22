// Schema introspected from the production Supabase database (see README "Database schema").
export * from './supabase.ts';
import type { artists } from './supabase.ts';

export type ArtistRow = typeof artists.$inferSelect;
export type NewArtistRow = typeof artists.$inferInsert;
