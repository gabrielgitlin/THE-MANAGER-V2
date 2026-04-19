CREATE TABLE IF NOT EXISTS project_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  project_id   uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access       text NOT NULL DEFAULT 'edit' CHECK (access IN ('view','edit')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);
CREATE INDEX IF NOT EXISTS pm_project_idx ON project_members(project_id);
CREATE INDEX IF NOT EXISTS pm_user_idx    ON project_members(user_id);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_self_or_owner_select" ON project_members FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM teams t WHERE t.id = project_members.workspace_id AND t.owner_id = auth.uid())
);
CREATE POLICY "pm_owner_write" ON project_members FOR ALL USING (
  EXISTS (SELECT 1 FROM teams t WHERE t.id = project_members.workspace_id AND t.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM teams t WHERE t.id = project_members.workspace_id AND t.owner_id = auth.uid())
);

-- Upgrade artists SELECT policy to be project-member-scoped
DROP POLICY IF EXISTS "artists_workspace_select" ON artists;
DROP POLICY IF EXISTS "artists_scoped_select" ON artists;
CREATE POLICY "artists_scoped_select" ON artists FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = artists.workspace_id AND t.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = artists.id AND pm.user_id = auth.uid()
  )
);
