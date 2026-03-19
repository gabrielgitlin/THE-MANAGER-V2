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