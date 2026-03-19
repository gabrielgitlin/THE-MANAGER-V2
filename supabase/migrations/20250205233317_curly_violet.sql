/*
  # Initial Schema Setup for Artist Management Platform

  1. New Tables
    - albums
      - Basic album information
      - Metadata and release details
    - tracks
      - Track information
      - Links to streaming platforms
    - credits
      - Artist, producer, and engineer credits
      - Master and publishing splits
    - shows
      - Live performance details
      - Venue information
    - show_advances
      - Production and venue contacts
      - Schedule and logistics
    - show_deals
      - Financial terms
      - Settlement details
    - budgets
      - Budget tracking for releases and shows
    - budget_items
      - Individual transactions
      - Income and expenses
    - notes
      - User notes and reminders
      - Categorized content
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Changes
    - Initial schema creation
    - Basic data structure setup
*/

-- Albums table
CREATE TABLE IF NOT EXISTS public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  release_date date,
  format text CHECK (format IN ('Single', 'EP', 'Album')),
  label text,
  distributor text,
  status text DEFAULT 'draft',
  genres text[],
  upc text,
  artwork_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- Tracks table
CREATE TABLE IF NOT EXISTS public.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid REFERENCES public.albums(id),
  disc_number integer DEFAULT 1,
  track_number integer NOT NULL,
  title text NOT NULL,
  duration text,
  isrc text,
  isrc_atmos text,
  isrc_video text,
  upc text,
  upc_atmos text,
  spotify_uri text,
  apple_id text,
  official_video_url text,
  lyric_video_url text,
  visualizer_url text,
  lyrics text,
  lyrics_url text,
  audio_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Credits table
CREATE TABLE IF NOT EXISTS public.credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL, -- Can be album_id or track_id
  entity_type text CHECK (entity_type IN ('album', 'track')),
  name text NOT NULL,
  role text CHECK (role IN ('artist', 'producer', 'songwriter', 'mix_engineer', 'mastering_engineer')),
  master_percentage numeric,
  publishing_percentage numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- Shows table
CREATE TABLE IF NOT EXISTS public.shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  venue text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  status text CHECK (status IN ('confirmed', 'pending', 'cancelled')) DEFAULT 'pending',
  capacity integer,
  tickets_sold integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;

-- Show advances table
CREATE TABLE IF NOT EXISTS public.show_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES public.shows(id),
  production_manager jsonb,
  venue_contact jsonb,
  schedule jsonb,
  catering jsonb,
  parking jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.show_advances ENABLE ROW LEVEL SECURITY;

-- Show deals table
CREATE TABLE IF NOT EXISTS public.show_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES public.shows(id),
  deal_type text CHECK (deal_type IN ('guarantee', 'percentage', 'guarantee_vs_percentage')),
  guarantee numeric,
  percentage numeric,
  expenses jsonb,
  settlement jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.show_deals ENABLE ROW LEVEL SECURITY;

-- Budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text CHECK (type IN ('release', 'show', 'tour')),
  title text NOT NULL,
  artist text NOT NULL,
  status text CHECK (status IN ('planning', 'in_progress', 'completed')) DEFAULT 'planning',
  release_type text CHECK (release_type IN ('single', 'ep', 'album')),
  release_date date,
  show_date date,
  venue text,
  city text,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Budget items table
CREATE TABLE IF NOT EXISTS public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES public.budgets(id),
  date date NOT NULL,
  description text NOT NULL,
  type text CHECK (type IN ('Expense', 'Income')),
  amount numeric NOT NULL,
  category text CHECK (category IN ('Art', 'Digital', 'Marketing', 'Music', 'Press', 'Other')),
  status text CHECK (status IN ('received', 'pending', 'paid', 'unpaid')),
  notes text,
  attachments text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  category text CHECK (category IN ('todo', 'meeting', 'idea', 'other')),
  color text,
  minimized boolean DEFAULT false,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Albums policies
CREATE POLICY "Users can view their own albums"
  ON public.albums
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own albums"
  ON public.albums
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own albums"
  ON public.albums
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Tracks policies
CREATE POLICY "Users can view their own tracks"
  ON public.tracks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracks"
  ON public.tracks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks"
  ON public.tracks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Credits policies
CREATE POLICY "Users can view their own credits"
  ON public.credits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits"
  ON public.credits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.credits
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Shows policies
CREATE POLICY "Users can view their own shows"
  ON public.shows
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shows"
  ON public.shows
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shows"
  ON public.shows
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Show advances policies
CREATE POLICY "Users can view their own show advances"
  ON public.show_advances
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own show advances"
  ON public.show_advances
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own show advances"
  ON public.show_advances
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Show deals policies
CREATE POLICY "Users can view their own show deals"
  ON public.show_deals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own show deals"
  ON public.show_deals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own show deals"
  ON public.show_deals
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can view their own budgets"
  ON public.budgets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON public.budgets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON public.budgets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Budget items policies
CREATE POLICY "Users can view their own budget items"
  ON public.budget_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget items"
  ON public.budget_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget items"
  ON public.budget_items
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view their own notes"
  ON public.notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON public.notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.notes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_albums_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tracks_updated_at
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_credits_updated_at
  BEFORE UPDATE ON public.credits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_shows_updated_at
  BEFORE UPDATE ON public.shows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_show_advances_updated_at
  BEFORE UPDATE ON public.show_advances
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_show_deals_updated_at
  BEFORE UPDATE ON public.show_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_budget_items_updated_at
  BEFORE UPDATE ON public.budget_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();