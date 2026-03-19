/*
  # Add Platform Integrations

  1. New Tables
    - `platform_integrations`
      - `id` (uuid, primary key)
      - `artist_id` (uuid, foreign key to artists)
      - `platform` (text - 'bandsintown' or 'songkick')
      - `enabled` (boolean)
      - `api_key` (text, encrypted)
      - `artist_name` (text - platform-specific artist name)
      - `platform_artist_id` (text - ID on the platform)
      - `last_sync` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Policies for authenticated users to manage their integrations
*/

CREATE TABLE IF NOT EXISTS platform_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('bandsintown', 'songkick')),
  enabled boolean DEFAULT true,
  api_key text,
  artist_name text,
  platform_artist_id text,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(artist_id, platform)
);

ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view platform integrations"
  ON platform_integrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create platform integrations"
  ON platform_integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update platform integrations"
  ON platform_integrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete platform integrations"
  ON platform_integrations
  FOR DELETE
  TO authenticated
  USING (true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_integrations_artist_platform 
  ON platform_integrations(artist_id, platform);