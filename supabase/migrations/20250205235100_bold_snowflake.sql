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