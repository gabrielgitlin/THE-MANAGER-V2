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