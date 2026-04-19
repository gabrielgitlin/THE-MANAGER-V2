/*
  # Fix Anonymous Access to Tracks in Public Playlists

  Anonymous (not logged-in) users visiting a shared public playlist link need
  to be able to read track details (title, audio_url, preview_url) so the
  media player works. The existing migration only added anon access to
  `playlists` and `playlist_tracks` — but PostgREST's embedded resource joins
  also require SELECT permission on the referenced tables.

  1. Tables fixed:
    - `tracks` — allow anon to read tracks that appear in public playlists
    - `albums` — allow anon to read albums linked to those tracks (for cover art)
    - `artists` — allow anon to read artists of those albums (for artist name display)

  2. Security:
    - Anon access is scoped exclusively to rows reachable from a public playlist
    - No write access is granted
*/

-- Allow anonymous users to view tracks that appear in public playlists
CREATE POLICY "Anonymous users can view tracks in public playlists"
  ON public.tracks FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.playlist_tracks pt
      JOIN public.playlists p ON p.id = pt.playlist_id
      WHERE pt.track_id = tracks.id
        AND p.is_public = true
    )
  );

-- Allow anonymous users to view albums linked to public-playlist tracks
-- (needed for cover art via album_tracks join)
CREATE POLICY "Anonymous users can view albums in public playlists"
  ON public.albums FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.album_tracks at2
      JOIN public.playlist_tracks pt ON pt.track_id = at2.track_id
      JOIN public.playlists p ON p.id = pt.playlist_id
      WHERE at2.album_id = albums.id
        AND p.is_public = true
    )
  );

-- Allow anonymous users to view artists for those albums
CREATE POLICY "Anonymous users can view artists in public playlists"
  ON public.artists FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.albums a
      JOIN public.album_tracks at2 ON at2.album_id = a.id
      JOIN public.playlist_tracks pt ON pt.track_id = at2.track_id
      JOIN public.playlists p ON p.id = pt.playlist_id
      WHERE a.artist_id = artists.id
        AND p.is_public = true
    )
  );
