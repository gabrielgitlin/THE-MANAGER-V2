/*
  # Add Spotify Integration Fields

  ## Description
  Adds fields to albums and tracks tables to support Spotify catalog import and duplicate detection.

  ## Changes

  ### Albums Table
  - `spotify_id` - Unique Spotify album ID for deduplication
  - `spotify_url` - Direct link to album on Spotify
  - `total_tracks` - Number of tracks in the album
  - `genres_array` - Array of genre strings from Spotify

  ### Tracks Table
  - `spotify_id` - Unique Spotify track ID for deduplication
  - `spotify_url` - Direct link to track on Spotify
  - `preview_url` - 30-second preview URL from Spotify
  - `popularity` - Spotify popularity score (0-100)
  - `explicit` - Explicit content flag

  ### Artists Table
  - `spotify_id` - Unique Spotify artist ID
  - `spotify_followers` - Number of followers on Spotify
  - `spotify_popularity` - Spotify popularity score (0-100)

  ## Security
  - No RLS changes needed (tables already have RLS enabled)
  - Fields are optional to maintain compatibility with existing data
*/

-- Add Spotify fields to artists table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artists' AND column_name = 'spotify_id'
  ) THEN
    ALTER TABLE artists ADD COLUMN spotify_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artists' AND column_name = 'spotify_followers'
  ) THEN
    ALTER TABLE artists ADD COLUMN spotify_followers integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artists' AND column_name = 'spotify_popularity'
  ) THEN
    ALTER TABLE artists ADD COLUMN spotify_popularity integer DEFAULT 0;
  END IF;
END $$;

-- Add Spotify fields to albums table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'albums' AND column_name = 'spotify_id'
  ) THEN
    ALTER TABLE albums ADD COLUMN spotify_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'albums' AND column_name = 'spotify_url'
  ) THEN
    ALTER TABLE albums ADD COLUMN spotify_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'albums' AND column_name = 'total_tracks'
  ) THEN
    ALTER TABLE albums ADD COLUMN total_tracks integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'albums' AND column_name = 'genres_array'
  ) THEN
    ALTER TABLE albums ADD COLUMN genres_array text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;

-- Add Spotify fields to tracks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'spotify_id'
  ) THEN
    ALTER TABLE tracks ADD COLUMN spotify_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'spotify_url'
  ) THEN
    ALTER TABLE tracks ADD COLUMN spotify_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'preview_url'
  ) THEN
    ALTER TABLE tracks ADD COLUMN preview_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'popularity'
  ) THEN
    ALTER TABLE tracks ADD COLUMN popularity integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'explicit'
  ) THEN
    ALTER TABLE tracks ADD COLUMN explicit boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'disc_number'
  ) THEN
    ALTER TABLE tracks ADD COLUMN disc_number integer DEFAULT 1;
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_albums_spotify_id ON albums(spotify_id);
CREATE INDEX IF NOT EXISTS idx_tracks_spotify_id ON tracks(spotify_id);
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);