-- Migration: workspace_scoping
-- Scopes contacts and artists to workspace_id (teams table)
-- and adds workspace-based RLS policies.

-- ────────────────────────────────────────────────────────────────────────────
-- Step 1: Add workspace_id (and visibility) columns
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'workspace'
    CHECK (visibility IN ('workspace','private'));

ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES teams(id) ON DELETE CASCADE;

-- ────────────────────────────────────────────────────────────────────────────
-- Step 2: Backfill contacts via user_id → teams.owner_id
-- ────────────────────────────────────────────────────────────────────────────
UPDATE contacts c
SET workspace_id = t.id
FROM teams t
WHERE c.user_id = t.owner_id
  AND c.workspace_id IS NULL;

-- Step 3: Backfill artists (no user_id column) — assign all to the single
-- personal workspace that already exists (owned by the same user who owns
-- the contacts). Safe for a dev DB with a single owner.
UPDATE artists a
SET workspace_id = t.id
FROM teams t
WHERE a.workspace_id IS NULL
  AND t.owner_id IN (SELECT DISTINCT user_id FROM contacts)
  AND t.id IN (SELECT id FROM teams ORDER BY created_at LIMIT 1);

-- ────────────────────────────────────────────────────────────────────────────
-- Step 4: Make workspace_id NOT NULL for future inserts
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE contacts ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE artists  ALTER COLUMN workspace_id SET NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- Step 5: Indexes
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS contacts_workspace_idx ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS artists_workspace_idx  ON artists(workspace_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Step 6: Drop existing policies
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anonymous users can view artists in public playlists" ON artists;
DROP POLICY IF EXISTS "Authenticated users can create artists" ON artists;
DROP POLICY IF EXISTS "Authenticated users can delete artists" ON artists;
DROP POLICY IF EXISTS "Authenticated users can update artists" ON artists;
DROP POLICY IF EXISTS "Authenticated users can view all artists" ON artists;
DROP POLICY IF EXISTS "contacts_delete" ON contacts;
DROP POLICY IF EXISTS "contacts_insert" ON contacts;
DROP POLICY IF EXISTS "contacts_select" ON contacts;
DROP POLICY IF EXISTS "contacts_update" ON contacts;

-- ────────────────────────────────────────────────────────────────────────────
-- Step 7: New workspace-scoped RLS policies
-- ────────────────────────────────────────────────────────────────────────────

-- contacts: SELECT (workspace members can see workspace contacts;
--           private contacts only visible to their creator)
CREATE POLICY "contacts_workspace_select" ON contacts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members m
    WHERE m.team_id = contacts.workspace_id
      AND m.user_id = auth.uid()
  )
  AND (contacts.visibility = 'workspace' OR contacts.user_id = auth.uid())
);

-- contacts: ALL write operations (owner/admin/editor only)
CREATE POLICY "contacts_workspace_write" ON contacts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM team_members m
    WHERE m.team_id = contacts.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members m
    WHERE m.team_id = contacts.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor')
  )
);

-- artists: SELECT (any workspace member)
CREATE POLICY "artists_workspace_select" ON artists FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members m
    WHERE m.team_id = artists.workspace_id
      AND m.user_id = auth.uid()
  )
);

-- artists: ALL write operations (owner/admin/editor only)
CREATE POLICY "artists_workspace_write" ON artists FOR ALL USING (
  EXISTS (
    SELECT 1 FROM team_members m
    WHERE m.team_id = artists.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members m
    WHERE m.team_id = artists.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor')
  )
);
