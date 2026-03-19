import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Disc, Calendar, Tag, Globe, Share2, Download, Play, Pause, ExternalLink, Pencil, File } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Track, CreditShare, DigitalAsset, Album } from '../types';
import { CATALOG } from '../data/catalog';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useMusicPlayerStore } from '../store/musicPlayerStore';
import DigitalAssetUploader, { AssetCategory } from '../components/catalog/DigitalAssetUploader';
import LoadingSpinner from '../components/LoadingSpinner';


export default function TrackDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [track, setTrack] = useState<Track | null>(null);
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [digitalAssets, setDigitalAssets] = useState<DigitalAsset[]>([]);

  useEffect(() => {
    const fetchTrack = async () => {
      if (!user) {
        const catalogTrack = CATALOG.flatMap(album => album.tracks).find(t => t.id === Number(id));
        const catalogAlbum = catalogTrack ? CATALOG.find(a => a.id === catalogTrack.albumId) : null;
        setTrack(catalogTrack || null);
        setAlbum(catalogAlbum || null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data: trackData, error: trackError } = await supabase
          .from('tracks')
          .select(`
            id,
            title,
            track_number,
            disc_number,
            duration,
            isrc,
            spotify_id,
            spotify_url,
            preview_url,
            audio_url,
            explicit,
            album_id
          `)
          .eq('id', id)
          .maybeSingle();

        if (trackError) throw trackError;
        if (!trackData) {
          setIsLoading(false);
          return;
        }

        const { data: albumTrackData } = await supabase
          .from('album_tracks')
          .select(`
            track_number,
            album_id,
            albums (
              id,
              title,
              release_date,
              cover_url,
              format,
              status,
              genres_array,
              spotify_url,
              artist_id,
              artists (
                name
              )
            )
          `)
          .eq('track_id', id)
          .maybeSingle();

        const albumData = albumTrackData?.albums;

        if (albumData) {
          const formattedAlbum: Album = {
            id: albumData.id as any,
            title: albumData.title,
            artist: albumData.artists?.name || 'Unknown Artist',
            releaseDate: albumData.release_date,
            artworkUrl: albumData.cover_url,
            format: albumData.format as 'Album' | 'EP' | 'Single',
            status: albumData.status,
            genres: albumData.genres_array || [],
            label: '',
            distributor: '',
            upc: '',
            spotifyUrl: albumData.spotify_url,
            tracks: [],
            artistCredits: [],
            producers: [],
            mixEngineers: [],
            masteringEngineers: [],
          };

          const formattedTrack: Track = {
            id: trackData.id as any,
            title: trackData.title,
            duration: formatDuration(trackData.duration || 0),
            trackNumber: albumTrackData?.track_number || 1,
            isrc: trackData.isrc || '',
            spotifyUri: trackData.spotify_url ? `spotify:track:${trackData.spotify_id}` : undefined,
            audioUrl: trackData.audio_url || trackData.preview_url || undefined,
            albumId: albumData.id as any,
            songwriters: [],
          };

          setAlbum(formattedAlbum);
          setTrack(formattedTrack);
        }
      } catch (err) {
        console.error('Error fetching track:', err);
        const catalogTrack = CATALOG.flatMap(album => album.tracks).find(t => t.id === Number(id));
        const catalogAlbum = catalogTrack ? CATALOG.find(a => a.id === catalogTrack.albumId) : null;
        setTrack(catalogTrack || null);
        setAlbum(catalogAlbum || null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrack();
  }, [id, user]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const { 
    playTrack, 
    togglePlayPause, 
    isPlaying, 
    tracks, 
    currentTrackIndex 
  } = useMusicPlayerStore();

  const handlePlayPause = () => {
    if (!track || !album) return;

    const currentTrack = tracks[currentTrackIndex];
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack({
        id: track.id,
        title: track.title,
        artist: album.artist,
        duration: track.duration || '0:00',
        audioUrl: track.audioUrl,
        coverArt: album.artworkUrl
      });
    }
  };

  const isCurrentTrackPlaying = tracks[currentTrackIndex]?.id === track?.id && isPlaying;

  const handleAddAsset = (asset: DigitalAsset) => {
    setDigitalAssets([...digitalAssets, asset]);
  };

  const handleDeleteAsset = (assetId: string) => {
    setDigitalAssets(digitalAssets.filter(asset => asset.id !== assetId));
  };

  const handleUpdateAsset = (updatedAsset: DigitalAsset) => {
    setDigitalAssets(digitalAssets.map(asset => 
      asset.id === updatedAsset.id ? updatedAsset : asset
    ));
  };

  const renderCreditList = (credits: CreditShare[]) => (
    <div className="space-y-2">
      {credits.map((credit, index) => (
        <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-900">{credit.name}</span>
            {typeof credit.masterPercentage !== 'undefined' && (
              <span className="text-sm text-gray-500">
                Master: {credit.masterPercentage}%
              </span>
            )}
            {typeof credit.publishingPercentage !== 'undefined' && (
              <span className="text-sm text-gray-500">
                Publishing: {credit.publishingPercentage}%
              </span>
            )}
          </div>
          {credit.pros && credit.pros.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">PRO:</span>
              <div className="flex gap-1">
                {credit.pros.map((pro, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                    {pro.name} ({pro.ipiNumber})
                  </span>
                ))}
              </div>
            </div>
          )}
          {credit.publishers && credit.publishers.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Publisher:</span>
              <div className="flex gap-1">
                {credit.publishers.map((pub, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                    {pub.name} ({pub.ipiNumber})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} />;
  }

  if (!track || !album) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Track Not Found</h2>
        <p className="text-gray-600 mb-8">The track you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/catalog')}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/catalog')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Catalog
        </button>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPause}
              className="p-3 bg-primary text-white rounded-full hover:bg-primary/90"
            >
              {isCurrentTrackPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-title">{track.title}</h1>
              <p className="mt-1 text-sm text-gray-500">{album.artist}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const shareData = {
                  title: track.title,
                  text: `Check out ${track.title} by ${album.artist}`,
                  url: window.location.href,
                };

                if (navigator.share && navigator.canShare(shareData)) {
                  navigator.share(shareData);
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => {
                const doc = new jsPDF();

                // Add title and artist
                doc.setFontSize(24);
                doc.setFont('helvetica', 'bold');
                doc.text(track.title, doc.internal.pageSize.width / 2, 20, { align: 'center' });

                doc.setFontSize(16);
                doc.setFont('helvetica', 'normal');
                doc.text(album.artist, doc.internal.pageSize.width / 2, 30, { align: 'center' });

                // Add basic info
                let yPos = 50;
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Track Information', 14, yPos);
                yPos += 10;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const basicInfo = [
                  ['Album', album.title],
                  ['Track Number', track.trackNumber.toString()],
                  ['Duration', track.duration || 'N/A'],
                  ['Release Date', new Date(album.releaseDate).toLocaleDateString()],
                  ['Label', album.label || 'N/A'],
                  ['Distributor', album.distributor || 'N/A'],
                  ['ISRC', track.isrc || 'N/A'],
                  ['UPC', album.upc || 'N/A'],
                  ['Genres', album.genres.join(', ')],
                ];

                autoTable(doc, {
                  startY: yPos,
                  head: [['Field', 'Value']],
                  body: basicInfo,
                  theme: 'striped',
                  headStyles: { fillColor: [30, 253, 1], textColor: [0, 0, 0] },
                });

                yPos = (doc as any).lastAutoTable.finalY + 20;

                // Add credits
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Credits', 14, yPos);
                yPos += 10;

                const formatCredits = (credits: CreditShare[]) => 
                  credits.map(c => {
                    const parts = [
                      `${c.name} ${c.masterPercentage ? `(Master: ${c.masterPercentage}%)` : ''}${c.publishingPercentage ? `(Publishing: ${c.publishingPercentage}%)` : ''}`
                    ];
                    
                    if (c.pros) {
                      parts.push(`PRO: ${c.pros.map(p => `${p.name} (${p.ipiNumber})`).join(', ')}`);
                    }
                    
                    if (c.publishers) {
                      parts.push(`Publisher: ${c.publishers.map(p => `${p.name} (${p.ipiNumber})`).join(', ')}`);
                    }
                    
                    return parts.join('\n');
                  }).join('\n\n');

                const credits = [
                  ['Artist', formatCredits(album.artistCredits)],
                  ['Producers', formatCredits(album.producers)],
                  ['Songwriters', formatCredits(track.songwriters)],
                  ['Mix Engineers', formatCredits(album.mixEngineers)],
                  ['Mastering Engineers', formatCredits(album.masteringEngineers)],
                ];

                autoTable(doc, {
                  startY: yPos,
                  head: [['Role', 'Credits']],
                  body: credits,
                  theme: 'striped',
                  headStyles: { fillColor: [30, 253, 1], textColor: [0, 0, 0] },
                });

                // Add digital assets section
                yPos = (doc as any).lastAutoTable.finalY + 20;
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Digital Assets', 14, yPos);
                yPos += 10;

                const assets = digitalAssets.map(asset => [
                  asset.name,
                  asset.category.charAt(0).toUpperCase() + asset.category.slice(1),
                  formatFileSize(asset.size),
                  new Date(asset.uploadDate).toLocaleDateString(),
                  asset.description || 'N/A',
                ]);

                if (assets.length > 0) {
                  autoTable(doc, {
                    startY: yPos,
                    head: [['Name', 'Category', 'Size', 'Upload Date', 'Description']],
                    body: assets,
                    theme: 'striped',
                    headStyles: { fillColor: [30, 253, 1], textColor: [0, 0, 0] },
                  });
                } else {
                  doc.setFontSize(10);
                  doc.setFont('helvetica', 'normal');
                  doc.text('No digital assets available', 14, yPos + 10);
                }

                // Add footer
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                for (let i = 1; i <= pageCount; i++) {
                  doc.setPage(i);
                  doc.setTextColor(128, 128, 128);
                  doc.text(
                    'Generated by THE MANAGER',
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                  );
                  doc.text(
                    `Page ${i} of ${pageCount}`,
                    doc.internal.pageSize.width - 20,
                    doc.internal.pageSize.height - 10,
                    { align: 'right' }
                  );
                }

                doc.save(`${album.artist} - ${track.title}.pdf`);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Stats */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500">Album</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{album.title}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Track Number</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{track.trackNumber}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Duration</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{track.duration}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Release Date</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {new Date(album.releaseDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Credits */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Credits</h2>
            <div className="grid grid-cols-1 gap-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Artist</h3>
                {renderCreditList(album.artistCredits)}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Songwriters & Publishing</h3>
                {renderCreditList(track.songwriters)}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Producers</h3>
                {renderCreditList(album.producers)}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Mix Engineers</h3>
                {renderCreditList(album.mixEngineers)}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Mastering Engineers</h3>
                {renderCreditList(album.masteringEngineers)}
              </div>
            </div>
          </div>

          {/* Digital Assets */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <DigitalAssetUploader
              assets={digitalAssets}
              onAssetAdd={handleAddAsset}
              onAssetDelete={handleDeleteAsset}
              onAssetUpdate={handleUpdateAsset}
              entityId={track.id}
              entityType="track"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Metadata */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Metadata</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Genres</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {album.genres.map((genre) => (
                    <span
                      key={genre}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Label</h3>
                <p className="mt-1 text-sm text-gray-900">{album.label}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Distributor</h3>
                <p className="mt-1 text-sm text-gray-900">{album.distributor}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">ISRC</h3>
                <p className="mt-1 text-sm text-gray-900">{track.isrc}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">UPC</h3>
                <p className="mt-1 text-sm text-gray-900">{album.upc}</p>
              </div>
            </div>
          </div>

          {/* Streaming Links */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Streaming Links</h2>
            <div className="space-y-4">
              {track.spotifyUri && (
                <a
                  href={`https://open.spotify.com/track/${track.spotifyUri.split(':')[2]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <img src="/tm-vinil-negro_(2).png" alt="Spotify" className="w-4 h-4 object-contain" />
                  Open in Spotify
                </a>
              )}
              {track.appleId && (
                <a
                  href={`https://music.apple.com/us/album/${track.appleId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <img src="/tm-vinil-negro_(2).png" alt="Apple Music" className="w-4 h-4 object-contain" />
                  Open in Apple Music
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}