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
