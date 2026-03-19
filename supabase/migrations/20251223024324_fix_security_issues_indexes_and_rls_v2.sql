/*
  # Fix Security Issues: Indexes, RLS Performance, and Duplicate Policies

  1. Foreign Key Indexes
    - Add indexes on foreign key columns for better query performance

  2. RLS Policy Performance Fixes
    - Update policies to use `(select auth.uid())` pattern for better performance

  3. Remove Duplicate Permissive Policies
    - Clean up overlapping policies

  4. Fix Function Search Paths
    - Set search_path for trigger functions
*/

-- ============================================
-- 1. ADD FOREIGN KEY INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_deal_bonuses_deal_id ON public.deal_bonuses(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_expenses_deal_id ON public.deal_expenses(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_merch_terms_deal_id ON public.deal_merch_terms(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_payments_deal_id ON public.deal_payments(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_templates_show_type_id ON public.deal_templates(show_type_id);
CREATE INDEX IF NOT EXISTS idx_deal_ticket_tiers_deal_id ON public.deal_ticket_tiers(deal_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_show_id ON public.legal_documents(show_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_album_id ON public.marketing_campaigns(album_id);
CREATE INDEX IF NOT EXISTS idx_notes_artist_id ON public.notes(artist_id);
CREATE INDEX IF NOT EXISTS idx_notes_show_id ON public.notes(show_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_added_by ON public.playlist_tracks(added_by);
CREATE INDEX IF NOT EXISTS idx_show_personnel_personnel_id ON public.show_personnel(personnel_id);
CREATE INDEX IF NOT EXISTS idx_tasks_artist_id ON public.tasks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tasks_show_id ON public.tasks(show_id);

-- ============================================
-- 2. FIX RLS POLICIES WITH (select auth.uid())
-- ============================================

-- Tasks table
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create their own tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Notes table
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

CREATE POLICY "Users can view their own notes"
  ON public.notes FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create their own notes"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own notes"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Calendar connections table
DROP POLICY IF EXISTS "Users can view own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can insert own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can update own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can delete own calendar connections" ON public.calendar_connections;

CREATE POLICY "Users can view own calendar connections"
  ON public.calendar_connections FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own calendar connections"
  ON public.calendar_connections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own calendar connections"
  ON public.calendar_connections FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own calendar connections"
  ON public.calendar_connections FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Synced events table (uses calendar_connection_id, not user_id)
DROP POLICY IF EXISTS "Users can view own synced events" ON public.synced_events;
DROP POLICY IF EXISTS "Users can insert own synced events" ON public.synced_events;
DROP POLICY IF EXISTS "Users can update own synced events" ON public.synced_events;
DROP POLICY IF EXISTS "Users can delete own synced events" ON public.synced_events;

CREATE POLICY "Users can view own synced events"
  ON public.synced_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_connections 
      WHERE id = synced_events.calendar_connection_id 
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own synced events"
  ON public.synced_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calendar_connections 
      WHERE id = synced_events.calendar_connection_id 
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own synced events"
  ON public.synced_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_connections 
      WHERE id = synced_events.calendar_connection_id 
      AND user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calendar_connections 
      WHERE id = synced_events.calendar_connection_id 
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own synced events"
  ON public.synced_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_connections 
      WHERE id = synced_events.calendar_connection_id 
      AND user_id = (select auth.uid())
    )
  );

-- Calendar events table
DROP POLICY IF EXISTS "Users can view own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can insert own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON public.calendar_events;

CREATE POLICY "Users can view own calendar events"
  ON public.calendar_events FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own calendar events"
  ON public.calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own calendar events"
  ON public.calendar_events FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own calendar events"
  ON public.calendar_events FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Playlists table
DROP POLICY IF EXISTS "Users can view own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can create own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can update own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can delete own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Public playlists viewable by all" ON public.playlists;

CREATE POLICY "Users can view own playlists"
  ON public.playlists FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_public = true);

CREATE POLICY "Users can create own playlists"
  ON public.playlists FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own playlists"
  ON public.playlists FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own playlists"
  ON public.playlists FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Playlist tracks table
DROP POLICY IF EXISTS "Users can view tracks in own playlists" ON public.playlist_tracks;
DROP POLICY IF EXISTS "Users can add tracks to own playlists" ON public.playlist_tracks;
DROP POLICY IF EXISTS "Users can update tracks in own playlists" ON public.playlist_tracks;
DROP POLICY IF EXISTS "Users can remove tracks from own playlists" ON public.playlist_tracks;
DROP POLICY IF EXISTS "Anyone can view tracks in public playlists" ON public.playlist_tracks;

CREATE POLICY "Users can view tracks in playlists"
  ON public.playlist_tracks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_tracks.playlist_id 
      AND (user_id = (select auth.uid()) OR is_public = true)
    )
  );

CREATE POLICY "Users can add tracks to own playlists"
  ON public.playlist_tracks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_tracks.playlist_id 
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update tracks in own playlists"
  ON public.playlist_tracks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_tracks.playlist_id 
      AND user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_tracks.playlist_id 
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can remove tracks from own playlists"
  ON public.playlist_tracks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_tracks.playlist_id 
      AND user_id = (select auth.uid())
    )
  );

-- ============================================
-- 3. REMOVE DUPLICATE PERMISSIVE POLICIES
-- ============================================

-- Deal bonuses - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view deal bonuses" ON public.deal_bonuses;

-- Deal expenses - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view deal expenses" ON public.deal_expenses;

-- Deal merch terms - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view deal merch terms" ON public.deal_merch_terms;

-- Deal payments - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view deal payments" ON public.deal_payments;

-- Deal templates - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view deal templates" ON public.deal_templates;

-- Deal ticket tiers - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view deal ticket tiers" ON public.deal_ticket_tiers;

-- Show deals - remove duplicate policies
DROP POLICY IF EXISTS "Users can view own show deals" ON public.show_deals;
DROP POLICY IF EXISTS "Users can manage own show deals" ON public.show_deals;
DROP POLICY IF EXISTS "Users can update own show deals" ON public.show_deals;
DROP POLICY IF EXISTS "Users can delete own show deals" ON public.show_deals;

-- Show types - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view show types" ON public.show_types;

-- ============================================
-- 4. FIX FUNCTION SEARCH PATHS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_venue_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.venues
  SET usage_count = usage_count + 1
  WHERE id = NEW.venue_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_venues_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_playlist_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.playlists
  SET updated_at = now()
  WHERE id = NEW.playlist_id;
  RETURN NEW;
END;
$$;
