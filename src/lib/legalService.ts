import { supabase } from './supabase';

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

export async function createDocument(documentData: CreateDocumentData, file?: File): Promise<LegalDocument> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  let fileUrl = '';
  let fileName = '';
  let fileSize = 0;

  if (file) {
    const uploadResult = await uploadDocumentFile(file);
    fileUrl = uploadResult.url;
    fileName = file.name;
    fileSize = file.size;
  }

  const { data, error } = await supabase
    .from('legal_documents')
    .insert({
      ...documentData,
      artist_id: documentData.artist_id || null,
      status: documentData.status || 'Draft',
      parties: documentData.parties || [],
      tags: documentData.tags || [],
      version: documentData.version || '1.0',
      description: documentData.description || '',
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
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

  if (document?.file_url) {
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
