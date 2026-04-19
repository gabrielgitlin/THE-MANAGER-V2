import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface DuplicateTrackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  albumId: string;
  trackTitle: string;
  onDone: () => void;
}

interface AlbumOption {
  id: string;
  title: string;
  artist: string;
  status: string;
}

type Step = 'choose' | 'pick-album' | 'copying';

export default function DuplicateTrackDialog({
  isOpen,
  onClose,
  trackId,
  albumId,
  trackTitle,
  onDone,
}: DuplicateTrackDialogProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('choose');
  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('choose');
      setSelectedAlbumId(null);
      setError(null);
    }
  }, [isOpen]);

  const loadAlbums = async () => {
    setLoadingAlbums(true);
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('id, title, artist, status')
        .neq('id', albumId)
        .order('title', { ascending: true });
      if (error) throw error;
      setAlbums(data || []);
    } catch (err: any) {
      setError('Failed to load projects.');
    } finally {
      setLoadingAlbums(false);
    }
  };

  const handleChoose = async (choice: 'same' | 'other') => {
    if (choice === 'same') {
      await doCopy(albumId);
    } else {
      await loadAlbums();
      setStep('pick-album');
    }
  };

  const doCopy = async (destAlbumId: string) => {
    if (!user) return;
    setCopying(true);
    setError(null);
    try {
      // Fetch original track data
      const { data: origTrack, error: fetchErr } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', trackId)
        .single();
      if (fetchErr) throw fetchErr;

      // Get max track_number in dest album
      const { data: atRows } = await supabase
        .from('album_tracks')
        .select('track_number')
        .eq('album_id', destAlbumId)
        .order('track_number', { ascending: false })
        .limit(1);

      const maxNum = atRows?.[0]?.track_number ?? 0;

      // Create new track
      const { data: newTrack, error: insertErr } = await supabase
        .from('tracks')
        .insert({
          title: `Copy of ${origTrack.title}`,
          album_id: destAlbumId,
          audio_url: origTrack.audio_url,
          notes: origTrack.notes,
          audio_versions: origTrack.audio_versions ?? [],
          user_id: user.id,
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;

      // Link to destination album
      const { error: linkErr } = await supabase
        .from('album_tracks')
        .insert({
          album_id: destAlbumId,
          track_id: newTrack.id,
          track_number: maxNum + 1,
          disc_number: 1,
        });
      if (linkErr) throw linkErr;

      onDone();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to duplicate track.');
    } finally {
      setCopying(false);
    }
  };

  const statusLabel = (status: string) => {
    if (status === 'demo') return 'Demo';
    if (status === 'released') return 'Released';
    return 'Catalog';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Duplicate Track" maxWidth="sm">
      {error && (
        <div style={{ color: 'var(--status-red)', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'var(--status-red-bg)', border: '1px solid var(--status-red)' }}>
          {error}
        </div>
      )}

      {step === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: 'var(--t2)', fontSize: 14, marginBottom: 4 }}>
            Where do you want to copy <strong style={{ color: 'var(--t1)' }}>{trackTitle}</strong>?
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => handleChoose('same')}
            disabled={copying}
            style={{ justifyContent: 'flex-start', gap: 10 }}
          >
            <img src="/TM-Copy-negro.svg" alt="" style={{ width: 14, height: 14, filter: 'invert(1)', opacity: 0.7 }} />
            Copy to same album
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleChoose('other')}
            disabled={copying}
            style={{ justifyContent: 'flex-start', gap: 10 }}
          >
            <img src="/TM-ExternalLink-negro.svg" alt="" style={{ width: 14, height: 14, filter: 'invert(1)', opacity: 0.7 }} />
            Copy to another project
          </button>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          </div>
        </div>
      )}

      {step === 'pick-album' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: 'var(--t2)', fontSize: 14, marginBottom: 4 }}>
            Select a destination project:
          </p>
          {loadingAlbums ? (
            <p style={{ color: 'var(--t3)', fontSize: 13 }}>Loading projects…</p>
          ) : albums.length === 0 ? (
            <p style={{ color: 'var(--t3)', fontSize: 13 }}>No other projects found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
              {albums.map(album => (
                <button
                  key={album.id}
                  onClick={() => setSelectedAlbumId(album.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: selectedAlbumId === album.id ? 'rgba(0,156,85,0.08)' : 'var(--surface-2)',
                    border: `1px solid ${selectedAlbumId === album.id ? 'var(--brand-1)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 100ms, background 100ms',
                  }}
                >
                  <span>
                    <span style={{ fontSize: 13, color: 'var(--t1)', display: 'block' }}>{album.title}</span>
                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>{album.artist}</span>
                  </span>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 6px',
                    background: 'var(--surface-3)',
                    border: '1px solid var(--border)',
                    color: 'var(--t3)',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {statusLabel(album.status)}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setStep('choose')}>Back</button>
            <button
              className="btn btn-primary btn-sm"
              disabled={!selectedAlbumId || copying}
              onClick={() => selectedAlbumId && doCopy(selectedAlbumId)}
            >
              {copying ? 'Copying…' : 'Copy Track'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
