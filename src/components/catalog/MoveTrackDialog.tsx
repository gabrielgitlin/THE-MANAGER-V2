import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { supabase } from '../../lib/supabase';

interface MoveTrackDialogProps {
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

export default function MoveTrackDialog({
  isOpen,
  onClose,
  trackId,
  albumId,
  trackTitle,
  onDone,
}: MoveTrackDialogProps) {
  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAlbums();
      setSelectedAlbumId(null);
      setError(null);
    }
  }, [isOpen, albumId]);

  const loadAlbums = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleMove = async () => {
    if (!selectedAlbumId) return;
    setMoving(true);
    setError(null);
    try {
      // Get max track_number in destination album
      const { data: atRows } = await supabase
        .from('album_tracks')
        .select('track_number')
        .eq('album_id', selectedAlbumId)
        .order('track_number', { ascending: false })
        .limit(1);

      const maxNum = atRows?.[0]?.track_number ?? 0;

      // Remove from current album_tracks
      const { error: deleteErr } = await supabase
        .from('album_tracks')
        .delete()
        .eq('track_id', trackId)
        .eq('album_id', albumId);
      if (deleteErr) throw deleteErr;

      // Insert into destination album_tracks
      const { error: insertErr } = await supabase
        .from('album_tracks')
        .insert({
          album_id: selectedAlbumId,
          track_id: trackId,
          track_number: maxNum + 1,
          disc_number: 1,
        });
      if (insertErr) throw insertErr;

      // Update tracks.album_id
      const { error: updateErr } = await supabase
        .from('tracks')
        .update({ album_id: selectedAlbumId })
        .eq('id', trackId);
      if (updateErr) throw updateErr;

      onDone();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to move track.');
    } finally {
      setMoving(false);
    }
  };

  const statusLabel = (status: string) => {
    if (status === 'demo') return 'Demo';
    if (status === 'released') return 'Released';
    return 'Catalog';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Move Track" maxWidth="sm">
      {error && (
        <div style={{ color: 'var(--status-red)', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'var(--status-red-bg)', border: '1px solid var(--status-red)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ color: 'var(--t2)', fontSize: 14, marginBottom: 4 }}>
          Move <strong style={{ color: 'var(--t1)' }}>{trackTitle}</strong> to another project:
        </p>

        {loading ? (
          <p style={{ color: 'var(--t3)', fontSize: 13 }}>Loading projects…</p>
        ) : albums.length === 0 ? (
          <p style={{ color: 'var(--t3)', fontSize: 13 }}>No other projects available.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
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
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            disabled={!selectedAlbumId || moving}
            onClick={handleMove}
          >
            {moving ? 'Moving…' : 'Move Track'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
