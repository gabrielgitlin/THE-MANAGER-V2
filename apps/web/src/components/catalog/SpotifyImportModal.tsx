import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SpotifyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string;
  onImportComplete: () => void;
}

interface ImportResult {
  success: boolean;
  artist?: string;
  imported?: number;
  skipped?: number;
  failed?: number;
  details?: {
    importedAlbums: { title: string; tracks: number }[];
    skippedAlbums: { title: string; reason: string }[];
    failedAlbums?: { title: string; reason: string }[];
  };
  error?: string;
}

export default function SpotifyImportModal({
  isOpen,
  onClose,
  artistId,
  onImportComplete,
}: SpotifyImportModalProps) {
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    if (!spotifyUrl.trim()) {
      setResult({ success: false, error: 'Please enter a Spotify artist URL' });
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-spotify-catalog`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotifyArtistUrl: spotifyUrl,
          artistId: artistId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data);

      // Refresh catalog whenever at least one album was imported, even if others failed
      if ((data.imported ?? 0) > 0) {
        onImportComplete();
      }

      // Auto-close only on a fully clean success
      if (data.success && (data.failed ?? 0) === 0) {
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSpotifyUrl('');
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={handleClose} />

        <div style={{ background: 'var(--surface)', borderRadius: 0, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }} className="relative max-w-2xl w-full">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: `1px solid var(--border)` }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--t1)' }}>
              Import from Spotify
            </h2>
            <button
              onClick={handleClose}
              style={{ color: 'var(--t3)' }}
              className="hover:opacity-80"
            >
              <img src="/TM-Close-negro.svg" className="pxi-xl icon-muted" alt="" />
            </button>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--t1)', marginBottom: '8px' }}>
                Spotify Artist URL
              </label>
              <input
                type="text"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/artist/..."
                style={{ width: '100%', padding: '8px 16px', border: `1px solid var(--border)`, background: 'var(--surface-2)' }}
                disabled={isImporting}
              />
              <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--t2)' }}>
                Paste the Spotify URL of the artist to import their entire catalog.
                Duplicate albums will be automatically skipped.
              </p>
            </div>

            {result && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 0,
                  border: `1px solid ${result.success ? 'var(--border)' : 'var(--border)'}`,
                  background: result.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                }}
              >
                <div className="flex items-start">
                  {result.success ? (
                    <img src="/The Manager_Iconografia-11.svg" className="pxi-lg icon-green mr-3 flex-shrink-0 mt-0.5" alt="" />
                  ) : (
                    <img src="/TM-Info-negro.svg" className="pxi-lg icon-danger mr-3 flex-shrink-0 mt-0.5" alt="" />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: result.success ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
                      }}
                    >
                      {result.success ? 'Import Successful!' : 'Import Failed'}
                    </h3>
                    {result.details && (
                      <div style={{ marginTop: '8px', fontSize: '14px', color: result.success ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.8)' }}>
                        <p className="font-medium mb-1">
                          Artist: {result.artist}
                        </p>
                        <p>Imported: {result.imported} albums</p>
                        <p>Skipped: {result.skipped} albums (already exist)</p>
                        {typeof result.failed === 'number' && result.failed > 0 && (
                          <p>Failed: {result.failed} albums</p>
                        )}

                        {result.details.importedAlbums.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium mb-1">Imported Albums:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              {result.details.importedAlbums.map((album, idx) => (
                                <li key={idx}>
                                  {album.title} ({album.tracks} tracks)
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.details.skippedAlbums.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium mb-1">Skipped Albums:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              {result.details.skippedAlbums.map((album, idx) => (
                                <li key={idx}>
                                  {album.title} - {album.reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.details.failedAlbums && result.details.failedAlbums.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium mb-1" style={{ color: 'rgba(239, 68, 68, 0.9)' }}>Failed Albums:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2" style={{ color: 'rgba(239, 68, 68, 0.9)' }}>
                              {result.details.failedAlbums.map((album, idx) => (
                                <li key={idx}>
                                  {album.title} - {album.reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {result.error && (
                      <p style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(239, 68, 68, 0.8)' }}>{result.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '24px', borderTop: `1px solid var(--border)`, background: 'var(--surface-2)' }}>
            <button
              onClick={handleClose}
              style={{ padding: '8px 16px', fontSize: '14px', fontWeight: '500', color: 'var(--t1)', background: 'var(--surface)', border: `1px solid var(--border)` }}
              className="hover:opacity-80"
              disabled={isImporting}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || !spotifyUrl.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <img src="/TM-Upload-negro.svg" className="pxi-md icon-white" alt="" />
                  Import Catalog
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
