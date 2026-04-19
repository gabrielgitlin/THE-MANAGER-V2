import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Disc, Calendar, Tag, Globe, DollarSign, TrendingUp, Plus, GripVertical } from 'lucide-react';
import { TMDatePicker } from '../components/ui/TMDatePicker';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Album, CreditShare } from '../types';
import { CATALOG } from '../data/catalog';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useMusicPlayerStore } from '../store/musicPlayerStore';
import DigitalAssetUploader from '../components/catalog/DigitalAssetUploader';
import { listAssets as listDigitalAssets } from '../lib/digitalAssetService';
import LoadingSpinner from '../components/LoadingSpinner';
import { KebabMenu } from '../components/ui/KebabMenu';
import { ContactTagInput, type ContactTag } from '../components/ui/ContactTagInput';
import { syncArtistsToTeam } from '../lib/contacts';


export default function AlbumDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [album, setAlbum] = useState<Album | null>(null);
  const [albumData, setAlbumData] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Inline edit state: null = no field being edited. Double-click a field to edit it.
  type EditableField = 'title' | 'format' | 'artist' | 'releaseDate';
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editDraft, setEditDraft] = useState<string>('');
  const [isEditingTracks, setIsEditingTracks] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedTrackId, setDraggedTrackId] = useState<string | number | null>(null);
  const [activeSpotifyEmbed, setActiveSpotifyEmbed] = useState<string | null>(null);
  const [isEditingCredits, setIsEditingCredits] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editingTrackId, setEditingTrackId] = useState<number | null>(null);
  const [newGenre, setNewGenre] = useState('');
  const [newCredit, setNewCredit] = useState<{ type: string; credit: CreditShare }>({ type: '', credit: { name: '' } });
  const [isAddingCredit, setIsAddingCredit] = useState(false);
  const [isUploadingArtwork, setIsUploadingArtwork] = useState(false);
  const [showStockPicker, setShowStockPicker] = useState(false);
  const artworkInputRef = React.useRef<HTMLInputElement>(null);
  const stockCarouselRef = React.useRef<HTMLDivElement>(null);

  // Inline artist tag editing
  const [isEditingArtist, setIsEditingArtist] = useState(false);
  const [artistEditTags, setArtistEditTags] = useState<ContactTag[]>([]);

  const saveArtistTags = async (tags: ContactTag[]) => {
    if (!album) return;
    const artistStr = tags.map(t => t.name).join(', ');
    const { error } = await supabase.from('albums').update({
      artist: artistStr || 'Unknown Artist',
      artist_contacts: JSON.stringify(tags),
    }).eq('id', album.id);
    if (error) { console.error('Failed to save artist:', error); return; }
    const updated = { ...album, artist: artistStr || 'Unknown Artist', artistTags: tags } as any;
    setAlbum(updated);
    setAlbumData(updated);
    setIsEditingArtist(false);
    if (tags.length > 0) syncArtistsToTeam(tags.map(t => ({ name: t.name, role: 'Artist' })));
  };

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!user) {
        const numericId = Number(id);
        const catalogAlbum = !Number.isNaN(numericId) ? CATALOG.find(a => a.id === numericId) : null;
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
            artwork_url,
            format,
            status,
            spotify_id,
            spotify_url,
            total_tracks,
            genres_array,
            label,
            upc,
            artist_id,
            artist,
            artist_contacts,
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

        const artistName = (albumData as any).artists?.name || (albumData as any).artist || 'Unknown Artist';
        // Parse artist_contacts; fall back to a plain tag from the artist string
        let artistTags: { id?: string; name: string }[] = [];
        try {
          const raw = (albumData as any).artist_contacts;
          if (raw && raw.length > 0) {
            artistTags = typeof raw === 'string' ? JSON.parse(raw) : raw;
          }
        } catch { /* silent */ }
        if (artistTags.length === 0 && artistName && artistName !== 'Unknown Artist') {
          artistTags = [{ name: artistName }];
        }
        const formattedAlbum: Album = {
          id: albumData.id as any,
          title: albumData.title,
          artist: artistName,
          artistTags,
          releaseDate: albumData.release_date,
          artworkUrl: (albumData as any).artwork_url,
          format: albumData.format as 'Album' | 'EP' | 'Single',
          status: albumData.status,
          genres: (albumData as any).genres_array || [],
          label: (albumData as any).label || '',
          distributor: '',
          upc: (albumData as any).upc || '',
          spotifyUrl: (albumData as any).spotify_url,
          tracks: (albumTracks || []).map((at: any) => ({
            id: at.tracks.id as any,
            title: at.tracks.title,
            duration: formatDuration(Number(at.tracks.duration) || 0),
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
      } catch (err: any) {
        console.error('Error fetching album:', err?.message || err, err);
        // Only fall back to mock catalog when id is a numeric mock id;
        // DB albums use UUIDs so Number(id) would be NaN and wipe the state.
        const numericId = Number(id);
        if (!Number.isNaN(numericId)) {
          const catalogAlbum = CATALOG.find(a => a.id === numericId);
          setAlbum(catalogAlbum || null);
          setAlbumData(catalogAlbum || null);
        }
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

  // 3-tier playback:
  //  1. audioUrl (uploaded file or Spotify preview) → play natively
  //  2. spotifyUri only → open Spotify in a new tab
  //  3. neither → button is disabled
  const getTrackPlayMode = (track: { audioUrl?: string; spotifyUri?: string }) => {
    if (track.audioUrl) return 'native' as const;
    if (track.spotifyUri) return 'spotify' as const;
    return 'none' as const;
  };

  const spotifyUriToUrl = (uri: string) => {
    // spotify:track:XXXXX → https://open.spotify.com/track/XXXXX
    const id = uri.replace('spotify:track:', '');
    return `https://open.spotify.com/track/${id}`;
  };

  const handlePlayPause = (trackId: number) => {
    const track = album?.tracks.find(t => t.id === trackId);
    if (!track || !album) return;

    const mode = getTrackPlayMode(track);

    if (mode === 'spotify' && track.spotifyUri) {
      const spotifyId = track.spotifyUri.replace('spotify:track:', '');
      setActiveSpotifyEmbed(prev => prev === spotifyId ? null : spotifyId);
      return;
    }
    setActiveSpotifyEmbed(null);

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

  const isTrackPlaying = (trackId: number) => {
    return tracks[currentTrackIndex]?.id === trackId && isPlayerPlaying;
  };


  // Map a UI field to the corresponding albums table column.
  const FIELD_TO_COLUMN: Record<EditableField, string> = {
    title: 'title',
    format: 'format',
    artist: 'artist', // legacy NOT NULL text column
    releaseDate: 'release_date',
  };

  const beginEditing = (field: EditableField, currentValue: string) => {
    setEditingField(field);
    setEditDraft(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditDraft('');
  };

  const commitEditing = async () => {
    if (!editingField || !albumData) {
      cancelEditing();
      return;
    }
    const field = editingField;
    const column = FIELD_TO_COLUMN[field];
    const rawValue = editDraft.trim();

    // Guard: title, format, and artist are NOT NULL in prod schema. Reject empty saves.
    if ((field === 'title' || field === 'format' || field === 'artist') && !rawValue) {
      cancelEditing();
      return;
    }

    // Optimistic local update, keyed on the React field name.
    const patchLocal: Partial<Album> =
      field === 'releaseDate' ? { releaseDate: rawValue } : { [field]: rawValue } as Partial<Album>;
    setAlbumData({ ...albumData, ...patchLocal });
    cancelEditing();

    // Persist. Only attempt when we have a real DB-backed album (UUID id).
    if (!user || typeof album?.id !== 'string') return;
    const { error } = await supabase
      .from('albums')
      .update({ [column]: rawValue || null })
      .eq('id', album.id);
    if (error) {
      console.error('Error updating album field:', field, error);
      // Roll back optimistic update
      setAlbumData({ ...albumData });
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEditing();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  // ---- Track reorder via drag-and-drop ----
  const handleDragStart = (trackId: string | number) => {
    setDraggedTrackId(trackId);
  };

  const handleDragOver = (e: React.DragEvent, targetTrackNumber: number) => {
    e.preventDefault();
    if (!draggedTrackId || !albumData) return;

    const tracks = [...albumData.tracks];
    const draggedIdx = tracks.findIndex(t => t.id === draggedTrackId);
    const targetIdx = tracks.findIndex(t => t.trackNumber === targetTrackNumber);
    if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) return;

    // Swap track numbers
    const tmpNum = tracks[draggedIdx].trackNumber;
    tracks[draggedIdx] = { ...tracks[draggedIdx], trackNumber: tracks[targetIdx].trackNumber };
    tracks[targetIdx] = { ...tracks[targetIdx], trackNumber: tmpNum };
    tracks.sort((a, b) => a.trackNumber - b.trackNumber);

    setAlbumData({ ...albumData, tracks });
  };

  const handleDragEnd = async () => {
    setDraggedTrackId(null);
    // Persist the new track order to album_tracks in Supabase
    if (!user || !albumData) return;
    for (const track of albumData.tracks) {
      await supabase
        .from('album_tracks')
        .update({ track_number: track.trackNumber })
        .eq('album_id', albumData.id)
        .eq('track_id', track.id);
    }
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
        .update({ artwork_url: publicUrl })
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

  const STOCK_COVERS = [
    '/covers/cover-green.jpg',
    '/covers/cover-dark.jpg',
    '/covers/cover-light.jpg',
  ];

  const handleStockCoverSelect = async (url: string) => {
    if (!id) return;
    try {
      const { error } = await supabase
        .from('albums')
        .update({ artwork_url: url })
        .eq('id', id);
      if (error) throw error;
      setAlbumData(prev => prev ? { ...prev, artworkUrl: url } : null);
      setAlbum(prev => prev ? { ...prev, artworkUrl: url } : null);
      setShowStockPicker(false);
    } catch (err) {
      console.error('Error setting stock cover:', err);
      alert('Failed to set cover. Please try again.');
    }
  };

  const renderCreditList = (credits: CreditShare[]) => (
    <div className="space-y-2">
      {credits.map((credit, index) => (
        <div key={index} className="flex items-center justify-between p-3" style={{ backgroundColor: 'var(--surface-2)' }}>
          <span className="text-sm" style={{ color: 'var(--t1)' }}>{credit.name}</span>
          <div className="flex items-center gap-4">
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
            {isEditingCredits && (
              <button
                onClick={() => handleRemoveCredit('artistCredits', index)}
                className="p-1 hover:text-red-500"
                style={{ color: 'var(--t3)' }}
              >
                <img src="/TM-Close-negro.svg" className="pxi-md icon-muted" alt="Remove" />
              </button>
            )}
          </div>
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

  if (!album) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--t1)' }}>Release Not Found</h2>
        <p className="mb-8" style={{ color: 'var(--t2)' }}>The release you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate(backUrl)}
          className="px-4 py-2 bg-primary text-white hover:bg-primary/90"
        >
          {backLabel}
        </button>
      </div>
    );
  }

  // Use albumData instead of album for display
  const displayAlbum = albumData || album;

  const handleExportPDF = async () => {
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

    // Fetch assets fresh at export time so the PDF always reflects current state.
    let digitalAssetsForPdf: Array<[string, string, string, string, string]> = [];
    try {
      const rows = await listDigitalAssets('album', String(album.id));
      digitalAssetsForPdf = rows.map((a) => [
        a.name,
        a.category.charAt(0).toUpperCase() + a.category.slice(1),
        a.source_type === 'upload' ? formatFileSize(a.file_size || 0) : a.source_type,
        new Date(a.created_at).toLocaleDateString(),
        a.description || 'N/A',
      ]);
    } catch (err) {
      console.warn('Could not fetch assets for PDF export:', err);
    }
    const assets = digitalAssetsForPdf;

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

      navigate(backUrl);
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Failed to delete album. Please try again.');
    }
  };

  const handleExportCSV = () => {
    if (!displayAlbum) return;
    const rows = [
      ['#', 'Title', 'Artist', 'Duration', 'ISRC'],
      ...(displayAlbum.tracks || []).map((t: any, i: number) => [
        String(i + 1),
        t.title || '',
        displayAlbum.artist || '',
        t.duration || '',
        t.isrc || '',
      ]),
    ];
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${displayAlbum.artist} - ${displayAlbum.title}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDuplicateAlbum = async () => {
    if (!album || !user) return;
    try {
      const { data: newAlbum, error: albumErr } = await supabase
        .from('albums')
        .insert({
          title: `Copy of ${album.title}`,
          artist: album.artist || '',
          artist_id: (album as any).artist_id || null,
          user_id: user.id,
          format: album.format,
          status: 'draft',
          release_date: album.releaseDate,
          artwork_url: (album as any).artwork_url || null,
          genres_array: (album as any).genres_array || [],
          label: (album as any).label || null,
        })
        .select()
        .single();
      if (albumErr) throw albumErr;

      for (const track of (displayAlbum?.tracks || [])) {
        const { data: newTrack, error: trackErr } = await supabase
          .from('tracks')
          .insert({
            title: (track as any).title,
            duration: (track as any).duration,
            audio_url: (track as any).audioUrl || null,
            album_id: newAlbum.id,
            user_id: user.id,
            track_number: (track as any).trackNumber || 1,
          })
          .select()
          .single();
        if (trackErr) throw trackErr;
        await supabase.from('album_tracks').insert({
          album_id: newAlbum.id,
          track_id: newTrack.id,
          track_number: (track as any).trackNumber || 1,
          disc_number: 1,
        });
      }
      navigate(`/album/${newAlbum.id}`);
    } catch (err: any) {
      alert(`Failed to duplicate: ${err?.message || 'Unknown error'}`);
    }
  };

  const STATUS_CYCLE: Record<string, string> = {
    draft: 'ready',
    ready: 'released',
    released: 'draft',
    demo: 'draft',
  };

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    ready: 'Ready for Release',
    released: 'Released',
    demo: 'Demo',
  };

  const handleChangeStatus = async () => {
    if (!album || !user || !id) return;
    const current = ((album as any).status || 'draft').toLowerCase();
    const next = STATUS_CYCLE[current] || 'draft';
    try {
      const { error } = await supabase
        .from('albums')
        .update({ status: next })
        .eq('id', id);
      if (error) throw error;
      setAlbum(prev => prev ? { ...prev, status: next } as any : prev);
      setAlbumData(prev => prev ? { ...prev, status: next } as any : prev);
    } catch (err: any) {
      alert(`Failed to update status: ${err?.message}`);
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
          onClick={() => navigate(backUrl)}
          className="flex items-center gap-2 text-sm mb-4 hover:opacity-80"
          style={{ color: 'var(--t2)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          {backLabel}
        </button>
        <div className="flex justify-between items-start">
          <div className="flex gap-6">
            {/* Album Artwork */}
            <div className="w-48 h-48 overflow-hidden relative group" style={{ backgroundColor: 'var(--surface)' }}>
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
              <input
                ref={artworkInputRef}
                type="file"
                accept="image/*"
                onChange={handleArtworkChange}
                className="hidden"
              />
              {/* Hover: "Edit" label */}
              {!showStockPicker && (
                <button
                  onClick={() => setShowStockPicker(true)}
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 text-xs text-white" style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <img src="/TM-Pluma-negro.png" className="pxi-sm icon-white" alt="" />
                    Edit
                  </span>
                </button>
              )}
              {/* Expanded: Upload / Stock picker */}
              {showStockPicker && (
                <div className="absolute inset-0 z-20 flex flex-col" style={{ backgroundColor: 'var(--surface)' }}>
                  <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                      Cover Art
                    </p>
                    <button onClick={() => setShowStockPicker(false)} className="hover:opacity-70">
                      <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="Close" />
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 p-3">
                    <button
                      onClick={() => { artworkInputRef.current?.click(); setShowStockPicker(false); }}
                      disabled={isUploadingArtwork}
                      className="w-full py-2 text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                    >
                      <img src="/TM-Upload-negro.svg" className="pxi-sm icon-white" alt="" />
                      {isUploadingArtwork ? 'Uploading...' : 'Upload Image'}
                    </button>
                    <div className="w-full">
                      <p className="text-xs uppercase tracking-wide mb-2 text-center" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                        Or use stock
                      </p>
                      <div className="relative">
                        <button
                          onClick={() => stockCarouselRef.current?.scrollBy({ left: -72, behavior: 'smooth' })}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-5 h-5 flex items-center justify-center"
                          style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border)' }}
                        >
                          <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-white" alt="" />
                        </button>
                        <div
                          ref={stockCarouselRef}
                          className="flex gap-1.5 overflow-x-auto px-6 justify-center"
                          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                          {STOCK_COVERS.map((url) => (
                            <button
                              key={url}
                              onClick={() => handleStockCoverSelect(url)}
                              className="flex-shrink-0 w-14 h-14 overflow-hidden transition-all duration-[120ms]"
                              style={{
                                border: displayAlbum.artworkUrl === url ? '2px solid var(--brand-1)' : '1px solid var(--border)',
                                opacity: displayAlbum.artworkUrl === url ? 1 : 0.7,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={(e) => { if (displayAlbum.artworkUrl !== url) e.currentTarget.style.opacity = '0.7'; }}
                            >
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => stockCarouselRef.current?.scrollBy({ left: 72, behavior: 'smooth' })}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-5 h-5 flex items-center justify-center"
                          style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border)', transform: 'translateY(-50%) scaleX(-1)' }}
                        >
                          <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-white" alt="" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              {/* Format — double-click to edit */}
              {editingField === 'format' ? (
                <select
                  autoFocus
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onBlur={commitEditing}
                  onKeyDown={handleEditKeyDown}
                  className="text-sm font-medium uppercase bg-transparent border-b border-primary focus:outline-none"
                  style={{ color: 'var(--t2)', backgroundColor: 'var(--surface-2)' }}
                >
                  <option value="Album">Album</option>
                  <option value="EP">EP</option>
                  <option value="Single">Single</option>
                </select>
              ) : (
                <span
                  onDoubleClick={() => beginEditing('format', displayAlbum.format)}
                  className="text-sm font-medium uppercase cursor-text select-none"
                  style={{ color: 'var(--t2)' }}
                  title="Double-click to edit"
                >
                  {displayAlbum.format}
                </span>
              )}

              {/* Title — double-click to edit */}
              <div className="flex items-center gap-2 mt-1">
                {editingField === 'title' ? (
                  <input
                    autoFocus
                    type="text"
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onBlur={commitEditing}
                    onKeyDown={handleEditKeyDown}
                    onFocus={(e) => e.currentTarget.select()}
                    className="text-3xl font-bold font-title bg-transparent border-b-2 border-primary focus:outline-none w-full"
                    style={{ color: 'var(--t1)', backgroundColor: 'transparent' }}
                  />
                ) : (
                  <h1
                    onDoubleClick={() => beginEditing('title', displayAlbum.title)}
                    className="text-3xl font-bold font-title cursor-text select-none"
                    style={{ color: 'var(--t1)' }}
                    title="Double-click to edit"
                  >
                    {displayAlbum.title}
                  </h1>
                )}
              </div>

              {/* Artist */}
              <div className="mt-1">
                {isEditingArtist ? (
                  <div style={{ maxWidth: 360 }}>
                    <ContactTagInput
                      value={artistEditTags}
                      onChange={setArtistEditTags}
                      placeholder="Search or add artist…"
                      preferRole="Artist"
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => saveArtistTags(artistEditTags)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setIsEditingArtist(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1">
                    {((displayAlbum as any).artistTags as { id?: string; name: string }[] | undefined)?.map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 9px',
                          borderRadius: 9999,
                          fontSize: 13,
                          fontWeight: 500,
                          background: tag.id ? 'var(--surface-4)' : 'var(--surface-3)',
                          color: tag.id ? 'var(--t1)' : 'var(--t2)',
                          border: '1px solid var(--border-2)',
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    <button
                      type="button"
                      className="btn-icon"
                      title="Edit artist"
                      onClick={() => {
                        setArtistEditTags(((displayAlbum as any).artistTags as ContactTag[]) ?? []);
                        setIsEditingArtist(true);
                      }}
                      style={{ width: 20, height: 20, minWidth: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={12} style={{ color: 'var(--t3)' }} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  displayAlbum.status === 'Released'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-beige text-black'
                }`}>
                  {displayAlbum.status}
                </span>
                {editingField === 'releaseDate' ? (
                  <TMDatePicker
                    value={editDraft}
                    onChange={(date) => setEditDraft(date)}
                  />
                ) : (
                  <span
                    onDoubleClick={() => beginEditing('releaseDate', displayAlbum.releaseDate)}
                    className="text-sm cursor-text select-none"
                    style={{ color: 'var(--t2)' }}
                    title="Double-click to edit"
                  >
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
              className="btn btn-secondary"
            >
              <img src="/TM-Share-negro.svg" style={{ width: 14, height: 14, filter: 'invert(1)', opacity: 0.6 }} alt="Share" />
              Share
            </button>
            <KebabMenu
              items={[
                {
                  label: 'Export PDF',
                  icon: '/TM-Download-negro.svg',
                  onClick: handleExportPDF,
                },
                {
                  label: 'Export Tracklist as CSV',
                  icon: '/TM-Download-negro.svg',
                  onClick: handleExportCSV,
                },
                {
                  label: `Set Status: ${STATUS_LABELS[STATUS_CYCLE[((album as any).status || 'draft').toLowerCase()] || 'draft']}`,
                  icon: '/TM-Tag-negro.svg',
                  onClick: handleChangeStatus,
                },
                {
                  label: 'Duplicate Album',
                  icon: '/TM-Copy-negro.svg',
                  onClick: handleDuplicateAlbum,
                  dividerBefore: true,
                },
                {
                  label: 'Delete Album',
                  icon: '/TM-Trash-negro.svg',
                  onClick: handleDeleteAlbum,
                  danger: true,
                  dividerBefore: true,
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ color: 'var(--t1)' }}>
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Track Listing */}
          <div className="shadow-md p-6" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>Track Listing</h2>
              <div className="flex items-center gap-2">
                {displayAlbum.tracks.length > 1 && (
                  <button
                    onClick={() => setIsReordering(!isReordering)}
                    className="flex items-center gap-2 px-3 py-1 text-sm font-medium hover:opacity-80"
                    style={{
                      backgroundColor: isReordering ? 'var(--brand-1)' : 'var(--surface-2)',
                      color: isReordering ? '#fff' : 'var(--t2)',
                      border: isReordering ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    <GripVertical className="w-4 h-4" />
                    {isReordering ? 'Done Reordering' : 'Reorder Tracks'}
                  </button>
                )}
                <button
                  onClick={() => setIsEditingTracks(!isEditingTracks)}
                  className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-primary hover:text-primary/80"
                >
                  {isEditingTracks ? <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-white" alt="Save" /> : <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="Edit" />}
                  {isEditingTracks ? 'Save Changes' : 'Edit Tracks'}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {displayAlbum.tracks.map((track) => (
                <React.Fragment key={track.id}>
                <div
                  draggable={isReordering}
                  onDragStart={() => handleDragStart(track.id)}
                  onDragOver={(e) => handleDragOver(e, track.trackNumber)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-4 p-3 transition-colors"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--t1)',
                    cursor: isReordering ? 'grab' : undefined,
                  }}
                >
                  {isReordering && (
                    <GripVertical className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--t3)', cursor: 'grab' }} />
                  )}
                  {(() => {
                    const mode = getTrackPlayMode(track);
                    if (mode === 'none') return (
                      <span className="p-2" style={{ opacity: 0.3 }}>
                        <img src="/pixel-play.svg" alt="Play" className="w-4 h-4" style={{ filter: 'brightness(0) invert(0.6)' }} />
                      </span>
                    );
                    return (
                      <button
                        onClick={() => handlePlayPause(track.id)}
                        className="p-2 hover:opacity-80"
                        title={mode === 'spotify' ? 'Play on Spotify' : isTrackPlaying(track.id) ? 'Pause' : 'Play'}
                      >
                        {mode === 'native' && isTrackPlaying(track.id) ? (
                          <img src="/TM-Pause-negro.svg" className="pxi-md icon-muted" alt="Pause" />
                        ) : (
                          <img src="/pixel-play.svg" alt="Play" className="w-4 h-4" style={{ filter: mode === 'spotify' ? 'brightness(0) saturate(100%) invert(52%) sepia(87%) saturate(520%) hue-rotate(107deg) brightness(97%) contrast(101%)' : 'brightness(0) invert(0.6)' }} />
                        )}
                      </button>
                    );
                  })()}
                  <span className="w-8 text-sm text-right" style={{ color: 'var(--t2)' }}>
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
                        className="flex-1 text-sm border rounded px-2 py-1 focus:border-primary focus:ring-primary"
                        style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
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
                        className="w-16 text-sm border rounded px-2 py-1 focus:border-primary focus:ring-primary"
                        style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                      />
                      <button
                        onClick={() => setEditingTrackId(null)}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-white" alt="Save" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate(`/catalog/track/${track.id}`)}
                        className="flex-1 text-left text-sm hover:text-primary"
                        style={{ color: 'var(--t1)' }}
                      >
                        {track.title}
                      </button>
                      <span className="text-sm" style={{ color: 'var(--t2)' }}>{track.duration}</span>
                      {isEditingTracks ? (
                        <button
                          onClick={() => setEditingTrackId(track.id)}
                          className="p-1 text-gray-400 hover:text-primary" style={{ color: 'var(--t3)' }}
                        >
                          <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="Edit" />
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/catalog/track/${track.id}`)}
                          className="p-1 text-gray-400 hover:text-gray-600" style={{ color: 'var(--t3)' }}
                        >
                          <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="Edit" />
                        </button>
                      )}
                    </>
                  )}
                </div>
                {activeSpotifyEmbed && track.spotifyUri?.includes(activeSpotifyEmbed) && (
                  <iframe
                    src={`https://open.spotify.com/embed/track/${activeSpotifyEmbed}?utm_source=generator&theme=0`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ border: 'none', display: 'block' }}
                    title="Spotify player"
                  />
                )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Credits */}
          <div className="shadow-md p-6" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>Credits</h2>
              <button
                onClick={() => setIsEditingCredits(!isEditingCredits)}
                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-primary hover:text-primary/80"
              >
                {isEditingCredits ? <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-white" alt="Save" /> : <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="Edit" />}
                {isEditingCredits ? 'Done Editing' : 'Edit Credits'}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Artist</h3>
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
          <div className="shadow-md p-6" style={{ backgroundColor: 'var(--surface)' }}>
            <DigitalAssetUploader
              entityId={String(album.id)}
              entityType="album"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Metadata */}
          <div className="shadow-md p-6" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>Metadata</h2>
              <button
                onClick={() => setIsEditingMetadata(!isEditingMetadata)}
                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-primary hover:text-primary/80"
              >
                {isEditingMetadata ? <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-white" alt="Save" /> : <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="Edit" />}
                {isEditingMetadata ? 'Done Editing' : 'Edit'}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Genres</h3>
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
                          <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="Remove" />
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
                <h3 className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Label</h3>
                {isEditingMetadata ? (
                  <input
                    type="text"
                    value={displayAlbum.label || ''}
                    onChange={(e) => setAlbumData({ ...displayAlbum, label: e.target.value })}
                    className="mt-1 block w-full text-sm rounded px-2 py-1 focus:border-primary focus:ring-primary"
                    style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                  />
                ) : (
                  <p className="mt-1 text-sm" style={{ color: 'var(--t1)' }}>{displayAlbum.label}</p>
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

        {/* Budget Section — hidden until v2 */}
      </div>
    </div>
  );
}