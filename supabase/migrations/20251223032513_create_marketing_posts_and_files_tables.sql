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
