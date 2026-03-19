/*
  # User Management and Permissions System

  1. New Tables
    - `users` - Main user accounts table
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text) - admin, artist_manager, artist, attorney, tour_manager, marketing_manager, finance_manager, team_member
      - `avatar_url` (text)
      - `artist_id` (uuid, references artists) - links user to an artist
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_permissions` - Stores granular module-level permissions
      - `user_id` (uuid, references users)
      - `module` (text) - catalog, finance, legal, live, marketing, personnel, info, dashboard
      - `access_level` (text) - view, comment, edit, full
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `team_invitations` - Tracks pending user invitations
      - `id` (uuid, primary key)
      - `email` (text)
      - `role` (text)
      - `invited_by` (uuid, references users)
      - `status` (text) - pending, accepted, expired
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated admin/artist_manager access
    - Add trigger to create user profile when auth user signs up

  3. Important Notes
    - This creates a proper user management system
    - Users can be linked to artists via artist_id
    - Custom permissions can override role defaults
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_team_members();

-- Create handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'team_member' CHECK (role IN ('admin', 'artist_manager', 'artist', 'attorney', 'tour_manager', 'marketing_manager', 'finance_manager', 'team_member')),
  avatar_url text,
  artist_id uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  module text NOT NULL CHECK (module IN ('catalog', 'finance', 'legal', 'live', 'marketing', 'personnel', 'info', 'dashboard')),
  access_level text NOT NULL CHECK (access_level IN ('view', 'comment', 'edit', 'full')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, module)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'team_member' CHECK (role IN ('admin', 'artist_manager', 'artist', 'attorney', 'tour_manager', 'marketing_manager', 'finance_manager', 'team_member')),
  invited_by uuid REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamptz DEFAULT (now() + INTERVAL '7 days'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Users can view all users'
    AND polrelid = 'public.users'::regclass
  ) THEN
    CREATE POLICY "Users can view all users"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Users can update their own profile'
    AND polrelid = 'public.users'::regclass
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.users
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Service role can insert users'
    AND polrelid = 'public.users'::regclass
  ) THEN
    CREATE POLICY "Service role can insert users"
      ON public.users
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admins can insert users directly'
    AND polrelid = 'public.users'::regclass
  ) THEN
    CREATE POLICY "Admins can insert users directly"
      ON public.users
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role IN ('admin', 'artist_manager')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admins can update any user'
    AND polrelid = 'public.users'::regclass
  ) THEN
    CREATE POLICY "Admins can update any user"
      ON public.users
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role IN ('admin', 'artist_manager')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role IN ('admin', 'artist_manager')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admins can delete users'
    AND polrelid = 'public.users'::regclass
  ) THEN
    CREATE POLICY "Admins can delete users"
      ON public.users
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role IN ('admin', 'artist_manager')
        )
      );
  END IF;
END $$;

-- RLS Policies for user_permissions

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admins can view all permissions'
    AND polrelid = 'public.user_permissions'::regclass
  ) THEN
    CREATE POLICY "Admins can view all permissions"
      ON public.user_permissions
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role IN ('admin', 'artist_manager')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Users can view their own permissions'
    AND polrelid = 'public.user_permissions'::regclass
  ) THEN
    CREATE POLICY "Users can view their own permissions"
      ON public.user_permissions
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admins can manage permissions'
    AND polrelid = 'public.user_permissions'::regclass
  ) THEN
    CREATE POLICY "Admins can manage permissions"
      ON public.user_permissions
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role IN ('admin', 'artist_manager')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role IN ('admin', 'artist_manager')
        )
      );
  END IF;
END $$;

-- RLS Policies for team_invitations

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admins can view all invitations'
    AND polrelid = 'public.team_invitations'::regclass
  ) THEN
    CREATE POLICY "Admins can view all invitations"
      ON public.team_invitations
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role IN ('admin', 'artist_manager')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admins can manage invitations'
    AND polrelid = 'public.team_invitations'::regclass
  ) THEN
    CREATE POLICY "Admins can manage invitations"
      ON public.team_invitations
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role IN ('admin', 'artist_manager')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role IN ('admin', 'artist_manager')
        )
      );
  END IF;
END $$;

-- Function to auto-create user profile when auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'artist_manager')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
END $$;

-- Function to get team members
CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  avatar_url text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.avatar_url,
    u.created_at
  FROM public.users u
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_members() TO authenticated;

-- Add updated_at triggers
DO $$
BEGIN
  DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
  CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

  DROP TRIGGER IF EXISTS set_user_permissions_updated_at ON public.user_permissions;
  CREATE TRIGGER set_user_permissions_updated_at
    BEFORE UPDATE ON public.user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
END $$;

-- Migrate existing auth users to the users table
INSERT INTO public.users (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', email) as full_name,
  'artist_manager' as role
FROM auth.users
ON CONFLICT (id) DO NOTHING;