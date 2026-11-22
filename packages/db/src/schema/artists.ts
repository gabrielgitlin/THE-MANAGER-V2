import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Mirrors the current Supabase `artists` table (supabase/consolidated_migration.sql).
// Will be replaced by the schema pulled from production with `pnpm db:pull` (migration step 2).
export const artists = pgTable('artists', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  bio: text('bio').default(''),
  genre: text('genre').default(''),
  imageUrl: text('image_url').default(''),
  spotifyUrl: text('spotify_url').default(''),
  appleMusicUrl: text('apple_music_url').default(''),
  instagramUrl: text('instagram_url').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type ArtistRow = typeof artists.$inferSelect;
export type NewArtistRow = typeof artists.$inferInsert;
