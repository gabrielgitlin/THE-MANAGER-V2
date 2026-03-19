/*
  # Initial Schema Setup for Artist Management Platform

  1. Tables
    - users
      - Extended user profile information
    - projects
      - Tracks project information and status
    - teams
      - Manages team assignments and roles
    
  2. Security
    - Enable RLS on all tables
    - Add policies for data access
*/

-- Create a health check table for connection testing
CREATE TABLE IF NOT EXISTS public._health (
  id serial PRIMARY KEY,
  count integer DEFAULT 1
);

INSERT INTO public._health (count) VALUES (1) ON CONFLICT DO NOTHING;

-- Users table extension (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  role text CHECK (role IN ('admin', 'artist_manager', 'artist', 'team_member')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text CHECK (status IN ('planning', 'in_progress', 'completed')) DEFAULT 'planning',
  due_date timestamptz,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team members junction table
CREATE TABLE IF NOT EXISTS public.team_members (
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text CHECK (role IN ('leader', 'member')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Health check policy
CREATE POLICY "Health check is readable by everyone"
  ON public._health
  FOR SELECT
  USING (true);

-- Profiles policies - use IF NOT EXISTS to avoid errors
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Public profiles are viewable by everyone'
    AND polrelid = 'public.profiles'::regclass
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone"
      ON public.profiles
      FOR SELECT
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can update their own profile'
    AND polrelid = 'public.profiles'::regclass
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- Projects policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Projects are viewable by team members'
    AND polrelid = 'public.projects'::regclass
  ) THEN
    CREATE POLICY "Projects are viewable by team members"
      ON public.projects
      FOR SELECT
      USING (
        auth.uid() IN (
          SELECT user_id 
          FROM public.team_members tm 
          WHERE tm.team_id IN (
            SELECT team_id 
            FROM public.team_members 
            WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Project owners can update their projects'
    AND polrelid = 'public.projects'::regclass
  ) THEN
    CREATE POLICY "Project owners can update their projects"
      ON public.projects
      FOR UPDATE
      USING (auth.uid() = owner_id);
  END IF;
END $$;

-- Teams policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Teams are viewable by their members'
    AND polrelid = 'public.teams'::regclass
  ) THEN
    CREATE POLICY "Teams are viewable by their members"
      ON public.teams
      FOR SELECT
      USING (
        auth.uid() IN (
          SELECT user_id 
          FROM public.team_members 
          WHERE team_id = id
        )
      );
  END IF;
END $$;

-- Team members policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Team members are viewable by team members'
    AND polrelid = 'public.team_members'::regclass
  ) THEN
    CREATE POLICY "Team members are viewable by team members"
      ON public.team_members
      FOR SELECT
      USING (
        auth.uid() IN (
          SELECT user_id 
          FROM public.team_members 
          WHERE team_id = team_id
        )
      );
  END IF;
END $$;

-- Functions

-- Function to handle updating timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at - only create if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_profiles_updated_at' 
    AND tgrelid = 'public.profiles'::regclass
  ) THEN
    CREATE TRIGGER set_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_projects_updated_at' 
    AND tgrelid = 'public.projects'::regclass
  ) THEN
    CREATE TRIGGER set_projects_updated_at
      BEFORE UPDATE ON public.projects
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_teams_updated_at' 
    AND tgrelid = 'public.teams'::regclass
  ) THEN
    CREATE TRIGGER set_teams_updated_at
      BEFORE UPDATE ON public.teams
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;