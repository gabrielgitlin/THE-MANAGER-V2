import { supabase } from './supabase';
import type { AssetSourceType, AssetSubmission } from './assetSources';

export type AssetCategory = 'artwork' | 'audio' | 'video' | 'document' | 'other';
export type EntityType = 'album' | 'track';

export interface DigitalAsset {
  id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id: string;
  name: string;
  category: AssetCategory;
  source_type: AssetSourceType;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const BUCKET = 'digital-assets';

function categoryFromMime(mime?: string): AssetCategory {
  if (!mime) return 'other';
  if (mime.startsWith('image/')) return 'artwork';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('application/') || mime.startsWith('text/')) return 'document';
  return 'other';
}

export async function listAssets(
  entityType: EntityType,
  entityId: string
): Promise<DigitalAsset[]> {
  const { data, error } = await supabase
    .from('digital_assets')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing digital assets:', error);
    throw error;
  }
  return (data || []) as DigitalAsset[];
}

export async function createAsset(
  entityType: EntityType,
  entityId: string,
  submission: AssetSubmission,
  categoryOverride?: AssetCategory
): Promise<DigitalAsset> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Not authenticated');

  let fileUrl: string | null = null;
  let fileSize: number | null = null;
  let mimeType: string | null = null;

  if (submission.sourceType === 'upload') {
    if (!submission.file) throw new Error('File is required for upload');
    const file = submission.file;
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${userId}/${entityType}/${entityId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (uploadError) {
      console.error('Asset upload failed:', uploadError);
      throw uploadError;
    }
    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);
    fileUrl = publicUrl.publicUrl;
    fileSize = file.size;
    mimeType = file.type || null;
  } else {
    if (!submission.url) throw new Error('URL is required for external links');
    fileUrl = submission.url;
    mimeType = null;
    fileSize = null;
  }

  const category =
    categoryOverride ||
    (submission.sourceType === 'upload' ? categoryFromMime(mimeType || undefined) : 'document');

  const { data, error } = await supabase
    .from('digital_assets')
    .insert({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      name: submission.name,
      category,
      source_type: submission.sourceType,
      file_url: fileUrl,
      file_size: fileSize,
      mime_type: mimeType,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error inserting digital asset:', error);
    throw error;
  }
  return data as DigitalAsset;
}

export async function deleteAsset(asset: DigitalAsset): Promise<void> {
  // If it's an uploaded file, try to remove the blob too. External links: just drop the row.
  if (asset.source_type === 'upload' && asset.file_url) {
    try {
      const marker = `/storage/v1/object/public/${BUCKET}/`;
      const idx = asset.file_url.indexOf(marker);
      if (idx !== -1) {
        const path = asset.file_url.slice(idx + marker.length);
        await supabase.storage.from(BUCKET).remove([path]);
      }
    } catch (err) {
      // Non-fatal — if the blob is already gone the row delete still succeeds.
      console.warn('Could not remove blob for asset:', asset.id, err);
    }
  }

  const { error } = await supabase.from('digital_assets').delete().eq('id', asset.id);
  if (error) {
    console.error('Error deleting digital asset:', error);
    throw error;
  }
}
