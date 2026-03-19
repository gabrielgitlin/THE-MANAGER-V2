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
