import { supabase } from './supabase';
import type { AssetSourceType } from './assetSources';

export type FileCategory = 'press_kit' | 'brand_assets' | 'campaign' | 'analytics' | 'other';

export interface MarketingFile {
  id: string;
  artist_id?: string;
  name: string;
  type: string;
  size: number;
  category: FileCategory;
  description: string;
  file_url: string;
  source_type?: AssetSourceType;
  shared: boolean;
  shared_with: string[];
  uploaded_by?: string;
  created_at: string;
}

export interface MarketingExternalLink {
  sourceType: AssetSourceType;
  url: string;
  name?: string;
}

export interface CreateFileData {
  name: string;
  category: FileCategory;
  description?: string;
  shared?: boolean;
  shared_with?: string[];
  artist_id?: string;
}

export interface UpdateFileData {
  name?: string;
  category?: FileCategory;
  description?: string;
  shared?: boolean;
  shared_with?: string[];
}

export async function getFiles(): Promise<MarketingFile[]> {
  const { data, error } = await supabase
    .from('marketing_files')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching files:', error);
    throw error;
  }

  return (data || []).map(file => ({
    ...file,
    shared_with: file.shared_with || [],
  }));
}

export async function getFile(id: string): Promise<MarketingFile | null> {
  const { data, error } = await supabase
    .from('marketing_files')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching file:', error);
    throw error;
  }

  if (!data) return null;

  return {
    ...data,
    shared_with: data.shared_with || [],
  };
}

export async function uploadFile(file: File, fileData: CreateFileData): Promise<MarketingFile> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('marketing-assets')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from('marketing-assets')
    .getPublicUrl(uploadData.path);

  const { data, error } = await supabase
    .from('marketing_files')
    .insert({
      name: fileData.name || file.name,
      type: file.type,
      size: file.size,
      category: fileData.category || 'other',
      description: fileData.description || '',
      file_url: urlData.publicUrl,
      source_type: 'upload',
      shared: fileData.shared || false,
      shared_with: fileData.shared_with || [],
      uploaded_by: userId,
      artist_id: fileData.artist_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating file record:', error);
    await supabase.storage.from('marketing-assets').remove([uploadData.path]);
    throw error;
  }

  return {
    ...data,
    shared_with: data.shared_with || [],
  };
}

/** Store an external cloud-link reference (Google Drive, Dropbox, etc.) as a marketing file. */
export async function createExternalLinkFile(
  link: MarketingExternalLink,
  fileData: CreateFileData
): Promise<MarketingFile> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('marketing_files')
    .insert({
      name: fileData.name || link.name || link.url,
      type: 'link',
      size: 0,
      category: fileData.category || 'other',
      description: fileData.description || '',
      file_url: link.url,
      source_type: link.sourceType,
      shared: fileData.shared || false,
      shared_with: fileData.shared_with || [],
      uploaded_by: userId,
      artist_id: fileData.artist_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating marketing link record:', error);
    throw error;
  }
  return {
    ...data,
    shared_with: data.shared_with || [],
  };
}

export async function updateFile(id: string, updates: UpdateFileData): Promise<MarketingFile> {
  const { data, error } = await supabase
    .from('marketing_files')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating file:', error);
    throw error;
  }

  return {
    ...data,
    shared_with: data.shared_with || [],
  };
}

export async function deleteFile(id: string): Promise<void> {
  const file = await getFile(id);

  // Only remove the underlying blob for uploads — external links just drop the row.
  if (file?.file_url && (!file.source_type || file.source_type === 'upload')) {
    const path = file.file_url.split('/').pop();
    if (path) {
      await supabase.storage.from('marketing-assets').remove([path]);
    }
  }

  const { error } = await supabase
    .from('marketing_files')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export async function downloadFile(fileUrl: string): Promise<Blob> {
  const path = fileUrl.split('/').pop();
  if (!path) {
    throw new Error('Invalid file URL');
  }

  const { data, error } = await supabase.storage
    .from('marketing-assets')
    .download(path);

  if (error) {
    console.error('Error downloading file:', error);
    throw error;
  }

  return data;
}

export async function getFilesByCategory(category: FileCategory): Promise<MarketingFile[]> {
  const { data, error } = await supabase
    .from('marketing_files')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching files by category:', error);
    throw error;
  }

  return (data || []).map(file => ({
    ...file,
    shared_with: file.shared_with || [],
  }));
}

export async function shareFile(id: string, sharedWith: string[]): Promise<MarketingFile> {
  return updateFile(id, {
    shared: sharedWith.length > 0,
    shared_with: sharedWith,
  });
}
