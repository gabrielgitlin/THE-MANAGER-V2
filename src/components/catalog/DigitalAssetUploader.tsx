import React, { useEffect, useState } from 'react';
import { Image, Music, Video, Plus, Eye, Link2 } from 'lucide-react';
import AssetInput from '../assets/AssetInput';
import AssetPreviewModal, { type AssetPreviewTarget } from '../assets/AssetPreviewModal';
import {
  listAssets,
  createAsset,
  deleteAsset,
  type DigitalAsset,
  type AssetCategory,
  type EntityType,
} from '../../lib/digitalAssetService';
import { getSourceLabel, type AssetSourceType } from '../../lib/assetSources';

// Re-exported for callers that imported these from the old module.
export type { AssetCategory } from '../../lib/digitalAssetService';

interface DigitalAssetUploaderProps {
  entityId: string;
  entityType: EntityType;
}

const CATEGORY_FILTERS: Array<{ key: AssetCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'artwork', label: 'Artwork' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
  { key: 'document', label: 'Documents' },
  { key: 'other', label: 'Other' },
];

function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function CategoryIcon({ category }: { category: AssetCategory }) {
  switch (category) {
    case 'artwork': return <Image className="w-5 h-5" style={{ color: '#3b82f6' }} />;
    case 'audio':   return <Music className="w-5 h-5" style={{ color: '#22c55e' }} />;
    case 'video':   return <Video className="w-5 h-5" style={{ color: '#8b5cf6' }} />;
    case 'document':return <img src="/TM-File-negro.svg" className="pxi-lg icon-muted" alt="" />;
    default:        return <img src="/TM-File-negro.svg" className="pxi-lg icon-muted" alt="" />;
  }
}

function SourceBadge({ source }: { source: AssetSourceType }) {
  if (source === 'upload') return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 500,
        background: 'var(--surface-3)',
        color: 'var(--t2)',
        borderRadius: 0,
      }}
    >
      <Link2 size={11} />
      {getSourceLabel(source)}
    </span>
  );
}

export default function DigitalAssetUploader({ entityId, entityType }: DigitalAssetUploaderProps) {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'all'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<AssetPreviewTarget | null>(null);

  const openPreview = (asset: DigitalAsset) => {
    if (!asset.file_url) return;
    setPreviewTarget({
      name: asset.name,
      fileUrl: asset.file_url,
      sourceType: asset.source_type,
      mimeType: asset.mime_type,
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await listAssets(entityType, entityId);
        if (!cancelled) setAssets(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load assets');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [entityType, entityId]);

  const handleCreate = async (submission: Parameters<typeof createAsset>[2]) => {
    setError(null);
    const newAsset = await createAsset(entityType, entityId, submission);
    setAssets((prev) => [newAsset, ...prev]);
    setShowUploadForm(false);
  };

  const handleDelete = async (asset: DigitalAsset) => {
    setError(null);
    try {
      await deleteAsset(asset);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      setShowDeleteConfirm(null);
    } catch (err: any) {
      setError(err?.message || 'Delete failed');
    }
  };

  const filtered = assets.filter(
    (a) => activeCategory === 'all' || a.category === activeCategory
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 500, color: 'var(--t1)' }}>Digital Assets</h2>
          <span style={{ fontSize: 14, color: 'var(--t2)' }}>({assets.length})</span>
        </div>
        <button
          onClick={() => setShowUploadForm((s) => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', fontSize: 14, fontWeight: 500,
            color: 'white', background: 'var(--brand-1)',
            border: 'none', cursor: 'pointer',
          }}
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      {showUploadForm && (
        <AssetInput
          onSubmit={handleCreate}
          submitLabel="Add Asset"
        />
      )}

      {error && (
        <div style={{ color: '#f87171', fontSize: 13 }}>Error: {error}</div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveCategory(f.key)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 500,
              border: 'none',
              background: activeCategory === f.key ? 'var(--brand-1)' : 'var(--surface-3)',
              color: activeCategory === f.key ? 'white' : 'var(--t1)',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
          Loading assets…
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((asset) => (
            <div
              key={asset.id}
              style={{
                background: 'var(--surface)',
                padding: 16,
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div
                  onClick={() => openPreview(asset)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, cursor: asset.file_url ? 'pointer' : 'default' }}
                >
                  <div style={{ padding: 8, background: 'var(--surface-3)' }}>
                    <CategoryIcon category={asset.category} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: 'var(--t1)',
                          margin: 0,
                          textDecoration: 'underline',
                          textUnderlineOffset: 3,
                          textDecorationColor: 'var(--border)',
                        }}
                      >
                        {asset.name}
                      </h3>
                      <SourceBadge source={asset.source_type} />
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--t2)', margin: '4px 0 0' }}>
                      {asset.source_type === 'upload'
                        ? `${formatFileSize(asset.file_size)} • Uploaded ${new Date(asset.created_at).toLocaleDateString()}`
                        : `${getSourceLabel(asset.source_type)} • Added ${new Date(asset.created_at).toLocaleDateString()}`}
                    </p>
                    {asset.description && (
                      <p style={{ marginTop: 4, fontSize: 14, color: 'var(--t2)' }}>{asset.description}</p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {asset.file_url && (
                    <button
                      type="button"
                      onClick={() => openPreview(asset)}
                      title="Preview"
                      style={{ padding: 4, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {showDeleteConfirm === asset.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={() => handleDelete(asset)}
                        style={{ padding: '4px 8px', fontSize: 12, color: 'white', background: '#dc2626', border: 'none', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        style={{ padding: '4px 8px', fontSize: 12, color: 'var(--t1)', background: 'var(--surface-3)', border: 'none', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(asset.id)}
                      style={{ padding: 4, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            background: 'var(--surface)',
            padding: 32,
            textAlign: 'center',
            border: '1px solid var(--border)',
          }}
        >
          <img src="/TM-File-negro.svg" className="pxi-xl icon-muted" alt="" style={{ margin: '0 auto' }} />
          <h3 style={{ marginTop: 8, fontSize: 14, fontWeight: 500, color: 'var(--t1)' }}>No assets found</h3>
          <p style={{ marginTop: 4, fontSize: 14, color: 'var(--t2)' }}>
            {assets.length > 0
              ? 'Try selecting a different category filter'
              : 'Upload a file or paste a cloud link to get started'}
          </p>
          {assets.length === 0 && !showUploadForm && (
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => setShowUploadForm(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'white',
                  background: 'var(--brand-1)',
                  cursor: 'pointer',
                }}
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Asset
              </button>
            </div>
          )}
        </div>
      )}

      <AssetPreviewModal asset={previewTarget} onClose={() => setPreviewTarget(null)} />
    </div>
  );
}
