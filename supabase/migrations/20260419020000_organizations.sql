CREATE TABLE IF NOT EXISTS organizations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  name          text NOT NULL,
  type          text NOT NULL CHECK (type IN (
    'label','publisher','management','booking','distributor',
    'pr','marketing','law','accounting','studio','venue',
    'festival','promoter','sync','pro','mech_rights','merch','brand','other'
  )),
  parent_org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,

  website       text,
  email         text,
  phone         text,
  address       text,
  city          text,
  state         text,
  country       text,
  postal_code   text,
  logo_url      text,
  bio           text,
  notes         text,
  tags          text[] NOT NULL DEFAULT '{}',
  social_links  jsonb  NOT NULL DEFAULT '{}'::jsonb,

  visibility    text NOT NULL DEFAULT 'workspace'
                  CHECK (visibility IN ('workspace','private')),

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organizations_workspace_idx ON organizations(workspace_id);
CREATE INDEX IF NOT EXISTS organizations_type_idx      ON organizations(type);
CREATE INDEX IF NOT EXISTS organizations_parent_idx    ON organizations(parent_org_id);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orgs_ws_select" ON organizations FOR SELECT USING (
  EXISTS (SELECT 1 FROM team_members m WHERE m.team_id = organizations.workspace_id AND m.user_id = auth.uid())
  AND (organizations.visibility = 'workspace' OR organizations.created_by = auth.uid())
);
CREATE POLICY "orgs_ws_write" ON organizations FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members m
    WHERE m.team_id = organizations.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM team_members m
    WHERE m.team_id = organizations.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor'))
);

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS organizations_touch ON organizations;
CREATE TRIGGER organizations_touch BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
