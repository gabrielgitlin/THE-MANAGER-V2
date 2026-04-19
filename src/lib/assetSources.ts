// Source-type model for assets attached across The Manager.
// 'upload' = file stored in our own Supabase Storage
// Everything else = external share link we just keep a reference to
export type AssetSourceType =
  | 'upload'
  | 'gdrive'
  | 'dropbox'
  | 'sharepoint'
  | 'onedrive'
  | 'url';

export interface AssetSubmission {
  name: string;
  sourceType: AssetSourceType;
  file?: File;
  url?: string;
  mimeType?: string;
  size?: number;
}

// Detect a cloud-storage provider from the URL the user pasted.
// We compare against the URL's hostname (not the whole string) so scheme and
// path don't confuse the match.
export function detectSourceFromUrl(raw: string): AssetSourceType {
  const trimmed = raw.trim();
  if (!trimmed) return 'url';

  let host = '';
  try {
    host = new URL(trimmed).hostname.toLowerCase();
  } catch {
    host = trimmed.toLowerCase();
  }

  if (host === 'drive.google.com' || host === 'docs.google.com') return 'gdrive';
  if (host.endsWith('dropbox.com') || host === 'db.tt') return 'dropbox';
  if (host.endsWith('sharepoint.com')) return 'sharepoint';
  if (host.endsWith('onedrive.live.com') || host === '1drv.ms') return 'onedrive';
  return 'url';
}

// Human label shown next to the asset in lists / detail views.
export function getSourceLabel(source: AssetSourceType): string {
  switch (source) {
    case 'upload': return 'File';
    case 'gdrive': return 'Google Drive';
    case 'dropbox': return 'Dropbox';
    case 'sharepoint': return 'SharePoint';
    case 'onedrive': return 'OneDrive';
    case 'url': return 'Link';
  }
}

// Action verb on the "open" button.
export function getOpenLabel(source: AssetSourceType): string {
  return source === 'upload' ? 'Download' : 'Open';
}

// Try to extract a reasonable display name from a cloud URL when the user
// hasn't typed one. Falls back to the hostname.
export function guessNameFromUrl(raw: string): string {
  try {
    const u = new URL(raw);
    // Google Docs: /document/d/{id}/edit → use the path segment before /edit
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && !/^(edit|view|preview)$/i.test(last) && last.length < 80) {
      return decodeURIComponent(last.replace(/[-_]/g, ' '));
    }
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'Link';
  }
}

// Loose URL sanity check used by forms before submit.
export function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Preview helpers
// ---------------------------------------------------------------------------

export type PreviewMode =
  | 'image'
  | 'audio'
  | 'video'
  | 'pdf'
  | 'iframe'
  | 'external'; // no embed — link out

export interface PreviewDescriptor {
  mode: PreviewMode;
  /** URL to put in src= for image/audio/video/pdf/iframe. */
  previewUrl: string;
  /** URL to open in a new tab when "Open externally" is clicked. */
  openUrl: string;
  /** Optional message to show when mode is 'external' explaining why. */
  externalReason?: string;
}

/**
 * Extract the canonical file/doc ID from a Google Drive URL.
 * Handles /file/d/{id}/..., /document/d/{id}/..., /spreadsheets/d/{id}/...,
 * /presentation/d/{id}/..., and ?id={id} query strings.
 */
function extractGoogleId(url: string): { id: string | null; kind: 'file' | 'document' | 'spreadsheet' | 'presentation' | 'folder' | null } {
  try {
    const u = new URL(url);
    const path = u.pathname;
    const idParam = u.searchParams.get('id');
    // /file/d/{id}/...
    let m = path.match(/\/file\/d\/([^/]+)/);
    if (m) return { id: m[1], kind: 'file' };
    m = path.match(/\/document\/d\/([^/]+)/);
    if (m) return { id: m[1], kind: 'document' };
    m = path.match(/\/spreadsheets\/d\/([^/]+)/);
    if (m) return { id: m[1], kind: 'spreadsheet' };
    m = path.match(/\/presentation\/d\/([^/]+)/);
    if (m) return { id: m[1], kind: 'presentation' };
    m = path.match(/\/drive\/folders\/([^/?]+)/);
    if (m) return { id: m[1], kind: 'folder' };
    if (idParam) return { id: idParam, kind: 'file' };
  } catch {
    // fall through
  }
  return { id: null, kind: null };
}

/**
 * Given an asset's {sourceType, fileUrl, mimeType?}, decide the best way to
 * preview it inside The Manager. Caller renders whatever mode this returns.
 */
export function describePreview(args: {
  sourceType: AssetSourceType;
  fileUrl: string;
  mimeType?: string | null;
}): PreviewDescriptor {
  const { sourceType, fileUrl, mimeType } = args;

  // --- Uploaded files: we control the storage URL, so inline by MIME ---
  if (sourceType === 'upload') {
    const mt = (mimeType || '').toLowerCase();
    if (mt.startsWith('image/')) return { mode: 'image', previewUrl: fileUrl, openUrl: fileUrl };
    if (mt.startsWith('audio/')) return { mode: 'audio', previewUrl: fileUrl, openUrl: fileUrl };
    if (mt.startsWith('video/')) return { mode: 'video', previewUrl: fileUrl, openUrl: fileUrl };
    if (mt === 'application/pdf') return { mode: 'pdf', previewUrl: fileUrl, openUrl: fileUrl };
    // Guess by extension as a last resort (our uploads sometimes have mime_type=null)
    const ext = fileUrl.split('?')[0].split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return { mode: 'image', previewUrl: fileUrl, openUrl: fileUrl };
    if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'].includes(ext)) return { mode: 'audio', previewUrl: fileUrl, openUrl: fileUrl };
    if (['mp4', 'webm', 'mov'].includes(ext)) return { mode: 'video', previewUrl: fileUrl, openUrl: fileUrl };
    if (ext === 'pdf') return { mode: 'pdf', previewUrl: fileUrl, openUrl: fileUrl };
    return {
      mode: 'external',
      previewUrl: fileUrl,
      openUrl: fileUrl,
      externalReason: 'This file type doesn\u2019t render inline. Download or open it to view the content.',
    };
  }

  // --- Google Drive: rewrite to /preview which is iframe-friendly ---
  if (sourceType === 'gdrive') {
    const { id, kind } = extractGoogleId(fileUrl);
    if (!id || kind === 'folder') {
      return {
        mode: 'external',
        previewUrl: fileUrl,
        openUrl: fileUrl,
        externalReason: 'Google Drive folders can\u2019t be previewed inline. Open in Drive to browse.',
      };
    }
    let previewUrl = fileUrl;
    if (kind === 'file') previewUrl = `https://drive.google.com/file/d/${id}/preview`;
    if (kind === 'document') previewUrl = `https://docs.google.com/document/d/${id}/preview`;
    if (kind === 'spreadsheet') previewUrl = `https://docs.google.com/spreadsheets/d/${id}/preview`;
    if (kind === 'presentation') previewUrl = `https://docs.google.com/presentation/d/${id}/preview`;
    return { mode: 'iframe', previewUrl, openUrl: fileUrl };
  }

  // --- SharePoint: try adding ?embed=1 / ?action=embedview ---
  if (sourceType === 'sharepoint') {
    try {
      const u = new URL(fileUrl);
      if (!u.searchParams.has('action')) u.searchParams.set('action', 'embedview');
      return { mode: 'iframe', previewUrl: u.toString(), openUrl: fileUrl };
    } catch {
      return { mode: 'iframe', previewUrl: fileUrl, openUrl: fileUrl };
    }
  }

  // --- OneDrive: embed URL ---
  if (sourceType === 'onedrive') {
    try {
      const u = new URL(fileUrl);
      if (!u.searchParams.has('embed')) u.searchParams.set('embed', '1');
      return { mode: 'iframe', previewUrl: u.toString(), openUrl: fileUrl };
    } catch {
      return { mode: 'iframe', previewUrl: fileUrl, openUrl: fileUrl };
    }
  }

  // --- Dropbox blocks iframe embedding site-wide. Link out. ---
  if (sourceType === 'dropbox') {
    return {
      mode: 'external',
      previewUrl: fileUrl,
      openUrl: fileUrl,
      externalReason: 'Dropbox doesn\u2019t allow inline previews. Open in Dropbox to view.',
    };
  }

  // --- Generic URL ---
  return {
    mode: 'external',
    previewUrl: fileUrl,
    openUrl: fileUrl,
    externalReason: 'External link \u2014 open to view.',
  };
}
