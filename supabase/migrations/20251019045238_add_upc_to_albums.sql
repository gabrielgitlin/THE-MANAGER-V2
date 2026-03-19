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
