/*
  # Create Credits Table

  ## Overview
  Creates a table to store credits and splits for tracks and albums, including artist, producer, songwriter, and engineer credits with percentage ownership.

  ## New Table
  
  ### `credits`
  - `id` (uuid, primary key) - Unique identifier
  - `entity_id` (uuid, not null) - References tracks or albums
  - `entity_type` (text, not null) - Either 'track' or 'album'
  - `name` (text, not null) - Name of the credited person/entity
  - `role` (text, not null) - Role: 'artist', 'producer', 'songwriter', 'mix_engineer', 'mastering_engineer'
  - `master_percentage` (numeric) - Master ownership percentage (0-100)
  - `publishing_percentage` (numeric) - Publishing ownership percentage (0-100)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS
  - Public read access (for now, can be restricted later)
  - Authenticated users can manage credits

  ## Indexes
  - Index on entity_id for fast lookups
  - Index on entity_type for filtering
  - Composite index on (entity_id, entity_type) for efficient queries
*/

CREATE TABLE IF NOT EXISTS public.credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('track', 'album')),
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('artist', 'producer', 'songwriter', 'mix_engineer', 'mastering_engineer')),
  master_percentage numeric(5,2) DEFAULT 0 CHECK (master_percentage >= 0 AND master_percentage <= 100),
  publishing_percentage numeric(5,2) DEFAULT 0 CHECK (publishing_percentage >= 0 AND publishing_percentage <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view credits"
  ON public.credits
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert credits"
  ON public.credits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update credits"
  ON public.credits
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete credits"
  ON public.credits
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS credits_entity_id_idx ON public.credits(entity_id);
CREATE INDEX IF NOT EXISTS credits_entity_type_idx ON public.credits(entity_type);
CREATE INDEX IF NOT EXISTS credits_entity_id_type_idx ON public.credits(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS credits_role_idx ON public.credits(role);
