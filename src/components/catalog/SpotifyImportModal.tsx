import React, { useState } from 'react';
import { X, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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
  details?: {
    importedAlbums: { title: string; tracks: number }[];
    skippedAlbums: { title: string; reason: string }[];
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

      if (data.success) {
        setTimeout(() => {
          onImportComplete();
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

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Import from Spotify
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spotify Artist URL
              </label>
              <input
                type="text"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/artist/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                disabled={isImporting}
              />
              <p className="mt-2 text-sm text-gray-500">
                Paste the Spotify URL of the artist to import their entire catalog.
                Duplicate albums will be automatically skipped.
              </p>
            </div>

            {result && (
              <div
                className={`p-4 rounded-md ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`text-sm font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {result.success ? 'Import Successful!' : 'Import Failed'}
                    </h3>
                    {result.success && result.details && (
                      <div className="mt-2 text-sm text-green-700">
                        <p className="font-medium mb-1">
                          Artist: {result.artist}
                        </p>
                        <p>Imported: {result.imported} albums</p>
                        <p>Skipped: {result.skipped} albums (already exist)</p>

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
                      </div>
                    )}
                    {result.error && (
                      <p className="mt-2 text-sm text-red-700">{result.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
                  <Upload className="w-4 h-4" />
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
