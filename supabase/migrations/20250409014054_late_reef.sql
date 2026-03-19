/*
  # Add Contract Analysis Support
  
  1. New Tables
    - `legal_documents` (if it doesn't exist)
      - Basic document information
      - Storage for legal contracts and agreements
    - `contract_analyses`
      - Stores AI-generated contract analyses
      - Links to legal documents
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create legal_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text CHECK (type IN ('contract', 'license', 'release', 'agreement', 'other')),
  status text CHECK (status IN ('draft', 'pending_review', 'pending_signature', 'active', 'expired', 'terminated')),
  parties text[] NOT NULL,
  effective_date timestamptz NOT NULL,
  expiration_date timestamptz,
  description text,
  file_name text NOT NULL,
  last_modified timestamptz DEFAULT now(),
  tags text[],
  version text,
  signed_by text[],
  pending_signatures text[],
  ai_analysis jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for legal_documents
CREATE POLICY "Users can view their own legal documents"
  ON public.legal_documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own legal documents"
  ON public.legal_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own legal documents"
  ON public.legal_documents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Contract analyses table
CREATE TABLE IF NOT EXISTS public.contract_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL,
  key_terms jsonb NOT NULL,
  risks jsonb NOT NULL,
  recommendations jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.contract_analyses ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX contract_analyses_document_id_idx ON public.contract_analyses(document_id);
CREATE INDEX contract_analyses_user_id_idx ON public.contract_analyses(user_id);

-- RLS Policies
CREATE POLICY "Users can view their own contract analyses"
  ON public.contract_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contract analyses"
  ON public.contract_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contract analyses"
  ON public.contract_analyses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER set_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_contract_analyses_updated_at
  BEFORE UPDATE ON public.contract_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();