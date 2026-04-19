CREATE TABLE IF NOT EXISTS project_relations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  contact_id      uuid REFERENCES contacts(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  role            text NOT NULL,
  role_custom     text,
  is_primary      boolean NOT NULL DEFAULT false,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exactly_one_target CHECK (
    (contact_id IS NOT NULL AND organization_id IS NULL) OR
    (contact_id IS NULL AND organization_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS pr_project_idx ON project_relations(project_id);
CREATE INDEX IF NOT EXISTS pr_contact_idx ON project_relations(contact_id);
CREATE INDEX IF NOT EXISTS pr_org_idx     ON project_relations(organization_id);
CREATE INDEX IF NOT EXISTS pr_ws_idx      ON project_relations(workspace_id);

ALTER TABLE project_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pr_ws_select" ON project_relations FOR SELECT USING (
  EXISTS (SELECT 1 FROM team_members m WHERE m.team_id = project_relations.workspace_id AND m.user_id = auth.uid())
);
CREATE POLICY "pr_ws_write" ON project_relations FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members m
    WHERE m.team_id = project_relations.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM team_members m
    WHERE m.team_id = project_relations.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor'))
);
DROP POLICY IF EXISTS "pr_ws_insert" ON project_relations;
CREATE POLICY "pr_ws_insert" ON project_relations FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM team_members m
      WHERE m.team_id = project_relations.workspace_id
        AND m.user_id = auth.uid()
        AND m.seat_role IN ('owner','admin','editor'))
  );
