/*
  # Add Personnel Profiles

  1. New Tables
    - `personnel_profiles`
      - Basic information (name, email, phone, etc.)
      - Contact details
      - Professional information
    - `personnel_pros`
      - PRO affiliations for personnel
    - `personnel_publishers`
      - Publisher affiliations for personnel
  
  2. Security
    - Enable RLS on all tables
    - Add policies for data access
    
  3. Changes
    - Add necessary indexes
    - Add triggers for updated_at
*/

-- Personnel Profiles table
CREATE TABLE IF NOT EXISTS public.personnel_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  type text CHECK (type IN ('songwriter', 'producer', 'artist', 'mix_engineer', 'mastering_engineer')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  date_of_birth date,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  bio text,
  website text,
  social_links jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.personnel_profiles ENABLE ROW LEVEL SECURITY;

-- Personnel PROs junction table
CREATE TABLE IF NOT EXISTS public.personnel_pros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id uuid REFERENCES public.personnel_profiles(id) ON DELETE CASCADE,
  pro_id uuid REFERENCES public.performance_rights_organizations(id) ON DELETE CASCADE,
  ipi_number text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(personnel_id, pro_id)
);

ALTER TABLE public.personnel_pros ENABLE ROW LEVEL SECURITY;

-- Personnel Publishers junction table
CREATE TABLE IF NOT EXISTS public.personnel_publishers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id uuid REFERENCES public.personnel_profiles(id) ON DELETE CASCADE,
  publisher_id uuid REFERENCES public.publishers(id) ON DELETE CASCADE,
  ipi_number text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(personnel_id, publisher_id)
);

ALTER TABLE public.personnel_publishers ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX personnel_profiles_user_id_idx ON public.personnel_profiles(user_id);
CREATE INDEX personnel_profiles_type_idx ON public.personnel_profiles(type);
CREATE INDEX personnel_pros_personnel_id_idx ON public.personnel_pros(personnel_id);
CREATE INDEX personnel_pros_pro_id_idx ON public.personnel_pros(pro_id);
CREATE INDEX personnel_publishers_personnel_id_idx ON public.personnel_publishers(personnel_id);
CREATE INDEX personnel_publishers_publisher_id_idx ON public.personnel_publishers(publisher_id);

-- RLS Policies

-- Personnel Profiles policies
CREATE POLICY "Users can view personnel profiles"
  ON public.personnel_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own personnel profiles"
  ON public.personnel_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personnel profiles"
  ON public.personnel_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personnel profiles"
  ON public.personnel_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Personnel PROs policies
CREATE POLICY "Users can view personnel PROs"
  ON public.personnel_pros
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.personnel_profiles
    WHERE id = personnel_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own personnel PROs"
  ON public.personnel_pros
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.personnel_profiles
    WHERE id = personnel_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own personnel PROs"
  ON public.personnel_pros
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.personnel_profiles
    WHERE id = personnel_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own personnel PROs"
  ON public.personnel_pros
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.personnel_profiles
    WHERE id = personnel_id AND user_id = auth.uid()
  ));

-- Personnel Publishers policies
CREATE POLICY "Users can view personnel publishers"
  ON public.personnel_publishers
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.personnel_profiles
    WHERE id = personnel_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own personnel publishers"
  ON public.personnel_publishers
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.personnel_profiles
    WHERE id = personnel_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own personnel publishers"
  ON public.personnel_publishers
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.personnel_profiles
    WHERE id = personnel_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own personnel publishers"
  ON public.personnel_publishers
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.personnel_profiles
    WHERE id = personnel_id AND user_id = auth.uid()
  ));

-- Add triggers for updated_at
CREATE TRIGGER set_personnel_profiles_updated_at
  BEFORE UPDATE ON public.personnel_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_personnel_pros_updated_at
  BEFORE UPDATE ON public.personnel_pros
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_personnel_publishers_updated_at
  BEFORE UPDATE ON public.personnel_publishers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();