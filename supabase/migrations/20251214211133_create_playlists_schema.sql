/*
  # Create Playlists Schema

  1. New Tables
    - `playlists`
      - `id` (uuid, primary key)
      - `title` (text) - Playlist name
      - `description` (text, nullable) - Optional description
      - `user_id` (uuid) - Owner of the playlist
      - `is_public` (boolean) - Whether playlist can be shared
      - `password_hash` (text, nullable) - Optional password protection
      - `share_token` (uuid) - Unique token for sharing
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `playlist_tracks`
      - `id` (uuid, primary key)
      - `playlist_id` (uuid, foreign key to playlists)
      - `track_id` (uuid, foreign key to tracks)
      - `position` (integer) - Track order in playlist
      - `added_at` (timestamptz)
      - `added_by` (uuid) - User who added the track

  2. Security
    - Enable RLS on both tables
    - Users can manage their own playlists
    - Public playlists can be viewed by anyone with the share token
    - Password-protected playlists require validation
*/

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,
  password_hash text,
  share_token uuid DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create playlist_tracks junction table
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz DEFAULT now(),
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(playlist_id, track_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track ON playlist_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_share_token ON playlists(share_token);

-- Enable RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playlists

-- Users can view their own playlists
CREATE POLICY "Users can view own playlists"
  ON playlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own playlists
CREATE POLICY "Users can create own playlists"
  ON playlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own playlists
CREATE POLICY "Users can update own playlists"
  ON playlists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own playlists
CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone can view public playlists via share token (handled in app logic)
CREATE POLICY "Public playlists viewable by all"
  ON playlists FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- RLS Policies for playlist_tracks

-- Users can view tracks in their own playlists
CREATE POLICY "Users can view tracks in own playlists"
  ON playlist_tracks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Users can add tracks to their own playlists
CREATE POLICY "Users can add tracks to own playlists"
  ON playlist_tracks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Users can remove tracks from their own playlists
CREATE POLICY "Users can remove tracks from own playlists"
  ON playlist_tracks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Users can reorder tracks in their own playlists
CREATE POLICY "Users can update tracks in own playlists"
  ON playlist_tracks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Anyone can view tracks in public playlists
CREATE POLICY "Anyone can view tracks in public playlists"
  ON playlist_tracks FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.is_public = true
    )
  );

-- Function to update playlist updated_at timestamp
CREATE OR REPLACE FUNCTION update_playlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE playlists
  SET updated_at = now()
  WHERE id = NEW.playlist_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update playlist timestamp when tracks are added/removed
DROP TRIGGER IF EXISTS update_playlist_timestamp ON playlist_tracks;
CREATE TRIGGER update_playlist_timestamp
  AFTER INSERT OR UPDATE OR DELETE ON playlist_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_updated_at();