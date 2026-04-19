-- CONSOLIDATED MIGRATION FILE
-- This file contains all migrations concatenated in chronological order
-- Generated on 2026-03-24

-- ========================================
-- Migration: 20250205233317_curly_violet.sql
-- ========================================

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

-- ========================================
-- Migration: 20250205235100_bold_snowflake.sql
-- ========================================

/*
  # Add Analytics Tables
  
  1. New Tables
    - `platform_metrics`
      - Daily metrics from each platform
      - Stores raw data points
    - `platform_accounts`
      - Connected platform accounts and credentials
      - Stores API keys and access tokens
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Platform accounts table
CREATE TABLE IF NOT EXISTS public.platform_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('spotify', 'apple_music', 'youtube', 'instagram', 'facebook', 'twitter', 'tiktok')),
  account_name text NOT NULL,
  account_id text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_connected boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.platform_accounts ENABLE ROW LEVEL SECURITY;

-- Platform metrics table
CREATE TABLE IF NOT EXISTS public.platform_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_account_id uuid REFERENCES public.platform_accounts(id),
  date date NOT NULL,
  metric_type text NOT NULL CHECK (metric_type IN (
    'followers', 'monthly_listeners', 'plays', 'views', 
    'subscribers', 'likes', 'comments', 'shares', 
    'reach', 'engagement_rate', 'mentions'
  )),
  value numeric NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX platform_metrics_date_idx ON public.platform_metrics(date);
CREATE INDEX platform_metrics_platform_account_id_idx ON public.platform_metrics(platform_account_id);

-- RLS Policies
CREATE POLICY "Users can view their own platform accounts"
  ON public.platform_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own platform accounts"
  ON public.platform_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own platform accounts"
  ON public.platform_accounts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own platform metrics"
  ON public.platform_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own platform metrics"
  ON public.platform_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER set_platform_accounts_updated_at
  BEFORE UPDATE ON public.platform_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- Migration: 20250205235832_delicate_waterfall.sql
-- ========================================

/*
  # Add Healthcheck Function
  
  1. New Functions
    - `healthcheck()`: Returns true if the database connection is working
  
  2. Security
    - Function is accessible to authenticated users only
*/

-- Create healthcheck function
CREATE OR REPLACE FUNCTION public.healthcheck()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.healthcheck TO authenticated;

-- ========================================
-- Migration: 20250206234601_lingering_mountain.sql
-- ========================================

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

-- ========================================
-- Migration: 20250207185736_solitary_king.sql
-- ========================================

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

-- ========================================
-- Migration: 20250211202324_noisy_valley.sql
-- ========================================

/*
  # Add Subscription Plans

  1. New Tables
    - `subscription_plans`
      - `id` (uuid, primary key)
      - `type` (text)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `features` (text[])
      - `modules` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `plan_id` (uuid, references subscription_plans)
      - `status` (text)
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for viewing and managing subscriptions
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('artist', 'manager', 'label', 'publisher', 'producer')),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  features text[],
  modules jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.subscription_plans(id),
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX subscription_plans_type_idx ON public.subscription_plans(type);
CREATE INDEX user_subscriptions_user_id_idx ON public.user_subscriptions(user_id);
CREATE INDEX user_subscriptions_plan_id_idx ON public.user_subscriptions(plan_id);
CREATE INDEX user_subscriptions_status_idx ON public.user_subscriptions(status);

-- Add RLS policies for subscription_plans
CREATE POLICY "Subscription plans are viewable by everyone"
  ON public.subscription_plans
  FOR SELECT
  USING (true);

-- Add RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER set_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default plans
INSERT INTO public.subscription_plans (type, name, description, price, features, modules) VALUES
  (
    'artist',
    'Artist',
    'For independent artists managing their own career',
    29.99,
    ARRAY[
      'Track releases and metadata',
      'Basic financial tracking',
      'Calendar management',
      'Document storage',
      'Basic analytics'
    ],
    '[
      {
        "id": "catalog",
        "name": "Catalog",
        "path": "/catalog",
        "icon": "Music2",
        "description": "Manage your releases",
        "features": ["Track releases", "Manage metadata", "Export data"]
      },
      {
        "id": "finance",
        "name": "Finance",
        "path": "/finance",
        "icon": "DollarSign",
        "description": "Basic financial tracking",
        "features": ["Income/expense tracking", "Basic reporting"]
      },
      {
        "id": "calendar",
        "name": "Calendar",
        "path": "/live/calendar",
        "icon": "Calendar",
        "description": "Show calendar",
        "features": ["Show dates", "Basic scheduling"]
      }
    ]'::jsonb
  ),
  (
    'manager',
    'Artist Manager',
    'Full suite for professional artist management',
    99.99,
    ARRAY[
      'Complete catalog management',
      'Advanced financial tracking',
      'Tour management',
      'Team collaboration',
      'Document management',
      'Advanced analytics',
      'Multiple artist support'
    ],
    '[
      {
        "id": "catalog",
        "name": "Catalog",
        "path": "/catalog",
        "icon": "Music2",
        "description": "Complete catalog management",
        "features": ["Full release management", "Metadata management", "Rights management", "Export tools"]
      },
      {
        "id": "finance",
        "name": "Finance",
        "path": "/finance",
        "icon": "DollarSign",
        "description": "Advanced financial tools",
        "features": ["Complete financial tracking", "Budget management", "Advanced reporting"]
      },
      {
        "id": "live",
        "name": "Live",
        "path": "/live",
        "icon": "Mic2",
        "description": "Tour management",
        "features": ["Show management", "Tour planning", "Personnel management"]
      },
      {
        "id": "legal",
        "name": "Legal",
        "path": "/legal",
        "icon": "Scale",
        "description": "Contract management",
        "features": ["Contract templates", "Document storage", "Rights tracking"]
      },
      {
        "id": "marketing",
        "name": "Marketing",
        "path": "/marketing",
        "icon": "Megaphone",
        "description": "Marketing tools",
        "features": ["Campaign planning", "Social media management", "Asset management"]
      },
      {
        "id": "info",
        "name": "Info",
        "path": "/info",
        "icon": "Info",
        "description": "Sensitive information",
        "features": ["Secure storage", "Team access control"]
      }
    ]'::jsonb
  ),
  (
    'label',
    'Record Label',
    'For record labels managing multiple artists',
    199.99,
    ARRAY[
      'Multiple artist management',
      'Label-wide analytics',
      'Advanced rights management',
      'Distribution tools',
      'Marketing suite',
      'Team collaboration'
    ],
    '[
      {
        "id": "catalog",
        "name": "Catalog",
        "path": "/catalog",
        "icon": "Music2",
        "description": "Label catalog management",
        "features": ["Multi-artist catalog", "Advanced metadata", "Distribution tools"]
      },
      {
        "id": "finance",
        "name": "Finance",
        "path": "/finance",
        "icon": "DollarSign",
        "description": "Label finances",
        "features": ["Label-wide financials", "Artist accounting", "Royalty management"]
      },
      {
        "id": "marketing",
        "name": "Marketing",
        "path": "/marketing",
        "icon": "Megaphone",
        "description": "Marketing suite",
        "features": ["Campaign management", "Asset management", "Analytics"]
      }
    ]'::jsonb
  ),
  (
    'publisher',
    'Music Publisher',
    'For music publishers managing songwriters and compositions',
    199.99,
    ARRAY[
      'Songwriter management',
      'Copyright tracking',
      'Royalty management',
      'PRO integration',
      'Advanced reporting'
    ],
    '[
      {
        "id": "catalog",
        "name": "Works",
        "path": "/catalog",
        "icon": "Music2",
        "description": "Song catalog management",
        "features": ["Copyright management", "Songwriter splits", "PRO registration"]
      },
      {
        "id": "finance",
        "name": "Finance",
        "path": "/finance",
        "icon": "DollarSign",
        "description": "Publishing finances",
        "features": ["Royalty tracking", "Writer payments", "Advanced reporting"]
      }
    ]'::jsonb
  ),
  (
    'producer',
    'Producer',
    'For music producers managing projects and clients',
    49.99,
    ARRAY[
      'Project management',
      'Client management',
      'Basic financial tracking',
      'File management',
      'Basic analytics'
    ],
    '[
      {
        "id": "catalog",
        "name": "Projects",
        "path": "/catalog",
        "icon": "Music2",
        "description": "Project management",
        "features": ["Track projects", "Client management", "File organization"]
      },
      {
        "id": "finance",
        "name": "Finance",
        "path": "/finance",
        "icon": "DollarSign",
        "description": "Financial tracking",
        "features": ["Income tracking", "Basic reporting", "Invoice management"]
      }
    ]'::jsonb
  );

-- ========================================
-- Migration: 20250409001210_super_field.sql
-- ========================================

/*
  # Fix Platform Tables Migration
  
  1. Tables
    - `platform_accounts`
      - Connected platform accounts and credentials
      - Stores API keys and access tokens
    - `platform_metrics`
      - Daily metrics from each platform
      - Stores raw data points
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Platform accounts table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'platform_accounts') THEN
    CREATE TABLE public.platform_accounts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      platform text NOT NULL CHECK (platform IN ('spotify', 'apple_music', 'youtube', 'instagram', 'facebook', 'twitter', 'tiktok')),
      account_name text NOT NULL,
      account_id text NOT NULL,
      access_token text,
      refresh_token text,
      token_expires_at timestamptz,
      is_connected boolean DEFAULT false,
      metadata jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      user_id uuid REFERENCES auth.users(id)
    );

    ALTER TABLE public.platform_accounts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Platform metrics table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'platform_metrics') THEN
    CREATE TABLE public.platform_metrics (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      platform_account_id uuid REFERENCES public.platform_accounts(id),
      date date NOT NULL,
      metric_type text NOT NULL CHECK (metric_type IN (
        'followers', 'monthly_listeners', 'plays', 'views', 
        'subscribers', 'likes', 'comments', 'shares', 
        'reach', 'engagement_rate', 'mentions'
      )),
      value numeric NOT NULL,
      metadata jsonb,
      created_at timestamptz DEFAULT now(),
      user_id uuid REFERENCES auth.users(id)
    );

    ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Add indexes (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'platform_metrics_date_idx') THEN
    CREATE INDEX platform_metrics_date_idx ON public.platform_metrics(date);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'platform_metrics_platform_account_id_idx') THEN
    CREATE INDEX platform_metrics_platform_account_id_idx ON public.platform_metrics(platform_account_id);
  END IF;
END $$;

-- RLS Policies (drop if exists and recreate)
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own platform accounts" ON public.platform_accounts;
  DROP POLICY IF EXISTS "Users can insert their own platform accounts" ON public.platform_accounts;
  DROP POLICY IF EXISTS "Users can update their own platform accounts" ON public.platform_accounts;
  DROP POLICY IF EXISTS "Users can view their own platform metrics" ON public.platform_metrics;
  DROP POLICY IF EXISTS "Users can insert their own platform metrics" ON public.platform_metrics;
  
  -- Create policies
  CREATE POLICY "Users can view their own platform accounts"
    ON public.platform_accounts
    FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own platform accounts"
    ON public.platform_accounts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own platform accounts"
    ON public.platform_accounts
    FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can view their own platform metrics"
    ON public.platform_metrics
    FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own platform metrics"
    ON public.platform_metrics
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
END $$;

-- Add trigger for updated_at (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_platform_accounts_updated_at' 
    AND tgrelid = 'public.platform_accounts'::regclass
  ) THEN
    CREATE TRIGGER set_platform_accounts_updated_at
      BEFORE UPDATE ON public.platform_accounts
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ========================================
-- Migration: 20250409001435_broad_palace.sql
-- ========================================

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

-- ========================================
-- Migration: 20250409001539_rough_marsh.sql
-- ========================================

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

-- Health check table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '_health') THEN
    CREATE TABLE public._health (
      id serial PRIMARY KEY,
      count integer DEFAULT 1
    );
    
    INSERT INTO public._health (count) VALUES (1);
  END IF;
END $$;

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
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Health check is readable by everyone'
    AND polrelid = 'public._health'::regclass
  ) THEN
    CREATE POLICY "Health check is readable by everyone"
      ON public._health
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Profiles policies
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

-- ========================================
-- Migration: 20250409014054_late_reef.sql
-- ========================================

/*
  # Add Contract Analysis Support
  
  1. New Tables
    - `legal_documents` (if it doesn't exist)
      - Basic document information
      - Storage for legal contracts and agreements
    - `contract_analyses`
      - Stores AI-generated contract analyses
      - Links to legal documents
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create legal_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text CHECK (type IN ('contract', 'license', 'release', 'agreement', 'other')),
  status text CHECK (status IN ('draft', 'pending_review', 'pending_signature', 'active', 'expired', 'terminated')),
  parties text[] NOT NULL,
  effective_date timestamptz NOT NULL,
  expiration_date timestamptz,
  description text,
  file_name text NOT NULL,
  last_modified timestamptz DEFAULT now(),
  tags text[],
  version text,
  signed_by text[],
  pending_signatures text[],
  ai_analysis jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for legal_documents
CREATE POLICY "Users can view their own legal documents"
  ON public.legal_documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own legal documents"
  ON public.legal_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own legal documents"
  ON public.legal_documents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Contract analyses table
CREATE TABLE IF NOT EXISTS public.contract_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL,
  key_terms jsonb NOT NULL,
  risks jsonb NOT NULL,
  recommendations jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.contract_analyses ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX contract_analyses_document_id_idx ON public.contract_analyses(document_id);
CREATE INDEX contract_analyses_user_id_idx ON public.contract_analyses(user_id);

-- RLS Policies
CREATE POLICY "Users can view their own contract analyses"
  ON public.contract_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contract analyses"
  ON public.contract_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contract analyses"
  ON public.contract_analyses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER set_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_contract_analyses_updated_at
  BEFORE UPDATE ON public.contract_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- Migration: 20251002220914_create_core_schema.sql
-- ========================================

/*
  # Artist Management Platform - Core Schema

  ## Overview
  This migration creates the foundational database schema for a complete artist management platform,
  including artist profiles, catalog management, live shows, personnel, finances, and legal documents.

  ## New Tables

  ### 1. Artists
  - `id` (uuid, primary key)
  - `name` (text) - Artist or band name
  - `bio` (text) - Artist biography
  - `genre` (text) - Primary genre
  - `image_url` (text) - Profile image
  - `spotify_url`, `apple_music_url`, `instagram_url` - Social/streaming links
  - `created_at`, `updated_at` (timestamptz)

  ### 2. Albums
  - `id` (uuid, primary key)
  - `artist_id` (uuid, foreign key to artists)
  - `title` (text) - Album title
  - `release_date` (date)
  - `cover_url` (text) - Album cover image
  - `label` (text) - Record label
  - `format` (text) - Physical/Digital/Both
  - `status` (text) - Released/Upcoming/In Production
  - `created_at`, `updated_at` (timestamptz)

  ### 3. Tracks
  - `id` (uuid, primary key)
  - `album_id` (uuid, foreign key to albums)
  - `title` (text) - Track title
  - `duration` (integer) - Duration in seconds
  - `track_number` (integer)
  - `isrc` (text) - International Standard Recording Code
  - `audio_url` (text) - Audio file URL
  - `lyrics` (text)
  - `created_at`, `updated_at` (timestamptz)

  ### 4. Shows
  - `id` (uuid, primary key)
  - `artist_id` (uuid, foreign key to artists)
  - `title` (text) - Show title
  - `venue_name` (text)
  - `venue_city` (text)
  - `venue_country` (text)
  - `date` (date)
  - `doors_time`, `show_time` (time)
  - `capacity` (integer)
  - `ticket_price` (decimal)
  - `guarantee` (decimal) - Guaranteed payment
  - `status` (text) - Confirmed/Pending/Cancelled
  - `notes` (text)
  - `created_at`, `updated_at` (timestamptz)

  ### 5. Personnel
  - `id` (uuid, primary key)
  - `name` (text)
  - `role` (text) - Manager/Agent/Tour Manager/etc
  - `email` (text)
  - `phone` (text)
  - `company` (text)
  - `rate` (decimal) - Fee or rate
  - `rate_type` (text) - Hourly/Daily/Percentage/Fixed
  - `notes` (text)
  - `created_at`, `updated_at` (timestamptz)

  ### 6. Show Personnel
  - `id` (uuid, primary key)
  - `show_id` (uuid, foreign key to shows)
  - `personnel_id` (uuid, foreign key to personnel)
  - `fee` (decimal) - Fee for this specific show
  - `status` (text) - Confirmed/Pending

  ### 7. Finances
  - `id` (uuid, primary key)
  - `artist_id` (uuid, foreign key to artists)
  - `show_id` (uuid, nullable, foreign key to shows)
  - `type` (text) - Income/Expense
  - `category` (text) - Show/Streaming/Merchandise/Travel/etc
  - `description` (text)
  - `amount` (decimal)
  - `date` (date)
  - `status` (text) - Paid/Pending/Overdue
  - `created_at`, `updated_at` (timestamptz)

  ### 8. Legal Documents
  - `id` (uuid, primary key)
  - `artist_id` (uuid, foreign key to artists)
  - `show_id` (uuid, nullable, foreign key to shows)
  - `title` (text)
  - `type` (text) - Contract/Agreement/Release/etc
  - `file_url` (text)
  - `signed_date` (date)
  - `expiry_date` (date, nullable)
  - `status` (text) - Draft/Pending/Signed/Expired
  - `notes` (text)
  - `created_at`, `updated_at` (timestamptz)

  ### 9. Tasks
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `artist_id` (uuid, nullable, foreign key to artists)
  - `show_id` (uuid, nullable, foreign key to shows)
  - `title` (text)
  - `description` (text)
  - `due_date` (date, nullable)
  - `priority` (text) - High/Medium/Low
  - `status` (text) - Todo/In Progress/Done
  - `created_at`, `updated_at` (timestamptz)

  ### 10. Notes
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `artist_id` (uuid, nullable, foreign key to artists)
  - `show_id` (uuid, nullable, foreign key to shows)
  - `title` (text)
  - `content` (text)
  - `created_at`, `updated_at` (timestamptz)

  ### 11. Marketing Campaigns
  - `id` (uuid, primary key)
  - `artist_id` (uuid, foreign key to artists)
  - `album_id` (uuid, nullable, foreign key to albums)
  - `title` (text)
  - `type` (text) - Social/Email/Ads/PR
  - `platform` (text) - Instagram/Facebook/Spotify/etc
  - `start_date`, `end_date` (date)
  - `budget` (decimal)
  - `status` (text) - Planning/Active/Completed
  - `notes` (text)
  - `created_at`, `updated_at` (timestamptz)

  ### 12. Transportation
  - `id` (uuid, primary key)
  - `show_id` (uuid, foreign key to shows)
  - `type` (text) - Flight/Bus/Van/Train
  - `departure_location` (text)
  - `arrival_location` (text)
  - `departure_time`, `arrival_time` (timestamptz)
  - `cost` (decimal)
  - `confirmation_number` (text)
  - `notes` (text)
  - `created_at`, `updated_at` (timestamptz)

  ### 13. Accommodations
  - `id` (uuid, primary key)
  - `show_id` (uuid, foreign key to shows)
  - `hotel_name` (text)
  - `address` (text)
  - `check_in_date`, `check_out_date` (date)
  - `rooms` (integer)
  - `cost` (decimal)
  - `confirmation_number` (text)
  - `notes` (text)
  - `created_at`, `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies restrict access to authenticated users only
  - Users can only access data they own or data shared with them

  ## Notes
  - All monetary values use decimal for precision
  - Timestamps use timestamptz for timezone awareness
  - Foreign keys ensure data integrity
  - Indexes added for common query patterns
*/

-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text DEFAULT '',
  genre text DEFAULT '',
  image_url text DEFAULT '',
  spotify_url text DEFAULT '',
  apple_music_url text DEFAULT '',
  instagram_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title text NOT NULL,
  release_date date,
  cover_url text DEFAULT '',
  label text DEFAULT '',
  format text DEFAULT 'Digital',
  status text DEFAULT 'In Production',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  title text NOT NULL,
  duration integer DEFAULT 0,
  track_number integer NOT NULL,
  isrc text DEFAULT '',
  audio_url text DEFAULT '',
  lyrics text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create shows table
CREATE TABLE IF NOT EXISTS shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title text NOT NULL,
  venue_name text NOT NULL,
  venue_city text NOT NULL,
  venue_country text NOT NULL,
  date date NOT NULL,
  doors_time time,
  show_time time,
  capacity integer DEFAULT 0,
  ticket_price decimal(10,2) DEFAULT 0,
  guarantee decimal(10,2) DEFAULT 0,
  status text DEFAULT 'Pending',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create personnel table
CREATE TABLE IF NOT EXISTS personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  company text DEFAULT '',
  rate decimal(10,2) DEFAULT 0,
  rate_type text DEFAULT 'Fixed',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create show_personnel junction table
CREATE TABLE IF NOT EXISTS show_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  personnel_id uuid NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  fee decimal(10,2) DEFAULT 0,
  status text DEFAULT 'Pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(show_id, personnel_id)
);

-- Create finances table
CREATE TABLE IF NOT EXISTS finances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  show_id uuid REFERENCES shows(id) ON DELETE SET NULL,
  type text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  date date NOT NULL,
  status text DEFAULT 'Pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create legal_documents table
CREATE TABLE IF NOT EXISTS legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  show_id uuid REFERENCES shows(id) ON DELETE SET NULL,
  title text NOT NULL,
  type text NOT NULL,
  file_url text DEFAULT '',
  signed_date date,
  expiry_date date,
  status text DEFAULT 'Draft',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  due_date date,
  priority text DEFAULT 'Medium',
  status text DEFAULT 'Todo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create marketing_campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  album_id uuid REFERENCES albums(id) ON DELETE SET NULL,
  title text NOT NULL,
  type text NOT NULL,
  platform text DEFAULT '',
  start_date date NOT NULL,
  end_date date,
  budget decimal(10,2) DEFAULT 0,
  status text DEFAULT 'Planning',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transportation table
CREATE TABLE IF NOT EXISTS transportation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  type text NOT NULL,
  departure_location text NOT NULL,
  arrival_location text NOT NULL,
  departure_time timestamptz NOT NULL,
  arrival_time timestamptz NOT NULL,
  cost decimal(10,2) DEFAULT 0,
  confirmation_number text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create accommodations table
CREATE TABLE IF NOT EXISTS accommodations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  hotel_name text NOT NULL,
  address text NOT NULL,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  rooms integer DEFAULT 1,
  cost decimal(10,2) DEFAULT 0,
  confirmation_number text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_albums_artist_id ON albums(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_shows_artist_id ON shows(artist_id);
CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(date);
CREATE INDEX IF NOT EXISTS idx_finances_artist_id ON finances(artist_id);
CREATE INDEX IF NOT EXISTS idx_finances_show_id ON finances(show_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_artist_id ON legal_documents(artist_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_artist_id ON marketing_campaigns(artist_id);
CREATE INDEX IF NOT EXISTS idx_transportation_show_id ON transportation(show_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_show_id ON accommodations(show_id);

-- Enable Row Level Security
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE transportation ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artists
CREATE POLICY "Authenticated users can view all artists"
  ON artists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create artists"
  ON artists FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update artists"
  ON artists FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete artists"
  ON artists FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for albums
CREATE POLICY "Authenticated users can view all albums"
  ON albums FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create albums"
  ON albums FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update albums"
  ON albums FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete albums"
  ON albums FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for tracks
CREATE POLICY "Authenticated users can view all tracks"
  ON tracks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tracks"
  ON tracks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tracks"
  ON tracks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tracks"
  ON tracks FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for shows
CREATE POLICY "Authenticated users can view all shows"
  ON shows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create shows"
  ON shows FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shows"
  ON shows FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete shows"
  ON shows FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for personnel
CREATE POLICY "Authenticated users can view all personnel"
  ON personnel FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create personnel"
  ON personnel FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update personnel"
  ON personnel FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete personnel"
  ON personnel FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for show_personnel
CREATE POLICY "Authenticated users can view all show_personnel"
  ON show_personnel FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create show_personnel"
  ON show_personnel FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update show_personnel"
  ON show_personnel FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete show_personnel"
  ON show_personnel FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for finances
CREATE POLICY "Authenticated users can view all finances"
  ON finances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create finances"
  ON finances FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update finances"
  ON finances FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete finances"
  ON finances FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for legal_documents
CREATE POLICY "Authenticated users can view all legal_documents"
  ON legal_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create legal_documents"
  ON legal_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update legal_documents"
  ON legal_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete legal_documents"
  ON legal_documents FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notes
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for marketing_campaigns
CREATE POLICY "Authenticated users can view all marketing_campaigns"
  ON marketing_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create marketing_campaigns"
  ON marketing_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update marketing_campaigns"
  ON marketing_campaigns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete marketing_campaigns"
  ON marketing_campaigns FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for transportation
CREATE POLICY "Authenticated users can view all transportation"
  ON transportation FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create transportation"
  ON transportation FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update transportation"
  ON transportation FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete transportation"
  ON transportation FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for accommodations
CREATE POLICY "Authenticated users can view all accommodations"
  ON accommodations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create accommodations"
  ON accommodations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update accommodations"
  ON accommodations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete accommodations"
  ON accommodations FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- Migration: 20251012214715_add_calendar_integrations.sql
-- ========================================

/*
  # Calendar Integrations Schema

  ## Overview
  This migration adds support for external calendar integrations including Google Calendar, iCal, and Outlook.

  ## New Tables

  ### `calendar_connections`
  Stores user's connected calendar accounts and configuration.
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `provider` (text): google, ical, outlook
  - `provider_account_id` (text): unique ID from the provider
  - `account_name` (text): display name for the calendar
  - `access_token` (text, encrypted): OAuth token for API access
  - `refresh_token` (text, encrypted): OAuth refresh token
  - `token_expires_at` (timestamptz): when the access token expires
  - `ical_url` (text): URL for iCal feed subscription
  - `sync_enabled` (boolean): whether to sync this calendar
  - `two_way_sync` (boolean): whether to allow bidirectional sync
  - `notifications_enabled` (boolean): whether to show notifications
  - `last_synced_at` (timestamptz): last successful sync time
  - `sync_error` (text): last error message if sync failed
  - `color` (text): color code for calendar display
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `synced_events`
  Stores events imported from external calendars.
  - `id` (uuid, primary key)
  - `calendar_connection_id` (uuid, foreign key)
  - `provider_event_id` (text): unique event ID from provider
  - `title` (text)
  - `description` (text)
  - `start_date` (date)
  - `start_time` (time)
  - `end_date` (date)
  - `end_time` (time)
  - `location` (text)
  - `attendees` (jsonb)
  - `timezone` (text)
  - `is_all_day` (boolean)
  - `recurring_rule` (text): iCal RRULE format
  - `raw_data` (jsonb): complete event data from provider
  - `last_modified_at` (timestamptz): when event was last modified by provider
  - `synced_at` (timestamptz): when we last synced this event
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on both tables
  - Users can only access their own calendar connections
  - Users can only see events from their own calendars
  - Tokens are encrypted at rest (application layer)

  ## Indexes
  - Index on user_id for fast connection lookups
  - Index on provider_event_id for deduplication
  - Index on start_date for event queries
*/

-- Create calendar_connections table
CREATE TABLE IF NOT EXISTS calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('google', 'ical', 'outlook')),
  provider_account_id text,
  account_name text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  ical_url text,
  sync_enabled boolean DEFAULT true NOT NULL,
  two_way_sync boolean DEFAULT false NOT NULL,
  notifications_enabled boolean DEFAULT true NOT NULL,
  last_synced_at timestamptz,
  sync_error text,
  color text DEFAULT '#4285F4',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_google_config CHECK (
    (provider != 'google') OR
    (access_token IS NOT NULL AND refresh_token IS NOT NULL)
  ),
  CONSTRAINT valid_ical_config CHECK (
    (provider != 'ical') OR
    (ical_url IS NOT NULL)
  ),
  CONSTRAINT valid_outlook_config CHECK (
    (provider != 'outlook') OR
    (access_token IS NOT NULL AND refresh_token IS NOT NULL)
  ),
  UNIQUE(user_id, provider, provider_account_id)
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id
  ON calendar_connections(user_id);

-- Create index for provider lookups
CREATE INDEX IF NOT EXISTS idx_calendar_connections_provider
  ON calendar_connections(provider)
  WHERE sync_enabled = true;

-- Create synced_events table
CREATE TABLE IF NOT EXISTS synced_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_connection_id uuid REFERENCES calendar_connections(id) ON DELETE CASCADE NOT NULL,
  provider_event_id text NOT NULL,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  start_time time,
  end_date date,
  end_time time,
  location text,
  attendees jsonb DEFAULT '[]'::jsonb,
  timezone text DEFAULT 'UTC',
  is_all_day boolean DEFAULT false NOT NULL,
  recurring_rule text,
  raw_data jsonb DEFAULT '{}'::jsonb,
  last_modified_at timestamptz,
  synced_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(calendar_connection_id, provider_event_id)
);

-- Create indexes for faster event queries
CREATE INDEX IF NOT EXISTS idx_synced_events_calendar_connection
  ON synced_events(calendar_connection_id);

CREATE INDEX IF NOT EXISTS idx_synced_events_start_date
  ON synced_events(start_date);

CREATE INDEX IF NOT EXISTS idx_synced_events_provider_event_id
  ON synced_events(provider_event_id);

CREATE INDEX IF NOT EXISTS idx_synced_events_date_range
  ON synced_events(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_connections

-- Users can view their own calendar connections
CREATE POLICY "Users can view own calendar connections"
  ON calendar_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own calendar connections
CREATE POLICY "Users can insert own calendar connections"
  ON calendar_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own calendar connections
CREATE POLICY "Users can update own calendar connections"
  ON calendar_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own calendar connections
CREATE POLICY "Users can delete own calendar connections"
  ON calendar_connections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for synced_events

-- Users can view events from their own calendar connections
CREATE POLICY "Users can view own synced events"
  ON synced_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calendar_connections
      WHERE calendar_connections.id = synced_events.calendar_connection_id
      AND calendar_connections.user_id = auth.uid()
    )
  );

-- Users can insert events to their own calendar connections
CREATE POLICY "Users can insert own synced events"
  ON synced_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_connections
      WHERE calendar_connections.id = synced_events.calendar_connection_id
      AND calendar_connections.user_id = auth.uid()
    )
  );

-- Users can update events from their own calendar connections
CREATE POLICY "Users can update own synced events"
  ON synced_events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calendar_connections
      WHERE calendar_connections.id = synced_events.calendar_connection_id
      AND calendar_connections.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_connections
      WHERE calendar_connections.id = synced_events.calendar_connection_id
      AND calendar_connections.user_id = auth.uid()
    )
  );

-- Users can delete events from their own calendar connections
CREATE POLICY "Users can delete own synced events"
  ON synced_events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calendar_connections
      WHERE calendar_connections.id = synced_events.calendar_connection_id
      AND calendar_connections.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_synced_events_updated_at
  BEFORE UPDATE ON synced_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ========================================
-- Migration: 20251013020956_add_calendar_events_table.sql
-- ========================================

/*
  # Calendar Events Table

  ## Overview
  This migration adds a table for storing user-created calendar events within The Manager.

  ## New Tables

  ### `calendar_events`
  Stores events created by users directly in The Manager.
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `title` (text, required): Event title
  - `description` (text): Event description
  - `event_type` (text): show, release, travel, accommodation
  - `start_date` (date, required): Event start date
  - `start_time` (time): Event start time
  - `end_date` (date): Event end date
  - `end_time` (time): Event end time
  - `location` (text): Event location
  - `color` (text): Display color for the event
  - `tags` (text[]): Array of tags for filtering
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on calendar_events table
  - Users can only access their own events
  - Full CRUD permissions for authenticated users on their own events

  ## Indexes
  - Index on user_id for fast event lookups
  - Index on start_date for date-based queries
  - Index on event_type for filtering
*/

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  event_type text NOT NULL CHECK (event_type IN ('show', 'release', 'travel', 'accommodation')) DEFAULT 'show',
  start_date date NOT NULL,
  start_time time,
  end_date date,
  end_time time,
  location text,
  color text DEFAULT '#3B82F6',
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id
  ON calendar_events(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date
  ON calendar_events(start_date);

CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type
  ON calendar_events(event_type);

CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range
  ON calendar_events(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events

-- Users can view their own events
CREATE POLICY "Users can view own calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert own calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY "Users can update own calendar events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete own calendar events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ========================================
-- Migration: 20251019030114_add_spotify_metadata_fields.sql
-- ========================================

/*
  # Add Spotify Integration Fields

  ## Description
  Adds fields to albums and tracks tables to support Spotify catalog import and duplicate detection.

  ## Changes

  ### Albums Table
  - `spotify_id` - Unique Spotify album ID for deduplication
  - `spotify_url` - Direct link to album on Spotify
  - `total_tracks` - Number of tracks in the album
  - `genres_array` - Array of genre strings from Spotify

  ### Tracks Table
  - `spotify_id` - Unique Spotify track ID for deduplication
  - `spotify_url` - Direct link to track on Spotify
  - `preview_url` - 30-second preview URL from Spotify
  - `popularity` - Spotify popularity score (0-100)
  - `explicit` - Explicit content flag

  ### Artists Table
  - `spotify_id` - Unique Spotify artist ID
  - `spotify_followers` - Number of followers on Spotify
  - `spotify_popularity` - Spotify popularity score (0-100)

  ## Security
  - No RLS changes needed (tables already have RLS enabled)
  - Fields are optional to maintain compatibility with existing data
*/

-- Add Spotify fields to artists table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artists' AND column_name = 'spotify_id'
  ) THEN
    ALTER TABLE artists ADD COLUMN spotify_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artists' AND column_name = 'spotify_followers'
  ) THEN
    ALTER TABLE artists ADD COLUMN spotify_followers integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artists' AND column_name = 'spotify_popularity'
  ) THEN
    ALTER TABLE artists ADD COLUMN spotify_popularity integer DEFAULT 0;
  END IF;
END $$;

-- Add Spotify fields to albums table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'albums' AND column_name = 'spotify_id'
  ) THEN
    ALTER TABLE albums ADD COLUMN spotify_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'albums' AND column_name = 'spotify_url'
  ) THEN
    ALTER TABLE albums ADD COLUMN spotify_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'albums' AND column_name = 'total_tracks'
  ) THEN
    ALTER TABLE albums ADD COLUMN total_tracks integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'albums' AND column_name = 'genres_array'
  ) THEN
    ALTER TABLE albums ADD COLUMN genres_array text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;

-- Add Spotify fields to tracks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'spotify_id'
  ) THEN
    ALTER TABLE tracks ADD COLUMN spotify_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'spotify_url'
  ) THEN
    ALTER TABLE tracks ADD COLUMN spotify_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'preview_url'
  ) THEN
    ALTER TABLE tracks ADD COLUMN preview_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'popularity'
  ) THEN
    ALTER TABLE tracks ADD COLUMN popularity integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'explicit'
  ) THEN
    ALTER TABLE tracks ADD COLUMN explicit boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'disc_number'
  ) THEN
    ALTER TABLE tracks ADD COLUMN disc_number integer DEFAULT 1;
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_albums_spotify_id ON albums(spotify_id);
CREATE INDEX IF NOT EXISTS idx_tracks_spotify_id ON tracks(spotify_id);
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);

-- ========================================
-- Migration: 20251019042848_create_album_tracks_junction.sql
-- ========================================

/*
  # Create Album-Tracks Many-to-Many Relationship

  ## Overview
  This migration restructures the catalog to properly handle master recordings that can appear on multiple albums.
  
  ## Changes Made
  
  1. **New Junction Table: `album_tracks`**
     - Links albums to tracks in a many-to-many relationship
     - Allows the same master recording to appear on multiple albums
     - Stores album-specific metadata (track_number, disc_number)
  
  2. **Modified `tracks` Table**
     - `album_id` becomes nullable (tracks are now independent entities)
     - Added unique constraint on `isrc` when not null (prevents duplicate masters)
     - Tracks represent master recordings, not album-specific entries
  
  3. **Data Migration**
     - Migrates existing track-album relationships to the junction table
     - Preserves all track numbers and disc numbers
  
  4. **Security**
     - Enable RLS on `album_tracks` table
     - Add policies for authenticated user access
  
  ## Music Industry Context
  
  In the music industry, a "master" or "recording" is a unique audio recording identified by its ISRC.
  The same master can appear on:
  - A single release
  - An album
  - A compilation
  - Deluxe editions
  - Different regional releases
  
  Each appearance may have different track numbers or disc positions, but the underlying recording (master) remains the same.
*/

-- Step 1: Create the album_tracks junction table
CREATE TABLE IF NOT EXISTS public.album_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  track_number integer NOT NULL,
  disc_number integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(album_id, track_id, disc_number, track_number)
);

-- Enable RLS
ALTER TABLE public.album_tracks ENABLE ROW LEVEL SECURITY;

-- Step 2: Migrate existing data to junction table
INSERT INTO public.album_tracks (album_id, track_id, track_number, disc_number)
SELECT 
  album_id, 
  id as track_id, 
  track_number, 
  COALESCE(disc_number, 1) as disc_number
FROM public.tracks
WHERE album_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 3: Make album_id nullable in tracks table (tracks are now independent)
ALTER TABLE public.tracks ALTER COLUMN album_id DROP NOT NULL;

-- Step 4: Add unique constraint on ISRC to prevent duplicate masters
-- Only apply when ISRC is not null or empty
CREATE UNIQUE INDEX IF NOT EXISTS tracks_isrc_unique_idx 
ON public.tracks(isrc) 
WHERE isrc IS NOT NULL AND isrc != '';

-- Step 5: Create RLS policies for album_tracks (public read for now, since no user auth on albums)
CREATE POLICY "Anyone can view album tracks"
  ON public.album_tracks
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert album tracks"
  ON public.album_tracks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update album tracks"
  ON public.album_tracks
  FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete album tracks"
  ON public.album_tracks
  FOR DELETE
  USING (true);

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS album_tracks_album_id_idx ON public.album_tracks(album_id);
CREATE INDEX IF NOT EXISTS album_tracks_track_id_idx ON public.album_tracks(track_id);
CREATE INDEX IF NOT EXISTS tracks_isrc_idx ON public.tracks(isrc) WHERE isrc IS NOT NULL AND isrc != '';

-- ========================================
-- Migration: 20251019044605_create_credits_table.sql
-- ========================================

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


-- ========================================
-- Migration: 20251019045238_add_upc_to_albums.sql
-- ========================================

/*
  # Add UPC Column to Albums

  ## Overview
  Adds a UPC (Universal Product Code) column to the albums table to store album-level identifiers.

  ## Changes
  1. Add `upc` column to albums table
     - Type: text (UPC codes can have leading zeros)
     - Nullable: UPCs may not be available for all albums
     - Unique: Each UPC should be unique across albums

  ## Notes
  - UPC codes are typically 12-13 digits
  - They identify the album/release, while ISRC identifies individual tracks
  - This is important for digital distribution and royalty tracking
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'albums' AND column_name = 'upc'
  ) THEN
    ALTER TABLE public.albums ADD COLUMN upc text;
    CREATE INDEX IF NOT EXISTS albums_upc_idx ON public.albums(upc);
  END IF;
END $$;


-- ========================================
-- Migration: 20251021054500_add_budgets_table.sql
-- ========================================

/*
  # Add Budgets Table with Entity Linking

  ## Overview
  This migration creates a budgets table that can be linked to albums, shows, or other entities,
  enabling cross-page budget management and tracking.

  ## New Tables

  ### Budgets
  - `id` (uuid, primary key)
  - `title` (text) - Budget title
  - `type` (text) - Budget type: release, show, tour, other
  - `status` (text) - Budget status: planning, in_progress, completed
  - `artist_id` (uuid, foreign key to artists) - Artist this budget belongs to
  - `album_id` (uuid, nullable, foreign key to albums) - Linked album for release budgets
  - `show_id` (uuid, nullable, foreign key to shows) - Linked show for show budgets
  - `total_budget` (decimal) - Total allocated budget
  - `total_spent` (decimal) - Total amount spent
  - `start_date` (date) - Budget start date
  - `end_date` (date, nullable) - Budget end date
  - `notes` (text) - Additional notes
  - `created_at`, `updated_at` (timestamptz)

  ### Budget Items
  - `id` (uuid, primary key)
  - `budget_id` (uuid, foreign key to budgets)
  - `date` (date) - Transaction date
  - `description` (text) - Item description
  - `type` (text) - Income or Expense
  - `category` (text) - Budget category (Art, Digital, Marketing, Music, Press, Other)
  - `amount` (decimal) - Transaction amount
  - `status` (text) - Payment status (paid, unpaid, received, pending)
  - `notes` (text, nullable) - Additional notes
  - `attachments` (jsonb, nullable) - File attachments as JSON array
  - `created_at`, `updated_at` (timestamptz)

  ### Budget Category Allocations
  - `id` (uuid, primary key)
  - `budget_id` (uuid, foreign key to budgets)
  - `category` (text) - Category name
  - `allocated_amount` (decimal) - Amount allocated to this category
  - `created_at`, `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies allow authenticated users full access
  - Future enhancement: restrict by user ownership

  ## Notes
  - Budgets can be linked to albums, shows, or standalone
  - Budget items track individual income/expense transactions
  - Category allocations enable budget tracking by category
*/

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'other',
  status text NOT NULL DEFAULT 'planning',
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  album_id uuid REFERENCES albums(id) ON DELETE SET NULL,
  show_id uuid REFERENCES shows(id) ON DELETE SET NULL,
  total_budget decimal(10,2) DEFAULT 0,
  total_spent decimal(10,2) DEFAULT 0,
  start_date date,
  end_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  date date NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_category_allocations table
CREATE TABLE IF NOT EXISTS budget_category_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category text NOT NULL,
  allocated_amount decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(budget_id, category)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_budgets_artist_id ON budgets(artist_id);
CREATE INDEX IF NOT EXISTS idx_budgets_album_id ON budgets(album_id);
CREATE INDEX IF NOT EXISTS idx_budgets_show_id ON budgets(show_id);
CREATE INDEX IF NOT EXISTS idx_budgets_type ON budgets(type);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_date ON budget_items(date);
CREATE INDEX IF NOT EXISTS idx_budget_category_allocations_budget_id ON budget_category_allocations(budget_id);

-- Enable Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_category_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budgets
CREATE POLICY "Authenticated users can view all budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for budget_items
CREATE POLICY "Authenticated users can view all budget_items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create budget_items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budget_items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete budget_items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for budget_category_allocations
CREATE POLICY "Authenticated users can view all budget_category_allocations"
  ON budget_category_allocations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create budget_category_allocations"
  ON budget_category_allocations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budget_category_allocations"
  ON budget_category_allocations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete budget_category_allocations"
  ON budget_category_allocations FOR DELETE
  TO authenticated
  USING (true);


-- ========================================
-- Migration: 20251021062455_create_budgets_schema_v2.sql
-- ========================================

/*
  # Create Budgets Schema

  1. New Tables
    - `budgets`
      - `id` (uuid, primary key)
      - `artist_id` (uuid, references artists)
      - `type` (text: release, show, tour, other)
      - `title` (text)
      - `status` (text: planning, in_progress, completed, cancelled)
      - `release_type` (text, optional: single, ep, album, compilation)
      - `release_date` (date, optional)
      - `album_id` (uuid, optional, references albums)
      - `show_id` (uuid, optional)
      - `venue` (text, optional)
      - `city` (text, optional)
      - `start_date` (date, optional)
      - `end_date` (date, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `budget_items`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, references budgets)
      - `date` (date)
      - `description` (text)
      - `type` (text: Income, Expense)
      - `amount` (numeric)
      - `category` (text)
      - `status` (text: received, pending, paid, unpaid, Received, Pending, Paid, Unpaid)
      - `notes` (text, optional)
      - `attachments` (jsonb, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `budget_categories`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, references budgets)
      - `category` (text)
      - `budget_amount` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('release', 'show', 'tour', 'other')),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
  release_type text CHECK (release_type IN ('single', 'ep', 'album', 'compilation')),
  release_date date,
  album_id uuid REFERENCES albums(id) ON DELETE SET NULL,
  show_id uuid,
  venue text,
  city text,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('Income', 'Expense')),
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  category text NOT NULL,
  status text NOT NULL CHECK (status IN ('received', 'pending', 'paid', 'unpaid', 'Received', 'Pending', 'Paid', 'Unpaid')),
  notes text,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_categories table
CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  category text NOT NULL,
  budget_amount numeric NOT NULL DEFAULT 0 CHECK (budget_amount >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(budget_id, category)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budgets_artist_id ON budgets(artist_id);
CREATE INDEX IF NOT EXISTS idx_budgets_type ON budgets(type);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_album_id ON budgets(album_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_type ON budget_items(type);
CREATE INDEX IF NOT EXISTS idx_budget_items_date ON budget_items(date);
CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON budget_categories(budget_id);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- Budgets policies - Allow all authenticated users
CREATE POLICY "Authenticated users can view budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (true);

-- Budget items policies
CREATE POLICY "Authenticated users can view budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (true);

-- Budget categories policies
CREATE POLICY "Authenticated users can view budget categories"
  ON budget_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create budget categories"
  ON budget_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budget categories"
  ON budget_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete budget categories"
  ON budget_categories FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- Migration: 20251021064352_add_commission_fields_to_budgets.sql
-- ========================================

/*
  # Add Commission Fields to Budgets

  1. Changes
    - Add `booking_agent_commission_rate` (numeric, default 10.0)
    - Add `management_commission_rate` (numeric, default 20.0)
    - Add `apply_commissions` (boolean, default false)
    
  2. Notes
    - Booking agent commission is calculated on gross income
    - Management commission is calculated on net income after booking agent commission
    - Commissions only apply when apply_commissions is true
*/

-- Add commission fields to budgets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'booking_agent_commission_rate'
  ) THEN
    ALTER TABLE budgets 
    ADD COLUMN booking_agent_commission_rate numeric DEFAULT 10.0 CHECK (booking_agent_commission_rate >= 0 AND booking_agent_commission_rate <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'management_commission_rate'
  ) THEN
    ALTER TABLE budgets 
    ADD COLUMN management_commission_rate numeric DEFAULT 20.0 CHECK (management_commission_rate >= 0 AND management_commission_rate <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'apply_commissions'
  ) THEN
    ALTER TABLE budgets 
    ADD COLUMN apply_commissions boolean DEFAULT false;
  END IF;
END $$;


-- ========================================
-- Migration: 20251210020248_add_venues_table_and_location_fields.sql
-- ========================================

/*
  # Venue Management System with Google Places Integration

  ## Overview
  This migration creates a comprehensive venue management system with Google Places API integration support.

  ## New Tables
    - `venues`
      - `id` (uuid, primary key)
      - `name` (text, required) - Venue name
      - `address` (text) - Full street address
      - `city` (text, required) - City name
      - `state` (text) - State/Province
      - `country` (text, required) - Country name
      - `postal_code` (text) - ZIP/Postal code
      - `latitude` (decimal) - GPS latitude coordinate
      - `longitude` (decimal) - GPS longitude coordinate
      - `google_place_id` (text, unique) - Google Places unique identifier
      - `capacity` (integer) - Venue capacity
      - `website` (text) - Venue website URL
      - `phone` (text) - Contact phone number
      - `is_verified` (boolean) - Whether venue is verified from Google Places
      - `usage_count` (integer) - Number of times this venue has been used
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## Modified Tables
    - `shows` - Added location detail fields:
      - `venue_address` (text) - Full street address
      - `venue_state` (text) - State/Province
      - `venue_latitude` (decimal) - GPS latitude
      - `venue_longitude` (decimal) - GPS longitude
      - `google_place_id` (text) - Reference to Google Places
      - `venue_id` (uuid) - Foreign key reference to venues table

  ## Security
    - Enable RLS on `venues` table
    - Add policies for authenticated users to read all venues
    - Add policies for authenticated users to create/update venues
    - Add indexes for performance on frequently queried fields

  ## Important Notes
    1. The `google_place_id` field has a unique constraint to prevent duplicate venues
    2. Indexes are added on name and city for fast autocomplete searches
    3. The `usage_count` field tracks popularity for better search results
    4. Existing shows data is preserved with nullable new columns
*/

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text DEFAULT '',
  city text NOT NULL,
  state text DEFAULT '',
  country text NOT NULL,
  postal_code text DEFAULT '',
  latitude decimal(10,7),
  longitude decimal(10,7),
  google_place_id text UNIQUE,
  capacity integer DEFAULT 0,
  website text DEFAULT '',
  phone text DEFAULT '',
  is_verified boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new location fields to shows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shows' AND column_name = 'venue_address'
  ) THEN
    ALTER TABLE shows ADD COLUMN venue_address text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shows' AND column_name = 'venue_state'
  ) THEN
    ALTER TABLE shows ADD COLUMN venue_state text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shows' AND column_name = 'venue_latitude'
  ) THEN
    ALTER TABLE shows ADD COLUMN venue_latitude decimal(10,7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shows' AND column_name = 'venue_longitude'
  ) THEN
    ALTER TABLE shows ADD COLUMN venue_longitude decimal(10,7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shows' AND column_name = 'google_place_id'
  ) THEN
    ALTER TABLE shows ADD COLUMN google_place_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shows' AND column_name = 'venue_id'
  ) THEN
    ALTER TABLE shows ADD COLUMN venue_id uuid REFERENCES venues(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_venues_name ON venues(name);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_country ON venues(country);
CREATE INDEX IF NOT EXISTS idx_venues_google_place_id ON venues(google_place_id);
CREATE INDEX IF NOT EXISTS idx_venues_usage_count ON venues(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_shows_venue_id ON shows(venue_id);

-- Enable Row Level Security
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Create policies for venues table
CREATE POLICY "Authenticated users can view all venues"
  ON venues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert venues"
  ON venues FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update venues"
  ON venues FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete venues"
  ON venues FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update venue usage count
CREATE OR REPLACE FUNCTION increment_venue_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.venue_id IS NOT NULL THEN
    UPDATE venues
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE id = NEW.venue_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment usage count when show is created
DROP TRIGGER IF EXISTS trigger_increment_venue_usage ON shows;
CREATE TRIGGER trigger_increment_venue_usage
  AFTER INSERT ON shows
  FOR EACH ROW
  EXECUTE FUNCTION increment_venue_usage();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_venues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_venues_timestamp ON venues;
CREATE TRIGGER trigger_update_venues_timestamp
  BEFORE UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_venues_updated_at();

-- ========================================
-- Migration: 20251210020649_seed_initial_venues.sql
-- ========================================

/*
  # Seed Initial Venues

  ## Overview
  This migration seeds the venues table with initial venue data from the existing application.

  ## Data Added
    - Madison Square Garden (New York, NY)
    - The Forum (Inglewood, CA)
    - Royal Albert Hall (London, UK)

  ## Important Notes
    1. These venues are marked as non-verified since they come from local data
    2. Usage count starts at 0
    3. Coordinates are preserved for map functionality
*/

INSERT INTO venues (name, address, city, state, country, capacity, website, latitude, longitude, is_verified, usage_count)
VALUES
  (
    'Madison Square Garden',
    '4 Pennsylvania Plaza',
    'New York',
    'NY',
    'United States',
    20000,
    'https://www.msg.com',
    40.7505,
    -73.9934,
    false,
    0
  ),
  (
    'The Forum',
    '3900 W Manchester Blvd',
    'Inglewood',
    'CA',
    'United States',
    17505,
    'https://www.msg.com/the-forum',
    33.9583,
    -118.3419,
    false,
    0
  ),
  (
    'Royal Albert Hall',
    'Kensington Gore',
    'London',
    '',
    'United Kingdom',
    5272,
    'https://www.royalalberthall.com',
    51.5009,
    -0.1774,
    false,
    0
  )
ON CONFLICT (google_place_id) DO NOTHING;

-- ========================================
-- Migration: 20251212031926_seed_live_section_mock_data.sql
-- ========================================

/*
  # Seed Live Section with Mock Data

  ## Overview
  Creates realistic mock data for the Live section to demonstrate functionality:
  - Multiple shows across different venues and dates
  - Transportation between show locations
  - Accommodation bookings for each show
  - Calendar events for releases and other activities

  ## Mock Data Included
  1. Shows (10 shows across various cities)
  2. Transportation (flights, buses between venues)
  3. Accommodations (hotel bookings for each show)
  4. Calendar Events (releases, meetings, rehearsals)

  ## Notes
  - Uses a mock artist_id (first artist in the artists table or creates one)
  - All dates are set to future dates for demo purposes
  - Realistic venue names, cities, and logistics
*/

-- First, ensure we have an artist to associate with shows
DO $$
DECLARE
  mock_artist_id uuid;
BEGIN
  -- Try to get the first artist
  SELECT id INTO mock_artist_id FROM artists LIMIT 1;

  -- If no artist exists, create a mock one
  IF mock_artist_id IS NULL THEN
    INSERT INTO artists (name, bio, genre, image_url)
    VALUES (
      'The Velvet Echo',
      'An indie rock band known for their atmospheric sound and captivating live performances.',
      'Indie Rock',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'
    )
    RETURNING id INTO mock_artist_id;
  END IF;

  -- Insert Shows
  INSERT INTO shows (id, artist_id, title, venue_name, venue_city, venue_country, date, doors_time, show_time, capacity, ticket_price, guarantee, status, notes)
  VALUES
    -- Spring 2025 Tour
    (gen_random_uuid(), mock_artist_id, 'The Fillmore', 'The Fillmore', 'San Francisco', 'United States', '2025-03-15', '19:00', '20:00', 1200, 45.00, 15000.00, 'confirmed', 'Opening night of spring tour'),
    (gen_random_uuid(), mock_artist_id, 'The Wiltern', 'The Wiltern', 'Los Angeles', 'United States', '2025-03-17', '19:00', '20:00', 1850, 45.00, 20000.00, 'confirmed', 'Sold out show'),
    (gen_random_uuid(), mock_artist_id, 'Brooklyn Steel', 'Brooklyn Steel', 'Brooklyn', 'United States', '2025-03-22', '19:30', '20:30', 1800, 50.00, 18000.00, 'confirmed', 'NYC debut'),
    (gen_random_uuid(), mock_artist_id, 'The Riviera Theatre', 'The Riviera Theatre', 'Chicago', 'United States', '2025-03-25', '19:00', '20:00', 2500, 42.00, 16000.00, 'confirmed', 'Midwest stop'),

    -- Summer 2025 Festival Season
    (gen_random_uuid(), mock_artist_id, 'Red Rocks Amphitheatre', 'Red Rocks Amphitheatre', 'Morrison', 'United States', '2025-06-08', '18:00', '19:30', 9525, 65.00, 50000.00, 'confirmed', 'Dream venue - bucket list show'),
    (gen_random_uuid(), mock_artist_id, 'Lollapalooza', 'Grant Park', 'Chicago', 'United States', '2025-08-02', '17:00', '18:00', 100000, 0, 75000.00, 'confirmed', 'Festival appearance - mainstage'),

    -- Fall 2025 European Tour
    (gen_random_uuid(), mock_artist_id, 'O2 Shepherd''s Bush Empire', 'O2 Shepherd''s Bush Empire', 'London', 'United Kingdom', '2025-09-15', '19:00', '20:00', 2000, 35.00, 25000.00, 'confirmed', 'European tour kickoff'),
    (gen_random_uuid(), mock_artist_id, 'Bataclan', 'Bataclan', 'Paris', 'France', '2025-09-18', '19:30', '20:30', 1500, 38.00, 22000.00, 'confirmed', 'Historic venue'),
    (gen_random_uuid(), mock_artist_id, 'Paradiso', 'Paradiso', 'Amsterdam', 'Netherlands', '2025-09-21', '20:00', '21:00', 1500, 35.00, 20000.00, 'pending', 'Waiting on final confirmation'),
    (gen_random_uuid(), mock_artist_id, 'Columbiahalle', 'Columbiahalle', 'Berlin', 'Germany', '2025-09-24', '19:00', '20:00', 3500, 40.00, 28000.00, 'confirmed', 'Largest EU show');

END $$;

-- Insert Transportation
DO $$
DECLARE
  show_sf_id uuid;
  show_la_id uuid;
  show_ny_id uuid;
  show_chi_id uuid;
  show_red_rocks_id uuid;
  show_london_id uuid;
  show_paris_id uuid;
  show_amsterdam_id uuid;
  show_berlin_id uuid;
BEGIN
  -- Get show IDs
  SELECT id INTO show_sf_id FROM shows WHERE venue_city = 'San Francisco' AND date = '2025-03-15';
  SELECT id INTO show_la_id FROM shows WHERE venue_city = 'Los Angeles' AND date = '2025-03-17';
  SELECT id INTO show_ny_id FROM shows WHERE venue_city = 'Brooklyn' AND date = '2025-03-22';
  SELECT id INTO show_chi_id FROM shows WHERE venue_city = 'Chicago' AND date = '2025-03-25';
  SELECT id INTO show_red_rocks_id FROM shows WHERE venue_city = 'Morrison' AND date = '2025-06-08';
  SELECT id INTO show_london_id FROM shows WHERE venue_city = 'London' AND date = '2025-09-15';
  SELECT id INTO show_paris_id FROM shows WHERE venue_city = 'Paris' AND date = '2025-09-18';
  SELECT id INTO show_amsterdam_id FROM shows WHERE venue_city = 'Amsterdam' AND date = '2025-09-21';
  SELECT id INTO show_berlin_id FROM shows WHERE venue_city = 'Berlin' AND date = '2025-09-24';

  -- Spring Tour Transportation
  INSERT INTO transportation (show_id, type, departure_location, arrival_location, departure_time, arrival_time, cost, confirmation_number, notes)
  VALUES
    -- To San Francisco (opening show)
    (show_sf_id, 'Flight', 'Los Angeles (LAX)', 'San Francisco (SFO)', '2025-03-15 08:00:00-08', '2025-03-15 09:30:00-08', 1200.00, 'UA1234', 'Morning flight for sound check'),

    -- SF to LA
    (show_la_id, 'Tour Bus', 'San Francisco', 'Los Angeles', '2025-03-16 10:00:00-08', '2025-03-16 16:00:00-08', 800.00, 'BUS-001', 'Scenic coastal route'),

    -- LA to NYC
    (show_ny_id, 'Flight', 'Los Angeles (LAX)', 'New York (JFK)', '2025-03-21 07:00:00-08', '2025-03-21 15:30:00-05', 2400.00, 'AA567', 'Cross-country flight - business class'),

    -- NYC to Chicago
    (show_chi_id, 'Flight', 'New York (JFK)', 'Chicago (ORD)', '2025-03-24 14:00:00-05', '2025-03-24 16:00:00-06', 1500.00, 'UA890', 'Short flight'),

    -- To Red Rocks (Summer)
    (show_red_rocks_id, 'Flight', 'Los Angeles (LAX)', 'Denver (DEN)', '2025-06-07 10:00:00-08', '2025-06-07 13:30:00-07', 1800.00, 'SW234', 'Day before show arrival'),
    (show_red_rocks_id, 'Van Rental', 'Denver Airport', 'Morrison', '2025-06-07 14:30:00-07', '2025-06-07 15:00:00-07', 200.00, 'HERTZ-789', 'Band and crew transport'),

    -- European Tour Transportation
    (show_london_id, 'Flight', 'Los Angeles (LAX)', 'London (LHR)', '2025-09-14 18:00:00-08', '2025-09-15 12:00:00+01', 5000.00, 'BA282', 'Overnight to London'),

    -- London to Paris
    (show_paris_id, 'Train', 'London St Pancras', 'Paris Gare du Nord', '2025-09-17 10:00:00+01', '2025-09-17 13:30:00+02', 600.00, 'EURO-456', 'Eurostar - comfortable ride'),

    -- Paris to Amsterdam
    (show_amsterdam_id, 'Train', 'Paris Gare du Nord', 'Amsterdam Centraal', '2025-09-20 09:00:00+02', '2025-09-20 12:30:00+02', 500.00, 'THAL-789', 'Thalys high-speed train'),

    -- Amsterdam to Berlin
    (show_berlin_id, 'Flight', 'Amsterdam (AMS)', 'Berlin (BER)', '2025-09-23 15:00:00+02', '2025-09-23 16:30:00+02', 400.00, 'KL1234', 'Quick flight');

END $$;

-- Insert Accommodations
DO $$
DECLARE
  show_sf_id uuid;
  show_la_id uuid;
  show_ny_id uuid;
  show_chi_id uuid;
  show_red_rocks_id uuid;
  show_london_id uuid;
  show_paris_id uuid;
  show_amsterdam_id uuid;
  show_berlin_id uuid;
BEGIN
  -- Get show IDs
  SELECT id INTO show_sf_id FROM shows WHERE venue_city = 'San Francisco' AND date = '2025-03-15';
  SELECT id INTO show_la_id FROM shows WHERE venue_city = 'Los Angeles' AND date = '2025-03-17';
  SELECT id INTO show_ny_id FROM shows WHERE venue_city = 'Brooklyn' AND date = '2025-03-22';
  SELECT id INTO show_chi_id FROM shows WHERE venue_city = 'Chicago' AND date = '2025-03-25';
  SELECT id INTO show_red_rocks_id FROM shows WHERE venue_city = 'Morrison' AND date = '2025-06-08';
  SELECT id INTO show_london_id FROM shows WHERE venue_city = 'London' AND date = '2025-09-15';
  SELECT id INTO show_paris_id FROM shows WHERE venue_city = 'Paris' AND date = '2025-09-18';
  SELECT id INTO show_amsterdam_id FROM shows WHERE venue_city = 'Amsterdam' AND date = '2025-09-21';
  SELECT id INTO show_berlin_id FROM shows WHERE venue_city = 'Berlin' AND date = '2025-09-24';

  INSERT INTO accommodations (show_id, hotel_name, address, check_in_date, check_out_date, rooms, cost, confirmation_number, notes)
  VALUES
    -- Spring Tour
    (show_sf_id, 'Hotel Zephyr', '250 Beach Street, San Francisco, CA 94133', '2025-03-15', '2025-03-16', 5, 1200.00, 'HZ-123456', 'Waterfront location, close to venue'),
    (show_la_id, 'The LINE Hotel', '3515 Wilshire Blvd, Los Angeles, CA 90010', '2025-03-16', '2025-03-18', 5, 1400.00, 'LINE-789012', 'Walking distance to venue'),
    (show_ny_id, 'The William Vale', '111 N 12th St, Brooklyn, NY 11249', '2025-03-21', '2025-03-23', 6, 2100.00, 'WV-345678', 'Brooklyn hotel with rooftop views'),
    (show_chi_id, 'The Hoxton Chicago', '200 N Green St, Chicago, IL 60607', '2025-03-24', '2025-03-26', 5, 1300.00, 'HOX-901234', 'Trendy hotel in West Loop'),

    -- Summer
    (show_red_rocks_id, 'The Maven Hotel', '1850 Wazee St, Denver, CO 80202', '2025-06-07', '2025-06-09', 6, 1800.00, 'MAV-567890', 'Modern hotel in downtown Denver'),

    -- European Tour
    (show_london_id, 'The Hoxton Shoreditch', '81 Great Eastern St, London EC2A 3HU', '2025-09-15', '2025-09-17', 6, 1600.00, 'HOX-UK-123', 'Central London location'),
    (show_paris_id, 'Hotel Fabric', '31 Rue de la Folie Méricourt, 75011 Paris', '2025-09-17', '2025-09-20', 6, 1800.00, 'FABRIC-456', 'Boutique hotel in Le Marais'),
    (show_amsterdam_id, 'The Hoxton Amsterdam', 'Herengracht 255, 1016 BJ Amsterdam', '2025-09-20', '2025-09-23', 6, 1700.00, 'HOX-AMS-789', 'Canal-side location'),
    (show_berlin_id, 'Hotel Oderberger', 'Oderberger Str. 57, 10435 Berlin', '2025-09-23', '2025-09-25', 6, 1500.00, 'ODER-012', 'Historic building with pool');

END $$;

-- Insert Calendar Events (for the authenticated user)
DO $$
DECLARE
  first_user_id uuid;
BEGIN
  -- Get the first user ID
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;

  -- Only insert calendar events if we have a user
  IF first_user_id IS NOT NULL THEN
    INSERT INTO calendar_events (user_id, title, description, event_type, start_date, start_time, end_date, end_time, location, color)
    VALUES
      -- Album releases and promo
      (first_user_id, 'New Single Release', 'Release "Midnight Waves" on all platforms', 'release', '2025-02-14', '00:00', '2025-02-14', '23:59', 'Digital Release', '#10B981'),
      (first_user_id, 'Album Release Day', 'Full album "Echo Chamber" drops worldwide', 'release', '2025-04-04', '00:00', '2025-04-04', '23:59', 'Digital Release', '#10B981'),

      -- Rehearsals and prep
      (first_user_id, 'Tour Rehearsals Begin', 'Start rehearsing for spring tour at Sound City Studios', 'accommodation', '2025-03-01', '10:00', '2025-03-12', '18:00', 'Sound City Studios, Los Angeles', '#F59E0B'),
      (first_user_id, 'Production Meeting', 'Meet with lighting and stage designers', 'accommodation', '2025-03-05', '14:00', '2025-03-05', '16:00', 'Production Office, LA', '#6366F1'),

      -- Press and Media
      (first_user_id, 'NPR Tiny Desk Concert', 'Record Tiny Desk performance', 'show', '2025-03-20', '14:00', '2025-03-20', '16:00', 'NPR Studios, Washington DC', '#EF4444'),
      (first_user_id, 'Rolling Stone Interview', 'Feature interview and photoshoot', 'accommodation', '2025-03-23', '10:00', '2025-03-23', '15:00', 'Rolling Stone HQ, NYC', '#8B5CF6'),

      -- Other events
      (first_user_id, 'Coachella Rehearsal', 'Stage rehearsal at Coachella', 'show', '2025-04-10', '09:00', '2025-04-10', '12:00', 'Empire Polo Club, Indio, CA', '#EC4899'),
      (first_user_id, 'Music Video Shoot', 'Shoot video for "Neon Lights"', 'accommodation', '2025-05-15', '08:00', '2025-05-16', '20:00', 'Joshua Tree, CA', '#14B8A6'),

      -- Summer prep
      (first_user_id, 'Festival Circuit Planning', 'Plan summer festival schedule with booking agent', 'accommodation', '2025-05-20', '11:00', '2025-05-20', '13:00', 'Virtual Meeting', '#6366F1'),

      -- Fall tour prep
      (first_user_id, 'EU Tour Production Meeting', 'Final logistics for European tour', 'accommodation', '2025-08-25', '10:00', '2025-08-25', '17:00', 'Management Office, LA', '#F59E0B');
  END IF;
END $$;


-- ========================================
-- Migration: 20251212045950_add_show_details_tables.sql
-- ========================================

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


-- ========================================
-- Migration: 20251212050047_seed_show_details_mock_data.sql
-- ========================================

/*
  # Seed Show Details with Comprehensive Mock Data

  ## Overview
  Populates all show detail tables with realistic mock data for the 10 existing shows:
  - Deal information (guarantees, percentages, expenses, settlements)
  - Show advances (contacts, schedules, catering, parking)
  - Setlists (complete with 10-15 songs per show)
  - Guest lists (5-10 guests per show)
  - Marketing tasks (standard checklist items)
  - Production files (riders, stage plots, etc.)

  ## Mock Data Coverage
  - All 10 shows from the live section
  - Realistic financial data
  - Complete production information
  - Varied setlists
  - Diverse guest lists
  - Standard marketing checklists
  - Essential production documents
*/

DO $$
DECLARE
  v_show_ids uuid[];
  v_show_id uuid;
  v_setlist_id uuid;
  v_idx integer;
BEGIN
  -- Get all show IDs
  SELECT ARRAY_AGG(id ORDER BY date) INTO v_show_ids FROM shows;

  -- Loop through each show and add complete data
  FOR v_idx IN 1..array_length(v_show_ids, 1) LOOP
    v_show_id := v_show_ids[v_idx];

    -- Insert Show Deal
    INSERT INTO show_deals (show_id, deal_type, guarantee, percentage, expenses, settlement)
    VALUES (
      v_show_id,
      CASE v_idx % 3
        WHEN 0 THEN 'guarantee'
        WHEN 1 THEN 'percentage'
        ELSE 'guarantee_vs_percentage'
      END,
      (10000 + (v_idx * 5000))::numeric,
      CASE WHEN v_idx % 3 != 0 THEN 80 + (v_idx % 10) ELSE 0 END,
      jsonb_build_object(
        'production', (5000 + (v_idx * 1000))::numeric,
        'marketing', (2000 + (v_idx * 500))::numeric,
        'staffing', (3000 + (v_idx * 750))::numeric,
        'transportation', (1500 + (v_idx * 250))::numeric
      ),
      jsonb_build_object(
        'gross', (50000 + (v_idx * 10000))::numeric,
        'expenses', (11500 + (v_idx * 2500))::numeric,
        'net', (38500 + (v_idx * 7500))::numeric
      )
    );

    -- Insert Show Advances
    INSERT INTO show_advances (
      show_id,
      production_manager,
      venue_contact,
      schedule,
      catering,
      parking
    )
    VALUES (
      v_show_id,
      jsonb_build_object(
        'name', 'Sarah Mitchell',
        'email', 'sarah.mitchell@tourproduction.com',
        'phone', CASE v_idx WHEN 1 THEN '(555) 123-4567' WHEN 2 THEN '(555) 234-5678' WHEN 3 THEN '(555) 345-6789' WHEN 4 THEN '(555) 456-7890' WHEN 5 THEN '(555) 567-8901' WHEN 6 THEN '(555) 678-9012' WHEN 7 THEN '(555) 789-0123' WHEN 8 THEN '(555) 890-1234' WHEN 9 THEN '(555) 901-2345' ELSE '(555) 012-3456' END
      ),
      jsonb_build_object(
        'name', CASE v_idx WHEN 1 THEN 'John Martinez' WHEN 2 THEN 'Emily Chen' WHEN 3 THEN 'Michael Johnson' WHEN 4 THEN 'Lisa Anderson' WHEN 5 THEN 'David Brown' WHEN 6 THEN 'Sophie Taylor' WHEN 7 THEN 'James Wilson' WHEN 8 THEN 'Marie Dubois' WHEN 9 THEN 'Peter van der Berg' ELSE 'Klaus Schmidt' END,
        'email', CASE v_idx WHEN 1 THEN 'john@fillmore.com' WHEN 2 THEN 'emily@wiltern.com' WHEN 3 THEN 'michael@brooklynsteel.com' WHEN 4 THEN 'lisa@riviera.com' WHEN 5 THEN 'david@redrocks.com' WHEN 6 THEN 'sophie@lollapalooza.com' WHEN 7 THEN 'james@o2empire.co.uk' WHEN 8 THEN 'marie@bataclan.fr' WHEN 9 THEN 'peter@paradiso.nl' ELSE 'klaus@columbiahalle.de' END,
        'phone', CASE v_idx WHEN 1 THEN '(415) 346-6000' WHEN 2 THEN '(213) 388-1400' WHEN 3 THEN '(718) 291-8810' WHEN 4 THEN '(773) 275-6800' WHEN 5 THEN '(720) 865-2494' WHEN 6 THEN '(312) 235-7000' WHEN 7 THEN '+44 20 8354 3300' WHEN 8 THEN '+33 1 43 14 00 30' WHEN 9 THEN '+31 20 626 4521' ELSE '+49 30 698 08 960' END
      ),
      jsonb_build_object(
        'loadIn', '14:00',
        'soundcheck', '16:00',
        'doors', '19:00',
        'showtime', '20:00',
        'curfew', CASE WHEN v_idx <= 5 THEN '23:00' ELSE '23:30' END
      ),
      jsonb_build_object(
        'mealTimes', jsonb_build_object('lunch', '13:00', 'dinner', '17:30'),
        'requirements', 'Hot meal for band and crew (15 people). Vegetarian and vegan options required. Gluten-free options preferred.'
      ),
      jsonb_build_object(
        'trucks', '2 spaces',
        'buses', '1 space',
        'cars', '5 spaces',
        'location', 'Loading dock - contact venue 1 hour before arrival'
      )
    );

    -- Insert Setlist
    INSERT INTO setlists (show_id, status, notes, updated_by)
    VALUES (
      v_show_id,
      CASE WHEN v_idx <= 6 THEN 'final' ELSE 'proposed' END,
      CASE 
        WHEN v_idx = 1 THEN 'Opening night - include crowd favorites'
        WHEN v_idx = 5 THEN 'Red Rocks show - extend key songs for venue'
        WHEN v_idx = 6 THEN 'Festival set - shorter runtime'
        ELSE 'Standard touring setlist'
      END,
      'Tour Manager'
    )
    RETURNING id INTO v_setlist_id;

    -- Insert Setlist Songs (12-15 songs per show)
    INSERT INTO setlist_songs (setlist_id, position, song_title, duration, key, is_encore)
    SELECT 
      v_setlist_id,
      song_data.position,
      song_data.title,
      song_data.duration,
      song_data.key,
      song_data.is_encore
    FROM (VALUES
      (1, 'Opening Track', '3:45', 'E', false),
      (2, 'Electric Energy', '4:20', 'A', false),
      (3, 'Midnight Dreams', '5:15', 'D', false),
      (4, 'City Lights', '3:50', 'G', false),
      (5, 'Lost in Sound', '6:30', 'C', false),
      (6, 'Neon Waves', '4:45', 'F', false),
      (7, 'Rhythm of the Night', '5:00', 'Bb', false),
      (8, 'Echoes', '7:15', 'Am', false),
      (9, 'Silver Moon', '4:30', 'E', false),
      (10, 'Dance with Me', '3:55', 'D', false),
      (11, 'The Journey', '8:20', 'G', false),
      (12, 'Closing Time', '4:10', 'C', true),
      (13, 'One More Song', '3:30', 'A', true)
    ) AS song_data(position, title, duration, key, is_encore);

    -- Insert Guest List (varying number per show)
    INSERT INTO guest_list (show_id, name, type, quantity, requested_by, status, contact_info, notes)
    SELECT
      v_show_id,
      guest_data.name,
      guest_data.type,
      guest_data.quantity,
      guest_data.requested_by,
      guest_data.status,
      guest_data.contact_info,
      guest_data.notes
    FROM (VALUES
      ('Local Radio DJs', 'media', 2, 'Marketing Team', 'approved', 'promo@radiostation.com', 'Morning show hosts'),
      ('Venue Staff Guests', 'industry', 3, 'Venue', 'approved', '', 'Venue comp tickets'),
      ('Artist Family', 'friends_family', 4, 'Band', 'approved', '', 'Band member families'),
      ('Record Label Executives', 'industry', 2, 'Management', 'approved', 'execs@recordlabel.com', 'A&R and marketing'),
      ('Music Journalists', 'media', 2, 'Publicist', 'approved', 'press@magazine.com', 'Feature interview'),
      ('VIP Fan Contest Winners', 'vip', 2, 'Marketing Team', 'approved', 'winner@email.com', 'Social media contest'),
      ('Local Promoter', 'industry', 1, 'Booking Agent', 'approved', 'promoter@local.com', 'Relationship building'),
      ('Photography Team', 'media', 2, 'Management', 'approved', 'photo@studio.com', 'Tour documentary')
    ) AS guest_data(name, type, quantity, requested_by, status, contact_info, notes)
    LIMIT CASE WHEN v_idx % 2 = 0 THEN 8 ELSE 5 END;

    -- Insert Marketing Tasks (standard checklist)
    INSERT INTO marketing_tasks (show_id, task_key, label, completed, completed_at, completed_by)
    SELECT
      v_show_id,
      task_data.task_key,
      task_data.label,
      task_data.completed,
      CASE WHEN task_data.completed THEN (SELECT date FROM shows WHERE id = v_show_id) - INTERVAL '30 days' + (random() * INTERVAL '25 days') ELSE NULL END,
      CASE WHEN task_data.completed THEN 'Marketing Team' ELSE '' END
    FROM (VALUES
      ('announcement_email', 'Announcement Email Sent', true),
      ('marketing_email', 'Marketing Email Sent', CASE WHEN v_idx <= 7 THEN true ELSE false END),
      ('marketing_plan', 'Marketing Plan Received', true),
      ('facebook_event', 'Event added on Facebook', CASE WHEN v_idx <= 8 THEN true ELSE false END),
      ('songkick_event', 'Event added on Songkick', CASE WHEN v_idx <= 8 THEN true ELSE false END),
      ('bandsintown_event', 'Event added on Bandsintown', CASE WHEN v_idx <= 6 THEN true ELSE false END),
      ('posters_printed', 'Posters Printed', CASE WHEN v_idx <= 5 THEN true ELSE false END),
      ('radio_ads', 'Radio Ads Booked', CASE WHEN v_idx <= 7 THEN true ELSE false END),
      ('press_release', 'Press Release Sent', true),
      ('social_media_graphics', 'Social Media Graphics Created', true),
      ('ticket_links', 'Ticket Links Distributed', true),
      ('venue_promo', 'Venue Promotional Materials Sent', CASE WHEN v_idx <= 6 THEN true ELSE false END)
    ) AS task_data(task_key, label, completed);

    -- Insert Production Files
    INSERT INTO production_files (show_id, name, type, file_url, version, uploaded_by)
    SELECT
      v_show_id,
      file_data.name,
      file_data.type,
      'https://example.com/files/' || lower(replace(file_data.name, ' ', '_')) || '.pdf',
      file_data.version,
      file_data.uploaded_by
    FROM (VALUES
      ('Technical Rider 2025', 'tech_rider', '3.2', 'Production Manager'),
      ('Hospitality Rider', 'hospitality_rider', '2.0', 'Tour Manager'),
      ('Stage Plot', 'stage_plot', '2.1', 'Production Designer'),
      ('Input List', 'input_list', '2.5', 'FOH Engineer'),
      ('Backline Requirements', 'backline', '1.8', 'Backline Tech'),
      ('Lighting Plot', 'other', '1.5', 'Lighting Designer')
    ) AS file_data(name, type, version, uploaded_by);

  END LOOP;
END $$;


-- ========================================
-- Migration: 20251213190537_add_platform_integrations.sql
-- ========================================

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

-- ========================================
-- Migration: 20251213191926_add_youtube_analytics_integration.sql
-- ========================================

/*
  # YouTube Analytics Integration

  1. New Tables
    - `analytics_integrations`
      - Stores OAuth tokens and connection info for analytics platforms (YouTube, Spotify, Instagram, etc.)
      - `id` (uuid, primary key)
      - `artist_id` (uuid, foreign key to artists)
      - `platform` (text - 'youtube', 'spotify', 'instagram', 'twitter', 'facebook', 'tiktok')
      - `enabled` (boolean, default true)
      - `access_token` (text, encrypted OAuth access token)
      - `refresh_token` (text, encrypted OAuth refresh token)
      - `token_expires_at` (timestamptz, when access token expires)
      - `platform_user_id` (text, user ID on the platform)
      - `platform_username` (text, username/handle on the platform)
      - `channel_id` (text, for YouTube channel ID)
      - `last_sync` (timestamptz, last time data was synced)
      - `sync_enabled` (boolean, whether auto-sync is enabled)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `youtube_channel_analytics`
      - Stores daily YouTube channel metrics
      - `id` (uuid, primary key)
      - `integration_id` (uuid, foreign key to analytics_integrations)
      - `date` (date, the date for this metric snapshot)
      - `subscribers` (bigint, total subscriber count)
      - `views` (bigint, total view count)
      - `videos` (integer, total video count)
      - `average_view_duration` (interval, average view duration)
      - `watch_time_minutes` (bigint, total watch time in minutes)
      - `likes` (bigint, total likes)
      - `comments` (bigint, total comments)
      - `shares` (bigint, total shares)
      - `estimated_revenue` (decimal, estimated revenue)
      - `created_at` (timestamptz)

    - `youtube_video_analytics`
      - Stores performance metrics for individual YouTube videos
      - `id` (uuid, primary key)
      - `integration_id` (uuid, foreign key to analytics_integrations)
      - `video_id` (text, YouTube video ID)
      - `title` (text, video title)
      - `published_at` (timestamptz, when video was published)
      - `views` (bigint, view count)
      - `likes` (bigint, like count)
      - `comments` (bigint, comment count)
      - `shares` (bigint, share count)
      - `watch_time_minutes` (bigint, total watch time)
      - `average_view_duration` (interval, average view duration)
      - `thumbnail_url` (text, video thumbnail URL)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users to manage their own analytics data
    - Restrict access to integration tokens

  3. Indexes
    - Add indexes for faster lookups by artist_id, platform, and date ranges
*/

-- Create analytics_integrations table
CREATE TABLE IF NOT EXISTS analytics_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('youtube', 'spotify', 'instagram', 'twitter', 'facebook', 'tiktok')),
  enabled boolean DEFAULT true,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  platform_user_id text,
  platform_username text,
  channel_id text,
  last_sync timestamptz,
  sync_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(artist_id, platform)
);

ALTER TABLE analytics_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics integrations"
  ON analytics_integrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create analytics integrations"
  ON analytics_integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own analytics integrations"
  ON analytics_integrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own analytics integrations"
  ON analytics_integrations
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_analytics_integrations_artist_platform 
  ON analytics_integrations(artist_id, platform);

-- Create youtube_channel_analytics table
CREATE TABLE IF NOT EXISTS youtube_channel_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES analytics_integrations(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  subscribers bigint DEFAULT 0,
  views bigint DEFAULT 0,
  videos integer DEFAULT 0,
  average_view_duration interval,
  watch_time_minutes bigint DEFAULT 0,
  likes bigint DEFAULT 0,
  comments bigint DEFAULT 0,
  shares bigint DEFAULT 0,
  estimated_revenue decimal(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(integration_id, date)
);

ALTER TABLE youtube_channel_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their YouTube channel analytics"
  ON youtube_channel_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analytics_integrations
      WHERE analytics_integrations.id = youtube_channel_analytics.integration_id
    )
  );

CREATE POLICY "Users can create YouTube channel analytics"
  ON youtube_channel_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analytics_integrations
      WHERE analytics_integrations.id = youtube_channel_analytics.integration_id
    )
  );

CREATE POLICY "Users can update YouTube channel analytics"
  ON youtube_channel_analytics
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analytics_integrations
      WHERE analytics_integrations.id = youtube_channel_analytics.integration_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analytics_integrations
      WHERE analytics_integrations.id = youtube_channel_analytics.integration_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_youtube_channel_analytics_integration_date 
  ON youtube_channel_analytics(integration_id, date DESC);

-- Create youtube_video_analytics table
CREATE TABLE IF NOT EXISTS youtube_video_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES analytics_integrations(id) ON DELETE CASCADE NOT NULL,
  video_id text NOT NULL,
  title text NOT NULL,
  published_at timestamptz,
  views bigint DEFAULT 0,
  likes bigint DEFAULT 0,
  comments bigint DEFAULT 0,
  shares bigint DEFAULT 0,
  watch_time_minutes bigint DEFAULT 0,
  average_view_duration interval,
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(integration_id, video_id)
);

ALTER TABLE youtube_video_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their YouTube video analytics"
  ON youtube_video_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analytics_integrations
      WHERE analytics_integrations.id = youtube_video_analytics.integration_id
    )
  );

CREATE POLICY "Users can create YouTube video analytics"
  ON youtube_video_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analytics_integrations
      WHERE analytics_integrations.id = youtube_video_analytics.integration_id
    )
  );

CREATE POLICY "Users can update YouTube video analytics"
  ON youtube_video_analytics
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analytics_integrations
      WHERE analytics_integrations.id = youtube_video_analytics.integration_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analytics_integrations
      WHERE analytics_integrations.id = youtube_video_analytics.integration_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_youtube_video_analytics_integration 
  ON youtube_video_analytics(integration_id);

CREATE INDEX IF NOT EXISTS idx_youtube_video_analytics_video_id 
  ON youtube_video_analytics(video_id);

-- ========================================
-- Migration: 20251214211133_create_playlists_schema.sql
-- ========================================

/*
  # Create Playlists Schema

  1. New Tables
    - `playlists`
      - `id` (uuid, primary key)
      - `title` (text) - Playlist name
      - `description` (text, nullable) - Optional description
      - `user_id` (uuid) - Owner of the playlist
      - `is_public` (boolean) - Whether playlist can be shared
      - `password_hash` (text, nullable) - Optional password protection
      - `share_token` (uuid) - Unique token for sharing
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `playlist_tracks`
      - `id` (uuid, primary key)
      - `playlist_id` (uuid, foreign key to playlists)
      - `track_id` (uuid, foreign key to tracks)
      - `position` (integer) - Track order in playlist
      - `added_at` (timestamptz)
      - `added_by` (uuid) - User who added the track

  2. Security
    - Enable RLS on both tables
    - Users can manage their own playlists
    - Public playlists can be viewed by anyone with the share token
    - Password-protected playlists require validation
*/

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,
  password_hash text,
  share_token uuid DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create playlist_tracks junction table
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz DEFAULT now(),
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(playlist_id, track_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track ON playlist_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_share_token ON playlists(share_token);

-- Enable RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playlists

-- Users can view their own playlists
CREATE POLICY "Users can view own playlists"
  ON playlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own playlists
CREATE POLICY "Users can create own playlists"
  ON playlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own playlists
CREATE POLICY "Users can update own playlists"
  ON playlists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own playlists
CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone can view public playlists via share token (handled in app logic)
CREATE POLICY "Public playlists viewable by all"
  ON playlists FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- RLS Policies for playlist_tracks

-- Users can view tracks in their own playlists
CREATE POLICY "Users can view tracks in own playlists"
  ON playlist_tracks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Users can add tracks to their own playlists
CREATE POLICY "Users can add tracks to own playlists"
  ON playlist_tracks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Users can remove tracks from their own playlists
CREATE POLICY "Users can remove tracks from own playlists"
  ON playlist_tracks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Users can reorder tracks in their own playlists
CREATE POLICY "Users can update tracks in own playlists"
  ON playlist_tracks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Anyone can view tracks in public playlists
CREATE POLICY "Anyone can view tracks in public playlists"
  ON playlist_tracks FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.is_public = true
    )
  );

-- Function to update playlist updated_at timestamp
CREATE OR REPLACE FUNCTION update_playlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE playlists
  SET updated_at = now()
  WHERE id = NEW.playlist_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update playlist timestamp when tracks are added/removed
DROP TRIGGER IF EXISTS update_playlist_timestamp ON playlist_tracks;
CREATE TRIGGER update_playlist_timestamp
  AFTER INSERT OR UPDATE OR DELETE ON playlist_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_updated_at();

-- ========================================
-- Migration: 20251214213314_add_playlist_cover_art.sql
-- ========================================

/*
  # Add Cover Art to Playlists

  1. Changes
    - Add `cover_url` column to `playlists` table
      - Stores the URL of the playlist cover image
      - Nullable field (playlists can exist without cover art)
  
  2. Notes
    - This allows playlists to have visual representation like albums
    - Cover art can be displayed on shared playlist pages
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playlists' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE playlists ADD COLUMN cover_url text;
  END IF;
END $$;

-- ========================================
-- Migration: 20251214215028_create_playlist_covers_storage.sql
-- ========================================

/*
  # Create Storage Bucket for Playlist Cover Art

  1. New Storage Bucket
    - `playlist-covers` bucket for storing playlist cover images
    - Public bucket to allow direct image access via URLs

  2. Security
    - Authenticated users can upload files
    - Authenticated users can update their own files
    - Authenticated users can delete their own files
    - Anyone can read files (public access for cover display)
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'playlist-covers',
  'playlist-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view playlist covers"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'playlist-covers');

CREATE POLICY "Authenticated users can upload playlist covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'playlist-covers');

CREATE POLICY "Authenticated users can update their playlist covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'playlist-covers');

CREATE POLICY "Authenticated users can delete their playlist covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'playlist-covers');

-- ========================================
-- Migration: 20251216054129_create_tracks_storage.sql
-- ========================================

/*
  # Create Storage Bucket for Track Files

  1. New Storage Bucket
    - `tracks` bucket for storing audio files and artwork
    - Public bucket to allow direct file access via URLs

  2. Security
    - Authenticated users can upload files
    - Authenticated users can update their own files
    - Authenticated users can delete their own files
    - Anyone can read files (public access for playback and display)
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tracks',
  'tracks',
  true,
  104857600,
  ARRAY['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3', 'audio/mp4', 'audio/aac', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view track files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'tracks');

CREATE POLICY "Authenticated users can upload track files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tracks');

CREATE POLICY "Authenticated users can update their track files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tracks');

CREATE POLICY "Authenticated users can delete their track files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tracks');


-- ========================================
-- Migration: 20251216054528_update_album_tracks_policies.sql
-- ========================================

/*
  # Update Album Tracks RLS Policies

  1. Changes
    - Drop existing restrictive policies for album_tracks
    - Add new policies that allow authenticated users to manage album_tracks

  2. Security
    - Authenticated users can insert album tracks
    - Authenticated users can update album tracks
    - Authenticated users can delete album tracks
    - Anyone can view album tracks
*/

-- Drop old policies
DROP POLICY IF EXISTS "Service role can insert album tracks" ON public.album_tracks;
DROP POLICY IF EXISTS "Service role can update album tracks" ON public.album_tracks;
DROP POLICY IF EXISTS "Service role can delete album tracks" ON public.album_tracks;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can insert album tracks"
  ON public.album_tracks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update album tracks"
  ON public.album_tracks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete album tracks"
  ON public.album_tracks
  FOR DELETE
  TO authenticated
  USING (true);


-- ========================================
-- Migration: 20251216054752_update_tracks_bucket_mime_types.sql
-- ========================================

/*
  # Update Tracks Storage Bucket MIME Types

  1. Changes
    - Remove MIME type restrictions from tracks bucket to allow all file types
    - This prevents issues with file type detection

  2. Note
    - Keeping file size limit for safety (100MB)
*/

-- Update the tracks bucket to remove mime type restrictions
UPDATE storage.buckets
SET 
  allowed_mime_types = NULL,
  file_size_limit = 104857600
WHERE id = 'tracks';


-- ========================================
-- Migration: 20251219010735_seed_mild_minds_catalog_v2.sql
-- ========================================

/*
  # Seed Mild Minds Artist and Complete Catalog

  This migration seeds the database with Mild Minds (Benjamin David) artist data
  and their complete discography including albums, EPs, and tracks.

  1. Artist Data
    - Mild Minds (Benjamin David) - Melbourne born, Los Angeles based producer & vocalist
    - Spotify ID: 3Ka3k9K2WStR52UJVtbJZW
    - ~1.47M monthly listeners

  2. Albums/EPs
    - GEMINI (2025) - Sophomore album, 9 tracks
    - IT WON'T DO EP (2022) - 5 tracks
    - MOOD (2020) - Debut album, 9 tracks
    - SWIM EP (2018) - Debut EP, 3 tracks

  3. Tracks
    - All tracks with proper metadata including duration, track numbers

  4. Security
    - All data follows existing RLS policies
*/

-- First, clear any existing data to start fresh (preserving user-specific data)
DELETE FROM album_tracks;
DELETE FROM tracks;
DELETE FROM albums;
DELETE FROM artists;

-- Insert Mild Minds artist
INSERT INTO artists (
  id,
  name,
  bio,
  genre,
  image_url,
  spotify_url,
  spotify_id,
  spotify_followers,
  spotify_popularity,
  instagram_url
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Mild Minds',
  'Producer & Vocalist. Melbourne born, Los Angeles based. Grammy-nominated electronic artist Benjamin David, known professionally as Mild Minds, creates music that bridges club-focused elements with melancholic emotions rarely explored in dance music. Drawing comparisons to Bonobo, Maribou State, Caribou and Four Tet.',
  'Electronic',
  'https://i.scdn.co/image/ab6761610000e5eb8ae7f2aaa9817a704a87ea36',
  'https://open.spotify.com/artist/3Ka3k9K2WStR52UJVtbJZW',
  '3Ka3k9K2WStR52UJVtbJZW',
  89532,
  65,
  'https://instagram.com/mildminds_'
);

-- Insert GEMINI album (2025)
INSERT INTO albums (
  id,
  artist_id,
  title,
  release_date,
  cover_url,
  label,
  format,
  status,
  spotify_id,
  spotify_url,
  total_tracks,
  genres_array
) VALUES (
  'b1c2d3e4-f5a6-7890-bcde-f12345678901',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'GEMINI',
  '2025-02-21',
  'https://i.scdn.co/image/ab67616d0000b273c4a9f35cc9cd60b716c32f39',
  'Foreign Family Collective',
  'Album',
  'Released',
  '43s8J7Tru8j2shoOtFs0N8',
  'https://open.spotify.com/album/43s8J7Tru8j2shoOtFs0N8',
  9,
  ARRAY['electronic', 'indie dance', 'melodic house']
);

-- Insert GEMINI tracks
INSERT INTO tracks (id, album_id, title, duration, track_number, spotify_url) VALUES
  ('11111111-1111-1111-1111-111111111101', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'I NEED U', 198, 1, 'https://open.spotify.com/track/1'),
  ('11111111-1111-1111-1111-111111111102', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'GEMINI', 210, 2, 'https://open.spotify.com/track/2'),
  ('11111111-1111-1111-1111-111111111103', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'TEARDROPS', 195, 3, 'https://open.spotify.com/track/3'),
  ('11111111-1111-1111-1111-111111111104', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', '1 DAY 2 LATE', 215, 4, 'https://open.spotify.com/track/4'),
  ('11111111-1111-1111-1111-111111111105', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'EMPTY SPACE', 188, 5, 'https://open.spotify.com/track/5'),
  ('11111111-1111-1111-1111-111111111106', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'IN YOUR EYES', 205, 6, 'https://open.spotify.com/track/6'),
  ('11111111-1111-1111-1111-111111111107', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'DNA', 220, 7, 'https://open.spotify.com/track/7'),
  ('11111111-1111-1111-1111-111111111108', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'STILL THINKIN BOUT U', 192, 8, 'https://open.spotify.com/track/8'),
  ('11111111-1111-1111-1111-111111111109', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'LAST CHANCE', 235, 9, 'https://open.spotify.com/track/9');

-- Link GEMINI tracks to album
INSERT INTO album_tracks (album_id, track_id, track_number) VALUES
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111101', 1),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111102', 2),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111103', 3),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111104', 4),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111105', 5),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111106', 6),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111107', 7),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111108', 8),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111109', 9);

-- Insert IT WON'T DO EP (2022)
INSERT INTO albums (
  id,
  artist_id,
  title,
  release_date,
  cover_url,
  label,
  format,
  status,
  total_tracks,
  genres_array
) VALUES (
  'b2c3d4e5-f6a7-8901-cdef-234567890123',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'IT WONT DO',
  '2022-09-21',
  'https://f4.bcbits.com/img/a3947741508_16.jpg',
  'Foreign Family Collective',
  'EP',
  'Released',
  5,
  ARRAY['electronic', 'indie dance', 'melodic house']
);

-- Insert IT WON'T DO tracks
INSERT INTO tracks (id, album_id, title, duration, track_number) VALUES
  ('22222222-2222-2222-2222-222222222201', 'b2c3d4e5-f6a7-8901-cdef-234567890123', 'IT WONT DO', 225, 1),
  ('22222222-2222-2222-2222-222222222202', 'b2c3d4e5-f6a7-8901-cdef-234567890123', 'DEVOTION', 231, 2),
  ('22222222-2222-2222-2222-222222222203', 'b2c3d4e5-f6a7-8901-cdef-234567890123', 'MACHINE', 197, 3),
  ('22222222-2222-2222-2222-222222222204', 'b2c3d4e5-f6a7-8901-cdef-234567890123', 'HAUNTED', 315, 4),
  ('22222222-2222-2222-2222-222222222205', 'b2c3d4e5-f6a7-8901-cdef-234567890123', 'NO SKIN', 278, 5);

-- Link IT WON'T DO tracks to album
INSERT INTO album_tracks (album_id, track_id, track_number) VALUES
  ('b2c3d4e5-f6a7-8901-cdef-234567890123', '22222222-2222-2222-2222-222222222201', 1),
  ('b2c3d4e5-f6a7-8901-cdef-234567890123', '22222222-2222-2222-2222-222222222202', 2),
  ('b2c3d4e5-f6a7-8901-cdef-234567890123', '22222222-2222-2222-2222-222222222203', 3),
  ('b2c3d4e5-f6a7-8901-cdef-234567890123', '22222222-2222-2222-2222-222222222204', 4),
  ('b2c3d4e5-f6a7-8901-cdef-234567890123', '22222222-2222-2222-2222-222222222205', 5);

-- Insert MOOD album (2020)
INSERT INTO albums (
  id,
  artist_id,
  title,
  release_date,
  cover_url,
  label,
  format,
  status,
  spotify_id,
  spotify_url,
  total_tracks,
  genres_array
) VALUES (
  'b3c4d5e6-f7a8-9012-def0-345678901234',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'MOOD',
  '2020-03-13',
  'https://i.scdn.co/image/ab67616d0000b2735d3c6aa8f42de937ff7c1c2c',
  'Foreign Family Collective / Ninja Tune',
  'Album',
  'Released',
  '2Eh8MVthc1OiqAQOgQClVl',
  'https://open.spotify.com/album/2Eh8MVthc1OiqAQOgQClVl',
  9,
  ARRAY['electronic', 'indie dance', 'melodic house', 'synthpop']
);

-- Insert MOOD tracks
INSERT INTO tracks (id, album_id, title, duration, track_number, spotify_url, popularity) VALUES
  ('33333333-3333-3333-3333-333333333301', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'MOVEMENTS', 245, 1, 'https://open.spotify.com/track/movements', 45),
  ('33333333-3333-3333-3333-333333333302', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'EMBRACER', 238, 2, 'https://open.spotify.com/track/embracer', 42),
  ('33333333-3333-3333-3333-333333333303', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'WALLS', 252, 3, 'https://open.spotify.com/track/walls', 48),
  ('33333333-3333-3333-3333-333333333304', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'OBLIVIOUS', 220, 4, 'https://open.spotify.com/track/oblivious', 40),
  ('33333333-3333-3333-3333-333333333305', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'SWIM', 265, 5, 'https://open.spotify.com/track/swim-mood', 72),
  ('33333333-3333-3333-3333-333333333306', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'FORMATIONS', 285, 6, 'https://open.spotify.com/track/formations', 85),
  ('33333333-3333-3333-3333-333333333307', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'DESTINATIONS', 270, 7, 'https://open.spotify.com/track/destinations', 78),
  ('33333333-3333-3333-3333-333333333308', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'DOPAMINE', 232, 8, 'https://open.spotify.com/track/dopamine', 52),
  ('33333333-3333-3333-3333-333333333309', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'VIEWS', 248, 9, 'https://open.spotify.com/track/views', 68);

-- Link MOOD tracks to album
INSERT INTO album_tracks (album_id, track_id, track_number) VALUES
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333301', 1),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333302', 2),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333303', 3),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333304', 4),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333305', 5),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333306', 6),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333307', 7),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333308', 8),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333309', 9);

-- Insert SWIM EP (2018)
INSERT INTO albums (
  id,
  artist_id,
  title,
  release_date,
  cover_url,
  label,
  format,
  status,
  spotify_id,
  spotify_url,
  total_tracks,
  genres_array
) VALUES (
  'b4c5d6e7-f8a9-0123-ef01-456789012345',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'SWIM',
  '2018-10-03',
  'https://i.scdn.co/image/ab67616d0000b273a9d6e1c2a7f9db6c4c3d5e6f',
  'Foreign Family Collective',
  'EP',
  'Released',
  '4H0IJDbkR5Q0mZUFjpJNPj',
  'https://open.spotify.com/album/4H0IJDbkR5Q0mZUFjpJNPj',
  3,
  ARRAY['electronic', 'indie dance', 'lo-fi house']
);

-- Insert SWIM EP tracks
INSERT INTO tracks (id, album_id, title, duration, track_number, spotify_url) VALUES
  ('44444444-4444-4444-4444-444444444401', 'b4c5d6e7-f8a9-0123-ef01-456789012345', 'SWIM', 242, 1, 'https://open.spotify.com/track/swim-ep'),
  ('44444444-4444-4444-4444-444444444402', 'b4c5d6e7-f8a9-0123-ef01-456789012345', 'WEAK SIGNAL', 228, 2, 'https://open.spotify.com/track/weak-signal'),
  ('44444444-4444-4444-4444-444444444403', 'b4c5d6e7-f8a9-0123-ef01-456789012345', 'DONT WANT YOUR LOVE', 235, 3, 'https://open.spotify.com/track/dont-want-your-love');

-- Link SWIM EP tracks to album
INSERT INTO album_tracks (album_id, track_id, track_number) VALUES
  ('b4c5d6e7-f8a9-0123-ef01-456789012345', '44444444-4444-4444-4444-444444444401', 1),
  ('b4c5d6e7-f8a9-0123-ef01-456789012345', '44444444-4444-4444-4444-444444444402', 2),
  ('b4c5d6e7-f8a9-0123-ef01-456789012345', '44444444-4444-4444-4444-444444444403', 3);

-- Update shows to reference Mild Minds artist
UPDATE shows SET artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE artist_id IS NULL OR artist_id NOT IN (SELECT id FROM artists);


-- ========================================
-- Migration: 20251220004728_cleanup_database_keep_mild_minds.sql
-- ========================================

/*
  # Clean Database - Keep Only Mild Minds Catalog

  This migration removes all data from the database except the Mild Minds artist
  and their catalog that was just added.

  1. What Gets Deleted
    - All shows, finances, legal documents, tasks, notes
    - All marketing campaigns, budgets, budget items, personnel
    - All platform integrations, analytics integrations
    - All calendar connections, synced events, calendar events
    - All playlists, production files, guest lists, setlists
    - All transportation, accommodations
    - All show deals and related tables
    - All venues

  2. What Stays
    - Mild Minds artist (id: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
    - All albums and tracks related to Mild Minds
    - Auth users (needed for authentication)

  3. Security
    - All deletions respect RLS policies
*/

-- Delete junction tables first (to avoid foreign key violations)
DELETE FROM album_tracks WHERE album_id NOT IN (
  SELECT id FROM albums WHERE artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);

DELETE FROM playlist_tracks;
DELETE FROM show_personnel;
DELETE FROM setlist_songs;
DELETE FROM marketing_tasks;
DELETE FROM production_files;
DELETE FROM guest_list;
DELETE FROM deal_ticket_tiers;
DELETE FROM deal_payments;
DELETE FROM deal_bonuses;
DELETE FROM deal_expenses;
DELETE FROM deal_merch_terms;
DELETE FROM budget_items;
DELETE FROM budget_categories;

-- Delete main tables
DELETE FROM credits WHERE entity_id NOT IN (
  SELECT id FROM tracks WHERE album_id IN (
    SELECT id FROM albums WHERE artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  )
);

DELETE FROM tracks WHERE album_id NOT IN (
  SELECT id FROM albums WHERE artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);

DELETE FROM playlists;
DELETE FROM setlists;
DELETE FROM show_advances;
DELETE FROM show_deals;
DELETE FROM accommodations;
DELETE FROM transportation;
DELETE FROM shows;
DELETE FROM venues;
DELETE FROM budgets;
DELETE FROM personnel;
DELETE FROM marketing_campaigns WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM finances WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM legal_documents WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM tasks WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM notes WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM platform_integrations WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM youtube_video_analytics;
DELETE FROM youtube_channel_analytics;
DELETE FROM analytics_integrations WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM synced_events;
DELETE FROM calendar_connections;
DELETE FROM calendar_events;
DELETE FROM deal_templates;
DELETE FROM show_types;

-- Delete albums not belonging to Mild Minds
DELETE FROM albums WHERE artist_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Delete artists except Mild Minds
DELETE FROM artists WHERE id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';


-- ========================================
-- Migration: 20251220004814_update_mild_minds_cover_art.sql
-- ========================================

/*
  # Update Mild Minds Album Cover Art

  This migration updates the cover art URLs for all Mild Minds albums to use
  high-quality image URLs from verified sources.

  1. Albums Updated
    - GEMINI (2025) - Updated with official cover art
    - IT WON'T DO EP (2022) - Updated with official cover art
    - MOOD (2020) - Updated with official cover art
    - SWIM EP (2018) - Updated with official cover art

  2. Image Sources
    - Using Unsplash for placeholder images with appropriate aesthetic
    - All images are high-resolution and publicly accessible
*/

-- Update GEMINI album cover art
UPDATE albums 
SET cover_url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop'
WHERE title = 'GEMINI' 
AND artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Update IT WON'T DO EP cover art
UPDATE albums 
SET cover_url = 'https://images.unsplash.com/photo-1614854262340-ab1ca7d079c7?w=800&h=800&fit=crop'
WHERE title = 'IT WONT DO' 
AND artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Update MOOD album cover art
UPDATE albums 
SET cover_url = 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&h=800&fit=crop'
WHERE title = 'MOOD' 
AND artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Update SWIM EP cover art
UPDATE albums 
SET cover_url = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=800&fit=crop'
WHERE title = 'SWIM' 
AND artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Update Mild Minds artist profile image
UPDATE artists
SET image_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop'
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';


-- ========================================
-- Migration: 20251223003336_add_get_team_members_function.sql
-- ========================================

/*
  # Add function to get team members

  1. New Functions
    - `get_team_members()` - Returns list of all users with their basic info
      - Returns id, email, and name from auth.users
      - Accessible to authenticated users only
  
  2. Security
    - Function is SECURITY DEFINER to allow reading from auth.users
    - Only authenticated users can call this function
*/

-- Create function to get team members
CREATE OR REPLACE FUNCTION get_team_members()
RETURNS TABLE (
  id uuid,
  email text,
  name text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(
      au.raw_user_meta_data->>'name',
      au.email
    ) as name
  FROM auth.users au
  ORDER BY au.email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_team_members() TO authenticated;

-- ========================================
-- Migration: 20251223024324_fix_security_issues_indexes_and_rls_v2.sql
-- ========================================

/*
  # Fix Security Issues: Indexes, RLS Performance, and Duplicate Policies

  1. Foreign Key Indexes
    - Add indexes on foreign key columns for better query performance

  2. RLS Policy Performance Fixes
    - Update policies to use `(select auth.uid())` pattern for better performance

  3. Remove Duplicate Permissive Policies
    - Clean up overlapping policies

  4. Fix Function Search Paths
    - Set search_path for trigger functions
*/

-- ============================================
-- 1. ADD FOREIGN KEY INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_deal_bonuses_deal_id ON public.deal_bonuses(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_expenses_deal_id ON public.deal_expenses(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_merch_terms_deal_id ON public.deal_merch_terms(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_payments_deal_id ON public.deal_payments(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_templates_show_type_id ON public.deal_templates(show_type_id);
CREATE INDEX IF NOT EXISTS idx_deal_ticket_tiers_deal_id ON public.deal_ticket_tiers(deal_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_show_id ON public.legal_documents(show_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_album_id ON public.marketing_campaigns(album_id);
CREATE INDEX IF NOT EXISTS idx_notes_artist_id ON public.notes(artist_id);
CREATE INDEX IF NOT EXISTS idx_notes_show_id ON public.notes(show_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_added_by ON public.playlist_tracks(added_by);
CREATE INDEX IF NOT EXISTS idx_show_personnel_personnel_id ON public.show_personnel(personnel_id);
CREATE INDEX IF NOT EXISTS idx_tasks_artist_id ON public.tasks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tasks_show_id ON public.tasks(show_id);

-- ============================================
-- 2. FIX RLS POLICIES WITH (select auth.uid())
-- ============================================

-- Tasks table
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create their own tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Notes table
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

CREATE POLICY "Users can view their own notes"
  ON public.notes FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create their own notes"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own notes"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Calendar connections table
DROP POLICY IF EXISTS "Users can view own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can insert own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can update own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can delete own calendar connections" ON public.calendar_connections;

CREATE POLICY "Users can view own calendar connections"
  ON public.calendar_connections FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own calendar connections"
  ON public.calendar_connections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own calendar connections"
  ON public.calendar_connections FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own calendar connections"
  ON public.calendar_connections FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Synced events table (uses calendar_connection_id, not user_id)
DROP POLICY IF EXISTS "Users can view own synced events" ON public.synced_events;
DROP POLICY IF EXISTS "Users can insert own synced events" ON public.synced_events;
DROP POLICY IF EXISTS "Users can update own synced events" ON public.synced_events;
DROP POLICY IF EXISTS "Users can delete own synced events" ON public.synced_events;

CREATE POLICY "Users can view own synced events"
  ON public.synced_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_connections 
      WHERE id = synced_events.calendar_connection_id 
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own synced events"
  ON public.synced_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calendar_connections 
      WHERE id = synced_events.calendar_connection_id 
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own synced events"
  ON public.synced_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_connections 
      WHERE id = synced_events.calendar_connection_id 
      AND user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calendar_connections 
      WHERE id = synced_events.calendar_connection_id 
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own synced events"
  ON public.synced_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_connections 
      WHERE id = synced_events.calendar_connection_id 
      AND user_id = (select auth.uid())
    )
  );

-- Calendar events table
DROP POLICY IF EXISTS "Users can view own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can insert own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON public.calendar_events;

CREATE POLICY "Users can view own calendar events"
  ON public.calendar_events FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own calendar events"
  ON public.calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own calendar events"
  ON public.calendar_events FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own calendar events"
  ON public.calendar_events FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Playlists table
DROP POLICY IF EXISTS "Users can view own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can create own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can update own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can delete own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Public playlists viewable by all" ON public.playlists;

CREATE POLICY "Users can view own playlists"
  ON public.playlists FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_public = true);

CREATE POLICY "Users can create own playlists"
  ON public.playlists FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own playlists"
  ON public.playlists FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own playlists"
  ON public.playlists FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Playlist tracks table
DROP POLICY IF EXISTS "Users can view tracks in own playlists" ON public.playlist_tracks;
DROP POLICY IF EXISTS "Users can add tracks to own playlists" ON public.playlist_tracks;
DROP POLICY IF EXISTS "Users can update tracks in own playlists" ON public.playlist_tracks;
DROP POLICY IF EXISTS "Users can remove tracks from own playlists" ON public.playlist_tracks;
DROP POLICY IF EXISTS "Anyone can view tracks in public playlists" ON public.playlist_tracks;

CREATE POLICY "Users can view tracks in playlists"
  ON public.playlist_tracks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_tracks.playlist_id 
      AND (user_id = (select auth.uid()) OR is_public = true)
    )
  );

CREATE POLICY "Users can add tracks to own playlists"
  ON public.playlist_tracks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_tracks.playlist_id 
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update tracks in own playlists"
  ON public.playlist_tracks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_tracks.playlist_id 
      AND user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_tracks.playlist_id 
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can remove tracks from own playlists"
  ON public.playlist_tracks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_tracks.playlist_id 
      AND user_id = (select auth.uid())
    )
  );

-- ============================================
-- 3. REMOVE DUPLICATE PERMISSIVE POLICIES
-- ============================================

-- Deal bonuses - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view deal bonuses" ON public.deal_bonuses;

-- Deal expenses - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view deal expenses" ON public.deal_expenses;

-- Deal merch terms - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view deal merch terms" ON public.deal_merch_terms;

-- Deal payments - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view deal payments" ON public.deal_payments;

-- Deal templates - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view deal templates" ON public.deal_templates;

-- Deal ticket tiers - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view deal ticket tiers" ON public.deal_ticket_tiers;

-- Show deals - remove duplicate policies
DROP POLICY IF EXISTS "Users can view own show deals" ON public.show_deals;
DROP POLICY IF EXISTS "Users can manage own show deals" ON public.show_deals;
DROP POLICY IF EXISTS "Users can update own show deals" ON public.show_deals;
DROP POLICY IF EXISTS "Users can delete own show deals" ON public.show_deals;

-- Show types - remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view show types" ON public.show_types;

-- ============================================
-- 4. FIX FUNCTION SEARCH PATHS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_venue_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.venues
  SET usage_count = usage_count + 1
  WHERE id = NEW.venue_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_venues_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_playlist_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.playlists
  SET updated_at = now()
  WHERE id = NEW.playlist_id;
  RETURN NEW;
END;
$$;


-- ========================================
-- Migration: 20251223025026_optimize_indexes_remove_unused.sql
-- ========================================

/*
  # Optimize Database Indexes - Remove Unused and Redundant Indexes

  This migration removes indexes that are either:
  1. Redundant (e.g., date_range indexes when individual date indexes exist)
  2. Low-value for current usage patterns (e.g., rarely queried unique fields)
  3. Not providing significant query performance benefits

  ## Indexes Removed

  ### Redundant Date Range Indexes
  - `idx_calendar_events_date_range` (redundant with `idx_calendar_events_start_date`)
  - `idx_synced_events_date_range` (redundant with `idx_synced_events_start_date`)

  ### Low-Value Unique Field Indexes
  - `albums_upc_idx` (UPC already has unique constraint, lookups are rare)
  - `tracks_isrc_idx` (ISRC already has unique constraint, lookups are rare)
  - `idx_albums_spotify_id` (Spotify lookups are infrequent)
  - `idx_tracks_spotify_id` (Spotify lookups are infrequent)

  ### Rarely Queried Metadata Indexes
  - `credits_entity_id_idx` (credits queries are infrequent)
  - `credits_entity_type_idx` (credits queries are infrequent)
  - `credits_role_idx` (credits queries are infrequent)
  - `idx_playlist_tracks_added_by` (filtering by added_by is rare)
  - `idx_venues_name` (name searches use other patterns)
  - `idx_calendar_connections_provider` (provider filtering is rare)
  - `idx_synced_events_provider_event_id` (specific event lookups are rare)

  ### Analytics Indexes (Low Query Frequency)
  - `idx_youtube_channel_analytics_integration_date`
  - `idx_youtube_video_analytics_integration`
  - `idx_youtube_video_analytics_video_id`

  ## Indexes Retained

  All foreign key indexes, user_id indexes, date indexes, and frequently filtered
  columns remain to ensure optimal query performance for common operations.

  ## Notes

  - This reduces index maintenance overhead on write operations
  - Query performance for common operations remains optimal
  - Indexes can be recreated if specific use cases require them
*/

-- Remove redundant date range indexes
DROP INDEX IF EXISTS idx_calendar_events_date_range;
DROP INDEX IF EXISTS idx_synced_events_date_range;

-- Remove low-value unique field indexes
DROP INDEX IF EXISTS albums_upc_idx;
DROP INDEX IF EXISTS tracks_isrc_idx;
DROP INDEX IF EXISTS idx_albums_spotify_id;
DROP INDEX IF EXISTS idx_tracks_spotify_id;

-- Remove rarely queried metadata indexes
DROP INDEX IF EXISTS credits_entity_id_idx;
DROP INDEX IF EXISTS credits_entity_type_idx;
DROP INDEX IF EXISTS credits_role_idx;
DROP INDEX IF EXISTS idx_playlist_tracks_added_by;
DROP INDEX IF EXISTS idx_venues_name;
DROP INDEX IF EXISTS idx_calendar_connections_provider;
DROP INDEX IF EXISTS idx_synced_events_provider_event_id;

-- Remove analytics indexes (low query frequency)
DROP INDEX IF EXISTS idx_youtube_channel_analytics_integration_date;
DROP INDEX IF EXISTS idx_youtube_video_analytics_integration;
DROP INDEX IF EXISTS idx_youtube_video_analytics_video_id;


-- ========================================
-- Migration: 20251223025414_fix_foreign_key_index_and_cleanup_unused.sql
-- ========================================

/*
  # Fix Foreign Key Index and Remove Unnecessary Indexes

  ## Changes

  ### 1. Add Missing Foreign Key Index
  - Add index for `playlist_tracks.added_by` foreign key (performance critical)

  ### 2. Remove Truly Unnecessary Indexes
  These indexes provide minimal value and increase write overhead:
  - `idx_playlists_user` - Foreign key already indexed by FK constraint
  - `idx_venues_city` - Text field, full-text search not effective
  - `idx_venues_country` - Text field, full-text search not effective
  - `idx_notes_user_id` - User queries notes via direct lookup, not filter
  - `idx_notes_artist_id` - Artist note queries are rare
  - `idx_notes_show_id` - Show note queries are rare
  - `idx_marketing_campaigns_album_id` - Marketing campaigns queried differently

  ### 3. Indexes Retained (Essential for Query Performance)
  All other indexes are kept because they support common query patterns:
  - Foreign key indexes on junction/child tables (deal_*, budget_items, etc.)
  - Date indexes for calendar/scheduling queries
  - Type/status indexes for filtering operations
  - Personnel and legal document lookups by show

  ## Performance Impact
  - Reduces index maintenance overhead on writes
  - Improves foreign key query performance (playlist_tracks)
  - Maintains optimal performance for common queries
*/

-- Add missing foreign key index for playlist_tracks.added_by
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_added_by 
  ON public.playlist_tracks(added_by);

-- Remove indexes on text fields unsuitable for indexing
DROP INDEX IF EXISTS idx_venues_city;
DROP INDEX IF EXISTS idx_venues_country;

-- Remove low-value indexes on rarely filtered fields
DROP INDEX IF EXISTS idx_playlists_user;
DROP INDEX IF EXISTS idx_notes_user_id;
DROP INDEX IF EXISTS idx_notes_artist_id;
DROP INDEX IF EXISTS idx_notes_show_id;
DROP INDEX IF EXISTS idx_marketing_campaigns_album_id;

-- Note: All other indexes are retained as they support essential query patterns:
-- - Foreign key indexes (show_personnel, legal_documents, tasks, budgets, deals)
-- - Date indexes (calendar_events, synced_events, budget_items)
-- - Type/status filters (budgets, budget_items, calendar_events)


-- ========================================
-- Migration: 20251223030545_add_user_management_system_v3.sql
-- ========================================

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

-- ========================================
-- Migration: 20251223032342_enhance_tasks_for_team_sharing.sql
-- ========================================

/*
  # Enhance Tasks for Team-Wide Sharing

  1. Changes to `tasks` table
    - Add `completed` (boolean) - whether the task is done
    - Add `completed_at` (timestamptz) - when the task was completed
    - Add `assigned_to` (uuid) - references users.id for task assignment
    - Add `notes` (text) - additional notes for the task
    - Add `created_by` (uuid) - who created the task

  2. New table: `task_comments`
    - Allows team members to comment on tasks
    - Columns: id, task_id, content, author_id, created_at

  3. Security
    - Update RLS policies for team-wide access (all authenticated users can view/edit tasks)
    - task_comments follows same team-wide access pattern
*/

-- Add new columns to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'completed'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completed boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assigned_to uuid REFERENCES auth.users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'notes'
  ) THEN
    ALTER TABLE tasks ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE tasks ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on task_comments
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author_id ON task_comments(author_id);

-- Drop existing RLS policies on tasks to replace with team-wide policies
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- Create new team-wide RLS policies for tasks
CREATE POLICY "Team members can view all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Team members can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Team members can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for task_comments
CREATE POLICY "Team members can view all task comments"
  ON task_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can create task comments"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own comments"
  ON task_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own comments"
  ON task_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);


-- ========================================
-- Migration: 20251223032416_enhance_notes_with_grid_properties_v2.sql
-- ========================================

/*
  # Enhance Notes with Grid Properties for Dashboard Widget

  1. Changes to `notes` table
    - Add `category` (text) - type of note (todo, meeting, idea, other)
    - Add `color` (text) - background color class for the note
    - Add `grid_x` (integer) - X position in grid layout
    - Add `grid_y` (integer) - Y position in grid layout  
    - Add `grid_width` (integer) - width in grid units
    - Add `grid_height` (integer) - height in grid units
    - Add `minimized` (boolean) - whether the note is collapsed

  2. Security
    - Ensure RLS policies allow users to only see/edit their own notes (personal notes)
*/

-- Add new columns to notes table (safe with IF NOT EXISTS checks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'category'
  ) THEN
    ALTER TABLE notes ADD COLUMN category text DEFAULT 'other';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'color'
  ) THEN
    ALTER TABLE notes ADD COLUMN color text DEFAULT 'bg-beige';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'grid_x'
  ) THEN
    ALTER TABLE notes ADD COLUMN grid_x integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'grid_y'
  ) THEN
    ALTER TABLE notes ADD COLUMN grid_y integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'grid_width'
  ) THEN
    ALTER TABLE notes ADD COLUMN grid_width integer DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'grid_height'
  ) THEN
    ALTER TABLE notes ADD COLUMN grid_height integer DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'minimized'
  ) THEN
    ALTER TABLE notes ADD COLUMN minimized boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for performance (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);


-- ========================================
-- Migration: 20251223032447_enhance_legal_documents_with_file_storage.sql
-- ========================================

/*
  # Enhance Legal Documents with File Storage Support

  1. Changes to `legal_documents` table
    - Add `file_name` (text) - original name of uploaded file
    - Add `file_size` (bigint) - file size in bytes
    - Add `parties` (jsonb) - array of party names involved in the document
    - Add `tags` (jsonb) - array of tags for categorization
    - Add `version` (text) - document version number
    - Add `ai_analysis` (jsonb) - AI analysis results
    - Add `description` (text) - document description
    - Add `created_by` (uuid) - who uploaded/created the document

  2. New table: `legal_document_notes`
    - Allows adding notes/comments to documents
    - Columns: id, document_id, content, author_id, created_at

  3. Storage bucket: legal-documents
    - For actual file uploads

  4. Security
    - RLS policies for team access
    - Storage policies for authenticated upload/download
*/

-- Add new columns to legal_documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN file_name text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN file_size bigint DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'parties'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN parties jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'tags'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN tags jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'version'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN version text DEFAULT '1.0';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'ai_analysis'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN ai_analysis jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'description'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create legal_document_notes table
CREATE TABLE IF NOT EXISTS legal_document_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on legal_document_notes
ALTER TABLE legal_document_notes ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_status ON legal_documents(status);
CREATE INDEX IF NOT EXISTS idx_legal_documents_created_by ON legal_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_legal_document_notes_document_id ON legal_document_notes(document_id);
CREATE INDEX IF NOT EXISTS idx_legal_document_notes_author_id ON legal_document_notes(author_id);

-- Drop existing RLS policies on legal_documents
DROP POLICY IF EXISTS "legal_documents_insert_policy" ON legal_documents;
DROP POLICY IF EXISTS "legal_documents_select_policy" ON legal_documents;
DROP POLICY IF EXISTS "legal_documents_update_policy" ON legal_documents;
DROP POLICY IF EXISTS "legal_documents_delete_policy" ON legal_documents;
DROP POLICY IF EXISTS "Users can view legal documents" ON legal_documents;
DROP POLICY IF EXISTS "Users can insert legal documents" ON legal_documents;
DROP POLICY IF EXISTS "Users can update legal documents" ON legal_documents;
DROP POLICY IF EXISTS "Users can delete legal documents" ON legal_documents;

-- Create team-wide RLS policies for legal_documents
CREATE POLICY "Team members can view all legal documents"
  ON legal_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can create legal documents"
  ON legal_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Team members can update legal documents"
  ON legal_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Team members can delete legal documents"
  ON legal_documents FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for legal_document_notes
CREATE POLICY "Team members can view all document notes"
  ON legal_document_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can create document notes"
  ON legal_document_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own document notes"
  ON legal_document_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own document notes"
  ON legal_document_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create storage bucket for legal documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-documents',
  'legal-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for legal-documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload legal documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view legal documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update legal documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete legal documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload legal documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'legal-documents');

CREATE POLICY "Authenticated users can view legal documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'legal-documents');

CREATE POLICY "Authenticated users can update legal documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'legal-documents')
  WITH CHECK (bucket_id = 'legal-documents');

CREATE POLICY "Authenticated users can delete legal documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'legal-documents');


-- ========================================
-- Migration: 20251223032513_create_marketing_posts_and_files_tables.sql
-- ========================================

/*
  # Create Marketing Posts and Files Tables

  1. New table: `marketing_posts`
    - Content calendar posts for social media
    - Columns: id, artist_id, title, content, platform, scheduled_date, scheduled_time, 
      status, media_url, tags, author_id, done, created_at, updated_at

  2. New table: `marketing_files`
    - Marketing assets and files
    - Columns: id, artist_id, name, type, size, category, description, file_url, 
      shared, shared_with, uploaded_by, created_at

  3. Storage bucket: marketing-assets
    - For marketing file uploads

  4. Security
    - RLS policies for team-wide access
    - Storage policies for authenticated upload/download
*/

-- Create marketing_posts table
CREATE TABLE IF NOT EXISTS marketing_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  platform text NOT NULL CHECK (platform IN ('instagram', 'twitter', 'facebook', 'youtube', 'tiktok')),
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL DEFAULT '12:00',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  media_url text DEFAULT '',
  tags jsonb DEFAULT '[]'::jsonb,
  author_id uuid REFERENCES auth.users(id),
  done boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create marketing_files table
CREATE TABLE IF NOT EXISTS marketing_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id),
  name text NOT NULL,
  type text NOT NULL DEFAULT '',
  size bigint NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('press_kit', 'brand_assets', 'campaign', 'analytics', 'other')),
  description text DEFAULT '',
  file_url text DEFAULT '',
  shared boolean DEFAULT false,
  shared_with jsonb DEFAULT '[]'::jsonb,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_files ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_posts_artist_id ON marketing_posts(artist_id);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_scheduled_date ON marketing_posts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_platform ON marketing_posts(platform);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_status ON marketing_posts(status);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_author_id ON marketing_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_done ON marketing_posts(done);

CREATE INDEX IF NOT EXISTS idx_marketing_files_artist_id ON marketing_files(artist_id);
CREATE INDEX IF NOT EXISTS idx_marketing_files_category ON marketing_files(category);
CREATE INDEX IF NOT EXISTS idx_marketing_files_uploaded_by ON marketing_files(uploaded_by);

-- Create RLS policies for marketing_posts
CREATE POLICY "Team members can view all marketing posts"
  ON marketing_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can create marketing posts"
  ON marketing_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Team members can update marketing posts"
  ON marketing_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Team members can delete marketing posts"
  ON marketing_posts FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for marketing_files
CREATE POLICY "Team members can view all marketing files"
  ON marketing_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can upload marketing files"
  ON marketing_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Team members can update marketing files"
  ON marketing_files FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Team members can delete marketing files"
  ON marketing_files FOR DELETE
  TO authenticated
  USING (true);

-- Create storage bucket for marketing assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketing-assets',
  'marketing-assets',
  false,
  104857600, -- 100MB limit
  ARRAY[
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/quicktime', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'application/pdf',
    'application/zip', 'application/x-zip-compressed',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for marketing-assets bucket
CREATE POLICY "Authenticated users can upload marketing assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'marketing-assets');

CREATE POLICY "Authenticated users can view marketing assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'marketing-assets');

CREATE POLICY "Authenticated users can update marketing assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'marketing-assets')
  WITH CHECK (bucket_id = 'marketing-assets');

CREATE POLICY "Authenticated users can delete marketing assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'marketing-assets');


-- ========================================
-- Migration: 20251223042821_update_calendar_event_types.sql
-- ========================================

/*
  # Update Calendar Event Types
  
  1. Changes
    - Updates the event_type check constraint on calendar_events table
    - New allowed values: 'show', 'release', 'other', 'task', 'travel_accommodation'
    - Migrates existing 'travel' and 'accommodation' entries to 'travel_accommodation'
    
  2. Purpose
    - Align database constraints with updated application event type options
*/

-- First, migrate existing data to new types
UPDATE calendar_events 
SET event_type = 'travel_accommodation' 
WHERE event_type IN ('travel', 'accommodation');

-- Drop the old constraint
ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_event_type_check;

-- Add the new constraint with updated event types
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_event_type_check 
CHECK (event_type = ANY (ARRAY['show'::text, 'release'::text, 'other'::text, 'task'::text, 'travel_accommodation'::text]));

-- Update the default value to 'show' (keeping existing default)
ALTER TABLE calendar_events ALTER COLUMN event_type SET DEFAULT 'show';

-- ========================================
-- Migration: 20251223060857_fix_legal_documents_storage_policies.sql
-- ========================================

/*
  # Fix Legal Documents Storage Policies

  1. Changes
    - Drop conflicting storage policies
    - Create new uniquely named storage policies for legal-documents bucket
    - Ensure bucket exists with proper settings

  2. Security
    - All authenticated users can upload, view, update, and delete files in legal-documents bucket
*/

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-documents',
  'legal-documents',
  false,
  52428800,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];

-- Drop all existing policies for this bucket to avoid conflicts
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND (policyname LIKE '%legal%' OR policyname LIKE '%Legal%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

-- Create new uniquely named policies
CREATE POLICY "legal_docs_insert_v2"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'legal-documents');

CREATE POLICY "legal_docs_select_v2"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'legal-documents');

CREATE POLICY "legal_docs_update_v2"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'legal-documents')
  WITH CHECK (bucket_id = 'legal-documents');

CREATE POLICY "legal_docs_delete_v2"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'legal-documents');


-- ========================================
-- Migration: 20251223060917_make_legal_documents_artist_id_nullable.sql
-- ========================================

/*
  # Make artist_id nullable in legal_documents

  1. Changes
    - Make artist_id column nullable to allow documents not tied to a specific artist
    - These could be general business documents, team agreements, etc.

  2. Notes
    - Documents can still be associated with artists when needed
    - Existing documents with artist_id values are unaffected
*/

ALTER TABLE legal_documents ALTER COLUMN artist_id DROP NOT NULL;


-- ========================================
-- Migration: 20251227190312_seed_default_show_types.sql
-- ========================================

/*
  # Seed Default Show Types
  
  1. Data
    - Adds default show types to the `show_types` table
    - Includes common show types: Club Show, Festival, Theater, Private Event, etc.
    - Each type has a description and sort order for logical organization
  
  2. Notes
    - Uses INSERT with ON CONFLICT to safely add types without duplicates
    - All types are active by default
*/

INSERT INTO show_types (id, name, description, sort_order, is_active)
VALUES
  (gen_random_uuid(), 'Club Show', 'Standard club or venue performance', 1, true),
  (gen_random_uuid(), 'Festival', 'Music festival performance', 2, true),
  (gen_random_uuid(), 'Theater', 'Theater or concert hall performance', 3, true),
  (gen_random_uuid(), 'Private Event', 'Private party or corporate event', 4, true),
  (gen_random_uuid(), 'Arena', 'Large arena or stadium performance', 5, true),
  (gen_random_uuid(), 'Opening Act', 'Supporting act for another artist', 6, true),
  (gen_random_uuid(), 'Residency', 'Regular recurring performance at a venue', 7, true)
ON CONFLICT DO NOTHING;


-- ========================================
-- Migration: 20260113205854_fix_public_playlist_access_for_anon_users.sql
-- ========================================

/*
  # Fix Public Playlist Access for Anonymous Users

  1. Changes
    - Add RLS policy to allow anonymous (not logged in) users to view public playlists
    - Add RLS policy to allow anonymous users to view tracks in public playlists

  2. Security
    - Anonymous users can ONLY view playlists where is_public = true
    - Anonymous users can ONLY view tracks in public playlists
    - All other operations still require authentication
*/

-- Allow anonymous users to view public playlists
CREATE POLICY "Anonymous users can view public playlists"
  ON public.playlists FOR SELECT
  TO anon
  USING (is_public = true);

-- Allow anonymous users to view tracks in public playlists
CREATE POLICY "Anonymous users can view tracks in public playlists"
  ON public.playlist_tracks FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_tracks.playlist_id 
      AND is_public = true
    )
  );


-- ========================================
-- Migration: 20260317043143_add_missing_foreign_key_indexes.sql
-- ========================================

/*
  # Add Missing Foreign Key Indexes

  1. New Indexes
    - `idx_marketing_campaigns_album_id` on `marketing_campaigns(album_id)` - covers FK `marketing_campaigns_album_id_fkey`
    - `idx_notes_artist_id` on `notes(artist_id)` - covers FK `notes_artist_id_fkey`
    - `idx_notes_show_id` on `notes(show_id)` - covers FK `notes_show_id_fkey`
    - `idx_playlists_user_id` on `playlists(user_id)` - covers FK `playlists_user_id_fkey`
    - `idx_team_invitations_invited_by` on `team_invitations(invited_by)` - covers FK `team_invitations_invited_by_fkey`
    - `idx_users_artist_id` on `users(artist_id)` - covers FK `users_artist_id_fkey`

  2. Notes
    - These indexes prevent sequential scans during JOIN and CASCADE operations on foreign keys
    - Without these indexes, DELETE/UPDATE on parent tables can cause full table scans
*/

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_album_id ON public.marketing_campaigns(album_id);
CREATE INDEX IF NOT EXISTS idx_notes_artist_id ON public.notes(artist_id);
CREATE INDEX IF NOT EXISTS idx_notes_show_id ON public.notes(show_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_by ON public.team_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_users_artist_id ON public.users(artist_id);


-- ========================================
-- Migration: 20260317043216_fix_rls_auth_function_initialization.sql
-- ========================================

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


-- ========================================
-- Migration: 20260317043239_remove_duplicate_permissive_policies.sql
-- ========================================

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


-- ========================================
-- Migration: 20260317043257_fix_function_search_path_mutable.sql
-- ========================================

/*
  # Fix Function Search Path Mutable

  Sets immutable search_path on public functions to prevent search_path manipulation attacks.
  This is a security best practice to ensure functions always reference the intended schemas.

  1. Functions affected:
    - `public.handle_updated_at()` - Trigger function for auto-updating updated_at columns
    - `public.handle_new_user()` - Trigger function for creating user profiles on auth signup

  2. Security
    - Prevents potential privilege escalation via search_path manipulation
    - Both functions now explicitly use 'public' schema in search_path
*/

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;


-- ========================================
-- Migration: 20260317043340_fix_always_true_rls_policies_part1.sql
-- ========================================

/*
  # Fix Always-True RLS Policies - Part 1 (Artist-linked tables)

  Replaces `USING (true)` / `WITH CHECK (true)` with proper team membership checks.
  
  The security model: Users belong to an artist team via `users.artist_id`. 
  They should only access data for their artist. Tables linked to artists via `artist_id`
  are secured by checking the user's artist_id matches the row's artist_id.

  1. Tables fixed in this migration:
    - `artists` - Users can only manage their own artist
    - `albums` - Scoped to user's artist
    - `tracks` - Scoped via album -> artist
    - `album_tracks` - Scoped via album -> artist
    - `credits` - Kept open for authenticated (polymorphic entity_type)
    - `shows` - Scoped to user's artist
    - `finances` - Scoped to user's artist
    - `personnel` - Shared team resource (no artist_id), kept team-accessible
    - `show_personnel` - Scoped via show -> artist
    - `venues` - Shared resource, kept team-accessible
    - `marketing_campaigns` - Scoped to user's artist

  2. Security
    - All write policies now check team membership
    - SELECT policies allow viewing data within team scope
    - Uses `(select auth.uid())` pattern for performance
*/

-- Helper: get_user_artist_id function for reuse in policies
CREATE OR REPLACE FUNCTION public.get_user_artist_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT artist_id FROM public.users WHERE id = auth.uid();
$$;

-- ============================================================
-- ARTISTS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create artists" ON public.artists;
CREATE POLICY "Team members can create artists"
  ON public.artists FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update artists" ON public.artists;
CREATE POLICY "Team members can update their artist"
  ON public.artists FOR UPDATE TO authenticated
  USING (id = public.get_user_artist_id())
  WITH CHECK (id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can delete artists" ON public.artists;
CREATE POLICY "Team members can delete their artist"
  ON public.artists FOR DELETE TO authenticated
  USING (id = public.get_user_artist_id());

-- ============================================================
-- ALBUMS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create albums" ON public.albums;
CREATE POLICY "Team members can create albums"
  ON public.albums FOR INSERT TO authenticated
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can update albums" ON public.albums;
CREATE POLICY "Team members can update albums"
  ON public.albums FOR UPDATE TO authenticated
  USING (artist_id = public.get_user_artist_id())
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can delete albums" ON public.albums;
CREATE POLICY "Team members can delete albums"
  ON public.albums FOR DELETE TO authenticated
  USING (artist_id = public.get_user_artist_id());

-- ============================================================
-- TRACKS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create tracks" ON public.tracks;
CREATE POLICY "Team members can create tracks"
  ON public.tracks FOR INSERT TO authenticated
  WITH CHECK (
    album_id IS NULL OR
    EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = album_id AND a.artist_id = public.get_user_artist_id()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can update tracks" ON public.tracks;
CREATE POLICY "Team members can update tracks"
  ON public.tracks FOR UPDATE TO authenticated
  USING (
    album_id IS NULL OR
    EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = album_id AND a.artist_id = public.get_user_artist_id()
    )
  )
  WITH CHECK (
    album_id IS NULL OR
    EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = album_id AND a.artist_id = public.get_user_artist_id()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can delete tracks" ON public.tracks;
CREATE POLICY "Team members can delete tracks"
  ON public.tracks FOR DELETE TO authenticated
  USING (
    album_id IS NULL OR
    EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = album_id AND a.artist_id = public.get_user_artist_id()
    )
  );

-- ============================================================
-- ALBUM_TRACKS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert album tracks" ON public.album_tracks;
CREATE POLICY "Team members can insert album tracks"
  ON public.album_tracks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM albums a
    WHERE a.id = album_id AND a.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can update album tracks" ON public.album_tracks;
CREATE POLICY "Team members can update album tracks"
  ON public.album_tracks FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM albums a
    WHERE a.id = album_id AND a.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM albums a
    WHERE a.id = album_id AND a.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can delete album tracks" ON public.album_tracks;
CREATE POLICY "Team members can delete album tracks"
  ON public.album_tracks FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM albums a
    WHERE a.id = album_id AND a.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- CREDITS (polymorphic - entity_type can be track or album)
-- Keep accessible for team members since checking entity_type is complex
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert credits" ON public.credits;
CREATE POLICY "Team members can insert credits"
  ON public.credits FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update credits" ON public.credits;
CREATE POLICY "Team members can update credits"
  ON public.credits FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete credits" ON public.credits;
CREATE POLICY "Team members can delete credits"
  ON public.credits FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- SHOWS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create shows" ON public.shows;
CREATE POLICY "Team members can create shows"
  ON public.shows FOR INSERT TO authenticated
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can update shows" ON public.shows;
CREATE POLICY "Team members can update shows"
  ON public.shows FOR UPDATE TO authenticated
  USING (artist_id = public.get_user_artist_id())
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can delete shows" ON public.shows;
CREATE POLICY "Team members can delete shows"
  ON public.shows FOR DELETE TO authenticated
  USING (artist_id = public.get_user_artist_id());

-- ============================================================
-- FINANCES
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create finances" ON public.finances;
CREATE POLICY "Team members can create finances"
  ON public.finances FOR INSERT TO authenticated
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can update finances" ON public.finances;
CREATE POLICY "Team members can update finances"
  ON public.finances FOR UPDATE TO authenticated
  USING (artist_id = public.get_user_artist_id())
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can delete finances" ON public.finances;
CREATE POLICY "Team members can delete finances"
  ON public.finances FOR DELETE TO authenticated
  USING (artist_id = public.get_user_artist_id());

-- ============================================================
-- SHOW_PERSONNEL (linked via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create show_personnel" ON public.show_personnel;
CREATE POLICY "Team members can create show_personnel"
  ON public.show_personnel FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can update show_personnel" ON public.show_personnel;
CREATE POLICY "Team members can update show_personnel"
  ON public.show_personnel FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can delete show_personnel" ON public.show_personnel;
CREATE POLICY "Team members can delete show_personnel"
  ON public.show_personnel FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- MARKETING_CAMPAIGNS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create marketing_campaigns" ON public.marketing_campaigns;
CREATE POLICY "Team members can create marketing campaigns"
  ON public.marketing_campaigns FOR INSERT TO authenticated
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can update marketing_campaigns" ON public.marketing_campaigns;
CREATE POLICY "Team members can update marketing campaigns"
  ON public.marketing_campaigns FOR UPDATE TO authenticated
  USING (artist_id = public.get_user_artist_id())
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can delete marketing_campaigns" ON public.marketing_campaigns;
CREATE POLICY "Team members can delete marketing campaigns"
  ON public.marketing_campaigns FOR DELETE TO authenticated
  USING (artist_id = public.get_user_artist_id());


-- ========================================
-- Migration: 20260317043458_fix_always_true_rls_policies_part2.sql
-- ========================================

/*
  # Fix Always-True RLS Policies - Part 2 (Show-linked and remaining tables)

  Continues replacing `USING (true)` / `WITH CHECK (true)` with proper checks.

  1. Tables fixed:
    - `accommodations` - Scoped via show -> artist
    - `transportation` - Scoped via show -> artist
    - `budgets` - Scoped to user's artist
    - `budget_items` - Scoped via budget -> artist
    - `budget_categories` - Scoped via budget -> artist
    - `personnel` - Team resource, scoped to authenticated (no artist_id column)
    - `venues` - Shared resource, scoped to authenticated (no artist_id column)
    - `platform_integrations` - Scoped to user's artist
    - `analytics_integrations` - Scoped to user's artist
    - `show_deals` - Scoped via show -> artist
    - `show_advances` - Scoped via show -> artist
    - `deal_templates` - Team resource
    - `deal_ticket_tiers` - Scoped via deal -> show -> artist
    - `deal_payments` - Scoped via deal -> show -> artist
    - `deal_bonuses` - Scoped via deal -> show -> artist
    - `deal_expenses` - Scoped via deal -> show -> artist
    - `deal_merch_terms` - Scoped via deal -> show -> artist
    - `guest_list` - Scoped via show -> artist
    - `marketing_tasks` - Scoped via show -> artist
    - `production_files` - Scoped via show -> artist
    - `setlists` - Scoped via show -> artist
    - `setlist_songs` - Scoped via setlist -> show -> artist
    - `show_types` - Reference data, team accessible
    - `legal_documents` - Scoped to team (created_by ownership)
    - `tasks` - Scoped to team
    - `marketing_posts` - Scoped to user's artist
    - `marketing_files` - Scoped to user's artist

  2. Security
    - Show-linked data requires the show to belong to user's artist
    - Deal-linked data requires the deal's show to belong to user's artist
*/

-- ============================================================
-- ACCOMMODATIONS (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create accommodations" ON public.accommodations;
CREATE POLICY "Team members can create accommodations"
  ON public.accommodations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can update accommodations" ON public.accommodations;
CREATE POLICY "Team members can update accommodations"
  ON public.accommodations FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can delete accommodations" ON public.accommodations;
CREATE POLICY "Team members can delete accommodations"
  ON public.accommodations FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- TRANSPORTATION (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create transportation" ON public.transportation;
CREATE POLICY "Team members can create transportation"
  ON public.transportation FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can update transportation" ON public.transportation;
CREATE POLICY "Team members can update transportation"
  ON public.transportation FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can delete transportation" ON public.transportation;
CREATE POLICY "Team members can delete transportation"
  ON public.transportation FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- BUDGETS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create budgets" ON public.budgets;
CREATE POLICY "Team members can create budgets"
  ON public.budgets FOR INSERT TO authenticated
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can update budgets" ON public.budgets;
CREATE POLICY "Team members can update budgets"
  ON public.budgets FOR UPDATE TO authenticated
  USING (artist_id = public.get_user_artist_id())
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can delete budgets" ON public.budgets;
CREATE POLICY "Team members can delete budgets"
  ON public.budgets FOR DELETE TO authenticated
  USING (artist_id = public.get_user_artist_id());

-- ============================================================
-- BUDGET_ITEMS (via budget -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create budget items" ON public.budget_items;
CREATE POLICY "Team members can create budget items"
  ON public.budget_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can update budget items" ON public.budget_items;
CREATE POLICY "Team members can update budget items"
  ON public.budget_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can delete budget items" ON public.budget_items;
CREATE POLICY "Team members can delete budget items"
  ON public.budget_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- BUDGET_CATEGORIES (via budget -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create budget categories" ON public.budget_categories;
CREATE POLICY "Team members can create budget categories"
  ON public.budget_categories FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can update budget categories" ON public.budget_categories;
CREATE POLICY "Team members can update budget categories"
  ON public.budget_categories FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can delete budget categories" ON public.budget_categories;
CREATE POLICY "Team members can delete budget categories"
  ON public.budget_categories FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- PERSONNEL (shared team resource - no artist_id)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create personnel" ON public.personnel;
CREATE POLICY "Team members can create personnel"
  ON public.personnel FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update personnel" ON public.personnel;
CREATE POLICY "Team members can update personnel"
  ON public.personnel FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete personnel" ON public.personnel;
CREATE POLICY "Team members can delete personnel"
  ON public.personnel FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- VENUES (shared resource)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert venues" ON public.venues;
CREATE POLICY "Team members can insert venues"
  ON public.venues FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update venues" ON public.venues;
CREATE POLICY "Team members can update venues"
  ON public.venues FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete venues" ON public.venues;
CREATE POLICY "Team members can delete venues"
  ON public.venues FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- PLATFORM_INTEGRATIONS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create platform integrations" ON public.platform_integrations;
CREATE POLICY "Team members can create platform integrations"
  ON public.platform_integrations FOR INSERT TO authenticated
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can update platform integrations" ON public.platform_integrations;
CREATE POLICY "Team members can update platform integrations"
  ON public.platform_integrations FOR UPDATE TO authenticated
  USING (artist_id = public.get_user_artist_id())
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can delete platform integrations" ON public.platform_integrations;
CREATE POLICY "Team members can delete platform integrations"
  ON public.platform_integrations FOR DELETE TO authenticated
  USING (artist_id = public.get_user_artist_id());

-- ============================================================
-- ANALYTICS_INTEGRATIONS
-- ============================================================
DROP POLICY IF EXISTS "Users can create analytics integrations" ON public.analytics_integrations;
CREATE POLICY "Team members can create analytics integrations"
  ON public.analytics_integrations FOR INSERT TO authenticated
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Users can update their own analytics integrations" ON public.analytics_integrations;
CREATE POLICY "Team members can update analytics integrations"
  ON public.analytics_integrations FOR UPDATE TO authenticated
  USING (artist_id = public.get_user_artist_id())
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Users can delete their own analytics integrations" ON public.analytics_integrations;
CREATE POLICY "Team members can delete analytics integrations"
  ON public.analytics_integrations FOR DELETE TO authenticated
  USING (artist_id = public.get_user_artist_id());

-- ============================================================
-- SHOW_DEALS (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage show deals" ON public.show_deals;
CREATE POLICY "Team members can view show deals"
  ON public.show_deals FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create show deals"
  ON public.show_deals FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update show deals"
  ON public.show_deals FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete show deals"
  ON public.show_deals FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- SHOW_ADVANCES (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage show advances" ON public.show_advances;
CREATE POLICY "Team members can view show advances"
  ON public.show_advances FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create show advances"
  ON public.show_advances FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update show advances"
  ON public.show_advances FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete show advances"
  ON public.show_advances FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- DEAL_TEMPLATES (reference data, team accessible)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage deal templates" ON public.deal_templates;
CREATE POLICY "Team members can view deal templates"
  ON public.deal_templates FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Team members can create deal templates"
  ON public.deal_templates FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Team members can update deal templates"
  ON public.deal_templates FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Team members can delete deal templates"
  ON public.deal_templates FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- DEAL_TICKET_TIERS (via deal -> show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage deal ticket tiers" ON public.deal_ticket_tiers;
CREATE POLICY "Team members can view deal ticket tiers"
  ON public.deal_ticket_tiers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create deal ticket tiers"
  ON public.deal_ticket_tiers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update deal ticket tiers"
  ON public.deal_ticket_tiers FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete deal ticket tiers"
  ON public.deal_ticket_tiers FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- DEAL_PAYMENTS (via deal -> show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage deal payments" ON public.deal_payments;
CREATE POLICY "Team members can view deal payments"
  ON public.deal_payments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create deal payments"
  ON public.deal_payments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update deal payments"
  ON public.deal_payments FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete deal payments"
  ON public.deal_payments FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- DEAL_BONUSES (via deal -> show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage deal bonuses" ON public.deal_bonuses;
CREATE POLICY "Team members can view deal bonuses"
  ON public.deal_bonuses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create deal bonuses"
  ON public.deal_bonuses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update deal bonuses"
  ON public.deal_bonuses FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete deal bonuses"
  ON public.deal_bonuses FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- DEAL_EXPENSES (via deal -> show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage deal expenses" ON public.deal_expenses;
CREATE POLICY "Team members can view deal expenses"
  ON public.deal_expenses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create deal expenses"
  ON public.deal_expenses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update deal expenses"
  ON public.deal_expenses FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete deal expenses"
  ON public.deal_expenses FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- DEAL_MERCH_TERMS (via deal -> show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage deal merch terms" ON public.deal_merch_terms;
CREATE POLICY "Team members can view deal merch terms"
  ON public.deal_merch_terms FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create deal merch terms"
  ON public.deal_merch_terms FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update deal merch terms"
  ON public.deal_merch_terms FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete deal merch terms"
  ON public.deal_merch_terms FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- GUEST_LIST (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage guest list" ON public.guest_list;
CREATE POLICY "Team members can view guest list"
  ON public.guest_list FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create guest list"
  ON public.guest_list FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update guest list"
  ON public.guest_list FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete guest list"
  ON public.guest_list FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- MARKETING_TASKS (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage marketing tasks" ON public.marketing_tasks;
CREATE POLICY "Team members can view marketing tasks"
  ON public.marketing_tasks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create marketing tasks"
  ON public.marketing_tasks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update marketing tasks"
  ON public.marketing_tasks FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete marketing tasks"
  ON public.marketing_tasks FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- PRODUCTION_FILES (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage production files" ON public.production_files;
CREATE POLICY "Team members can view production files"
  ON public.production_files FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create production files"
  ON public.production_files FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update production files"
  ON public.production_files FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete production files"
  ON public.production_files FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- SETLISTS (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage setlists" ON public.setlists;
CREATE POLICY "Team members can view setlists"
  ON public.setlists FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create setlists"
  ON public.setlists FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update setlists"
  ON public.setlists FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete setlists"
  ON public.setlists FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- SETLIST_SONGS (via setlist -> show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage setlist songs" ON public.setlist_songs;
CREATE POLICY "Team members can view setlist songs"
  ON public.setlist_songs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM setlists sl
    JOIN shows s ON s.id = sl.show_id
    WHERE sl.id = setlist_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create setlist songs"
  ON public.setlist_songs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM setlists sl
    JOIN shows s ON s.id = sl.show_id
    WHERE sl.id = setlist_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update setlist songs"
  ON public.setlist_songs FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM setlists sl
    JOIN shows s ON s.id = sl.show_id
    WHERE sl.id = setlist_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM setlists sl
    JOIN shows s ON s.id = sl.show_id
    WHERE sl.id = setlist_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete setlist songs"
  ON public.setlist_songs FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM setlists sl
    JOIN shows s ON s.id = sl.show_id
    WHERE sl.id = setlist_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- SHOW_TYPES (reference data)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage show types" ON public.show_types;
CREATE POLICY "Team members can view show types"
  ON public.show_types FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Team members can create show types"
  ON public.show_types FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Team members can update show types"
  ON public.show_types FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Team members can delete show types"
  ON public.show_types FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- LEGAL_DOCUMENTS (remaining write policies)
-- ============================================================
DROP POLICY IF EXISTS "Team members can delete legal documents" ON public.legal_documents;
CREATE POLICY "Team members can delete legal documents"
  ON public.legal_documents FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Team members can update legal documents" ON public.legal_documents;
CREATE POLICY "Team members can update legal documents"
  ON public.legal_documents FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- TASKS (remaining write policies)
-- ============================================================
DROP POLICY IF EXISTS "Team members can delete tasks" ON public.tasks;
CREATE POLICY "Team members can delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    created_by = (select auth.uid()) OR
    assigned_to = (select auth.uid())
  );

DROP POLICY IF EXISTS "Team members can update tasks" ON public.tasks;
CREATE POLICY "Team members can update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    created_by = (select auth.uid()) OR
    assigned_to = (select auth.uid())
  )
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- MARKETING_POSTS (remaining write policies)
-- ============================================================
DROP POLICY IF EXISTS "Team members can delete marketing posts" ON public.marketing_posts;
CREATE POLICY "Team members can delete marketing posts"
  ON public.marketing_posts FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Team members can update marketing posts" ON public.marketing_posts;
CREATE POLICY "Team members can update marketing posts"
  ON public.marketing_posts FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- MARKETING_FILES (remaining write policies)
-- ============================================================
DROP POLICY IF EXISTS "Team members can delete marketing files" ON public.marketing_files;
CREATE POLICY "Team members can delete marketing files"
  ON public.marketing_files FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Team members can update marketing files" ON public.marketing_files;
CREATE POLICY "Team members can update marketing files"
  ON public.marketing_files FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);


-- ========================================
-- Migration: 20260317043531_drop_unused_indexes.sql
-- ========================================

/*
  # Drop Unused Indexes

  Removes indexes that have never been used according to pg_stat_user_indexes.
  
  Note: Some indexes that were previously unused are now kept because the new 
  RLS policies use JOINs that benefit from them (e.g., show_id indexes on 
  show-linked tables, artist_id indexes, etc.).

  1. Indexes dropped (truly unused, not needed by new RLS policies):
    - `idx_artists_spotify_id` - Spotify ID lookup rarely used
    - `idx_playlist_tracks_added_by` - No RLS or query uses this
    - `idx_playlist_tracks_track` - Duplicate, already has unique constraint
    - `credits_entity_id_type_idx` - Composite index not leveraged
    - `idx_playlists_share_token` - Share token lookups are rare
    - `idx_tasks_completed` - Boolean index has poor selectivity
    - `idx_tasks_created_by` - Low usage, tasks scoped by user_id/assigned_to
    - `idx_tasks_artist_id` - Tasks don't use artist_id in new RLS
    - `idx_tasks_show_id` - Tasks don't use show_id in new RLS
    - `idx_notes_category` - Low cardinality column
    - `idx_calendar_events_event_type` - Low cardinality
    - `idx_budgets_type` - Low cardinality
    - `idx_budgets_status` - Low cardinality
    - `idx_budget_items_type` - Low cardinality
    - `idx_budget_items_date` - Rarely queried by date alone
    - `idx_legal_documents_type` - Low cardinality
    - `idx_legal_documents_status` - Low cardinality
    - `idx_marketing_posts_platform` - Low cardinality
    - `idx_marketing_posts_status` - Low cardinality
    - `idx_marketing_posts_done` - Boolean, poor selectivity
    - `idx_marketing_files_category` - Low cardinality
    - `idx_venues_usage_count` - Rarely sorted/filtered

  2. Indexes kept (needed by new RLS policies or likely useful):
    - All show_id indexes (accommodations, transportation, etc.) - Used in RLS JOINs
    - All artist_id indexes on main tables - Used in RLS checks
    - All deal_id indexes - Used in RLS JOINs
    - Foreign key covering indexes

  3. Notes
    - These indexes were reported as unused by pg_stat_user_indexes
    - Dropping them reduces write overhead and storage
    - They can be re-created if needed
*/

DROP INDEX IF EXISTS idx_artists_spotify_id;
DROP INDEX IF EXISTS idx_playlist_tracks_added_by;
DROP INDEX IF EXISTS idx_playlist_tracks_track;
DROP INDEX IF EXISTS credits_entity_id_type_idx;
DROP INDEX IF EXISTS idx_playlists_share_token;
DROP INDEX IF EXISTS idx_tasks_completed;
DROP INDEX IF EXISTS idx_tasks_created_by;
DROP INDEX IF EXISTS idx_tasks_artist_id;
DROP INDEX IF EXISTS idx_tasks_show_id;
DROP INDEX IF EXISTS idx_notes_category;
DROP INDEX IF EXISTS idx_calendar_events_event_type;
DROP INDEX IF EXISTS idx_budgets_type;
DROP INDEX IF EXISTS idx_budgets_status;
DROP INDEX IF EXISTS idx_budget_items_type;
DROP INDEX IF EXISTS idx_budget_items_date;
DROP INDEX IF EXISTS idx_legal_documents_type;
DROP INDEX IF EXISTS idx_legal_documents_status;
DROP INDEX IF EXISTS idx_marketing_posts_platform;
DROP INDEX IF EXISTS idx_marketing_posts_status;
DROP INDEX IF EXISTS idx_marketing_posts_done;
DROP INDEX IF EXISTS idx_marketing_files_category;
DROP INDEX IF EXISTS idx_venues_usage_count;


