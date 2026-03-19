/*
  # Add Comprehensive Show Details Tables

  ## Overview
  Creates tables to store all show-related details displayed in ShowDetails page:
  - Show deals (guarantee, percentage, expenses, settlement)
  - Show advances (contacts, schedule, catering, parking)
  - Setlists and songs
  - Guest lists
  - Marketing tasks
  - Production files

  ## New Tables
  1. `show_deals` - Financial deal information for shows
  2. `show_advances` - Production advances and day-of-show details
  3. `setlists` - Master setlist records
  4. `setlist_songs` - Individual songs in setlists
  5. `guest_list` - Guest list entries for shows
  6. `marketing_tasks` - Marketing checklist items per show
  7. `production_files` - Production documents (riders, plots, etc.)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their show data
*/

-- Show Deals Table
CREATE TABLE IF NOT EXISTS show_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  deal_type text NOT NULL CHECK (deal_type IN ('guarantee', 'percentage', 'guarantee_vs_percentage', 'flat_fee')),
  guarantee numeric DEFAULT 0,
  percentage integer DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  expenses jsonb DEFAULT '{}'::jsonb,
  settlement jsonb DEFAULT '{}'::jsonb,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE show_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage show deals"
  ON show_deals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Show Advances Table
CREATE TABLE IF NOT EXISTS show_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  production_manager jsonb DEFAULT '{}'::jsonb,
  venue_contact jsonb DEFAULT '{}'::jsonb,
  schedule jsonb DEFAULT '{}'::jsonb,
  catering jsonb DEFAULT '{}'::jsonb,
  parking jsonb DEFAULT '{}'::jsonb,
  technical_requirements text DEFAULT '',
  hospitality_requirements text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE show_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage show advances"
  ON show_advances
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Setlists Table
CREATE TABLE IF NOT EXISTS setlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'proposed', 'final', 'archived')),
  notes text DEFAULT '',
  last_updated timestamptz DEFAULT now(),
  updated_by text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage setlists"
  ON setlists
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Setlist Songs Table
CREATE TABLE IF NOT EXISTS setlist_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id uuid REFERENCES setlists(id) ON DELETE CASCADE NOT NULL,
  position integer NOT NULL,
  song_title text NOT NULL,
  duration text DEFAULT '',
  key text DEFAULT '',
  is_encore boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage setlist songs"
  ON setlist_songs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Guest List Table
CREATE TABLE IF NOT EXISTS guest_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('vip', 'industry', 'friends_family', 'media', 'other')),
  quantity integer DEFAULT 1,
  requested_by text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  contact_info text DEFAULT '',
  notes text DEFAULT '',
  tickets_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE guest_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage guest list"
  ON guest_list
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Marketing Tasks Table
CREATE TABLE IF NOT EXISTS marketing_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  task_key text NOT NULL,
  label text NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  completed_by text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage marketing tasks"
  ON marketing_tasks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Production Files Table
CREATE TABLE IF NOT EXISTS production_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('tech_rider', 'hospitality_rider', 'stage_plot', 'input_list', 'backline', 'contract', 'other')),
  file_url text DEFAULT '',
  version text DEFAULT '1.0',
  uploaded_at timestamptz DEFAULT now(),
  uploaded_by text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE production_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage production files"
  ON production_files
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_show_deals_show_id ON show_deals(show_id);
CREATE INDEX IF NOT EXISTS idx_show_advances_show_id ON show_advances(show_id);
CREATE INDEX IF NOT EXISTS idx_setlists_show_id ON setlists(show_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist_id ON setlist_songs(setlist_id);
CREATE INDEX IF NOT EXISTS idx_guest_list_show_id ON guest_list(show_id);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_show_id ON marketing_tasks(show_id);
CREATE INDEX IF NOT EXISTS idx_production_files_show_id ON production_files(show_id);
