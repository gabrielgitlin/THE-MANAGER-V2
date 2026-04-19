import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Track, CreditShare, Album } from '../types';
import { CATALOG } from '../data/catalog';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useMusicPlayerStore } from '../store/musicPlayerStore';
import DigitalAssetUploader from '../components/catalog/DigitalAssetUploader';
import { listAssets as listDigitalAssets } from '../lib/digitalAssetService';
import LoadingSpinner from '../components/LoadingSpinner';


export default function TrackDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [track, setTrack] = useState<Track | null>(null);
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSpotifyEmbed, setShowSpotifyEmbed] = useState(false);

  useEffect(() => {
    const fetchTrack = async () => {
      if (!user) {
        const numericId = Number(id);
        const catalogTrack = !Number.isNaN(numericId)
          ? CATALOG.flatMap(album => album.tracks).find(t => t.id === numericId)
          : null;
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
              artwork_url,
              format,
              status,
              genres_array,
              spotify_url,
              label,
              upc,
              artist_id,
              artist,
              artists (
                name
              )
            )
          `)
          .eq('track_id', id)
          .maybeSingle();

        const albumData: any = (albumTrackData as any)?.albums;

        if (albumData) {
          const artistName = albumData.artists?.name || albumData.artist || 'Unknown Artist';
          const formattedAlbum: Album = {
            id: albumData.id as any,
            title: albumData.title,
            artist: artistName,
            releaseDate: albumData.release_date,
            artworkUrl: albumData.artwork_url,
            format: albumData.format as 'Album' | 'EP' | 'Single',
            status: albumData.status,
            genres: albumData.genres_array || [],
            label: albumData.label || '',
            distributor: '',
            upc: albumData.upc || '',
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
            duration: formatDuration(Number(trackData.duration) || 0),
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
      } catch (err: any) {
        console.error('Error fetching track:', err?.message || err, err);
        const numericId = Number(id);
        if (!Number.isNaN(numericId)) {
          const catalogTrack = CATALOG.flatMap(album => album.tracks).find(t => t.id === numericId);
          const catalogAlbum = catalogTrack ? CATALOG.find(a => a.id === catalogTrack.albumId) : null;
          setTrack(catalogTrack || null);
          setAlbum(catalogAlbum || null);
        }
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

  const getTrackPlayMode = (t: { audioUrl?: string; spotifyUri?: string }) => {
    if (t.audioUrl) return 'native' as const;
    if (t.spotifyUri) return 'spotify' as const;
    return 'none' as const;
  };

  const spotifyUriToUrl = (uri: string) => {
    const id = uri.replace('spotify:track:', '');
    return `https://open.spotify.com/track/${id}`;
  };

  const handlePlayPause = () => {
    if (!track || !album) return;

    const mode = getTrackPlayMode(track);

    if (mode === 'spotify' && track.spotifyUri) {
      setShowSpotifyEmbed(prev => !prev);
      return;
    }
    setShowSpotifyEmbed(false);

    if (mode === 'native') {
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
    }
  };

  const isCurrentTrackPlaying = tracks[currentTrackIndex]?.id === track?.id && isPlaying;
  const playMode = track ? getTrackPlayMode(track) : 'none';


  const renderCreditList = (credits: CreditShare[]) => (
    <div className="space-y-2">
      {credits.map((credit, index) => (
        <div key={index} className="flex flex-col gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--t1)' }}>{credit.name}</span>
            {typeof credit.masterPercentage !== 'undefined' && (
              <span className="text-sm" style={{ color: 'var(--t2)' }}>
                Master: {credit.masterPercentage}%
              </span>
            )}
            {typeof credit.publishingPercentage !== 'undefined' && (
              <span className="text-sm" style={{ color: 'var(--t2)' }}>
                Publishing: {credit.publishingPercentage}%
              </span>
            )}
          </div>
          {credit.pros && credit.pros.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: 'var(--t2)' }}>PRO:</span>
              <div className="flex gap-1">
                {credit.pros.map((pro, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--brand-1)', color: 'white' }}>
                    {pro.name} ({pro.ipiNumber})
                  </span>
                ))}
              </div>
            </div>
          )}
          {credit.publishers && credit.publishers.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: 'var(--t2)' }}>Publisher:</span>
              <div className="flex gap-1">
                {credit.publishers.map((pub, idx) => (
                  <span key={idx} className="status-badge badge-green">
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

  const isDemo = album?.status === 'demo';
  const backUrl = isDemo ? '/catalog?tab=demos' : '/catalog';
  const backLabel = isDemo ? 'Back to Demos' : 'Back to Catalog';

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} />;
  }

  if (!track || !album) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--t1)' }}>Track Not Found</h2>
        <p className="mb-8" style={{ color: 'var(--t2)' }}>The track you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate(backUrl)}
          className="px-4 py-2 bg-primary text-white hover:bg-primary/90"
        >
          {backLabel}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate(backUrl)}
          className="flex items-center gap-2 text-sm mb-4 hover:opacity-80"
          style={{ color: 'var(--t2)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          {backLabel}
        </button>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {playMode === 'none' ? (
              <img src="/pixel-play.svg" alt="Play" className="w-14 h-14" style={{ opacity: 0.3 }} />
            ) : (
              <button
                onClick={handlePlayPause}
                className="hover:opacity-80 transition-opacity"
                style={{ background: 'none', border: 'none', padding: 0, lineHeight: 0 }}
                title={playMode === 'spotify' ? 'Play on Spotify' : isCurrentTrackPlaying ? 'Pause' : 'Play'}
              >
                {playMode === 'native' && isCurrentTrackPlaying ? (
                  <img src="/TM-Pause-negro.svg" className="pxi-xl icon-white" alt="" />
                ) : (
                  <img
                    src="/pixel-play.svg"
                    alt="Play"
                    className="w-14 h-14"
                    style={playMode === 'spotify' ? { filter: 'invert(56%) sepia(95%) saturate(335%) hue-rotate(95deg) brightness(95%)' } : undefined}
                  />
                )}
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold font-title" style={{ color: 'var(--t1)' }}>{track.title}</h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--t2)' }}>{album.artist}</p>
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:opacity-80"
              style={{ color: 'var(--t1)', backgroundColor: 'var(--surface)', border: `1px solid var(--border)` }}
            >
              <img src="/TM-Share-negro.svg" className="pxi-md icon-muted" alt="" />
              Share
            </button>
            <button
              onClick={async () => {
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

                let assets: Array<[string, string, string, string, string]> = [];
                try {
                  const rows = await listDigitalAssets('track', String(track.id));
                  assets = rows.map((a) => [
                    a.name,
                    a.category.charAt(0).toUpperCase() + a.category.slice(1),
                    a.source_type === 'upload' ? formatFileSize(a.file_size || 0) : a.source_type,
                    new Date(a.created_at).toLocaleDateString(),
                    a.description || 'N/A',
                  ]);
                } catch (err) {
                  console.warn('Could not fetch assets for PDF export:', err);
                }

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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90"
            >
              <img src="/TM-Download-negro.svg" className="pxi-md icon-white" alt="" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {showSpotifyEmbed && track.spotifyUri && (
        <div style={{ marginBottom: 16 }}>
          <iframe
            src={`https://open.spotify.com/embed/track/${track.spotifyUri.replace('spotify:track:', '')}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ border: 'none', display: 'block' }}
            title="Spotify player"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ color: 'var(--t1)' }}>
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Stats */}
          <div className="shadow-md p-6" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Album</div>
                <div className="mt-1 text-2xl font-semibold" style={{ color: 'var(--t1)' }}>{album.title}</div>
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Track Number</div>
                <div className="mt-1 text-2xl font-semibold" style={{ color: 'var(--t1)' }}>{track.trackNumber}</div>
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Duration</div>
                <div className="mt-1 text-2xl font-semibold" style={{ color: 'var(--t1)' }}>{track.duration}</div>
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Release Date</div>
                <div className="mt-1 text-2xl font-semibold" style={{ color: 'var(--t1)' }}>
                  {new Date(album.releaseDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Credits */}
          <div className="shadow-md p-6" style={{ backgroundColor: 'var(--surface)' }}>
            <h2 className="text-lg font-medium mb-6" style={{ color: 'var(--t1)' }}>Credits</h2>
            <div className="grid grid-cols-1 gap-8">
              <div>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--t2)' }}>Artist</h3>
                {renderCreditList(album.artistCredits)}
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--t2)' }}>Songwriters & Publishing</h3>
                {renderCreditList(track.songwriters)}
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--t2)' }}>Producers</h3>
                {renderCreditList(album.producers)}
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--t2)' }}>Mix Engineers</h3>
                {renderCreditList(album.mixEngineers)}
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--t2)' }}>Mastering Engineers</h3>
                {renderCreditList(album.masteringEngineers)}
              </div>
            </div>
          </div>

          {/* Digital Assets */}
          <div className="shadow-md p-6" style={{ backgroundColor: 'var(--surface)' }}>
            <DigitalAssetUploader
              entityId={String(track.id)}
              entityType="track"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Metadata */}
          <div className="shadow-md p-6" style={{ backgroundColor: 'var(--surface)' }}>
            <h2 className="text-lg font-medium mb-6" style={{ color: 'var(--t1)' }}>Metadata</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Genres</h3>
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
                <h3 className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Label</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--t1)' }}>{album.label}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Distributor</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--t1)' }}>{album.distributor}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--t2)' }}>ISRC</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--t1)' }}>{track.isrc}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--t2)' }}>UPC</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--t1)' }}>{album.upc}</p>
              </div>
            </div>
          </div>

          {/* Streaming Links */}
          <div className="shadow-md p-6" style={{ backgroundColor: 'var(--surface)' }}>
            <h2 className="text-lg font-medium mb-6" style={{ color: 'var(--t1)' }}>Streaming Links</h2>
            <div className="space-y-4">
              {track.spotifyUri && (
                <a
                  href={`https://open.spotify.com/track/${track.spotifyUri.split(':')[2]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:opacity-80"
                  style={{ color: 'var(--t1)', backgroundColor: 'var(--surface-2)' }}
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
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:opacity-80"
                  style={{ color: 'var(--t1)', backgroundColor: 'var(--surface-2)' }}
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