/*
  # Enhance Legal Documents with File Storage Support

  1. Changes to `legal_documents` table
    - Add `file_name` (text) - original name of uploaded file
    - Add `file_size` (bigint) - file size in bytes
    - Add `parties` (jsonb) - array of party names involved in the document
    - Add `tags` (jsonb) - array of tags for categorization
    - Add `version` (text) - document version number
    - Add `ai_analysis` (jsonb) - AI analysis results
    - Add `description` (text) - document description
    - Add `created_by` (uuid) - who uploaded/created the document

  2. New table: `legal_document_notes`
    - Allows adding notes/comments to documents
    - Columns: id, document_id, content, author_id, created_at

  3. Storage bucket: legal-documents
    - For actual file uploads

  4. Security
    - RLS policies for team access
    - Storage policies for authenticated upload/download
*/

-- Add new columns to legal_documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN file_name text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN file_size bigint DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'parties'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN parties jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'tags'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN tags jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'version'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN version text DEFAULT '1.0';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'ai_analysis'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN ai_analysis jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'description'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE legal_documents ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create legal_document_notes table
CREATE TABLE IF NOT EXISTS legal_document_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on legal_document_notes
ALTER TABLE legal_document_notes ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_status ON legal_documents(status);
CREATE INDEX IF NOT EXISTS idx_legal_documents_created_by ON legal_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_legal_document_notes_document_id ON legal_document_notes(document_id);
CREATE INDEX IF NOT EXISTS idx_legal_document_notes_author_id ON legal_document_notes(author_id);

-- Drop existing RLS policies on legal_documents
DROP POLICY IF EXISTS "legal_documents_insert_policy" ON legal_documents;
DROP POLICY IF EXISTS "legal_documents_select_policy" ON legal_documents;
DROP POLICY IF EXISTS "legal_documents_update_policy" ON legal_documents;
DROP POLICY IF EXISTS "legal_documents_delete_policy" ON legal_documents;
DROP POLICY IF EXISTS "Users can view legal documents" ON legal_documents;
DROP POLICY IF EXISTS "Users can insert legal documents" ON legal_documents;
DROP POLICY IF EXISTS "Users can update legal documents" ON legal_documents;
DROP POLICY IF EXISTS "Users can delete legal documents" ON legal_documents;

-- Create team-wide RLS policies for legal_documents
CREATE POLICY "Team members can view all legal documents"
  ON legal_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can create legal documents"
  ON legal_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Team members can update legal documents"
  ON legal_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Team members can delete legal documents"
  ON legal_documents FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for legal_document_notes
CREATE POLICY "Team members can view all document notes"
  ON legal_document_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team members can create document notes"
  ON legal_document_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own document notes"
  ON legal_document_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own document notes"
  ON legal_document_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create storage bucket for legal documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-documents',
  'legal-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for legal-documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload legal documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view legal documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update legal documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete legal documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload legal documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'legal-documents');

CREATE POLICY "Authenticated users can view legal documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'legal-documents');

CREATE POLICY "Authenticated users can update legal documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'legal-documents')
  WITH CHECK (bucket_id = 'legal-documents');

CREATE POLICY "Authenticated users can delete legal documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'legal-documents');
