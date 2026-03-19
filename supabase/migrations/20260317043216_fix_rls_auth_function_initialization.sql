/*
  # Fix RLS Auth Function Initialization

  Wraps `auth.uid()` calls in `(select auth.uid())` to prevent re-evaluation per row.
  This is a Supabase best practice for RLS policy performance at scale.

  1. Tables affected:
    - `legal_documents` - "Team members can create legal documents"
    - `tasks` - "Team members can create tasks"
    - `users` - "Admins can delete users", "Admins can insert users directly", "Admins can update any user", "Users can update their own profile"
    - `user_permissions` - "Admins can manage permissions", "Admins can view all permissions", "Users can view their own permissions"
    - `team_invitations` - "Admins can manage invitations", "Admins can view all invitations"
    - `task_comments` - "Authors can delete their own comments", "Authors can update their own comments", "Team members can create task comments"
    - `legal_document_notes` - "Authors can delete their own document notes", "Authors can update their own document notes", "Team members can create document notes"
    - `marketing_posts` - "Team members can create marketing posts"
    - `marketing_files` - "Team members can upload marketing files"

  2. Security
    - No functional changes to policy logic
    - Performance optimization only
*/

-- legal_documents: "Team members can create legal documents"
DROP POLICY IF EXISTS "Team members can create legal documents" ON public.legal_documents;
CREATE POLICY "Team members can create legal documents"
  ON public.legal_documents FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- tasks: "Team members can create tasks"
DROP POLICY IF EXISTS "Team members can create tasks" ON public.tasks;
CREATE POLICY "Team members can create tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- users: "Admins can delete users"
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (select auth.uid())
    AND u.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])
  ));

-- users: "Admins can insert users directly"
DROP POLICY IF EXISTS "Admins can insert users directly" ON public.users;
CREATE POLICY "Admins can insert users directly"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (select auth.uid())
    AND u.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])
  ));

-- users: "Admins can update any user"
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (select auth.uid())
    AND u.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (select auth.uid())
    AND u.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])
  ));

-- users: "Users can update their own profile"
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- user_permissions: "Admins can manage permissions"
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.user_permissions;
CREATE POLICY "Admins can manage permissions"
  ON public.user_permissions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (select auth.uid())
    AND u.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (select auth.uid())
    AND u.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])
  ));

-- user_permissions: "Admins can view all permissions"
DROP POLICY IF EXISTS "Admins can view all permissions" ON public.user_permissions;
CREATE POLICY "Admins can view all permissions"
  ON public.user_permissions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (select auth.uid())
    AND u.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])
  ));

-- user_permissions: "Users can view their own permissions"
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
CREATE POLICY "Users can view their own permissions"
  ON public.user_permissions FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- team_invitations: "Admins can manage invitations"
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.team_invitations;
CREATE POLICY "Admins can manage invitations"
  ON public.team_invitations FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (select auth.uid())
    AND u.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (select auth.uid())
    AND u.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])
  ));

-- team_invitations: "Admins can view all invitations"
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.team_invitations;
CREATE POLICY "Admins can view all invitations"
  ON public.team_invitations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (select auth.uid())
    AND u.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])
  ));

-- task_comments: "Authors can delete their own comments"
DROP POLICY IF EXISTS "Authors can delete their own comments" ON public.task_comments;
CREATE POLICY "Authors can delete their own comments"
  ON public.task_comments FOR DELETE TO authenticated
  USING ((select auth.uid()) = author_id);

-- task_comments: "Authors can update their own comments"
DROP POLICY IF EXISTS "Authors can update their own comments" ON public.task_comments;
CREATE POLICY "Authors can update their own comments"
  ON public.task_comments FOR UPDATE TO authenticated
  USING ((select auth.uid()) = author_id)
  WITH CHECK ((select auth.uid()) = author_id);

-- task_comments: "Team members can create task comments"
DROP POLICY IF EXISTS "Team members can create task comments" ON public.task_comments;
CREATE POLICY "Team members can create task comments"
  ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = author_id);

-- legal_document_notes: "Authors can delete their own document notes"
DROP POLICY IF EXISTS "Authors can delete their own document notes" ON public.legal_document_notes;
CREATE POLICY "Authors can delete their own document notes"
  ON public.legal_document_notes FOR DELETE TO authenticated
  USING ((select auth.uid()) = author_id);

-- legal_document_notes: "Authors can update their own document notes"
DROP POLICY IF EXISTS "Authors can update their own document notes" ON public.legal_document_notes;
CREATE POLICY "Authors can update their own document notes"
  ON public.legal_document_notes FOR UPDATE TO authenticated
  USING ((select auth.uid()) = author_id)
  WITH CHECK ((select auth.uid()) = author_id);

-- legal_document_notes: "Team members can create document notes"
DROP POLICY IF EXISTS "Team members can create document notes" ON public.legal_document_notes;
CREATE POLICY "Team members can create document notes"
  ON public.legal_document_notes FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = author_id);

-- marketing_posts: "Team members can create marketing posts"
DROP POLICY IF EXISTS "Team members can create marketing posts" ON public.marketing_posts;
CREATE POLICY "Team members can create marketing posts"
  ON public.marketing_posts FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- marketing_files: "Team members can upload marketing files"
DROP POLICY IF EXISTS "Team members can upload marketing files" ON public.marketing_files;
CREATE POLICY "Team members can upload marketing files"
  ON public.marketing_files FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
