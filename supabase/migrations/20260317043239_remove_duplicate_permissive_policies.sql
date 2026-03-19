/*
  # Remove Duplicate Permissive Policies

  Multiple permissive policies on the same table/action for the same role are combined with OR,
  which can lead to unintended access. This migration removes the redundant policies.

  1. Tables affected:
    - `legal_documents` - Remove old "Authenticated users can *" policies (duplicated by "Team members can *")
    - `tasks` - Remove "Users can create their own tasks" (duplicated by "Team members can create tasks")
    - `team_invitations` - Remove "Admins can view all invitations" (covered by "Admins can manage invitations" ALL policy)
    - `user_permissions` - Remove "Admins can view all permissions" (covered by "Admins can manage permissions" ALL policy)
    - `users` - Remove "Service role can insert users" (overly permissive, covered by handle_new_user trigger + admin insert)

  2. Security
    - Reduces policy ambiguity
    - Eliminates unintended OR combinations
*/

-- legal_documents: Remove old overly-permissive duplicates, keep team-based ones
DROP POLICY IF EXISTS "Authenticated users can create legal_documents" ON public.legal_documents;
DROP POLICY IF EXISTS "Authenticated users can delete legal_documents" ON public.legal_documents;
DROP POLICY IF EXISTS "Authenticated users can update legal_documents" ON public.legal_documents;
DROP POLICY IF EXISTS "Authenticated users can view all legal_documents" ON public.legal_documents;

-- tasks: Remove duplicate INSERT policy
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;

-- team_invitations: Remove duplicate SELECT (ALL policy already covers SELECT)
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.team_invitations;

-- user_permissions: Remove duplicate SELECT (ALL policy already covers SELECT)
DROP POLICY IF EXISTS "Admins can view all permissions" ON public.user_permissions;

-- users: Remove overly permissive public INSERT policy
-- The handle_new_user trigger (SECURITY DEFINER) handles auth signups
-- Admin insert policy handles manual user creation
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
