/*
  # Optimize Database Indexes - Remove Unused and Redundant Indexes

  This migration removes indexes that are either:
  1. Redundant (e.g., date_range indexes when individual date indexes exist)
  2. Low-value for current usage patterns (e.g., rarely queried unique fields)
  3. Not providing significant query performance benefits

  ## Indexes Removed

  ### Redundant Date Range Indexes
  - `idx_calendar_events_date_range` (redundant with `idx_calendar_events_start_date`)
  - `idx_synced_events_date_range` (redundant with `idx_synced_events_start_date`)

  ### Low-Value Unique Field Indexes
  - `albums_upc_idx` (UPC already has unique constraint, lookups are rare)
  - `tracks_isrc_idx` (ISRC already has unique constraint, lookups are rare)
  - `idx_albums_spotify_id` (Spotify lookups are infrequent)
  - `idx_tracks_spotify_id` (Spotify lookups are infrequent)

  ### Rarely Queried Metadata Indexes
  - `credits_entity_id_idx` (credits queries are infrequent)
  - `credits_entity_type_idx` (credits queries are infrequent)
  - `credits_role_idx` (credits queries are infrequent)
  - `idx_playlist_tracks_added_by` (filtering by added_by is rare)
  - `idx_venues_name` (name searches use other patterns)
  - `idx_calendar_connections_provider` (provider filtering is rare)
  - `idx_synced_events_provider_event_id` (specific event lookups are rare)

  ### Analytics Indexes (Low Query Frequency)
  - `idx_youtube_channel_analytics_integration_date`
  - `idx_youtube_video_analytics_integration`
  - `idx_youtube_video_analytics_video_id`

  ## Indexes Retained

  All foreign key indexes, user_id indexes, date indexes, and frequently filtered
  columns remain to ensure optimal query performance for common operations.

  ## Notes

  - This reduces index maintenance overhead on write operations
  - Query performance for common operations remains optimal
  - Indexes can be recreated if specific use cases require them
*/

-- Remove redundant date range indexes
DROP INDEX IF EXISTS idx_calendar_events_date_range;
DROP INDEX IF EXISTS idx_synced_events_date_range;

-- Remove low-value unique field indexes
DROP INDEX IF EXISTS albums_upc_idx;
DROP INDEX IF EXISTS tracks_isrc_idx;
DROP INDEX IF EXISTS idx_albums_spotify_id;
DROP INDEX IF EXISTS idx_tracks_spotify_id;

-- Remove rarely queried metadata indexes
DROP INDEX IF EXISTS credits_entity_id_idx;
DROP INDEX IF EXISTS credits_entity_type_idx;
DROP INDEX IF EXISTS credits_role_idx;
DROP INDEX IF EXISTS idx_playlist_tracks_added_by;
DROP INDEX IF EXISTS idx_venues_name;
DROP INDEX IF EXISTS idx_calendar_connections_provider;
DROP INDEX IF EXISTS idx_synced_events_provider_event_id;

-- Remove analytics indexes (low query frequency)
DROP INDEX IF EXISTS idx_youtube_channel_analytics_integration_date;
DROP INDEX IF EXISTS idx_youtube_video_analytics_integration;
DROP INDEX IF EXISTS idx_youtube_video_analytics_video_id;
