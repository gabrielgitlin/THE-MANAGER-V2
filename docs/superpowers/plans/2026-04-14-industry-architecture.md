# Industry Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the "Team" tab into a full music-industry contact graph called **Industry** — with first-class Companies, Person↔Company affiliations with history, Project↔Person/Org relations, workspace-shared contacts with per-project access control, and decouple album/playlist "artist" tagging from the Contacts table so Projects (Artists) are the source of truth.

**Architecture:**
- Two primary entity tables: `contacts` (people, existing) + `organizations` (companies, new)
- Join table `contact_affiliations` records who-works-where-as-what, with start/end dates — supports multiple concurrent affiliations and full history
- The existing `artists` table is re-cast as **Projects/Acts**; a new `project_relations` table links a Project to a Contact OR an Organization with a role
- Workspace layer built on the existing (empty) `teams` + `team_members` tables. Every contact/org/project gets `workspace_id`. Per-contact `visibility: 'workspace' | 'private'`. Per-project access gated by a new `project_members` table
- Album/playlist `artist_contacts` stops referencing `contacts.id` — it references `artists.id` (Projects) instead
- Controlled role vocabulary lives in TypeScript (`src/lib/industryRoles.ts`); free-text fallback lives in a `role_custom` column
- Legacy empty tables are archived (renamed with `_deprecated_` prefix) rather than dropped, so data is never lost if this plan is reverted

**Tech Stack:** Supabase Postgres (Row-Level Security), React 18 + TypeScript + Vite, Tailwind CSS + custom design tokens in `src/index.css`, Lucide + custom pixel icons.

**Execution notes:**
- All DB changes go through `mcp__supabase__apply_migration` so Supabase tracks them.
- After every task, run the app (`npm run dev`) and exercise the changed surface before committing. UI verification uses `preview_*` tools.
- When a task changes types, regenerate via `mcp__supabase__generate_typescript_types` if the project uses generated types (otherwise hand-edit `src/types/...`).
- Commit after every task. Use conventional commits (`feat:`, `refactor:`, `chore:`, `fix:`).

---

## Table of contents

- **Phase 1 — Workspace foundation** (Tasks 1–2)
- **Phase 2 — New tables & types** (Tasks 3–6)
- **Phase 3 — Rename Team → Industry** (Tasks 7–8)
- **Phase 4 — Organizations UI** (Tasks 9–11)
- **Phase 5 — People affiliations UI** (Tasks 12–13)
- **Phase 6 — Projects UI** (Tasks 14–15)
- **Phase 7 — Decouple album tagging from Contacts** (Tasks 16–18)
- **Phase 8 — Spotify import wiring** (Task 19)
- **Phase 9 — Sunset legacy tables** (Task 20)

---

## Phase 1 — Workspace foundation

### Task 1: Default personal workspace per user

**Goal:** Every existing and future user has a `teams` row they own, so we can migrate ownership from `user_id` to `workspace_id` safely.

**Files:**
- Create migration: `supabase/migrations/<timestamp>_personal_workspace.sql`
- Modify: `src/lib/supabase.ts` (add `ensurePersonalWorkspace()` helper)
- Modify: `src/App.tsx` (call `ensurePersonalWorkspace()` on sign-in)

- [ ] **Step 1: Inspect current `teams` and `team_members` schemas** so the migration matches.

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('teams','team_members')
ORDER BY table_name, ordinal_position;
```

Expected output: both tables exist and are empty. If the columns don't match what the migration below assumes, adapt the migration (or add ALTER TABLE statements before the INSERT).

- [ ] **Step 2: Write the migration** — seed a personal workspace for every existing user and make membership idempotent.

```sql
-- supabase/migrations/<timestamp>_personal_workspace.sql

-- Ensure the required columns exist. (No-ops if already present.)
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Personal Workspace',
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS seat_role text NOT NULL DEFAULT 'owner'
    CHECK (seat_role IN ('owner','admin','editor','viewer')),
  ADD COLUMN IF NOT EXISTS joined_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS team_members_team_user_uniq
  ON team_members(team_id, user_id);

-- Seed: one workspace per existing user, with that user as owner.
INSERT INTO teams (name, owner_id)
SELECT 'Personal Workspace', u.id
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.owner_id = u.id);

INSERT INTO team_members (team_id, user_id, seat_role)
SELECT t.id, t.owner_id, 'owner'
FROM teams t
WHERE NOT EXISTS (
  SELECT 1 FROM team_members m
  WHERE m.team_id = t.id AND m.user_id = t.owner_id
);

-- RLS: a user can see teams they are a member of.
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams: members can select" ON teams;
CREATE POLICY "teams: members can select" ON teams FOR SELECT
  USING (EXISTS (SELECT 1 FROM team_members m WHERE m.team_id = teams.id AND m.user_id = auth.uid()));

DROP POLICY IF EXISTS "teams: owner can update" ON teams;
CREATE POLICY "teams: owner can update" ON teams FOR UPDATE
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "team_members: self or owner can select" ON team_members;
CREATE POLICY "team_members: self or owner can select" ON team_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid())
  );
```

Apply via `mcp__supabase__apply_migration` with `name: personal_workspace`.

- [ ] **Step 3: App-level safety net** — create workspace on first sign-in if the user didn't exist when the migration ran.

```ts
// src/lib/workspaces.ts  (new file)
import { supabase } from './supabase';

export async function ensurePersonalWorkspace(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('teams')
    .insert({ name: 'Personal Workspace', owner_id: user.id })
    .select('id')
    .single();

  if (error || !created) throw error ?? new Error('workspace create failed');

  await supabase.from('team_members').insert({
    team_id: created.id,
    user_id: user.id,
    seat_role: 'owner',
  });

  return created.id;
}

export async function currentWorkspaceId(): Promise<string> {
  // For now: single personal workspace per user.
  // Future: read active workspace from localStorage / URL.
  return ensurePersonalWorkspace();
}
```

- [ ] **Step 4: Call on sign-in** — call `ensurePersonalWorkspace()` in `src/App.tsx` after the auth state resolves so new users are bootstrapped.

Wire it next to wherever the app already reacts to `supabase.auth.onAuthStateChange` / the initial session load.

- [ ] **Step 5: Verify** — sign out, sign back in, then query:

```sql
SELECT t.id, t.name, t.owner_id, count(m.*) AS members
FROM teams t LEFT JOIN team_members m ON m.team_id = t.id
GROUP BY t.id;
```

Every user should have exactly one team with 1 member.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations src/lib/workspaces.ts src/lib/supabase.ts src/App.tsx
git commit -m "feat(industry): seed personal workspace per user + RLS policies"
```

---

### Task 2: Add `workspace_id` to `contacts` and `artists`

**Files:**
- Migration: `supabase/migrations/<timestamp>_workspace_scoping.sql`
- Modify: `src/types/contacts.ts` (add `workspaceId`)
- Modify: `src/lib/contacts.ts` (write `workspace_id` on every insert)

- [ ] **Step 1: Write the migration.**

```sql
-- supabase/migrations/<timestamp>_workspace_scoping.sql

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'workspace'
    CHECK (visibility IN ('workspace','private'));

ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES teams(id) ON DELETE CASCADE;

-- Backfill: put every existing row into the owner's personal workspace.
UPDATE contacts c
SET workspace_id = t.id
FROM teams t
WHERE c.user_id = t.owner_id AND c.workspace_id IS NULL;

UPDATE artists a
SET workspace_id = t.id
FROM teams t
WHERE a.user_id = t.owner_id AND a.workspace_id IS NULL;

-- After backfill, make workspace_id required on future inserts.
ALTER TABLE contacts ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE artists  ALTER COLUMN workspace_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS contacts_workspace_idx ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS artists_workspace_idx  ON artists(workspace_id);

-- Update RLS: workspace members can SELECT; only workspace members can write.
-- (We keep the current user_id column for backwards-compat but no longer gate on it.)
DROP POLICY IF EXISTS "contacts_select_own" ON contacts;
DROP POLICY IF EXISTS "contacts_insert_own" ON contacts;
DROP POLICY IF EXISTS "contacts_update_own" ON contacts;
DROP POLICY IF EXISTS "contacts_delete_own" ON contacts;

CREATE POLICY "contacts_workspace_select" ON contacts FOR SELECT USING (
  EXISTS (SELECT 1 FROM team_members m WHERE m.team_id = contacts.workspace_id AND m.user_id = auth.uid())
  AND (contacts.visibility = 'workspace' OR contacts.user_id = auth.uid())
);
CREATE POLICY "contacts_workspace_write" ON contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members m
    WHERE m.team_id = contacts.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM team_members m
    WHERE m.team_id = contacts.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor'))
);

-- Same treatment for artists.
DROP POLICY IF EXISTS "artists_own" ON artists;

CREATE POLICY "artists_workspace_select" ON artists FOR SELECT USING (
  EXISTS (SELECT 1 FROM team_members m WHERE m.team_id = artists.workspace_id AND m.user_id = auth.uid())
);
CREATE POLICY "artists_workspace_write" ON artists FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members m
    WHERE m.team_id = artists.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM team_members m
    WHERE m.team_id = artists.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor'))
);
```

Review existing `contacts` / `artists` policies (names may differ — use `SELECT policyname FROM pg_policies WHERE tablename IN ('contacts','artists')`) and drop the specific ones that existed before adding the new ones. Adjust the DROP names in the migration accordingly.

- [ ] **Step 2: Types.** Add `workspaceId: string` and `visibility: 'workspace'|'private'` to the `Contact` interface in `src/types/contacts.ts`.

- [ ] **Step 3: Repo plumbing.** In `src/lib/contacts.ts`, import `currentWorkspaceId` and include `workspace_id` in every insert. Also expose `getContacts()` to filter by the current workspace (explicit `.eq('workspace_id', …)`). RLS already prevents leakage, but the explicit filter makes the query plan predictable.

- [ ] **Step 4: Verify** — sign in, navigate to Team tab, confirm all existing contacts appear. Add a new contact and confirm it saves.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations src/types/contacts.ts src/lib/contacts.ts
git commit -m "feat(industry): scope contacts and artists to workspaces with RLS"
```

---

## Phase 2 — New tables & types

### Task 3: `organizations` table

**Files:**
- Migration: `supabase/migrations/<timestamp>_organizations.sql`
- Create: `src/types/organizations.ts`
- Create: `src/lib/organizations.ts`

- [ ] **Step 1: Migration.**

```sql
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
```

- [ ] **Step 2: Types.**

```ts
// src/types/organizations.ts
export const ORG_TYPES = [
  'label','publisher','management','booking','distributor',
  'pr','marketing','law','accounting','studio','venue',
  'festival','promoter','sync','pro','mech_rights','merch','brand','other',
] as const;
export type OrganizationType = typeof ORG_TYPES[number];

export const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  label: 'Record Label', publisher: 'Publisher', management: 'Management',
  booking: 'Booking Agency', distributor: 'Distributor', pr: 'PR',
  marketing: 'Marketing', law: 'Law Firm', accounting: 'Accounting',
  studio: 'Studio', venue: 'Venue', festival: 'Festival',
  promoter: 'Promoter', sync: 'Sync Agency', pro: 'PRO',
  mech_rights: 'Mechanical Rights', merch: 'Merch', brand: 'Brand', other: 'Other',
};

export interface Organization {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  type: OrganizationType;
  parentOrgId?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  logoUrl?: string;
  bio?: string;
  notes?: string;
  tags: string[];
  socialLinks: Record<string, string>;
  visibility: 'workspace' | 'private';
  createdAt: string;
  updatedAt: string;
}

export type OrganizationFormData = Omit<Organization,
  'id' | 'workspaceId' | 'createdBy' | 'createdAt' | 'updatedAt'>;
```

- [ ] **Step 3: Data access layer.**

```ts
// src/lib/organizations.ts
import { supabase } from './supabase';
import { currentWorkspaceId } from './workspaces';
import type { Organization, OrganizationFormData } from '../types/organizations';

const FROM_DB = (r: any): Organization => ({
  id: r.id, workspaceId: r.workspace_id, createdBy: r.created_by,
  name: r.name, type: r.type, parentOrgId: r.parent_org_id ?? undefined,
  website: r.website ?? undefined, email: r.email ?? undefined,
  phone: r.phone ?? undefined, address: r.address ?? undefined,
  city: r.city ?? undefined, state: r.state ?? undefined,
  country: r.country ?? undefined, postalCode: r.postal_code ?? undefined,
  logoUrl: r.logo_url ?? undefined, bio: r.bio ?? undefined,
  notes: r.notes ?? undefined, tags: r.tags ?? [],
  socialLinks: r.social_links ?? {}, visibility: r.visibility,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

export async function getOrganizations(): Promise<Organization[]> {
  const wsId = await currentWorkspaceId();
  const { data, error } = await supabase.from('organizations')
    .select('*').eq('workspace_id', wsId).order('name');
  if (error) throw error;
  return (data ?? []).map(FROM_DB);
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const { data, error } = await supabase.from('organizations')
    .select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? FROM_DB(data) : null;
}

export async function createOrganization(form: OrganizationFormData): Promise<Organization> {
  const wsId = await currentWorkspaceId();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('organizations').insert({
    workspace_id: wsId, created_by: user.id,
    name: form.name, type: form.type, parent_org_id: form.parentOrgId ?? null,
    website: form.website ?? null, email: form.email ?? null, phone: form.phone ?? null,
    address: form.address ?? null, city: form.city ?? null, state: form.state ?? null,
    country: form.country ?? null, postal_code: form.postalCode ?? null,
    logo_url: form.logoUrl ?? null, bio: form.bio ?? null, notes: form.notes ?? null,
    tags: form.tags ?? [], social_links: form.socialLinks ?? {},
    visibility: form.visibility ?? 'workspace',
  }).select('*').single();
  if (error || !data) throw error ?? new Error('insert failed');
  return FROM_DB(data);
}

export async function updateOrganization(id: string, form: Partial<OrganizationFormData>): Promise<Organization> {
  const patch: Record<string, unknown> = {};
  if (form.name !== undefined) patch.name = form.name;
  if (form.type !== undefined) patch.type = form.type;
  if (form.parentOrgId !== undefined) patch.parent_org_id = form.parentOrgId;
  if (form.website !== undefined) patch.website = form.website;
  if (form.email !== undefined) patch.email = form.email;
  if (form.phone !== undefined) patch.phone = form.phone;
  if (form.address !== undefined) patch.address = form.address;
  if (form.city !== undefined) patch.city = form.city;
  if (form.state !== undefined) patch.state = form.state;
  if (form.country !== undefined) patch.country = form.country;
  if (form.postalCode !== undefined) patch.postal_code = form.postalCode;
  if (form.logoUrl !== undefined) patch.logo_url = form.logoUrl;
  if (form.bio !== undefined) patch.bio = form.bio;
  if (form.notes !== undefined) patch.notes = form.notes;
  if (form.tags !== undefined) patch.tags = form.tags;
  if (form.socialLinks !== undefined) patch.social_links = form.socialLinks;
  if (form.visibility !== undefined) patch.visibility = form.visibility;

  const { data, error } = await supabase.from('organizations')
    .update(patch).eq('id', id).select('*').single();
  if (error || !data) throw error ?? new Error('update failed');
  return FROM_DB(data);
}

export async function deleteOrganization(id: string): Promise<void> {
  const { error } = await supabase.from('organizations').delete().eq('id', id);
  if (error) throw error;
}

export async function findOrganizationByName(name: string): Promise<Organization | null> {
  const wsId = await currentWorkspaceId();
  const { data, error } = await supabase.from('organizations')
    .select('*').eq('workspace_id', wsId).ilike('name', name).limit(1).maybeSingle();
  if (error) throw error;
  return data ? FROM_DB(data) : null;
}
```

- [ ] **Step 4: Smoke test in a dev console / temp page.** Create an org, fetch it, delete it. Confirm round-trip works and RLS isn't rejecting workspace-member writes.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations src/types/organizations.ts src/lib/organizations.ts
git commit -m "feat(industry): organizations table + types + data access"
```

---

### Task 4: `contact_affiliations` table

Models "this person works at this company as this role, between these dates."

**Files:**
- Migration: `supabase/migrations/<timestamp>_contact_affiliations.sql`
- Create: `src/types/affiliations.ts`
- Create: `src/lib/affiliations.ts`

- [ ] **Step 1: Migration.**

```sql
CREATE TABLE IF NOT EXISTS contact_affiliations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  contact_id      uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            text NOT NULL,   -- canonical role key or free-text if role_custom is set
  role_custom     text,            -- if the user picked "Other" and typed their own label
  title           text,            -- optional job title distinct from role ("SVP, A&R")
  start_date      date,
  end_date        date,
  is_primary      boolean NOT NULL DEFAULT false,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS caff_contact_idx ON contact_affiliations(contact_id);
CREATE INDEX IF NOT EXISTS caff_org_idx     ON contact_affiliations(organization_id);
CREATE INDEX IF NOT EXISTS caff_ws_idx      ON contact_affiliations(workspace_id);

ALTER TABLE contact_affiliations ENABLE ROW LEVEL SECURITY;

-- Any workspace member can read; editors+ can write.
CREATE POLICY "caff_ws_select" ON contact_affiliations FOR SELECT USING (
  EXISTS (SELECT 1 FROM team_members m WHERE m.team_id = contact_affiliations.workspace_id AND m.user_id = auth.uid())
);
CREATE POLICY "caff_ws_write" ON contact_affiliations FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members m
    WHERE m.team_id = contact_affiliations.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM team_members m
    WHERE m.team_id = contact_affiliations.workspace_id
      AND m.user_id = auth.uid()
      AND m.seat_role IN ('owner','admin','editor'))
);
```

- [ ] **Step 2: Types + lib.** Mirror the org pattern. Expose `getAffiliationsForContact(contactId)`, `getAffiliationsForOrganization(orgId)`, `createAffiliation(data)`, `updateAffiliation(id, patch)`, `deleteAffiliation(id)`.

- [ ] **Step 3: Role vocabulary.** Create `src/lib/industryRoles.ts`:

```ts
export const INDUSTRY_ROLES = [
  // Management & business
  'manager','day_to_day_manager','tour_manager','business_manager','booking_agent',
  'publicist','marketing_manager','a_and_r','sync_agent','label_rep','publisher_rep',
  'lawyer','accountant',
  // Creative
  'producer','songwriter','composer','engineer','mixing_engineer','mastering_engineer',
  'session_musician','vocalist',
  // Touring & crew
  'front_of_house','monitor_engineer','lighting_designer','backline_tech','stage_manager',
  'driver','promoter','talent_buyer','production_manager',
  // Media
  'photographer','videographer','stylist','journalist','dj',
  'other',
] as const;
export type IndustryRole = typeof INDUSTRY_ROLES[number];

export const ROLE_LABELS: Record<IndustryRole, string> = {
  manager: 'Manager', day_to_day_manager: 'Day-to-Day Manager', tour_manager: 'Tour Manager',
  business_manager: 'Business Manager', booking_agent: 'Booking Agent',
  publicist: 'Publicist', marketing_manager: 'Marketing Manager', a_and_r: 'A&R',
  sync_agent: 'Sync Agent', label_rep: 'Label Rep', publisher_rep: 'Publisher Rep',
  lawyer: 'Lawyer', accountant: 'Accountant', producer: 'Producer',
  songwriter: 'Songwriter', composer: 'Composer', engineer: 'Engineer',
  mixing_engineer: 'Mixing Engineer', mastering_engineer: 'Mastering Engineer',
  session_musician: 'Session Musician', vocalist: 'Vocalist',
  front_of_house: 'FOH Engineer', monitor_engineer: 'Monitor Engineer',
  lighting_designer: 'Lighting Designer', backline_tech: 'Backline Tech',
  stage_manager: 'Stage Manager', driver: 'Driver', promoter: 'Promoter',
  talent_buyer: 'Talent Buyer', production_manager: 'Production Manager',
  photographer: 'Photographer', videographer: 'Videographer',
  stylist: 'Stylist', journalist: 'Journalist', dj: 'DJ', other: 'Other',
};

export function displayRole(role: string, custom?: string | null): string {
  if (role === 'other' && custom) return custom;
  return ROLE_LABELS[role as IndustryRole] ?? role;
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations src/types/affiliations.ts src/lib/affiliations.ts src/lib/industryRoles.ts
git commit -m "feat(industry): contact_affiliations + role vocabulary"
```

---

### Task 5: `project_relations` table

Models "this Project (Artist) is connected to this Person OR this Organization in this role" — superset of the album-level artist credit, usable for Manager-of-project, Label-of-project, Booking-agent-of-project, etc.

**Files:**
- Migration: `supabase/migrations/<timestamp>_project_relations.sql`
- Create: `src/types/projectRelations.ts`
- Create: `src/lib/projectRelations.ts`

- [ ] **Step 1: Migration.**

```sql
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
```

- [ ] **Step 2: Types + lib.** Expose:
  - `getRelationsForProject(projectId)` — returns rows joined with contact/org records
  - `getProjectsForContact(contactId)`
  - `getProjectsForOrganization(orgId)`
  - `createRelation(input)`, `updateRelation(id, patch)`, `deleteRelation(id)`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations src/types/projectRelations.ts src/lib/projectRelations.ts
git commit -m "feat(industry): project_relations table + lib"
```

---

### Task 6: `project_members` — per-project access

Gates *which seats of a workspace* can see a given project. A workspace owner can see everything regardless; other seats only see projects they're on.

**Files:**
- Migration: `supabase/migrations/<timestamp>_project_members.sql`
- Create: `src/lib/projectAccess.ts` (helpers)

- [ ] **Step 1: Migration.**

```sql
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

-- Upgrade `artists` SELECT policy: owner sees all, otherwise only if project_members row exists.
DROP POLICY IF EXISTS "artists_workspace_select" ON artists;
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
```

- [ ] **Step 2: Backfill** — insert a `project_members` row for every existing artist so the workspace owner retains access (the owner policy already covers this, so the backfill is optional; include only if you want non-owner seats to auto-get access on migration).

- [ ] **Step 3: Helpers.**

```ts
// src/lib/projectAccess.ts
import { supabase } from './supabase';

export async function addProjectMember(projectId: string, userId: string, access: 'view'|'edit' = 'edit') {
  const { error } = await supabase.from('project_members').insert({
    project_id: projectId, user_id: userId, access,
    workspace_id: (await supabase.from('artists').select('workspace_id').eq('id', projectId).single()).data?.workspace_id,
  });
  if (error) throw error;
}
export async function removeProjectMember(projectId: string, userId: string) {
  const { error } = await supabase.from('project_members')
    .delete().eq('project_id', projectId).eq('user_id', userId);
  if (error) throw error;
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations src/lib/projectAccess.ts
git commit -m "feat(industry): per-project access control via project_members"
```

---

## Phase 3 — Rename Team → Industry

### Task 7: Rename files and routes

**Files affected** (non-exhaustive — grep confirms):
- `src/pages/Team.tsx` → `src/pages/Industry.tsx`
- `src/pages/ContactProfile.tsx` — route changes from `/team/:id` → `/industry/people/:id`
- `src/App.tsx` — routes
- `src/components/Layout.tsx` — sidebar label + icon
- Any `navigate('/team…')` calls throughout

- [ ] **Step 1: Find all references.**

```
rg -n "'\\/team(\\/|')" src/
rg -n "\"Team\"|>Team<" src/
rg -n "from.*pages\\/Team" src/
```

Make a checklist of every file.

- [ ] **Step 2: Rename the page file.**

```bash
git mv src/pages/Team.tsx src/pages/Industry.tsx
```

Update the default export name inside from `Team` to `Industry`.

- [ ] **Step 3: Update routing in `App.tsx`.** Replace the `/team` route tree:

```tsx
<Route path="/industry"          element={<Industry />} />
<Route path="/industry/people/:id" element={<ContactProfile />} />
<Route path="/industry/companies/:id" element={<OrganizationProfile />} />
{/* Keep /team for now as a redirect to /industry so any bookmarks don't 404 */}
<Route path="/team/*" element={<Navigate to="/industry" replace />} />
<Route path="/team/:id" element={<RedirectTeamToIndustry />} />
```

Write a tiny `<RedirectTeamToIndustry/>` that reads `:id` from params and navigates to `/industry/people/:id` — one-time redirect, remove after a month.

- [ ] **Step 4: Sidebar / nav.** In `src/components/Layout.tsx`, change the label `Team` → `Industry` and update the `to` prop to `/industry`. Leave the pixel icon as-is unless you want to swap it.

- [ ] **Step 5: Update inbound `navigate('/team…')` calls everywhere.** Replace with `/industry/people/${id}`.

- [ ] **Step 6: Verify.** `npm run dev`, visit `/industry` and `/team` (should redirect), click on a contact and confirm you land at `/industry/people/:id`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(industry): rename Team tab to Industry; add redirect"
```

---

### Task 8: Restructure Industry page with 3 top-level tabs

**Files:**
- Modify: `src/pages/Industry.tsx`
- Create: `src/components/industry/PeopleTab.tsx`
- Create: `src/components/industry/CompaniesTab.tsx`
- Create: `src/components/industry/ProjectsTab.tsx`

- [ ] **Step 1: Page shell** — extract current content into `PeopleTab` and add top-level `.tm-tabs` with **People / Companies / Projects**.

```tsx
// src/pages/Industry.tsx
import React, { useState } from 'react';
import PeopleTab from '../components/industry/PeopleTab';
import CompaniesTab from '../components/industry/CompaniesTab';
import ProjectsTab from '../components/industry/ProjectsTab';

type TopTab = 'people' | 'companies' | 'projects';

export default function Industry() {
  const [tab, setTab] = useState<TopTab>('people');

  return (
    <div>
      <div className="tm-tabs mb-6">
        {(['people','companies','projects'] as TopTab[]).map(t => (
          <button key={t}
            className={`tm-tab ${tab===t ? 'active' : ''}`}
            onClick={() => setTab(t)}>
            {t[0].toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>
      {tab==='people' && <PeopleTab />}
      {tab==='companies' && <CompaniesTab />}
      {tab==='projects' && <ProjectsTab />}
    </div>
  );
}
```

- [ ] **Step 2: Move current People logic.** Cut the sub-tabs + contact grid/list logic from old Industry.tsx into `PeopleTab.tsx`, unchanged. Verify it still works.

- [ ] **Step 3: Stub Companies and Projects tabs** so the page compiles — each renders an `empty-state` card until Tasks 10 and 14 fill them in.

- [ ] **Step 4: Verify** — all three tabs render, People tab behaves identically to pre-refactor.

- [ ] **Step 5: Commit**

```bash
git commit -am "refactor(industry): split Industry page into People/Companies/Projects tabs"
```

---

## Phase 4 — Organizations UI

### Task 9: OrganizationCard + OrganizationRow + OrganizationFormModal

**Files:**
- Create: `src/components/industry/OrganizationCard.tsx`
- Create: `src/components/industry/OrganizationRow.tsx`
- Create: `src/components/industry/OrganizationFormModal.tsx`
- Create: `src/components/industry/OrgLogo.tsx` (fallback avatar for orgs, mirrors `AvatarWithFallback`)

Follow the exact visual language of `ContactCard`/`ContactRow`. Type badge uses `status-badge` with a color mapped from `OrganizationType`:

```ts
// badge per org type
import type { OrganizationType } from '../../types/organizations';
export const ORG_TYPE_BADGE: Record<OrganizationType,string> = {
  label: 'badge-green', publisher: 'badge-green',
  management: 'badge-brand', booking: 'badge-brand',
  distributor: 'badge-blue', pr: 'badge-blue', marketing: 'badge-blue',
  law: 'badge-neutral', accounting: 'badge-neutral',
  studio: 'badge-yellow', venue: 'badge-yellow',
  festival: 'badge-orange', promoter: 'badge-orange',
  sync: 'badge-blue', pro: 'badge-neutral', mech_rights: 'badge-neutral',
  merch: 'badge-yellow', brand: 'badge-yellow', other: 'badge-neutral',
};
```

`OrgLogo` — if `logoUrl` is set, render it; else render the first two letters of `name` in a rounded-full circle with a deterministic color by type (same pattern as contact avatars).

Form modal: match `ContactFormModal` layout — single column, labeled fields (mono + uppercase labels per design system).

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(industry): organization card/row/form components"
```

---

### Task 10: Companies tab wiring

**Files:**
- Modify: `src/components/industry/CompaniesTab.tsx`

Mirror `PeopleTab` structure: sub-tabs by `OrganizationType` (All / Label / Publisher / Management / Booking / etc.), search, grid/list toggle, add button → opens `OrganizationFormModal`.

- [ ] **Step 1: Load + filter.** Use `getOrganizations()` from Task 3. Filter by `type` sub-tab + search on name/tags.
- [ ] **Step 2: Render.** Grid of `OrganizationCard` or list of `OrganizationRow`.
- [ ] **Step 3: Add/Edit flows.** Wire the form modal.
- [ ] **Step 4: Verify** — create a new Label "Counter Records", confirm it appears in the grid.
- [ ] **Step 5: Commit**

```bash
git commit -am "feat(industry): companies tab with create/edit/filter"
```

---

### Task 11: Organization profile page

**Files:**
- Create: `src/pages/OrganizationProfile.tsx`
- Route: `/industry/companies/:id`

Sections (each `tm-card` with `folder-label` above):
1. **Overview** — name, type badge, logo, website, address, bio, notes, tags
2. **People** — everyone currently affiliated (`getAffiliationsForOrganization(id)`), grouped by role, with "add affiliation" button
3. **Projects** — every Project that has a `project_relation` pointing at this org

- [ ] **Step 1: Route + shell.**
- [ ] **Step 2: Data loaders.** Call `getOrganization(id)`, `getAffiliationsForOrganization(id)`, `getProjectsForOrganization(id)` in parallel on mount.
- [ ] **Step 3: Overview card + edit pen icon → opens OrgFormModal in edit mode.**
- [ ] **Step 4: People section** — list affiliations, show contact avatar + role + date range, clickable to `/industry/people/:id`.
- [ ] **Step 5: Projects section** — list related projects, link to project detail.
- [ ] **Step 6: Delete flow** with confirmation.
- [ ] **Step 7: Commit**

```bash
git commit -am "feat(industry): organization profile page"
```

---

## Phase 5 — People affiliations UI

### Task 12: Affiliations section on ContactProfile

**Files:**
- Modify: `src/pages/ContactProfile.tsx`
- Create: `src/components/industry/AffiliationCard.tsx`
- Create: `src/components/industry/AffiliationFormModal.tsx`

Add a section "Affiliations" on the contact profile between Bio and Notes. Show current affiliations at top (no `end_date`), past affiliations collapsed below.

`AffiliationFormModal` captures: Organization (searchable picker over existing orgs + "create new"), Role (dropdown from `INDUSTRY_ROLES` + free text if `other`), Title (optional), Start date, End date, Is primary, Notes.

When the user picks "create new" in the org field, open `OrganizationFormModal` inline, then on save use the new org's id.

- [ ] **Step 1: Lay out the section.**
- [ ] **Step 2: Build the form modal.** Reuse the org picker pattern from `ContactTagInput` (pill-based search).
- [ ] **Step 3: Add/edit/delete flow.**
- [ ] **Step 4: Verify** — add an affiliation "John Smith at Wasserman as Booking Agent, 2024-01-01–present", then visit Wasserman's org profile and confirm John appears.
- [ ] **Step 5: Commit**

```bash
git commit -am "feat(industry): contact affiliations UI"
```

---

### Task 13: Aggregate role display on ContactCard / ContactRow

Today the card shows `contact.role`. Now that primary role may come from affiliations:

- If a `contact_affiliations` row is `is_primary = true` and still active (no `end_date` or in future), display "{role_label} at {org_name}".
- Else fall back to `contact.role`.

**Files:**
- Modify: `src/components/contacts/ContactCard.tsx`
- Modify: `src/components/contacts/ContactRow.tsx`
- Modify: `src/lib/contacts.ts` — `getContacts()` joins in primary affiliation

- [ ] **Step 1: Extend query.** Use Supabase's join syntax:

```ts
.from('contacts')
.select(`*, primary_affiliation:contact_affiliations!left(
  role, role_custom, title, end_date,
  organization:organizations(id, name)
)`)
.eq('workspace_id', wsId)
.eq('primary_affiliation.is_primary', true)
```

Resolve ambiguity client-side if multiple rows come back.

- [ ] **Step 2: Render.**

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(industry): show primary affiliation on contact cards"
```

---

## Phase 6 — Projects UI

### Task 14: Projects tab on Industry page

**Files:**
- Modify: `src/components/industry/ProjectsTab.tsx`
- Create: `src/components/industry/ProjectCard.tsx` (reuse artist artwork, name, genre)

Load `artists` rows (filtered by workspace + project access). Card click → `/industry/projects/:id`.

- [ ] **Commit:** `feat(industry): projects tab listing`

---

### Task 15: Project detail — Network tab

**Files:**
- Modify or create: `src/pages/Artist.tsx` (existing) or `src/pages/ProjectProfile.tsx`

Add a "Network" tab to the project detail page. Sections grouped by role category:

- **Management** (Manager, Day-to-Day, Tour Manager, Business Manager)
- **Representation** (Booking Agent, Publicist, Lawyer, Accountant)
- **Label & Publishing** — renders Organizations directly
- **Creative** (Producer, Songwriter, Engineer…)
- **Crew** (FOH, Monitors, Lighting, Driver…)
- **Other**

Each row shows: avatar/logo, name, role, "via {org}" if contact-via-affiliation, date range if relevant. Add button opens a new `ProjectRelationModal` (Task 5 lib supports it).

- [ ] **Commit:** `feat(industry): project detail Network tab`

---

## Phase 7 — Decouple album tagging from Contacts

### Task 16: Switch `artist_contacts` to `artist_projects`

**Files:**
- Migration: `supabase/migrations/<timestamp>_album_artist_projects.sql`
- Modify: every file reading/writing `artist_contacts` on albums and playlists.

- [ ] **Step 1: Schema.** Add a parallel column instead of mutating in place, so the migration is reversible.

```sql
ALTER TABLE albums    ADD COLUMN IF NOT EXISTS artist_projects jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS creator_projects jsonb NOT NULL DEFAULT '[]'::jsonb;
```

`artist_projects` is `[{ id: <artists.id>, name: <string> }]` — same shape as today's contact tags, just pointing at `artists`.

- [ ] **Step 2: Backfill** — map each album's current `artist_contacts` (if any) or `artist_id` to `artist_projects`:

```sql
UPDATE albums
SET artist_projects =
  CASE
    WHEN artist_id IS NOT NULL THEN
      jsonb_build_array(jsonb_build_object('id', artist_id::text, 'name', artist))
    ELSE '[]'::jsonb
  END
WHERE (artist_projects = '[]'::jsonb OR artist_projects IS NULL);
```

- [ ] **Step 3: Frontend.** Update `ContactTagInput` usage sites to a new `ProjectTagInput` that searches `artists` instead of `contacts`. Use the same pill component but pass `preferSource='projects'`.

Places to change: `DemoUploadModal`, `CatalogForm`, `PlaylistsTab`, `Catalog.tsx` (list + form), `AlbumDetails.tsx`.

- [ ] **Step 4: Preserve existing `artist_contacts`** for one release cycle — leave the column in place, only stop reading from it. Delete after backfill is verified in prod.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(industry): album/playlist artist tags point at Projects not Contacts"
```

---

### Task 17: Remove `syncArtistsToTeam` / `syncAllCatalogArtistsToTeam`

**Files:**
- Modify: `src/lib/contacts.ts` (delete both functions)
- Modify: `src/components/catalog/DemoUploadModal.tsx` — remove the sync call
- Modify: `supabase/functions/import-spotify-catalog/index.ts` — remove the contact-creation block (we'll re-introduce a smarter one in Task 19 that targets organizations, not contacts-as-artists)

- [ ] **Commit:** `refactor(industry): remove contact-as-artist sync path`

---

### Task 18: Backfill `project_relations` from any legacy `artist_contacts`

For albums where `artist_contacts` pointed at real human collaborators (e.g., a producer), insert `project_relations` rows so the data doesn't evaporate.

- [ ] **Step 1:** Query:

```sql
SELECT a.id AS album_id, a.artist_id AS project_id, tag->>'id' AS contact_id
FROM albums a, jsonb_array_elements(a.artist_contacts) tag
WHERE a.artist_contacts <> '[]'::jsonb
  AND tag->>'id' IS NOT NULL;
```

- [ ] **Step 2:** Insert as `project_relations` with `role='collaborator'` for anything that can't be identified. Flag for the user to re-categorize later.
- [ ] **Commit.**

---

## Phase 8 — Spotify import wiring

### Task 19: Create Organization for Spotify label

**Files:**
- Modify: `supabase/functions/import-spotify-catalog/index.ts`

Spotify's album endpoint returns a `label` string (sometimes). When present:
1. Look up an org by name (case-insensitive) in this workspace.
2. If none, create one with `type='label'`.
3. Insert a `project_relations` row linking the Project (Artist) to the Label org with `role='label_rep'` and `is_primary=true`.
4. Skip if a matching relation already exists.

- [ ] **Step 1:** Fetch the full album (not just the artist's album list) to get `label`:

```ts
const fullAlbumResp = await fetch(`https://api.spotify.com/v1/albums/${album.id}`, {
  headers: { Authorization: `Bearer ${spotifyAccessToken}` },
});
const fullAlbum = await fullAlbumResp.json();
const labelName: string | null = fullAlbum.label?.trim() || null;
```

(Note: `label` is per-album. Caching per artist import avoids repeated calls if the same label recurs across releases.)

- [ ] **Step 2:** Upsert org + relation. Use service-role client.
- [ ] **Step 3:** Deploy function with `mcp__supabase__deploy_edge_function`.
- [ ] **Step 4:** Verify — run an import for Mild Minds, confirm "Counter Records" (or whatever the label metadata says) shows up as an Organization tied to the project.
- [ ] **Commit:** `feat(industry): spotify import creates label organization + project relation`

---

## Phase 9 — Sunset legacy tables

### Task 20: Archive unused/abandoned tables

**Files:**
- Migration: `supabase/migrations/<timestamp>_archive_legacy.sql`

Never drop — rename. This keeps data recoverable if we revert.

```sql
ALTER TABLE personnel                        RENAME TO _deprecated_personnel;
ALTER TABLE personnel_profiles               RENAME TO _deprecated_personnel_profiles;
ALTER TABLE personnel_pros                   RENAME TO _deprecated_personnel_pros;
ALTER TABLE personnel_publishers             RENAME TO _deprecated_personnel_publishers;
ALTER TABLE publishers                       RENAME TO _deprecated_publishers;
ALTER TABLE performance_rights_organizations RENAME TO _deprecated_performance_rights_organizations;
```

After a month of no issues, a follow-up plan can `DROP` them.

- [ ] **Commit:** `chore(industry): archive legacy personnel/publisher/PRO tables`

---

## Verification matrix

After the plan is executed end-to-end, manually verify:

- [ ] `/industry` loads; three tabs visible
- [ ] People tab shows existing contacts, category filters work
- [ ] Can create a new Contact and assign a primary affiliation to an existing Org in the same flow
- [ ] Can create a new Organization of every `OrganizationType`
- [ ] Company profile shows affiliated people
- [ ] Project detail's Network tab groups relations by role category
- [ ] Album artist tag picker searches Projects (artists), not Contacts
- [ ] Spotify import creates a Label Org and a project_relation
- [ ] `/team` redirects to `/industry`
- [ ] A second user added to a workspace via `team_members` only sees projects they're in `project_members` for
- [ ] A contact set to `visibility='private'` is invisible to other workspace members

## Rollback notes

Each phase is reversible:
- Phase 1–2: new columns with defaults, backfilled — safe to drop.
- Phase 3–6: new UI, old `Team.tsx` history is in git.
- Phase 7: `artist_contacts` column retained; revert by restoring the old `ContactTagInput` usage.
- Phase 9: `_deprecated_` tables can be renamed back.

## Out of scope (deferred)

- Invite flow for adding seats to a workspace (UI + email). The schema supports it; UX is a separate project.
- Import from Google Contacts / vCard.
- Bulk org creation from a CSV.
- Smart de-duplication across workspaces (e.g., "this person is at WME — link to the shared WME org that 3 other users in your org already created").
- Activity log of affiliation changes.
- Full-text search across the Industry graph.
