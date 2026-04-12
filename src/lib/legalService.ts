import { supabase } from './supabase';
import type { AssetSourceType } from './assetSources';

export type DocumentType = 'contract' | 'license' | 'release' | 'agreement' | 'other';
export type DocumentStatus = 'Draft' | 'pending_review' | 'pending_signature' | 'active' | 'expired' | 'terminated';

export interface LegalDocument {
  id: string;
  artist_id: string;
  show_id?: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  file_url: string;
  file_name: string;
  file_size: number;
  source_type?: AssetSourceType;
  parties: string[];
  tags: string[];
  version: string;
  description: string;
  signed_date?: string;
  expiry_date?: string;
  ai_analysis?: {
    summary: string;
    keyTerms: string[];
    risks: string[];
    recommendations: string[];
  };
  notes: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/** External cloud-link attachment for a document (instead of a file upload). */
export interface LegalExternalLink {
  sourceType: AssetSourceType;
  url: string;
  name?: string;
}

export interface DocumentNote {
  id: string;
  document_id: string;
  content: string;
  author_id: string;
  created_at: string;
  author?: {
    email: string;
    full_name?: string;
  };
}

export interface CreateDocumentData {
  title: string;
  type: DocumentType;
  status?: DocumentStatus;
  parties?: string[];
  tags?: string[];
  version?: string;
  description?: string;
  signed_date?: string;
  expiry_date?: string;
  ai_analysis?: {
    summary: string;
    keyTerms: string[];
    risks: string[];
    recommendations: string[];
  };
  artist_id?: string;
  show_id?: string;
}

export interface UpdateDocumentData {
  title?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  parties?: string[];
  tags?: string[];
  version?: string;
  description?: string;
  signed_date?: string;
  expiry_date?: string;
  ai_analysis?: {
    summary: string;
    keyTerms: string[];
    risks: string[];
    recommendations: string[];
  };
}

export async function getDocuments(): Promise<LegalDocument[]> {
  const { data, error } = await supabase
    .from('legal_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }

  return (data || []).map(doc => ({
    ...doc,
    parties: doc.parties || [],
    tags: doc.tags || [],
  }));
}

export async function getDocument(id: string): Promise<LegalDocument | null> {
  const { data, error } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching document:', error);
    throw error;
  }

  if (!data) return null;

  return {
    ...data,
    parties: data.parties || [],
    tags: data.tags || [],
  };
}

export async function createDocument(
  documentData: CreateDocumentData,
  file?: File,
  externalLink?: LegalExternalLink
): Promise<LegalDocument> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  let fileUrl = '';
  let fileName = '';
  let fileSize = 0;
  let sourceType: AssetSourceType = 'upload';

  if (file) {
    const uploadResult = await uploadDocumentFile(file);
    fileUrl = uploadResult.url;
    fileName = file.name;
    fileSize = file.size;
    sourceType = 'upload';
  } else if (externalLink) {
    fileUrl = externalLink.url;
    fileName = externalLink.name || externalLink.url;
    fileSize = 0;
    sourceType = externalLink.sourceType;
  }

  const { data, error } = await supabase
    .from('legal_documents')
    .insert({
      ...documentData,
      artist_id: documentData.artist_id || null,
      // prod check constraint enforces lowercase values
      status: (documentData.status || 'Draft').toLowerCase(),
      parties: documentData.parties || [],
      tags: documentData.tags || [],
      version: documentData.version || '1.0',
      description: documentData.description || '',
      // prod schema has effective_date NOT NULL with no default — default to signed_date or now()
      effective_date: (documentData as any).effective_date || documentData.signed_date || new Date().toISOString(),
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      source_type: sourceType,
      user_id: userId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating document:', error);
    throw error;
  }

  return {
    ...data,
    parties: data.parties || [],
    tags: data.tags || [],
  };
}

export async function updateDocument(id: string, updates: UpdateDocumentData, file?: File): Promise<LegalDocument> {
  const updateData: Record<string, unknown> = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (file) {
    const uploadResult = await uploadDocumentFile(file);
    updateData.file_url = uploadResult.url;
    updateData.file_name = file.name;
    updateData.file_size = file.size;
  }

  const { data, error } = await supabase
    .from('legal_documents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating document:', error);
    throw error;
  }

  return {
    ...data,
    parties: data.parties || [],
    tags: data.tags || [],
  };
}

export async function deleteDocument(id: string): Promise<void> {
  const document = await getDocument(id);

  // Only try to remove the blob when it's an uploaded file — external links stay
  // in the cloud provider, we just drop our reference row.
  if (document?.file_url && (!document.source_type || document.source_type === 'upload')) {
    const path = document.file_url.split('/').pop();
    if (path) {
      await supabase.storage.from('legal-documents').remove([path]);
    }
  }

  const { error } = await supabase
    .from('legal_documents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

export async function uploadDocumentFile(file: File): Promise<{ url: string; path: string }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('legal-documents')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from('legal-documents')
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

export async function downloadDocumentFile(fileUrl: string): Promise<Blob> {
  const path = fileUrl.split('/').pop();
  if (!path) {
    throw new Error('Invalid file URL');
  }

  const { data, error } = await supabase.storage
    .from('legal-documents')
    .download(path);

  if (error) {
    console.error('Error downloading file:', error);
    throw error;
  }

  return data;
}

export async function getDocumentNotes(documentId: string): Promise<DocumentNote[]> {
  const { data, error } = await supabase
    .from('legal_document_notes')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching document notes:', error);
    throw error;
  }

  return data || [];
}

export async function addDocumentNote(documentId: string, content: string): Promise<DocumentNote> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('legal_document_notes')
    .insert({
      document_id: documentId,
      content,
      author_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding document note:', error);
    throw error;
  }

  return data;
}

export async function deleteDocumentNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('legal_document_notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting document note:', error);
    throw error;
  }
}

export async function getSigningStatusForDocuments(documentIds: string[]): Promise<Record<string, {
  status: string;
  signed_count: number;
  total_count: number;
  signing_request_id: string;
}>> {
  if (documentIds.length === 0) return {};

  const { data, error } = await supabase
    .from('signing_requests')
    .select('id, document_id, status, signing_recipients(id, status)')
    .in('document_id', documentIds)
    .order('created_at', { ascending: false });

  if (error || !data) return {};

  const result: Record<string, any> = {};
  for (const req of data) {
    // Only keep the latest signing request per document
    if (result[req.document_id]) continue;
    const recipients = (req as any).signing_recipients || [];
    result[req.document_id] = {
      status: req.status,
      signed_count: recipients.filter((r: any) => r.status === 'signed').length,
      total_count: recipients.length,
      signing_request_id: req.id,
    };
  }
  return result;
}
