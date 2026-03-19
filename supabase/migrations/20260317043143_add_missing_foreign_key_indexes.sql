/*
  # Add Missing Foreign Key Indexes

  1. New Indexes
    - `idx_marketing_campaigns_album_id` on `marketing_campaigns(album_id)` - covers FK `marketing_campaigns_album_id_fkey`
    - `idx_notes_artist_id` on `notes(artist_id)` - covers FK `notes_artist_id_fkey`
    - `idx_notes_show_id` on `notes(show_id)` - covers FK `notes_show_id_fkey`
    - `idx_playlists_user_id` on `playlists(user_id)` - covers FK `playlists_user_id_fkey`
    - `idx_team_invitations_invited_by` on `team_invitations(invited_by)` - covers FK `team_invitations_invited_by_fkey`
    - `idx_users_artist_id` on `users(artist_id)` - covers FK `users_artist_id_fkey`

  2. Notes
    - These indexes prevent sequential scans during JOIN and CASCADE operations on foreign keys
    - Without these indexes, DELETE/UPDATE on parent tables can cause full table scans
*/

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_album_id ON public.marketing_campaigns(album_id);
CREATE INDEX IF NOT EXISTS idx_notes_artist_id ON public.notes(artist_id);
CREATE INDEX IF NOT EXISTS idx_notes_show_id ON public.notes(show_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_by ON public.team_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_users_artist_id ON public.users(artist_id);
