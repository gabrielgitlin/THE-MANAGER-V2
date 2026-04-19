import React, { useState, useRef, useEffect } from 'react';
import Modal from '../Modal';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface AudioVersion {
  url: string;
  filename: string;
  uploaded_at: string;
  is_active: boolean;
}

interface ReplaceAudioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
  audioUrl?: string;
  audioVersions?: AudioVersion[];
  onDone: () => void;
}

function extractFilename(url: string): string {
  try {
    const parts = url.split('/');
    const last = parts[parts.length - 1];
    // Strip timestamp prefix if present (e.g. "1234567890_myfile.wav" -> "myfile.wav")
    const match = last.match(/^\d+_(.+)$/);
    return match ? match[1] : last;
  } catch {
    return url;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export default function ReplaceAudioDialog({
  isOpen,
  onClose,
  trackId,
  trackTitle,
  audioUrl,
  audioVersions = [],
  onDone,
}: ReplaceAudioDialogProps) {
  const { user } = useAuthStore();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setDragging(false);
    }
  }, [isOpen]);

  const handleFile = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setError(null);
    try {
      const path = `audio/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('tracks')
        .upload(path, file, { cacheControl: '3600', upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('tracks').getPublicUrl(path);

      // Build updated versions list: mark all existing as inactive, archive current audio_url
      const prevVersions: AudioVersion[] = (audioVersions || []).map(v => ({ ...v, is_active: false }));
      if (audioUrl) {
        const alreadyArchived = prevVersions.some(v => v.url === audioUrl);
        if (!alreadyArchived) {
          prevVersions.push({
            url: audioUrl,
            filename: extractFilename(audioUrl),
            uploaded_at: new Date().toISOString(),
            is_active: false,
          });
        }
      }
      const newVersion: AudioVersion = {
        url: publicUrl,
        filename: extractFilename(publicUrl),
        uploaded_at: new Date().toISOString(),
        is_active: true,
      };

      const { error: updateErr } = await supabase
        .from('tracks')
        .update({
          audio_url: publicUrl,
          audio_versions: [...prevVersions, newVersion],
        })
        .eq('id', trackId);
      if (updateErr) throw updateErr;

      onDone();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRestore = async (version: AudioVersion) => {
    setRestoring(version.url);
    setError(null);
    try {
      // Archive current active url if different
      const updatedVersions: AudioVersion[] = (audioVersions || []).map(v => ({
        ...v,
        is_active: v.url === version.url,
      }));

      // If current audioUrl isn't in the list, add it as inactive
      if (audioUrl && !updatedVersions.some(v => v.url === audioUrl)) {
        updatedVersions.push({
          url: audioUrl,
          filename: extractFilename(audioUrl),
          uploaded_at: new Date().toISOString(),
          is_active: false,
        });
      }

      const { error: updateErr } = await supabase
        .from('tracks')
        .update({
          audio_url: version.url,
          audio_versions: updatedVersions,
        })
        .eq('id', trackId);
      if (updateErr) throw updateErr;

      onDone();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Restore failed.');
    } finally {
      setRestoring(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const currentFilename = audioUrl ? extractFilename(audioUrl) : null;
  const historyVersions = (audioVersions || []).filter(v => !v.is_active && v.url !== audioUrl);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Replace Audio" maxWidth="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && (
          <div style={{ color: 'var(--status-red)', fontSize: 13, padding: '8px 12px', background: 'var(--status-red-bg)', border: '1px solid var(--status-red)' }}>
            {error}
          </div>
        )}

        <div>
          <p style={{ color: 'var(--t2)', fontSize: 14, marginBottom: 4 }}>
            <strong style={{ color: 'var(--t1)' }}>{trackTitle}</strong>
          </p>
          {currentFilename && (
            <p style={{ color: 'var(--t3)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              Current: {currentFilename}
            </p>
          )}
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--brand-1)' : 'var(--border-2)'}`,
            background: dragging ? 'rgba(0,156,85,0.05)' : 'var(--surface-2)',
            padding: '32px 24px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'border-color 120ms, background 120ms',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
          <img
            src="/TM-Refresh-negro.svg"
            alt=""
            style={{ width: 24, height: 24, filter: 'invert(1)', opacity: 0.4, margin: '0 auto 12px' }}
          />
          {uploading ? (
            <p style={{ color: 'var(--t2)', fontSize: 13 }}>Uploading…</p>
          ) : (
            <>
              <p style={{ color: 'var(--t1)', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                Drop audio file here
              </p>
              <p style={{ color: 'var(--t3)', fontSize: 12 }}>or click to browse</p>
            </>
          )}
        </div>

        {/* Version History */}
        {historyVersions.length > 0 && (
          <div>
            <p style={{ color: 'var(--t3)', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Version History
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {historyVersions.map((version, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: 'var(--t1)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {version.filename}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--t3)' }}>
                      {formatDate(version.uploaded_at)}
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={restoring === version.url}
                    onClick={() => handleRestore(version)}
                    style={{ flexShrink: 0 }}
                  >
                    {restoring === version.url ? 'Restoring…' : 'Restore'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}
