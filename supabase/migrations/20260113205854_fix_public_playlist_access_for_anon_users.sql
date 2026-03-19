/*
  # Fix Public Playlist Access for Anonymous Users

  1. Changes
    - Add RLS policy to allow anonymous (not logged in) users to view public playlists
    - Add RLS policy to allow anonymous users to view tracks in public playlists

  2. Security
    - Anonymous users can ONLY view playlists where is_public = true
    - Anonymous users can ONLY view tracks in public playlists
    - All other operations still require authentication
*/

-- Allow anonymous users to view public playlists
CREATE POLICY "Anonymous users can view public playlists"
  ON public.playlists FOR SELECT
  TO anon
  USING (is_public = true);

-- Allow anonymous users to view tracks in public playlists
CREATE POLICY "Anonymous users can view tracks in public playlists"
  ON public.playlist_tracks FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_tracks.playlist_id 
      AND is_public = true
    )
  );
