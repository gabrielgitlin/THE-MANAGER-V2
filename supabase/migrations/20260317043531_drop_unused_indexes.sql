/*
  # Drop Unused Indexes

  Removes indexes that have never been used according to pg_stat_user_indexes.
  
  Note: Some indexes that were previously unused are now kept because the new 
  RLS policies use JOINs that benefit from them (e.g., show_id indexes on 
  show-linked tables, artist_id indexes, etc.).

  1. Indexes dropped (truly unused, not needed by new RLS policies):
    - `idx_artists_spotify_id` - Spotify ID lookup rarely used
    - `idx_playlist_tracks_added_by` - No RLS or query uses this
    - `idx_playlist_tracks_track` - Duplicate, already has unique constraint
    - `credits_entity_id_type_idx` - Composite index not leveraged
    - `idx_playlists_share_token` - Share token lookups are rare
    - `idx_tasks_completed` - Boolean index has poor selectivity
    - `idx_tasks_created_by` - Low usage, tasks scoped by user_id/assigned_to
    - `idx_tasks_artist_id` - Tasks don't use artist_id in new RLS
    - `idx_tasks_show_id` - Tasks don't use show_id in new RLS
    - `idx_notes_category` - Low cardinality column
    - `idx_calendar_events_event_type` - Low cardinality
    - `idx_budgets_type` - Low cardinality
    - `idx_budgets_status` - Low cardinality
    - `idx_budget_items_type` - Low cardinality
    - `idx_budget_items_date` - Rarely queried by date alone
    - `idx_legal_documents_type` - Low cardinality
    - `idx_legal_documents_status` - Low cardinality
    - `idx_marketing_posts_platform` - Low cardinality
    - `idx_marketing_posts_status` - Low cardinality
    - `idx_marketing_posts_done` - Boolean, poor selectivity
    - `idx_marketing_files_category` - Low cardinality
    - `idx_venues_usage_count` - Rarely sorted/filtered

  2. Indexes kept (needed by new RLS policies or likely useful):
    - All show_id indexes (accommodations, transportation, etc.) - Used in RLS JOINs
    - All artist_id indexes on main tables - Used in RLS checks
    - All deal_id indexes - Used in RLS JOINs
    - Foreign key covering indexes

  3. Notes
    - These indexes were reported as unused by pg_stat_user_indexes
    - Dropping them reduces write overhead and storage
    - They can be re-created if needed
*/

DROP INDEX IF EXISTS idx_artists_spotify_id;
DROP INDEX IF EXISTS idx_playlist_tracks_added_by;
DROP INDEX IF EXISTS idx_playlist_tracks_track;
DROP INDEX IF EXISTS credits_entity_id_type_idx;
DROP INDEX IF EXISTS idx_playlists_share_token;
DROP INDEX IF EXISTS idx_tasks_completed;
DROP INDEX IF EXISTS idx_tasks_created_by;
DROP INDEX IF EXISTS idx_tasks_artist_id;
DROP INDEX IF EXISTS idx_tasks_show_id;
DROP INDEX IF EXISTS idx_notes_category;
DROP INDEX IF EXISTS idx_calendar_events_event_type;
DROP INDEX IF EXISTS idx_budgets_type;
DROP INDEX IF EXISTS idx_budgets_status;
DROP INDEX IF EXISTS idx_budget_items_type;
DROP INDEX IF EXISTS idx_budget_items_date;
DROP INDEX IF EXISTS idx_legal_documents_type;
DROP INDEX IF EXISTS idx_legal_documents_status;
DROP INDEX IF EXISTS idx_marketing_posts_platform;
DROP INDEX IF EXISTS idx_marketing_posts_status;
DROP INDEX IF EXISTS idx_marketing_posts_done;
DROP INDEX IF EXISTS idx_marketing_files_category;
DROP INDEX IF EXISTS idx_venues_usage_count;
