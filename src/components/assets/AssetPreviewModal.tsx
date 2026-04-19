import React from 'react';
import {
  describePreview,
  getSourceLabel,
  type AssetSourceType,
} from '../../lib/assetSources';

export interface AssetPreviewTarget {
  name: string;
  fileUrl: string;
  sourceType: AssetSourceType;
  mimeType?: string | null;
}

interface AssetPreviewModalProps {
  asset: AssetPreviewTarget | null;
  onClose: () => void;
}

/**
 * Best-effort inline preview for any asset stored in The Manager.
 * - Uploaded image/audio/video/PDF → native player or <img>/<iframe>
 * - Google Drive / SharePoint / OneDrive → provider /preview iframe
 * - Dropbox / generic URL → link-out card (these block iframe embedding)
 */
export default function AssetPreviewModal({ asset, onClose }: AssetPreviewModalProps) {
  if (!asset) return null;

  const preview = describePreview({
    sourceType: asset.sourceType,
    fileUrl: asset.fileUrl,
    mimeType: asset.mimeType,
  });

  const providerLabel = getSourceLabel(asset.sourceType);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
      />
      <div
        style={{
          position: 'relative',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          maxWidth: preview.mode === 'external' || preview.mode === 'audio' ? 560 : 960,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--t1)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: 0,
              }}
              title={asset.name}
            >
              {asset.name}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--t3)', margin: '2px 0 0' }}>
              {providerLabel}
            </p>
          </div>
          <a
            href={preview.openUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              fontSize: 12,
              color: 'var(--t2)',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              textDecoration: 'none',
            }}
            title="Open in a new tab"
          >
            <img src="/TM-ExternalLink-negro.svg" className="pxi-sm icon-muted" alt="" />
            Open
          </a>
          {asset.sourceType === 'upload' && (
            <a
              href={preview.openUrl}
              download={asset.name}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                fontSize: 12,
                color: 'var(--t2)',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                textDecoration: 'none',
              }}
              title="Download"
            >
              <img src="/TM-Download-negro.svg" className="pxi-sm icon-muted" alt="" />
              Download
            </a>
          )}
          <button
            onClick={onClose}
            aria-label="Close preview"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--t3)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <img src="/TM-Close-negro.svg" className="pxi-md icon-muted" alt="" />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: preview.mode === 'image' ? 'var(--surface-2)' : 'var(--surface)',
            padding: preview.mode === 'external' ? 32 : 0,
          }}
        >
          {preview.mode === 'image' && (
            <img
              src={preview.previewUrl}
              alt={asset.name}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          )}

          {preview.mode === 'audio' && (
            <div style={{ padding: 24, width: '100%' }}>
              <audio controls src={preview.previewUrl} style={{ width: '100%' }} />
            </div>
          )}

          {preview.mode === 'video' && (
            <video
              controls
              src={preview.previewUrl}
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
          )}

          {preview.mode === 'pdf' && (
            <iframe
              src={preview.previewUrl}
              title={asset.name}
              style={{ width: '100%', height: '80vh', border: 'none' }}
            />
          )}

          {preview.mode === 'iframe' && (
            <iframe
              src={preview.previewUrl}
              title={asset.name}
              style={{ width: '100%', height: '80vh', border: 'none' }}
              allow="autoplay; encrypted-media"
              referrerPolicy="no-referrer"
            />
          )}

          {preview.mode === 'external' && (
            <div style={{ textAlign: 'center', maxWidth: 420 }}>
              <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 16 }}>
                {preview.externalReason || 'This asset can\u2019t be previewed inside The Manager.'}
              </p>
              <a
                href={preview.openUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  fontSize: 14,
                  fontWeight: 500,
                  background: 'var(--brand-1)',
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                <img src="/TM-ExternalLink-negro.svg" className="pxi-sm icon-white" alt="" />
                Open in {providerLabel}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
