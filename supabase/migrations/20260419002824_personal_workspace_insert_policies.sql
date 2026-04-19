-- Allow authenticated users to insert their own team
DROP POLICY IF EXISTS "teams: owner can insert" ON teams;
CREATE POLICY "teams: owner can insert" ON teams FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Allow workspace members (editors+) to insert team_members rows
DROP POLICY IF EXISTS "team_members: owner can insert" ON team_members;
CREATE POLICY "team_members: owner can insert" ON team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id AND t.owner_id = auth.uid()
    )
  );
