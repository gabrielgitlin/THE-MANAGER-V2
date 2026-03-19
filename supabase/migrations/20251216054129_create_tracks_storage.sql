/*
  # Create Storage Bucket for Track Files

  1. New Storage Bucket
    - `tracks` bucket for storing audio files and artwork
    - Public bucket to allow direct file access via URLs

  2. Security
    - Authenticated users can upload files
    - Authenticated users can update their own files
    - Authenticated users can delete their own files
    - Anyone can read files (public access for playback and display)
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tracks',
  'tracks',
  true,
  104857600,
  ARRAY['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3', 'audio/mp4', 'audio/aac', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view track files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'tracks');

CREATE POLICY "Authenticated users can upload track files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tracks');

CREATE POLICY "Authenticated users can update their track files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tracks');

CREATE POLICY "Authenticated users can delete their track files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tracks');
