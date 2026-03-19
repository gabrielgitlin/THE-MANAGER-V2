/*
  # Add PRO and Publisher Information

  1. New Tables
    - `performance_rights_organizations` (PROs)
      - `id` (uuid, primary key)
      - `name` (text)
      - `country` (text)
      - `ipi_number` (text)
    - `publishers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `ipi_number` (text)
    - `songwriter_pros` (junction table)
      - `songwriter_id` (uuid, references credits)
      - `pro_id` (uuid, references PROs)
    - `songwriter_publishers` (junction table)
      - `songwriter_id` (uuid, references credits)
      - `publisher_id` (uuid, references publishers)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users

  3. Changes
    - Add PRO and publisher relationships for songwriters
    - Add IPI numbers tracking
*/

-- Performance Rights Organizations table
CREATE TABLE IF NOT EXISTS public.performance_rights_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text,
  ipi_number text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.performance_rights_organizations ENABLE ROW LEVEL SECURITY;

-- Publishers table
CREATE TABLE IF NOT EXISTS public.publishers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ipi_number text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;

-- Songwriter PROs junction table
CREATE TABLE IF NOT EXISTS public.songwriter_pros (
  songwriter_id uuid REFERENCES public.credits(id) ON DELETE CASCADE,
  pro_id uuid REFERENCES public.performance_rights_organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (songwriter_id, pro_id)
);

ALTER TABLE public.songwriter_pros ENABLE ROW LEVEL SECURITY;

-- Songwriter Publishers junction table
CREATE TABLE IF NOT EXISTS public.songwriter_publishers (
  songwriter_id uuid REFERENCES public.credits(id) ON DELETE CASCADE,
  publisher_id uuid REFERENCES public.publishers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (songwriter_id, publisher_id)
);

ALTER TABLE public.songwriter_publishers ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX pro_name_idx ON public.performance_rights_organizations(name);
CREATE INDEX publisher_name_idx ON public.publishers(name);
CREATE INDEX songwriter_pros_songwriter_id_idx ON public.songwriter_pros(songwriter_id);
CREATE INDEX songwriter_pros_pro_id_idx ON public.songwriter_pros(pro_id);
CREATE INDEX songwriter_publishers_songwriter_id_idx ON public.songwriter_publishers(songwriter_id);
CREATE INDEX songwriter_publishers_publisher_id_idx ON public.songwriter_publishers(publisher_id);

-- RLS Policies

-- PRO policies
CREATE POLICY "Users can view PROs"
  ON public.performance_rights_organizations
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own PROs"
  ON public.performance_rights_organizations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PROs"
  ON public.performance_rights_organizations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Publisher policies
CREATE POLICY "Users can view publishers"
  ON public.publishers
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own publishers"
  ON public.publishers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own publishers"
  ON public.publishers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Songwriter PROs policies
CREATE POLICY "Users can view songwriter PROs"
  ON public.songwriter_pros
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert songwriter PROs"
  ON public.songwriter_pros
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.credits c
    WHERE c.id = songwriter_id AND c.user_id = auth.uid()
  ));

-- Songwriter Publishers policies
CREATE POLICY "Users can view songwriter publishers"
  ON public.songwriter_publishers
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert songwriter publishers"
  ON public.songwriter_publishers
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.credits c
    WHERE c.id = songwriter_id AND c.user_id = auth.uid()
  ));

-- Add triggers for updated_at
CREATE TRIGGER set_pros_updated_at
  BEFORE UPDATE ON public.performance_rights_organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_publishers_updated_at
  BEFORE UPDATE ON public.publishers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();