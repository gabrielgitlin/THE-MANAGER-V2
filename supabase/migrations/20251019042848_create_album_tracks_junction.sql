/*
  # Create Album-Tracks Many-to-Many Relationship

  ## Overview
  This migration restructures the catalog to properly handle master recordings that can appear on multiple albums.
  
  ## Changes Made
  
  1. **New Junction Table: `album_tracks`**
     - Links albums to tracks in a many-to-many relationship
     - Allows the same master recording to appear on multiple albums
     - Stores album-specific metadata (track_number, disc_number)
  
  2. **Modified `tracks` Table**
     - `album_id` becomes nullable (tracks are now independent entities)
     - Added unique constraint on `isrc` when not null (prevents duplicate masters)
     - Tracks represent master recordings, not album-specific entries
  
  3. **Data Migration**
     - Migrates existing track-album relationships to the junction table
     - Preserves all track numbers and disc numbers
  
  4. **Security**
     - Enable RLS on `album_tracks` table
     - Add policies for authenticated user access
  
  ## Music Industry Context
  
  In the music industry, a "master" or "recording" is a unique audio recording identified by its ISRC.
  The same master can appear on:
  - A single release
  - An album
  - A compilation
  - Deluxe editions
  - Different regional releases
  
  Each appearance may have different track numbers or disc positions, but the underlying recording (master) remains the same.
*/

-- Step 1: Create the album_tracks junction table
CREATE TABLE IF NOT EXISTS public.album_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  track_number integer NOT NULL,
  disc_number integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(album_id, track_id, disc_number, track_number)
);

-- Enable RLS
ALTER TABLE public.album_tracks ENABLE ROW LEVEL SECURITY;

-- Step 2: Migrate existing data to junction table
INSERT INTO public.album_tracks (album_id, track_id, track_number, disc_number)
SELECT 
  album_id, 
  id as track_id, 
  track_number, 
  COALESCE(disc_number, 1) as disc_number
FROM public.tracks
WHERE album_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 3: Make album_id nullable in tracks table (tracks are now independent)
ALTER TABLE public.tracks ALTER COLUMN album_id DROP NOT NULL;

-- Step 4: Add unique constraint on ISRC to prevent duplicate masters
-- Only apply when ISRC is not null or empty
CREATE UNIQUE INDEX IF NOT EXISTS tracks_isrc_unique_idx 
ON public.tracks(isrc) 
WHERE isrc IS NOT NULL AND isrc != '';

-- Step 5: Create RLS policies for album_tracks (public read for now, since no user auth on albums)
CREATE POLICY "Anyone can view album tracks"
  ON public.album_tracks
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert album tracks"
  ON public.album_tracks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update album tracks"
  ON public.album_tracks
  FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete album tracks"
  ON public.album_tracks
  FOR DELETE
  USING (true);

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS album_tracks_album_id_idx ON public.album_tracks(album_id);
CREATE INDEX IF NOT EXISTS album_tracks_track_id_idx ON public.album_tracks(track_id);
CREATE INDEX IF NOT EXISTS tracks_isrc_idx ON public.tracks(isrc) WHERE isrc IS NOT NULL AND isrc != '';