import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import * as tus from 'tus-js-client';
import { supabase } from '../../lib/supabase';
import { syncArtistsToTeam } from '../../lib/contacts';
import { useAuthStore } from '../../store/authStore';
import { ContactTagInput, type ContactTag } from '../ui/ContactTagInput';

interface DemoTrack {
  file: File;
  title: string;
  notes: string;
}

interface DemoUploadModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function fileToTitle(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      const dur = isFinite(audio.duration) ? Math.round(audio.duration) : 0;
      URL.revokeObjectURL(url);
      resolve(dur);
    };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    audio.src = url;
  });
}

export default function DemoUploadModal({ onClose, onSaved }: DemoUploadModalProps) {
  const { user } = useAuthStore();
  const [tracks, setTracks] = useState<DemoTrack[]>([]);
  const [artistTags, setArtistTags] = useState<ContactTag[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; status?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const audioFiles = Array.from(files).filter(f =>
      f.type.startsWith('audio/') || /\.(mp3|wav|aac|flac|ogg|m4a|aiff)$/i.test(f.name)
    );
    setTracks(prev => [
      ...prev,
      ...audioFiles.map(f => ({ file: f, title: fileToTitle(f.name), notes: '' })),
    ]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const updateTrack = (i: number, field: keyof Pick<DemoTrack, 'title' | 'notes'>, value: string) => {
    setTracks(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  };

  const removeTrack = (i: number) => {
    setTracks(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!user || tracks.length === 0) return;
    setIsSaving(true);
    setProgress({ current: 0, total: tracks.length });

    try {
      // Optionally resolve artist — demos can exist without one
      const artistStr = artistTags.map(t => t.name).join(', ');
      let artistId: string | null = null;
      if (artistStr) {
        const { data: existing } = await supabase
          .from('artists')
          .select('id')
          .eq('name', artistStr)
          .maybeSingle();
        if (existing) {
          artistId = existing.id;
        } else {
          const { data: created } = await supabase
            .from('artists')
            .insert({ name: artistStr })
            .select('id')
            .single();
          artistId = created?.id ?? null;
        }
      }

      for (let i = 0; i < tracks.length; i++) {
        const { file, title, notes } = tracks[i];
        setProgress({ current: i + 1, total: tracks.length, status: 'Uploading...' });

        const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const audioPath = `audio/${user.id}/${Date.now()}_${safeFilename}`;
        const contentType = file.type || 'audio/mpeg';

        // Try TUS resumable upload first (6MB chunks), fall back to standard upload
        let uploaded = false;
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token) {
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
            await new Promise<void>((resolve, reject) => {
              const tusUpload = new tus.Upload(file, {
                endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
                retryDelays: [0, 1000, 3000, 5000],
                chunkSize: 6 * 1024 * 1024,
                headers: {
                  authorization: `Bearer ${token}`,
                  'x-upsert': 'false',
                },
                metadata: {
                  bucketName: 'tracks',
                  objectName: audioPath,
                  contentType,
                  cacheControl: '3600',
                },
                onError: (err) => reject(err),
                onSuccess: () => resolve(),
              });
              tusUpload.start();
            });
            uploaded = true;
          } catch {
            // TUS failed — fall through to standard upload
          }
        }

        if (!uploaded) {
          const { error: uploadErr } = await supabase.storage
            .from('tracks')
            .upload(audioPath, file, {
              cacheControl: '3600',
              contentType,
              upsert: true,
            });
          if (uploadErr) throw new Error(`Audio upload failed: ${uploadErr.message}`);
        }

        const { data: { publicUrl: audioUrl } } = supabase.storage.from('tracks').getPublicUrl(audioPath);

        // Extract duration from the audio file
        const duration = await getAudioDuration(file);

        // Create project (demo)
        const { data: album, error: albumErr } = await supabase
          .from('albums')
          .insert({
            title: title.trim() || file.name,
            artist_id: artistId,
            artist: artistStr,
            artist_contacts: JSON.stringify(artistTags),
            user_id: user.id,
            format: 'Single',
            status: 'demo',
            release_date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single();
        if (albumErr) throw albumErr;

        // Create track
        const { data: track, error: trackErr } = await supabase
          .from('tracks')
          .insert({
            title: title.trim() || file.name,
            audio_url: audioUrl,
            duration,
            album_id: album.id,
            user_id: user.id,
            track_number: 1,
            ...(notes.trim() ? { notes: notes.trim() } : {}),
          })
          .select()
          .single();
        if (trackErr) throw trackErr;

        // Link track to album
        await supabase.from('album_tracks').insert({
          album_id: album.id,
          track_id: track.id,
          track_number: 1,
          disc_number: 1,
        });
      }

      // Sync artists to Team database (silent, non-blocking)
      if (artistTags.length > 0) {
        syncArtistsToTeam(artistTags.map(t => ({ name: t.name, role: 'Artist' })));
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Demo upload error:', err);
      alert(`Error saving demos: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
      setProgress(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Artist field */}
      <div className="form-field">
        <label>Artist <span style={{ color: 'var(--t3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
        <ContactTagInput
          value={artistTags}
          onChange={setArtistTags}
          placeholder="Search or add artist…"
          preferRole="Artist"
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--brand-1)' : 'var(--border-2)'}`,
          background: isDragging ? 'rgba(0,156,85,0.06)' : 'var(--surface-2)',
          padding: '32px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 120ms, background 120ms',
        }}
      >
        <img src="/TM-Upload-negro.svg" alt="" style={{ width: 28, height: 28, margin: '0 auto 12px', filter: 'invert(1)', opacity: 0.5 }} />
        <p style={{ color: 'var(--t2)', fontSize: 14, marginBottom: 4 }}>
          Drop audio files here or <span style={{ color: 'var(--brand-1)' }}>browse</span>
        </p>
        <p style={{ color: 'var(--t3)', fontSize: 12 }}>MP3, WAV, FLAC, AAC, M4A supported</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.aac,.m4a,.aiff,.ogg"
          multiple
          style={{ display: 'none' }}
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Track list */}
      {tracks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="text-section" style={{ color: 'var(--t3)', marginBottom: 4 }}>
            {tracks.length} {tracks.length === 1 ? 'PROJECT' : 'PROJECTS'} QUEUED
          </p>
          {tracks.map((track, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--border-2)',
                background: 'var(--surface-2)',
                padding: '12px 14px',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <img src="/TM-Mic-negro.svg" alt="" style={{ width: 16, height: 16, marginTop: 10, flexShrink: 0, filter: 'invert(1)', opacity: 0.4 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  type="text"
                  value={track.title}
                  onChange={e => updateTrack(i, 'title', e.target.value)}
                  placeholder="Track title"
                  style={{ height: 34, fontSize: 13 }}
                />
                <input
                  type="text"
                  value={track.notes}
                  onChange={e => updateTrack(i, 'notes', e.target.value)}
                  placeholder="Notes (optional) — mood, reference, idea..."
                  style={{ height: 34, fontSize: 13 }}
                />
                <p style={{ fontSize: 11, color: 'var(--t4)', marginTop: 2 }}>{track.file.name}</p>
              </div>
              <button className="btn-icon sm" onClick={() => removeTrack(i)} style={{ flexShrink: 0, marginTop: 4 }}>
                <X size={14} style={{ color: 'var(--t3)' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
        <button className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving || tracks.length === 0}
        >
          {isSaving && progress
            ? `${progress.status || 'Uploading'} (${progress.current} / ${progress.total})`
            : `Save ${tracks.length > 0 ? tracks.length : ''} Project${tracks.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
