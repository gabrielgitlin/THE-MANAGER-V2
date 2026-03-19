/*
  # Add Cover Art to Playlists

  1. Changes
    - Add `cover_url` column to `playlists` table
      - Stores the URL of the playlist cover image
      - Nullable field (playlists can exist without cover art)
  
  2. Notes
    - This allows playlists to have visual representation like albums
    - Cover art can be displayed on shared playlist pages
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playlists' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE playlists ADD COLUMN cover_url text;
  END IF;
END $$;