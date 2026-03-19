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
