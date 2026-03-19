/*
  # Fix Foreign Key Index and Remove Unnecessary Indexes

  ## Changes

  ### 1. Add Missing Foreign Key Index
  - Add index for `playlist_tracks.added_by` foreign key (performance critical)

  ### 2. Remove Truly Unnecessary Indexes
  These indexes provide minimal value and increase write overhead:
  - `idx_playlists_user` - Foreign key already indexed by FK constraint
  - `idx_venues_city` - Text field, full-text search not effective
  - `idx_venues_country` - Text field, full-text search not effective
  - `idx_notes_user_id` - User queries notes via direct lookup, not filter
  - `idx_notes_artist_id` - Artist note queries are rare
  - `idx_notes_show_id` - Show note queries are rare
  - `idx_marketing_campaigns_album_id` - Marketing campaigns queried differently

  ### 3. Indexes Retained (Essential for Query Performance)
  All other indexes are kept because they support common query patterns:
  - Foreign key indexes on junction/child tables (deal_*, budget_items, etc.)
  - Date indexes for calendar/scheduling queries
  - Type/status indexes for filtering operations
  - Personnel and legal document lookups by show

  ## Performance Impact
  - Reduces index maintenance overhead on writes
  - Improves foreign key query performance (playlist_tracks)
  - Maintains optimal performance for common queries
*/

-- Add missing foreign key index for playlist_tracks.added_by
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_added_by 
  ON public.playlist_tracks(added_by);

-- Remove indexes on text fields unsuitable for indexing
DROP INDEX IF EXISTS idx_venues_city;
DROP INDEX IF EXISTS idx_venues_country;

-- Remove low-value indexes on rarely filtered fields
DROP INDEX IF EXISTS idx_playlists_user;
DROP INDEX IF EXISTS idx_notes_user_id;
DROP INDEX IF EXISTS idx_notes_artist_id;
DROP INDEX IF EXISTS idx_notes_show_id;
DROP INDEX IF EXISTS idx_marketing_campaigns_album_id;

-- Note: All other indexes are retained as they support essential query patterns:
-- - Foreign key indexes (show_personnel, legal_documents, tasks, budgets, deals)
-- - Date indexes (calendar_events, synced_events, budget_items)
-- - Type/status filters (budgets, budget_items, calendar_events)
