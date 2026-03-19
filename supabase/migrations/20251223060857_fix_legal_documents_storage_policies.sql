/*
  # Fix Legal Documents Storage Policies

  1. Changes
    - Drop conflicting storage policies
    - Create new uniquely named storage policies for legal-documents bucket
    - Ensure bucket exists with proper settings

  2. Security
    - All authenticated users can upload, view, update, and delete files in legal-documents bucket
*/

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-documents',
  'legal-documents',
  false,
  52428800,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];

-- Drop all existing policies for this bucket to avoid conflicts
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND (policyname LIKE '%legal%' OR policyname LIKE '%Legal%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

-- Create new uniquely named policies
CREATE POLICY "legal_docs_insert_v2"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'legal-documents');

CREATE POLICY "legal_docs_select_v2"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'legal-documents');

CREATE POLICY "legal_docs_update_v2"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'legal-documents')
  WITH CHECK (bucket_id = 'legal-documents');

CREATE POLICY "legal_docs_delete_v2"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'legal-documents');
