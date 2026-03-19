/*
  # Update Tracks Storage Bucket MIME Types

  1. Changes
    - Remove MIME type restrictions from tracks bucket to allow all file types
    - This prevents issues with file type detection

  2. Note
    - Keeping file size limit for safety (100MB)
*/

-- Update the tracks bucket to remove mime type restrictions
UPDATE storage.buckets
SET 
  allowed_mime_types = NULL,
  file_size_limit = 104857600
WHERE id = 'tracks';
