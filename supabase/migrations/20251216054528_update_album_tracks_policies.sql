/*
  # Update Album Tracks RLS Policies

  1. Changes
    - Drop existing restrictive policies for album_tracks
    - Add new policies that allow authenticated users to manage album_tracks

  2. Security
    - Authenticated users can insert album tracks
    - Authenticated users can update album tracks
    - Authenticated users can delete album tracks
    - Anyone can view album tracks
*/

-- Drop old policies
DROP POLICY IF EXISTS "Service role can insert album tracks" ON public.album_tracks;
DROP POLICY IF EXISTS "Service role can update album tracks" ON public.album_tracks;
DROP POLICY IF EXISTS "Service role can delete album tracks" ON public.album_tracks;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can insert album tracks"
  ON public.album_tracks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update album tracks"
  ON public.album_tracks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete album tracks"
  ON public.album_tracks
  FOR DELETE
  TO authenticated
  USING (true);
