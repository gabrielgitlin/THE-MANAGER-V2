-- Add missing columns to teams
-- (name already exists NOT NULL, created_at already exists)
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add missing columns to team_members
-- (team_id and user_id already exist with PK; role exists but is nullable)
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS seat_role text NOT NULL DEFAULT 'owner'
    CHECK (seat_role IN ('owner','admin','editor','viewer')),
  ADD COLUMN IF NOT EXISTS joined_at timestamptz NOT NULL DEFAULT now();

-- The composite PK (team_id, user_id) already ensures uniqueness;
-- this index is redundant but harmless
CREATE UNIQUE INDEX IF NOT EXISTS team_members_team_user_uniq
  ON team_members(team_id, user_id);

-- Seed: one workspace per existing user, with that user as owner.
INSERT INTO teams (name, owner_id)
SELECT 'Personal Workspace', u.id
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.owner_id = u.id);

-- Seed team_members only for users that have a profile row
-- (team_members.user_id FK references profiles(id))
INSERT INTO team_members (team_id, user_id, seat_role)
SELECT t.id, t.owner_id, 'owner'
FROM teams t
WHERE t.owner_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = t.owner_id)
  AND NOT EXISTS (
    SELECT 1 FROM team_members m
    WHERE m.team_id = t.id AND m.user_id = t.owner_id
  );

-- RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies by their actual names
DROP POLICY IF EXISTS "Teams are viewable by their members" ON teams;
DROP POLICY IF EXISTS "Team members are viewable by team members" ON team_members;

-- Also drop any prior versions of the new policy names
DROP POLICY IF EXISTS "teams: members can select" ON teams;
DROP POLICY IF EXISTS "teams: owner can update" ON teams;
DROP POLICY IF EXISTS "team_members: self or owner can select" ON team_members;

CREATE POLICY "teams: members can select" ON teams FOR SELECT
  USING (EXISTS (SELECT 1 FROM team_members m WHERE m.team_id = teams.id AND m.user_id = auth.uid()));

CREATE POLICY "teams: owner can update" ON teams FOR UPDATE
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "team_members: self or owner can select" ON team_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid())
  );
