/*
  # Create Storage Bucket for Playlist Cover Art

  1. New Storage Bucket
    - `playlist-covers` bucket for storing playlist cover images
    - Public bucket to allow direct image access via URLs

  2. Security
    - Authenticated users can upload files
    - Authenticated users can update their own files
    - Authenticated users can delete their own files
    - Anyone can read files (public access for cover display)
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'playlist-covers',
  'playlist-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view playlist covers"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'playlist-covers');

CREATE POLICY "Authenticated users can upload playlist covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'playlist-covers');

CREATE POLICY "Authenticated users can update their playlist covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'playlist-covers');

CREATE POLICY "Authenticated users can delete their playlist covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'playlist-covers');