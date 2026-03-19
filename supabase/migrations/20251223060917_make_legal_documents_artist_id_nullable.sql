/*
  # Make artist_id nullable in legal_documents

  1. Changes
    - Make artist_id column nullable to allow documents not tied to a specific artist
    - These could be general business documents, team agreements, etc.

  2. Notes
    - Documents can still be associated with artists when needed
    - Existing documents with artist_id values are unaffected
*/

ALTER TABLE legal_documents ALTER COLUMN artist_id DROP NOT NULL;
