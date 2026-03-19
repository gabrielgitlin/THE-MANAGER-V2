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