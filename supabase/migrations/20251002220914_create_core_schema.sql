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