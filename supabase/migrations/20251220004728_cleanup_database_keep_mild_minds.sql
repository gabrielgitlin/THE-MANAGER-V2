/*
  # Clean Database - Keep Only Mild Minds Catalog

  This migration removes all data from the database except the Mild Minds artist
  and their catalog that was just added.

  1. What Gets Deleted
    - All shows, finances, legal documents, tasks, notes
    - All marketing campaigns, budgets, budget items, personnel
    - All platform integrations, analytics integrations
    - All calendar connections, synced events, calendar events
    - All playlists, production files, guest lists, setlists
    - All transportation, accommodations
    - All show deals and related tables
    - All venues

  2. What Stays
    - Mild Minds artist (id: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
    - All albums and tracks related to Mild Minds
    - Auth users (needed for authentication)

  3. Security
    - All deletions respect RLS policies
*/

-- Delete junction tables first (to avoid foreign key violations)
DELETE FROM album_tracks WHERE album_id NOT IN (
  SELECT id FROM albums WHERE artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);

DELETE FROM playlist_tracks;
DELETE FROM show_personnel;
DELETE FROM setlist_songs;
DELETE FROM marketing_tasks;
DELETE FROM production_files;
DELETE FROM guest_list;
DELETE FROM deal_ticket_tiers;
DELETE FROM deal_payments;
DELETE FROM deal_bonuses;
DELETE FROM deal_expenses;
DELETE FROM deal_merch_terms;
DELETE FROM budget_items;
DELETE FROM budget_categories;

-- Delete main tables
DELETE FROM credits WHERE entity_id NOT IN (
  SELECT id FROM tracks WHERE album_id IN (
    SELECT id FROM albums WHERE artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  )
);

DELETE FROM tracks WHERE album_id NOT IN (
  SELECT id FROM albums WHERE artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);

DELETE FROM playlists;
DELETE FROM setlists;
DELETE FROM show_advances;
DELETE FROM show_deals;
DELETE FROM accommodations;
DELETE FROM transportation;
DELETE FROM shows;
DELETE FROM venues;
DELETE FROM budgets;
DELETE FROM personnel;
DELETE FROM marketing_campaigns WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM finances WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM legal_documents WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM tasks WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM notes WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM platform_integrations WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM youtube_video_analytics;
DELETE FROM youtube_channel_analytics;
DELETE FROM analytics_integrations WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM synced_events;
DELETE FROM calendar_connections;
DELETE FROM calendar_events;
DELETE FROM deal_templates;
DELETE FROM show_types;

-- Delete albums not belonging to Mild Minds
DELETE FROM albums WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Delete artists except Mild Minds
DELETE FROM artists WHERE id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
