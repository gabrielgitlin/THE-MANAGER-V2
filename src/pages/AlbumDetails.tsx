import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Disc, Calendar, Tag, Globe, Share2, Download, Play, Pause, ExternalLink, Pencil, File, Edit, Save, X, Plus, DollarSign, TrendingUp, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Album, CreditShare, DigitalAsset, Budget } from '../types';
import { CATALOG } from '../data/catalog';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useMusicPlayerStore } from '../store/musicPlayerStore';
import DigitalAssetUploader, { AssetCategory } from '../components/catalog/DigitalAssetUploader';
import BudgetLinkSection from '../components/BudgetLinkSection';
import LoadingSpinner from '../components/LoadingSpinner';
import { ProjectTagInput, type ProjectTag } from '../components/ui/ProjectTagInput';


export default function AlbumDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [album, setAlbum] = useState<Album | null>(null);
  const [albumData, setAlbumData] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingAlbum, setIsEditingAlbum] = useState(false);
  const [isEditingTracks, setIsEditingTracks] = useState(false);
  const [isEditingCredits, setIsEditingCredits] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editingTrackId, setEditingTrackId] = useState<number | null>(null);
  const [newGenre, setNewGenre] = useState('');
  const [newCredit, setNewCredit] = useState<{ type: string; credit: CreditShare }>({ type: '', credit: { name: '' } });
  const [isAddingCredit, setIsAddingCredit] = useState(false);
  const [digitalAssets, setDigitalAssets] = useState<DigitalAsset[]>([]);
  const [linkedBudget, setLinkedBudget] = useState<Budget | null>(null);
  const [artistProjects, setArtistProjects] = useState<ProjectTag[]>([]);
  const [isUploadingArtwork, setIsUploadingArtwork] = useState(false);
  const artworkInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!user) {
        const catalogAlbum = CATALOG.find(a => a.id === Number(id));
        setAlbum(catalogAlbum || null);
        setAlbumData(catalogAlbum || null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data: albumData, error: albumError } = await supabase
          .from('albums')
          .select(`
            id,
            title,
            release_date,
            cover_url,
            format,
            status,
            spotify_id,
            spotify_url,
            total_tracks,
            genres_array,
            artist_id,
            artist_projects,
            artists (
              name
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (albumError) throw albumError;
        if (!albumData) {
          setIsLoading(false);
          return;
        }

        const { data: albumTracks } = await supabase
          .from('album_tracks')
          .select(`
            track_number,
            disc_number,
            tracks (
              id,
              title,
              duration,
              isrc,
              spotify_id,
              spotify_url,
              preview_url,
              audio_url
            )
          `)
          .eq('album_id', id)
          .order('disc_number', { ascending: true })
          .order('track_number', { ascending: true });

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
          tracks: (albumTracks || []).map((at: any) => ({
            id: at.tracks.id as any,
            title: at.tracks.title,
            duration: formatDuration(at.tracks.duration || 0),
            trackNumber: at.track_number,
            isrc: at.tracks.isrc || '',
            spotifyUri: at.tracks.spotify_url ? `spotify:track:${at.tracks.spotify_id}` : undefined,
            audioUrl: at.tracks.audio_url || at.tracks.preview_url || undefined,
            albumId: albumData.id as any,
            songwriters: [],
          })),
          artistCredits: [],
          producers: [],
          mixEngineers: [],
          masteringEngineers: [],
        };

        setAlbum(formattedAlbum);
        setAlbumData(formattedAlbum);

        // Populate artist_projects tags; fall back to artist_id + name if empty
        const rawProjects = (albumData as any).artist_projects;
        if (Array.isArray(rawProjects) && rawProjects.length > 0) {
          setArtistProjects(rawProjects as ProjectTag[]);
        } else if (albumData.artist_id) {
          setArtistProjects([{
            id: albumData.artist_id as string,
            name: albumData.artists?.name || 'Unknown Artist',
          }]);
        }
      } catch (err) {
        console.error('Error fetching album:', err);
        const catalogAlbum = CATALOG.find(a => a.id === Number(id));
        setAlbum(catalogAlbum || null);
        setAlbumData(catalogAlbum || null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbum();
  }, [id, user]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const { 
    playTrack, 
    togglePlayPause, 
    isPlaying: isPlayerPlaying, 
    tracks, 
    currentTrackIndex 
  } = useMusicPlayerStore();

  const handlePlayPause = (trackId: number) => {
    const track = album?.tracks.find(t => t.id === trackId);
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

  const isTrackPlaying = (trackId: number) => {
    return tracks[currentTrackIndex]?.id === trackId && isPlayerPlaying;
  };

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

  const handleSaveAlbum = async () => {
    if (user && id && albumData) {
      try {
        const { error } = await supabase
          .from('albums')
          .update({ artist_projects: artistProjects })
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Error saving artist projects:', err);
      }
    }
    setIsEditingAlbum(false);
  };

  const handleSaveTrack = (trackId: number, updates: any) => {
    if (!albumData) return;
    const updatedTracks = albumData.tracks.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    );
    setAlbumData({ ...albumData, tracks: updatedTracks });
    setEditingTrackId(null);
  };

  const handleAddGenre = () => {
    if (!newGenre.trim() || !albumData) return;
    if (!albumData.genres.includes(newGenre.trim())) {
      setAlbumData({
        ...albumData,
        genres: [...albumData.genres, newGenre.trim()]
      });
    }
    setNewGenre('');
  };

  const handleRemoveGenre = (genre: string) => {
    if (!albumData) return;
    setAlbumData({
      ...albumData,
      genres: albumData.genres.filter(g => g !== genre)
    });
  };

  const handleAddCredit = () => {
    if (!newCredit.type || !newCredit.credit.name || !albumData) return;
    
    const creditType = newCredit.type as keyof Pick<Album, 'artistCredits' | 'producers' | 'mixEngineers' | 'masteringEngineers'>;
    const currentCredits = albumData[creditType] || [];
    
    setAlbumData({
      ...albumData,
      [creditType]: [...currentCredits, newCredit.credit]
    });
    
    setNewCredit({ type: '', credit: { name: '' } });
    setIsAddingCredit(false);
  };

  const handleRemoveCredit = (type: string, index: number) => {
    if (!albumData) return;
    const creditType = type as keyof Pick<Album, 'artistCredits' | 'producers' | 'mixEngineers' | 'masteringEngineers'>;
    const currentCredits = albumData[creditType] || [];

    setAlbumData({
      ...albumData,
      [creditType]: currentCredits.filter((_, i) => i !== index)
    });
  };

  const handleArtworkChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !id) return;

    setIsUploadingArtwork(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `album-${id}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tracks')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tracks')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('albums')
        .update({ cover_url: publicUrl })
        .eq('id', id);

      if (updateError) throw updateError;

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      setAlbumData(prev => prev ? { ...prev, artworkUrl: cacheBustedUrl } : null);
      setAlbum(prev => prev ? { ...prev, artworkUrl: cacheBustedUrl } : null);
    } catch (err) {
      console.error('Error uploading artwork:', err);
      alert('Failed to upload artwork. Please try again.');
    } finally {
      setIsUploadingArtwork(false);
    }
  };

  const renderCreditList = (credits: CreditShare[]) => (
    <div className="space-y-2">
      {credits.map((credit, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-900">{credit.name}</span>
          <div className="flex items-center gap-4">
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
            {isEditingCredits && (
              <button
                onClick={() => handleRemoveCredit('artistCredits', index)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} />;
  }

  if (!album) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Release Not Found</h2>
        <p className="text-gray-600 mb-8">The release you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/catalog')}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  // Use albumData instead of album for display
  const displayAlbum = albumData || album;

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Add title and artist
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(album.title, doc.internal.pageSize.width / 2, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(album.artist, doc.internal.pageSize.width / 2, 30, { align: 'center' });

    // Add basic info
    let yPos = 50;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Release Information', 14, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const basicInfo = [
      ['Format', album.format],
      ['Release Date', new Date(album.releaseDate).toLocaleDateString()],
      ['Label', album.label || 'N/A'],
      ['Distributor', album.distributor || 'N/A'],
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

    // Add track listing
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Track Listing', 14, yPos);
    yPos += 10;

    const tracks = album.tracks.map(track => [
      track.trackNumber,
      track.title,
      track.duration || 'N/A',
      track.isrc || 'N/A',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Title', 'Duration', 'ISRC']],
      body: tracks,
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
      credits.map(c => `${c.name} ${
        c.masterPercentage ? `(Master: ${c.masterPercentage}%)` : ''
      }${
        c.publishingPercentage ? `(Publishing: ${c.publishingPercentage}%)` : ''
      }`).join('\n');

    const credits = [
      ['Artist', formatCredits(album.artistCredits)],
      ['Producers', formatCredits(album.producers)],
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

    doc.save(`${album.artist} - ${album.title}.pdf`);
  };

  const handleDeleteAlbum = async () => {
    if (!album) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${album.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      if (user && id) {
        const { error } = await supabase
          .from('albums')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      navigate('/catalog');
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Failed to delete album. Please try again.');
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
          <div className="flex gap-6">
            {/* Album Artwork */}
            <div className="w-48 h-48 rounded-lg overflow-hidden bg-gray-100 relative group">
              {displayAlbum.artworkUrl ? (
                <img
                  src={displayAlbum.artworkUrl}
                  alt={`${displayAlbum.title} cover`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img src="/tm-vinil-negro_(2).png" alt="Album" className="w-12 h-12 object-contain opacity-40" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                <input
                  ref={artworkInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleArtworkChange}
                  className="hidden"
                />
                <button
                  onClick={() => artworkInputRef.current?.click()}
                  disabled={isUploadingArtwork}
                  className="px-3 py-1 text-xs text-white bg-black bg-opacity-50 rounded-md hover:bg-opacity-70 disabled:opacity-50"
                >
                  {isUploadingArtwork ? 'Uploading...' : 'Change'}
                </button>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 uppercase">{displayAlbum.format}</span>
              <div className="flex items-center gap-2 mt-1">
                {isEditingAlbum ? (
                  <input
                    type="text"
                    value={displayAlbum.title}
                    onChange={(e) => setAlbumData({ ...displayAlbum, title: e.target.value })}
                    className="text-3xl font-bold text-gray-900 font-title bg-transparent border-b-2 border-primary focus:outline-none"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900 font-title">{displayAlbum.title}</h1>
                )}
                <button
                  onClick={() => isEditingAlbum ? handleSaveAlbum() : setIsEditingAlbum(true)}
                  className="p-1 text-gray-400 hover:text-primary"
                >
                  {isEditingAlbum ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {isEditingAlbum ? (
                  <input
                    type="text"
                    value={displayAlbum.artist}
                    onChange={(e) => setAlbumData({ ...displayAlbum, artist: e.target.value })}
                    className="text-xl text-gray-500 bg-transparent border-b border-gray-300 focus:outline-none focus:border-primary"
                  />
                ) : (
                  <p className="text-xl text-gray-500">{displayAlbum.artist}</p>
                )}
              </div>
              {isEditingAlbum && (
                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Artist Projects
                  </label>
                  <ProjectTagInput
                    value={artistProjects}
                    onChange={setArtistProjects}
                    placeholder="Search projects…"
                    size="sm"
                  />
                </div>
              )}
              <div className="flex items-center gap-4 mt-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  displayAlbum.status === 'Released'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-beige text-black'
                }`}>
                  {displayAlbum.status}
                </span>
                {isEditingAlbum ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Released</span>
                    <input
                      type="date"
                      value={displayAlbum.releaseDate}
                      onChange={(e) => setAlbumData({ ...displayAlbum, releaseDate: e.target.value })}
                      className="text-sm text-gray-500 bg-transparent border-b border-gray-300 focus:outline-none focus:border-primary"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">
                    Released {new Date(displayAlbum.releaseDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const shareData = {
                  title: album.title,
                  text: `Check out ${album.title} by ${album.artist}`,
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
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={handleDeleteAlbum}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Track Listing */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Track Listing</h2>
              <button
                onClick={() => setIsEditingTracks(!isEditingTracks)}
                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-primary hover:text-primary/80"
              >
                {isEditingTracks ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {isEditingTracks ? 'Save Changes' : 'Edit Tracks'}
              </button>
            </div>
            <div className="space-y-2">
              {displayAlbum.tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <button
                    onClick={() => handlePlayPause(track.id)}
                    className="p-2 text-gray-400 hover:text-primary"
                  >
                    {isTrackPlaying(track.id) ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <span className="w-8 text-sm text-gray-500 text-right">
                    {track.trackNumber}.
                  </span>
                  {isEditingTracks && editingTrackId === track.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={track.title}
                        onChange={(e) => {
                          const updatedTracks = displayAlbum.tracks.map(t => 
                            t.id === track.id ? { ...t, title: e.target.value } : t
                          );
                          setAlbumData({ ...displayAlbum, tracks: updatedTracks });
                        }}
                        className="flex-1 text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:border-primary focus:ring-primary"
                      />
                      <input
                        type="text"
                        value={track.duration || ''}
                        onChange={(e) => {
                          const updatedTracks = displayAlbum.tracks.map(t => 
                            t.id === track.id ? { ...t, duration: e.target.value } : t
                          );
                          setAlbumData({ ...displayAlbum, tracks: updatedTracks });
                        }}
                        placeholder="00:00"
                        className="w-16 text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:border-primary focus:ring-primary"
                      />
                      <button
                        onClick={() => setEditingTrackId(null)}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate(`/catalog/track/${track.id}`)}
                        className="flex-1 text-left text-sm text-gray-900 hover:text-primary"
                      >
                        {track.title}
                      </button>
                      <span className="text-sm text-gray-500">{track.duration}</span>
                      {isEditingTracks ? (
                        <button
                          onClick={() => setEditingTrackId(track.id)}
                          className="p-1 text-gray-400 hover:text-primary"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/catalog/track/${track.id}`)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Credits */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Credits</h2>
              <button
                onClick={() => setIsEditingCredits(!isEditingCredits)}
                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-primary hover:text-primary/80"
              >
                {isEditingCredits ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {isEditingCredits ? 'Done Editing' : 'Edit Credits'}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-500">Artist</h3>
                  {isEditingCredits && (
                    <button
                      onClick={() => {
                        setNewCredit({ type: 'artistCredits', credit: { name: '' } });
                        setIsAddingCredit(true);
                      }}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  )}
                </div>
                {renderCreditList(displayAlbum.artistCredits)}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-500">Producers</h3>
                  {isEditingCredits && (
                    <button
                      onClick={() => {
                        setNewCredit({ type: 'producers', credit: { name: '' } });
                        setIsAddingCredit(true);
                      }}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  )}
                </div>
                {renderCreditList(displayAlbum.producers)}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-500">Mix Engineers</h3>
                  {isEditingCredits && (
                    <button
                      onClick={() => {
                        setNewCredit({ type: 'mixEngineers', credit: { name: '' } });
                        setIsAddingCredit(true);
                      }}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  )}
                </div>
                {renderCreditList(displayAlbum.mixEngineers)}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-500">Mastering Engineers</h3>
                  {isEditingCredits && (
                    <button
                      onClick={() => {
                        setNewCredit({ type: 'masteringEngineers', credit: { name: '' } });
                        setIsAddingCredit(true);
                      }}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  )}
                </div>
                {renderCreditList(displayAlbum.masteringEngineers)}
              </div>

              {/* Add Credit Form */}
              {isAddingCredit && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Credit</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={newCredit.credit.name}
                        onChange={(e) => setNewCredit({
                          ...newCredit,
                          credit: { ...newCredit.credit, name: e.target.value }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="Enter name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Master %</label>
                      <input
                        type="number"
                        value={newCredit.credit.masterPercentage || ''}
                        onChange={(e) => setNewCredit({
                          ...newCredit,
                          credit: { ...newCredit.credit, masterPercentage: Number(e.target.value) }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Publishing %</label>
                      <input
                        type="number"
                        value={newCredit.credit.publishingPercentage || ''}
                        onChange={(e) => setNewCredit({
                          ...newCredit,
                          credit: { ...newCredit.credit, publishingPercentage: Number(e.target.value) }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsAddingCredit(false);
                        setNewCredit({ type: '', credit: { name: '' } });
                      }}
                      className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCredit}
                      className="px-3 py-1 text-sm text-white bg-primary rounded hover:bg-primary/90"
                    >
                      Add Credit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Digital Assets */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <DigitalAssetUploader
              assets={digitalAssets}
              onAssetAdd={handleAddAsset}
              onAssetDelete={handleDeleteAsset}
              onAssetUpdate={handleUpdateAsset}
              entityId={album.id}
              entityType="album"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Metadata */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Metadata</h2>
              <button
                onClick={() => setIsEditingMetadata(!isEditingMetadata)}
                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-primary hover:text-primary/80"
              >
                {isEditingMetadata ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {isEditingMetadata ? 'Done Editing' : 'Edit'}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Genres</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {displayAlbum.genres.map((genre) => (
                    <span
                      key={genre}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      {genre}
                      {isEditingMetadata && (
                        <button
                          onClick={() => handleRemoveGenre(genre)}
                          className="ml-1 text-primary/60 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {isEditingMetadata && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newGenre}
                        onChange={(e) => setNewGenre(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddGenre();
                          }
                        }}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:border-primary focus:ring-primary"
                        placeholder="Add genre"
                      />
                      <button
                        onClick={handleAddGenre}
                        className="p-1 text-primary hover:text-primary/80"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Label</h3>
                {isEditingMetadata ? (
                  <input
                    type="text"
                    value={displayAlbum.label || ''}
                    onChange={(e) => setAlbumData({ ...displayAlbum, label: e.target.value })}
                    className="mt-1 block w-full text-sm border border-gray-300 rounded px-2 py-1 focus:border-primary focus:ring-primary"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{displayAlbum.label}</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Distributor</h3>
                {isEditingMetadata ? (
                  <input
                    type="text"
                    value={displayAlbum.distributor || ''}
                    onChange={(e) => setAlbumData({ ...displayAlbum, distributor: e.target.value })}
                    className="mt-1 block w-full text-sm border border-gray-300 rounded px-2 py-1 focus:border-primary focus:ring-primary"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{displayAlbum.distributor}</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">UPC</h3>
                {isEditingMetadata ? (
                  <input
                    type="text"
                    value={displayAlbum.upc || ''}
                    onChange={(e) => setAlbumData({ ...displayAlbum, upc: e.target.value })}
                    className="mt-1 block w-full text-sm border border-gray-300 rounded px-2 py-1 focus:border-primary focus:ring-primary"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{displayAlbum.upc}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Budget Section */}
        <BudgetLinkSection budget={linkedBudget} entityType="album" entityName={displayAlbum.title} />
      </div>
    </div>
  );
}