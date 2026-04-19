import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ArrowUpRight } from 'lucide-react';
import { TMMonthPicker } from '../components/ui/TMMonthPicker';
import Modal from '../components/Modal';
import CatalogForm from '../components/CatalogForm';
import NewContentSelector from '../components/catalog/NewContentSelector';
import SpotifyImportModal from '../components/catalog/SpotifyImportModal';
import PlaylistsTab from '../components/catalog/PlaylistsTab';
import DemoUploadModal from '../components/catalog/DemoUploadModal';
import DuplicateTrackDialog from '../components/catalog/DuplicateTrackDialog';
import MoveTrackDialog from '../components/catalog/MoveTrackDialog';
import ReplaceAudioDialog from '../components/catalog/ReplaceAudioDialog';
import ExportAudioDialog from '../components/catalog/ExportAudioDialog';
import { KebabMenu } from '../components/ui/KebabMenu';
import CatalogList from './CatalogList';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import type { Album, Track } from '../types';
import { CATALOG } from '../data/catalog';
import { formatDate, formatTime, formatDateTime } from '../lib/utils';
import { isSupabaseReady, supabase } from '../lib/supabase';
import { syncArtistsToTeam } from '../lib/contacts';
import type { ContactTag } from '../components/ui/ContactTagInput';
import { useMusicPlayerStore } from '../store/musicPlayerStore';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Catalog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { playAlbum } = useMusicPlayerStore();
  const { user } = useAuthStore();
  const [catalog, setCatalog] = useState<Album[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewContentModalOpen, setIsNewContentModalOpen] = useState(false);
  const [isSpotifyImportModalOpen, setIsSpotifyImportModalOpen] = useState(false);
  const [isDemoUploadModalOpen, setIsDemoUploadModalOpen] = useState(false);
  const [promotingAlbum, setPromotingAlbum] = useState<{ id: number; title: string } | null>(null);
  const [editingAlbumId, setEditingAlbumId] = useState<number | null>(null);
  const [editingTrackId, setEditingTrackId] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'Single' | 'EP' | 'Album'>('Single');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<'All' | 'Album' | 'EP' | 'Single'>('All');
  const [demoTypeFilter, setDemoTypeFilter] = useState<'all' | 'demo' | 'mix' | 'master' | 'on_hold'>('all');
  const [currentArtistId, setCurrentArtistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialTab = (searchParams.get('tab') as 'catalog' | 'demos' | 'playlists' | 'splits') || 'catalog';
  const [mainTab, setMainTab] = useState<'catalog' | 'demos' | 'playlists' | 'splits'>(initialTab);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataResults, setMetadataResults] = useState<{
    updated: number; failed: number; upcsUpdated: number; creditsAdded: number; usingSpotify: boolean;
    details: { updated: { title: string; isrc: string; source: string }[]; failed: { title: string; reason: string }[]; albumsUpdated: { albumId: string; upc: string }[]; credits: { title: string; count: number }[] };
  } | null>(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showMetadataDetails, setShowMetadataDetails] = useState(false);
  const [showMetadataConfirm, setShowMetadataConfirm] = useState(false);
  const [metadataPreflight, setMetadataPreflight] = useState<{
    tracksWithoutIsrc: number; tracksWithIsrc: number; albumsTotal: number; estimatedSeconds: number;
  } | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    artistTags: [] as ContactTag[],
    genres: [] as string[],
    format: 'Single' as 'Single' | 'EP' | 'Album',
    artistCredits: [] as string[],
    producers: [] as string[],
    songwriters: [] as string[],
    mixEngineers: [] as string[],
    masteringEngineers: [] as string[],
    newGenre: '',
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Inline notes state
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});

  // Track-level modal state
  const [trackModal, setTrackModal] = useState<{
    type: 'duplicate' | 'move' | 'replace-audio' | 'export';
    trackId: string;
    albumId: string;
    trackTitle: string;
    audioUrl?: string;
    audioVersions?: { url: string; filename: string; uploaded_at: string; is_active: boolean }[];
  } | null>(null);

  // Demo status / hold modal state
  const [holdModal, setHoldModal] = useState<{
    type: 'project' | 'track';
    id: number | string;
    albumId?: string;
    currentHoldUntil?: string;
  } | null>(null);
  const [holdDate, setHoldDate] = useState('');

  useEffect(() => {
    const fetchDefaultArtist = async () => {
      if (!user) return;

      const { data: artists } = await supabase
        .from('artists')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (artists) {
        setCurrentArtistId(artists.id);
      }
    };

    fetchDefaultArtist();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'artwork' | 'lyrics') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'audio') {
        setAudioFile(file);
      } else if (type === 'artwork') {
        setArtworkFile(file);
      }
      // Ignore lyrics for now
    }
  };

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      // Upload audio file if provided
      let audioUrl = null;
      if (audioFile) {
        const audioPath = `audio/${user.id}/${Date.now()}_${audioFile.name}`;

        const { error: audioError } = await supabase.storage
          .from('tracks')
          .upload(audioPath, audioFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (audioError) throw audioError;

        const { data: { publicUrl } } = supabase.storage
          .from('tracks')
          .getPublicUrl(audioPath);

        audioUrl = publicUrl;
      }

      // Upload artwork if provided
      let coverUrl = null;
      if (artworkFile) {
        const artworkPath = `artwork/${user.id}/${Date.now()}_${artworkFile.name}`;

        const { error: artworkError } = await supabase.storage
          .from('tracks')
          .upload(artworkPath, artworkFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (artworkError) throw artworkError;

        const { data: { publicUrl } } = supabase.storage
          .from('tracks')
          .getPublicUrl(artworkPath);

        coverUrl = publicUrl;
      }

      // Create or get artist
      let artistId = currentArtistId;

      // If artist name is provided, find or create that artist
      if (formData.artist) {
        const { data: existingArtist } = await supabase
          .from('artists')
          .select('id')
          .eq('name', formData.artist)
          .maybeSingle();

        if (existingArtist) {
          artistId = existingArtist.id;
        } else {
          const { data: newArtist, error: artistError } = await supabase
            .from('artists')
            .insert({ name: formData.artist })
            .select('id')
            .single();

          if (artistError) throw artistError;
          artistId = newArtist.id;
        }
      }

      // If still no artist ID, create a default one
      if (!artistId) {
        const { data: newArtist, error: artistError } = await supabase
          .from('artists')
          .insert({ name: 'Unknown Artist' })
          .select('id')
          .single();

        if (artistError) throw artistError;
        artistId = newArtist.id;
      }

      // Create album first (albums have artist_id, tracks have album_id)
      const { data: album, error: albumError } = await supabase
        .from('albums')
        .insert({
          title: formData.title,
          artist_id: artistId,
          artist: formData.artist || 'Unknown Artist',
          artist_contacts: JSON.stringify(formData.artistTags),
          user_id: user.id,
          format: formData.format,
          artwork_url: coverUrl,
          release_date: new Date().toISOString().split('T')[0],
          status: mainTab === 'demos' ? 'demo' : 'draft',
        })
        .select()
        .single();

      if (albumError) {
        console.error('Album error:', albumError);
        throw albumError;
      }

      // Create track with album_id
      const { data: track, error: trackError } = await supabase
        .from('tracks')
        .insert({
          title: formData.title,
          audio_url: audioUrl,
          album_id: album.id,
          track_number: 1,
        })
        .select()
        .single();

      if (trackError) {
        console.error('Track error:', trackError);
        throw trackError;
      }

      // Link track to album via junction table
      const { error: linkError } = await supabase
        .from('album_tracks')
        .insert({
          album_id: album.id,
          track_id: track.id,
          track_number: 1,
          disc_number: 1,
        });

      if (linkError) {
        console.error('Link error:', linkError);
        throw linkError;
      }

      // Sync all credited artists/collaborators to the Team database (silent, non-blocking)
      syncArtistsToTeam([
        ...formData.artistTags.map((t: ContactTag) => ({ name: t.name, role: 'Artist' })),
        ...(formData.artistCredits ?? []).map((n: string) => ({ name: n, role: 'Artist' })),
        ...(formData.producers ?? []).map((n: string) => ({ name: n, role: 'Producer' })),
        ...(formData.songwriters ?? []).map((n: string) => ({ name: n, role: 'Songwriter' })),
        ...(formData.mixEngineers ?? []).map((n: string) => ({ name: n, role: 'Mix Engineer' })),
        ...(formData.masteringEngineers ?? []).map((n: string) => ({ name: n, role: 'Mastering Engineer' })),
      ]);

      // Reset form and close modal
      setFormData({
        title: '',
        artist: '',
        artistTags: [],
        genres: [],
        format: 'Single',
        artistCredits: [],
        producers: [],
        songwriters: [],
        mixEngineers: [],
        masteringEngineers: [],
        newGenre: '',
      });
      setAudioFile(null);
      setArtworkFile(null);
      setIsModalOpen(false);

      // Refresh catalog
      await fetchCatalog();

    } catch (error: any) {
      console.error('Error saving track:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const errorMessage = error?.message || error?.error_description || 'Failed to save track. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchCatalog = async () => {
    if (!user) {
      setCatalog([...CATALOG].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: albums, error: albumsError } = await supabase
        .from('albums')
        .select(`
          id,
          title,
          release_date,
          artwork_url,
          format,
          status,
          demo_status,
          hold_until,
          artist_id,
          artist,
          artist_contacts,
          notes,
          artists (
            name
          )
        `)
        .order('release_date', { ascending: false });

      if (albumsError) throw albumsError;

      const albumsWithTracks = await Promise.all(
        (albums || []).map(async (album) => {
          const { data: albumTracks } = await supabase
            .from('album_tracks')
            .select(`
              track_number,
              disc_number,
              tracks (
                id,
                title,
                duration,
                audio_url,
                preview_url,
                spotify_id,
                notes,
                audio_versions,
                demo_status,
                hold_until
              )
            `)
            .eq('album_id', album.id)
            .order('disc_number', { ascending: true })
            .order('track_number', { ascending: true });

          const artistName = (album as any).artists?.name || (album as any).artist || 'Unknown Artist';
          // Parse artist_contacts jsonb; fall back to a plain tag from the artist string
          let artistTags: ContactTag[] = [];
          try {
            const raw = (album as any).artist_contacts;
            if (raw && raw.length > 0) {
              artistTags = typeof raw === 'string' ? JSON.parse(raw) : raw;
            }
          } catch { /* silent */ }
          if (artistTags.length === 0 && artistName && artistName !== 'Unknown Artist') {
            artistTags = [{ name: artistName }];
          }
          return {
            id: album.id as any,
            title: album.title,
            artist: artistName,
            artistTags,
            releaseDate: album.release_date,
            artworkUrl: (album as any).artwork_url,
            format: album.format as 'Album' | 'EP' | 'Single',
            status: album.status,
            demo_status: (album as any).demo_status ?? null,
            hold_until: (album as any).hold_until ?? null,
            notes: (album as any).notes ?? undefined,
            tracks: (albumTracks || []).filter((at: any) => at.tracks != null).map((at: any) => ({
              id: at.tracks.id as any,
              title: at.tracks.title,
              duration: formatDuration(at.tracks.duration || 0),
              trackNumber: at.track_number,
              artist: artistName,
              audioUrl: at.tracks.audio_url || at.tracks.preview_url || undefined,
              spotifyId: at.tracks.spotify_id || undefined,
              notes: at.tracks.notes ?? undefined,
              audioVersions: at.tracks.audio_versions ?? [],
              demo_status: at.tracks.demo_status ?? null,
              hold_until: at.tracks.hold_until ?? null,
            })),
          };
        })
      );

      setCatalog(albumsWithTracks);
    } catch (err: any) {
      console.error('Error fetching catalog:', err?.message || err, err);
      setCatalog([...CATALOG].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateTotalDuration = (tracks: Track[]): number => {
    return tracks.reduce((total, track) => {
      const [mins, secs] = track.duration.split(':').map(Number);
      return total + (mins * 60) + secs;
    }, 0);
  };

  const formatTotalMinutes = (totalSeconds: number): string => {
    return Math.floor(totalSeconds / 60).toString();
  };

  const catalogItems = catalog.filter(item => item.status !== 'demo');
  const demoItems = catalog.filter(item => item.status === 'demo');

  const albumCount = catalogItems.filter(item => item.format === 'Album').length;
  const epCount = catalogItems.filter(item => item.format === 'EP').length;
  const singleCount = catalogItems.filter(item => item.format === 'Single').length;

  const demoTypeCount = demoItems.filter(item => (item as any).demo_status === 'demo').length;
  const mixCount = demoItems.filter(item => (item as any).demo_status === 'mix').length;
  const masterCount = demoItems.filter(item => (item as any).demo_status === 'master').length;
  const onHoldCount = demoItems.filter(item => (item as any).demo_status === 'on_hold').length;

  const handlePromoteToCatalog = async (albumId: number, format: 'Single' | 'EP' | 'Album') => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('albums')
        .update({ status: 'draft', format })
        .eq('id', albumId);
      if (error) throw error;
      setPromotingAlbum(null);
      await fetchCatalog();
    } catch (err: any) {
      console.error('Error promoting project:', err);
      alert('Failed to move project to catalog.');
    }
  };

  const handleDeleteDemo = async (albumId: number) => {
    if (!user) return;
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      // Delete junction rows first, then tracks, then album
      const { data: albumTracks } = await supabase
        .from('album_tracks')
        .select('track_id')
        .eq('album_id', albumId);

      await supabase.from('album_tracks').delete().eq('album_id', albumId);

      if (albumTracks?.length) {
        const trackIds = albumTracks.map((at: any) => at.track_id);
        await supabase.from('tracks').delete().in('id', trackIds);
      }

      const { error } = await supabase.from('albums').delete().eq('id', albumId);
      if (error) throw error;

      await fetchCatalog();
    } catch (err: any) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project.');
    }
  };

  const handleSetProjectStatus = async (albumId: number, format: 'demo' | 'mix' | 'master' | 'on_hold' | null, holdUntil?: string) => {
    try {
      const trackUpdate: Record<string, unknown> = { demo_status: format, hold_until: null };
      const albumUpdate: Record<string, unknown> = { demo_status: format, hold_until: null };
      if (format === 'on_hold') {
        albumUpdate.hold_until = holdUntil || null;
        trackUpdate.hold_until = holdUntil || null;
      }

      // Update the album
      const { error: albumError } = await supabase.from('albums').update(albumUpdate).eq('id', albumId);
      if (albumError) throw albumError;

      // Get all track IDs for this album and update them too
      const { data: albumTracks, error: atError } = await supabase
        .from('album_tracks')
        .select('track_id')
        .eq('album_id', albumId);
      if (atError) throw atError;

      if (albumTracks && albumTracks.length > 0) {
        const trackIds = albumTracks.map((at: any) => at.track_id);
        const { error: tracksError } = await supabase
          .from('tracks')
          .update(trackUpdate)
          .in('id', trackIds);
        if (tracksError) throw tracksError;
      }

      await fetchCatalog();
    } catch (err: any) {
      console.error('Error setting project status:', err);
      alert('Failed to update status.');
    }
  };

  const handleSetTrackStatus = async (trackId: string, format: 'demo' | 'mix' | 'master' | 'on_hold' | null, holdUntil?: string) => {
    try {
      const update: Record<string, unknown> = { demo_status: format, hold_until: null };
      if (format === 'on_hold') {
        update.hold_until = holdUntil || null;
      }
      const { error } = await supabase.from('tracks').update(update).eq('id', trackId);
      if (error) throw error;
      await fetchCatalog();
    } catch (err: any) {
      console.error('Error setting track status:', err);
      alert('Failed to update status.');
    }
  };

  const handleNewContentSelect = (type: 'song' | 'ep' | 'album') => {
    setSelectedFormat(type === 'song' ? 'Single' : type === 'ep' ? 'EP' : 'Album');
    setIsNewContentModalOpen(false);
    setIsModalOpen(true);
  };

  const toggleNotes = (key: string, initialValue?: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        // Initialize note value if not already set
        if (!(key in noteValues)) {
          setNoteValues(v => ({ ...v, [key]: initialValue ?? '' }));
        }
      }
      return next;
    });
  };

  const handleSaveNote = async (key: string) => {
    if (!user) return;
    const value = noteValues[key] ?? '';
    const [type, id] = key.split('-', 2);
    try {
      if (type === 'album') {
        await supabase.from('albums').update({ notes: value }).eq('id', id);
      } else if (type === 'track') {
        await supabase.from('tracks').update({ notes: value }).eq('id', id);
      }
      // Optimistically update local catalog
      setCatalog(prev => prev.map(album => {
        if (type === 'album' && String(album.id) === id) {
          return { ...album, notes: value };
        }
        return {
          ...album,
          tracks: album.tracks.map((t: any) => {
            if (type === 'track' && String(t.id) === id) {
              return { ...t, notes: value };
            }
            return t;
          }),
        };
      }));
    } catch (err: any) {
      console.error('Error saving note:', err);
    }
  };

  const handleDuplicateAlbum = async (album: any) => {
    if (!user) return;
    try {
      // Create new album
      const { data: newAlbum, error: albumErr } = await supabase
        .from('albums')
        .insert({
          title: `Copy of ${album.title}`,
          artist: album.artist,
          format: album.format,
          status: album.status,
          user_id: user.id,
          release_date: album.releaseDate,
          artwork_url: album.artworkUrl,
          notes: album.notes,
        })
        .select('id')
        .single();
      if (albumErr) throw albumErr;

      // Duplicate each track and link it
      for (let i = 0; i < album.tracks.length; i++) {
        const track = album.tracks[i] as any;
        const { data: newTrack, error: trackErr } = await supabase
          .from('tracks')
          .insert({
            title: track.title,
            audio_url: track.audioUrl,
            album_id: newAlbum.id,
            notes: track.notes,
            audio_versions: track.audioVersions ?? [],
            user_id: user.id,
          })
          .select('id')
          .single();
        if (trackErr) throw trackErr;

        await supabase.from('album_tracks').insert({
          album_id: newAlbum.id,
          track_id: newTrack.id,
          track_number: track.trackNumber ?? i + 1,
          disc_number: 1,
        });
      }

      await fetchCatalog();
    } catch (err: any) {
      console.error('Error duplicating album:', err);
      alert('Failed to duplicate album.');
    }
  };

  const handleDeleteTrack = async (trackId: string, albumId: string, audioUrl?: string) => {
    if (!window.confirm('Delete this track? This cannot be undone.')) return;
    try {
      // Delete from album_tracks
      await supabase.from('album_tracks').delete().eq('track_id', trackId).eq('album_id', albumId);
      // Delete track record
      await supabase.from('tracks').delete().eq('id', trackId);
      // Delete from storage if we have a URL
      if (audioUrl) {
        const marker = '/public/tracks/';
        const idx = audioUrl.indexOf(marker);
        if (idx !== -1) {
          const storagePath = audioUrl.slice(idx + marker.length);
          await supabase.storage.from('tracks').remove([storagePath]);
        }
      }
      await fetchCatalog();
    } catch (err: any) {
      console.error('Error deleting track:', err);
      alert('Failed to delete track.');
    }
  };

  const handlePreflightCheck = async () => {
    if (!user) return;
    try {
      const [
        { count: tracksWithoutIsrc },
        { count: tracksWithIsrc },
        { count: albumsTotal },
      ] = await Promise.all([
        supabase.from('tracks').select('*', { count: 'exact', head: true }).or('isrc.is.null,isrc.eq.'),
        supabase.from('tracks').select('*', { count: 'exact', head: true }).not('isrc', 'is', null).neq('isrc', ''),
        supabase.from('albums').select('*', { count: 'exact', head: true }),
      ]);
      const tw = tracksWithoutIsrc ?? 0;
      const ti = tracksWithIsrc ?? 0;
      const al = albumsTotal ?? 0;
      // Phase 1 (ISRC via Spotify): ~0.3s/track; Phase 2 (credits via MusicBrainz): ~2.2s/track; Phase 3 (albums via Spotify): ~0.5s/album
      const estimatedSeconds = tw * 0.3 + ti * 2.2 + al * 0.5;
      setMetadataPreflight({ tracksWithoutIsrc: tw, tracksWithIsrc: ti, albumsTotal: al, estimatedSeconds });
      setShowMetadataConfirm(true);
    } catch {
      // If pre-flight fails, just run directly
      handleFetchMetadata();
    }
  };

  const handleFetchMetadata = async () => {
    if (!user) return;
    setIsFetchingMetadata(true);
    setMetadataResults(null);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-isrc-codes', { body: {} });
      if (error) throw error;
      setMetadataResults(data);
      setShowMetadataModal(true);
      setShowMetadataDetails(false);
    } catch (err: any) {
      alert('Failed to fetch metadata. Please try again.');
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const formatEstimatedTime = (seconds: number) => {
    if (seconds < 90) return `~${Math.round(seconds)}s`;
    const mins = Math.round(seconds / 60);
    return `~${mins} min${mins !== 1 ? 's' : ''}`;
  };

  return (
    <div>
      <div className="sub-tabs mb-6">
        <button className={`sub-tab ${mainTab === 'catalog' ? 'active' : ''}`} onClick={() => { setMainTab('catalog'); setDemoTypeFilter('all'); }}>
          Catalog
        </button>
        <button className={`sub-tab ${mainTab === 'demos' ? 'active' : ''}`} onClick={() => setMainTab('demos')}>
          Demos
        </button>
        <button className={`sub-tab ${mainTab === 'playlists' ? 'active' : ''}`} onClick={() => setMainTab('playlists')}>
          Playlists
        </button>
        <button className={`sub-tab ${mainTab === 'splits' ? 'active' : ''}`} onClick={() => setMainTab('splits')}>
          Splits
        </button>
      </div>

      {(mainTab === 'catalog' || mainTab === 'demos') && (
        <>
          <div className="flex items-center justify-between mb-6">
            {mainTab === 'catalog' ? (
              <>
                <div className="sub-tabs" style={{ borderBottom: 'none' }}>
                  {(['All', 'Album', 'EP', 'Single'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      className={`sub-tab ${formatFilter === fmt ? 'active' : ''}`}
                      onClick={() => setFormatFilter(fmt)}
                      style={{ borderBottom: 'none' }}
                    >
                      {fmt === 'All' ? 'All' : fmt === 'Album' ? 'Albums' : fmt === 'EP' ? 'EPs' : 'Singles'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--t3)' }}>
                  <span><span className="font-semibold" style={{ color: 'var(--t1)' }}>{albumCount}</span> Albums</span>
                  <span style={{ color: 'var(--t2)' }}>|</span>
                  <span><span className="font-semibold" style={{ color: 'var(--t1)' }}>{epCount}</span> EPs</span>
                  <span style={{ color: 'var(--t2)' }}>|</span>
                  <span><span className="font-semibold" style={{ color: 'var(--t1)' }}>{singleCount}</span> Singles</span>
                </div>
              </>
            ) : (
              <>
                <div className="sub-tabs" style={{ borderBottom: 'none' }}>
                  {(['all', 'demo', 'mix', 'master', 'on_hold'] as const).map((type) => (
                    <button
                      key={type}
                      className={`sub-tab ${demoTypeFilter === type ? 'active' : ''}`}
                      onClick={() => setDemoTypeFilter(type)}
                      style={{ borderBottom: 'none' }}
                    >
                      {type === 'all' ? 'All' : type === 'demo' ? 'Demos' : type === 'mix' ? 'Mixes' : type === 'master' ? 'Masters' : 'On Hold'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--t3)' }}>
                  <span><span className="font-semibold" style={{ color: 'var(--t1)' }}>{demoTypeCount}</span> Demos</span>
                  <span style={{ color: 'var(--t2)' }}>|</span>
                  <span><span className="font-semibold" style={{ color: 'var(--t1)' }}>{mixCount}</span> Mixes</span>
                  <span style={{ color: 'var(--t2)' }}>|</span>
                  <span><span className="font-semibold" style={{ color: 'var(--t1)' }}>{masterCount}</span> Masters</span>
                  <span style={{ color: 'var(--t2)' }}>|</span>
                  <span><span className="font-semibold" style={{ color: 'var(--t1)' }}>{onHoldCount}</span> On Hold</span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {mainTab === 'splits' ? (
        <CatalogList embedded />
      ) : mainTab === 'playlists' ? (
        <PlaylistsTab />
      ) : (
        <div>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              {/* Search bar — grows to fill space */}
              <div className="relative flex-1">
                <img
                  src="/TM-Search-negro.svg"
                  className="pxi-md icon-muted"
                  alt="Search"
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  placeholder={mainTab === 'demos' ? 'Search projects…' : 'Search albums, tracks…'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: 34,
                    paddingRight: 10,
                    paddingTop: 7,
                    paddingBottom: 7,
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--t1)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Add */}
              <button
                onClick={() => mainTab === 'demos' ? setIsDemoUploadModalOpen(true) : setIsNewContentModalOpen(true)}
                className="btn btn-icon btn-secondary"
                title={mainTab === 'demos' ? 'Add Demo' : 'Add'}
              >
                <Plus className="w-4 h-4" style={{ color: 'var(--t2)' }} />
              </button>

              {/* Import — Spotify catalog + metadata enrichment */}
              {mainTab === 'catalog' && (
                <button
                  onClick={() => setIsSpotifyImportModalOpen(true)}
                  disabled={isFetchingMetadata || !currentArtistId}
                  className="btn btn-icon btn-secondary"
                  title="Import catalog & metadata from Spotify"
                >
                  <img
                    src="/TM-Download-negro.svg"
                    className={`pxi-md icon-muted${isFetchingMetadata ? ' animate-spin' : ''}`}
                    alt="Import"
                  />
                </button>
              )}

              {/* Release date filter — catalog tab only */}
              {mainTab === 'catalog' && (
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setFilterOpen(o => !o)}
                    title="Filter by release date"
                    className="btn btn-icon btn-secondary"
                    style={dateFrom || dateTo ? { borderColor: 'var(--brand-1)' } : {}}
                  >
                    <img src="/TM-Filter-negro.svg" className={`pxi-md ${dateFrom || dateTo ? 'icon-green' : 'icon-muted'}`} alt="Filter" />
                  </button>

                  {filterOpen && (
                    <div
                      className="absolute right-0 top-full mt-1 z-50 p-4"
                      style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-2)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: 220, maxHeight: '80vh', overflowY: 'auto' }}
                    >
                      <div className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>
                        Release Date
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t4)' }}>From</div>
                          <TMMonthPicker value={dateFrom} onChange={v => setDateFrom(prev => prev === v ? '' : v)} />
                        </div>
                        <div>
                          <div className="mb-1" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t4)' }}>To</div>
                          <TMMonthPicker value={dateTo} onChange={v => setDateTo(prev => prev === v ? '' : v)} />
                        </div>
                      </div>
                      {(dateFrom || dateTo) && (
                        <button
                          onClick={() => { setDateFrom(''); setDateTo(''); }}
                          className="mt-2 w-full btn btn-ghost btn-sm"
                          style={{ fontSize: 11 }}
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Metadata fetch loading strip */}
          {isFetchingMetadata && (
            <div className="flex items-center gap-2 px-6 py-2 text-xs" style={{ backgroundColor: 'var(--surface-2)', borderBottom: '1px solid var(--border)', color: 'var(--t2)' }}>
              <img src="/TM-Refresh-negro.svg" className="pxi-sm icon-muted animate-spin" alt="" />
              Looking for metadata…
            </div>
          )}

          <div style={{ borderColor: 'var(--border)' }}>
            {isLoading ? (
              <LoadingSpinner fullScreen={false} />
            ) : (mainTab === 'demos' ? demoItems : catalogItems).length === 0 ? (
              <div className="p-12 text-center">
                <img src="/tm-vinil-negro_(2).png" alt={mainTab === 'demos' ? 'Demos' : 'Catalog'} className="mx-auto h-12 w-12 object-contain opacity-40" />
                <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--t1)' }}>
                  {mainTab === 'demos' ? 'No projects yet' : 'No albums yet'}
                </h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--t3)' }}>
                  {mainTab === 'demos'
                    ? 'Add projects to track works in progress before they are released.'
                    : 'Get started by adding a new album or importing from Spotify.'}
                </p>
              </div>
            ) : (mainTab === 'demos'
                ? demoItems.filter(album => {
                    const s = searchTerm.toLowerCase();
                    const matchesType = demoTypeFilter === 'all' ||
                      (album as any).demo_status === demoTypeFilter ||
                      album.tracks.some((t: any) => t.demo_status === demoTypeFilter);
                    const matchesSearch = !s || album.title.toLowerCase().includes(s) || album.artist.toLowerCase().includes(s) ||
                      album.tracks.some((t: any) => t.title.toLowerCase().includes(s));
                    return matchesType && matchesSearch;
                  })
                : catalogItems.filter(album => {
                    const s = searchTerm.toLowerCase();
                    const matchesFormat = formatFilter === 'All' || album.format === formatFilter;
                    const matchesSearch = !s || album.title.toLowerCase().includes(s) || album.artist.toLowerCase().includes(s) ||
                      album.tracks.some((t: any) => t.title.toLowerCase().includes(s));
                    const matchesDate =
                      (!dateFrom || (album.releaseDate || '') >= dateFrom + '-01') &&
                      (!dateTo   || (album.releaseDate || '') <= dateTo   + '-31');
                    return matchesFormat && matchesSearch && matchesDate;
                  })
              ).map((album) => (
              <div key={album.id} className="p-6">
                <div className="flex items-start gap-6 mb-4">
                  <div className="flex-shrink-0 w-48">
                    <div className="w-48 h-48 relative group mb-2">
                      {album.artworkUrl ? (
                        <>
                          <button
                            onClick={() => setLightboxUrl(album.artworkUrl || null)}
                            className="w-full h-full overflow-hidden transition-transform duration-200 group-hover:scale-105"
                            style={{ backgroundColor: 'var(--surface-2)' }}
                          >
                            <img
                              src={album.artworkUrl}
                              alt={`${album.title} cover`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playAlbum(album.tracks.map(t => ({ ...t, coverArt: album.artworkUrl })));
                            }}
                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                            style={{ background: 'none', border: 'none', padding: 0, lineHeight: 0 }}
                          >
                            <img src="/pixel-play.svg" alt="Play" className="w-12 h-12" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-full h-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--surface-2)' }}>
                            <img src="/tm-vinil-negro_(2).png" alt="Album" className="w-8 h-8 object-contain opacity-40" />
                          </div>
                          {album.tracks.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playAlbum(album.tracks.map(t => ({ ...t, coverArt: album.artworkUrl })));
                              }}
                              className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                              style={{ background: 'none', border: 'none', padding: 0, lineHeight: 0 }}
                            >
                              <img src="/pixel-play.svg" alt="Play" className="w-12 h-12" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-center uppercase tracking-wide" style={{ color: 'var(--t3)' }}>
                      {album.tracks.length} {album.tracks.length === 1 ? 'song' : 'songs'}, {formatTotalMinutes(calculateTotalDuration(album.tracks))} minutes
                    </p>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button
                          onClick={() => navigate(`/catalog/album/${album.id}`)}
                          className="text-lg font-medium"
                          style={{ color: 'var(--t1)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t1)')}
                        >
                          {album.title}
                        </button>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {((album as any).artistTags as ContactTag[]).map((tag: ContactTag, i: number) => (
                            <span
                              key={i}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '1px 7px',
                                borderRadius: 9999,
                                fontSize: 11,
                                fontWeight: 500,
                                background: tag.id ? 'var(--surface-4)' : 'var(--surface-3)',
                                color: tag.id ? 'var(--t1)' : 'var(--t2)',
                                border: '1px solid var(--border-2)',
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                        {mainTab === 'demos' ? (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {(() => {
                              const fmt = (album as any).demo_status;
                              if (fmt === 'demo') return <span className="status-badge badge-neutral">Demo</span>;
                              if (fmt === 'mix') return <span className="status-badge badge-blue">Mix</span>;
                              if (fmt === 'master') return <span className="status-badge" style={{ backgroundColor: 'rgba(44,110,142,0.18)', color: '#5ba8c8', border: '1px solid rgba(91,168,200,0.3)' }}>Master</span>;
                              if (fmt === 'on_hold') return (
                                <span className="status-badge badge-yellow">
                                  Hold{(album as any).hold_until ? ` · ${formatDate((album as any).hold_until)}` : ''}
                                </span>
                              );
                              return null;
                            })()}
                            <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--t3)' }}>
                              Added {formatDate(album.releaseDate)}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
                            Released {formatDate(album.releaseDate)}
                          </p>
                        )}
                      </div>
                      <KebabMenu items={[
                        {
                          label: 'Notes',
                          icon: '/TM-File-negro.svg',
                          onClick: () => toggleNotes(`album-${album.id}`, (album as any).notes ?? ''),
                        },
                        {
                          label: 'Duplicate',
                          icon: '/TM-Copy-negro.svg',
                          onClick: () => handleDuplicateAlbum(album),
                        },
                        ...(mainTab === 'demos' ? [
                          {
                            label: 'Move to Catalog',
                            icon: '/TM-ExternalLink-negro.svg',
                            onClick: () => setPromotingAlbum({ id: album.id, title: album.title }),
                          },
                          { label: 'Status', isHeader: true, dividerBefore: true, onClick: () => {} },
                          {
                            label: 'Demo',
                            icon: '/TM-Mic-negro.svg',
                            active: (album as any).demo_status === 'demo',
                            onClick: () => handleSetProjectStatus(album.id, (album as any).demo_status === 'demo' ? null : 'demo'),
                          },
                          {
                            label: 'Mix',
                            icon: '/TM-Settings-negro.svg',
                            active: (album as any).demo_status === 'mix',
                            onClick: () => handleSetProjectStatus(album.id, (album as any).demo_status === 'mix' ? null : 'mix'),
                          },
                          {
                            label: 'Master',
                            icon: '/The Manager_Iconografia-11.svg',
                            active: (album as any).demo_status === 'master',
                            onClick: () => handleSetProjectStatus(album.id, (album as any).demo_status === 'master' ? null : 'master'),
                          },
                          {
                            label: 'Hold',
                            icon: '/TM-Alert-negro.svg',
                            active: (album as any).demo_status === 'on_hold',
                            onClick: () => {
                              if ((album as any).demo_status === 'on_hold') {
                                handleSetProjectStatus(album.id, null);
                              } else {
                                setHoldDate((album as any).hold_until ?? '');
                                setHoldModal({ type: 'project', id: album.id, currentHoldUntil: (album as any).hold_until });
                              }
                            },
                          },
                        ] : []),
                        {
                          label: 'Delete',
                          icon: '/TM-Trash-negro.svg',
                          danger: true,
                          dividerBefore: true,
                          onClick: () => handleDeleteDemo(album.id),
                        },
                      ]} />
                    </div>

                    {/* Album inline notes */}
                    {expandedNotes.has(`album-${album.id}`) && (
                      <div style={{ marginTop: 12, marginBottom: 4 }}>
                        <textarea
                          autoFocus
                          value={noteValues[`album-${album.id}`] ?? (album as any).notes ?? ''}
                          onChange={e => setNoteValues(v => ({ ...v, [`album-${album.id}`]: e.target.value }))}
                          onBlur={() => handleSaveNote(`album-${album.id}`)}
                          placeholder="Add notes…"
                          rows={3}
                          style={{
                            width: '100%',
                            background: 'var(--surface-3)',
                            border: '1px solid var(--border-2)',
                            color: 'var(--t1)',
                            fontSize: 13,
                            padding: '8px 10px',
                            resize: 'vertical',
                            outline: 'none',
                            fontFamily: 'inherit',
                            lineHeight: 1.5,
                          }}
                        />
                      </div>
                    )}

                    <div className="space-y-1 mt-4">
                      {album.tracks.filter(track =>
                        mainTab !== 'demos' || demoTypeFilter === 'all' || (track as any).demo_status === demoTypeFilter
                      ).map((track) => (
                        <div key={track.id}>
                          <div
                            className="flex items-center gap-4 p-2 transition-colors"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <span className="w-8 text-sm text-right" style={{ color: 'var(--t3)' }}>
                              {track.trackNumber}.
                            </span>
                            <button
                              onClick={() => navigate(`/catalog/track/${track.id}`)}
                              className="flex-1 text-left text-sm"
                              style={{ color: 'var(--t1)' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-1)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t1)')}
                            >
                              {track.title}
                            </button>
                            {mainTab === 'demos' && (() => {
                              const ds = (track as any).demo_status;
                              if (ds === 'demo') return <span className="status-badge badge-neutral">Demo</span>;
                              if (ds === 'mix') return <span className="status-badge badge-blue">Mix</span>;
                              if (ds === 'master') return <span className="status-badge" style={{ backgroundColor: 'rgba(44,110,142,0.18)', color: '#5ba8c8', border: '1px solid rgba(91,168,200,0.3)' }}>Master</span>;
                              if (ds === 'on_hold') return (
                                <span className="status-badge badge-yellow">
                                  Hold{(track as any).hold_until ? ` · ${formatDate((track as any).hold_until)}` : ''}
                                </span>
                              );
                              return null;
                            })()}
                            <span className="text-sm" style={{ color: 'var(--t3)' }}>{track.duration}</span>
                            <KebabMenu size="sm" items={[
                              {
                                label: 'Notes',
                                icon: '/TM-File-negro.svg',
                                onClick: () => toggleNotes(`track-${track.id}`, (track as any).notes ?? ''),
                              },
                              {
                                label: 'Duplicate',
                                icon: '/TM-Copy-negro.svg',
                                onClick: () => setTrackModal({
                                  type: 'duplicate',
                                  trackId: String(track.id),
                                  albumId: String(album.id),
                                  trackTitle: track.title,
                                  audioUrl: track.audioUrl,
                                  audioVersions: (track as any).audioVersions ?? [],
                                }),
                              },
                              {
                                label: 'Move',
                                icon: '/TM-ArrowLeft-negro.svg',
                                onClick: () => setTrackModal({
                                  type: 'move',
                                  trackId: String(track.id),
                                  albumId: String(album.id),
                                  trackTitle: track.title,
                                }),
                              },
                              {
                                label: 'Replace Audio',
                                icon: '/TM-Refresh-negro.svg',
                                onClick: () => setTrackModal({
                                  type: 'replace-audio',
                                  trackId: String(track.id),
                                  albumId: String(album.id),
                                  trackTitle: track.title,
                                  audioUrl: track.audioUrl,
                                  audioVersions: (track as any).audioVersions ?? [],
                                }),
                              },
                              {
                                label: 'Export Audio',
                                icon: '/TM-Download-negro.svg',
                                onClick: () => setTrackModal({
                                  type: 'export',
                                  trackId: String(track.id),
                                  albumId: String(album.id),
                                  trackTitle: track.title,
                                  audioUrl: track.audioUrl,
                                }),
                              },
                              ...(mainTab === 'demos' ? [
                                { label: 'Status', isHeader: true, dividerBefore: true, onClick: () => {} },
                                {
                                  label: 'Demo',
                                  icon: '/TM-Mic-negro.svg',
                                  active: (track as any).demo_status === 'demo',
                                  onClick: () => handleSetTrackStatus(String(track.id), (track as any).demo_status === 'demo' ? null : 'demo'),
                                },
                                {
                                  label: 'Mix',
                                  icon: '/TM-Settings-negro.svg',
                                  active: (track as any).demo_status === 'mix',
                                  onClick: () => handleSetTrackStatus(String(track.id), (track as any).demo_status === 'mix' ? null : 'mix'),
                                },
                                {
                                  label: 'Master',
                                  icon: '/The Manager_Iconografia-11.svg',
                                  active: (track as any).demo_status === 'master',
                                  onClick: () => handleSetTrackStatus(String(track.id), (track as any).demo_status === 'master' ? null : 'master'),
                                },
                                {
                                  label: 'Hold',
                                  icon: '/TM-Alert-negro.svg',
                                  active: (track as any).demo_status === 'on_hold',
                                  onClick: () => {
                                    if ((track as any).demo_status === 'on_hold') {
                                      handleSetTrackStatus(String(track.id), null);
                                    } else {
                                      setHoldDate((track as any).hold_until ?? '');
                                      setHoldModal({ type: 'track', id: track.id, albumId: String(album.id), currentHoldUntil: (track as any).hold_until });
                                    }
                                  },
                                },
                              ] : []),
                              {
                                label: 'Delete',
                                icon: '/TM-Trash-negro.svg',
                                danger: true,
                                dividerBefore: true,
                                onClick: () => handleDeleteTrack(
                                  String(track.id),
                                  String(album.id),
                                  track.audioUrl,
                                ),
                              },
                            ]} />
                          </div>
                          {/* Track inline notes */}
                          {expandedNotes.has(`track-${track.id}`) && (
                            <div style={{ padding: '6px 8px 6px 40px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
                              <textarea
                                autoFocus
                                value={noteValues[`track-${track.id}`] ?? (track as any).notes ?? ''}
                                onChange={e => setNoteValues(v => ({ ...v, [`track-${track.id}`]: e.target.value }))}
                                onBlur={() => handleSaveNote(`track-${track.id}`)}
                                placeholder="Add notes…"
                                rows={2}
                                style={{
                                  width: '100%',
                                  background: 'var(--surface-3)',
                                  border: '1px solid var(--border-2)',
                                  color: 'var(--t1)',
                                  fontSize: 13,
                                  padding: '6px 10px',
                                  resize: 'vertical',
                                  outline: 'none',
                                  fontFamily: 'inherit',
                                  lineHeight: 1.5,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Format picker when moving project to catalog */}
      <Modal
        isOpen={!!promotingAlbum}
        onClose={() => setPromotingAlbum(null)}
        title="Move to Catalog"
      >
        {promotingAlbum && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--t2)', fontSize: 14 }}>
              Release <strong style={{ color: 'var(--t1)' }}>{promotingAlbum.title}</strong> as:
            </p>
            <div className="grid grid-cols-3 gap-3">
              {(['Single', 'EP', 'Album'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => handlePromoteToCatalog(promotingAlbum.id, fmt)}
                  style={{
                    border: '1px solid var(--border-2)',
                    background: 'var(--surface-2)',
                    padding: '20px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'border-color 120ms, background 120ms',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--brand-1)';
                    e.currentTarget.style.background = 'rgba(0,156,85,0.06)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-2)';
                    e.currentTarget.style.background = 'var(--surface-2)';
                  }}
                >
                  <img src="/tm-vinil-negro_(2).png" alt="" style={{ width: 24, height: 24, objectFit: 'contain', filter: 'invert(1)', opacity: 0.5 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--t1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {fmt}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPromotingAlbum(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isDemoUploadModalOpen}
        onClose={() => setIsDemoUploadModalOpen(false)}
        title="Upload Projects"
      >
        <DemoUploadModal
          onClose={() => setIsDemoUploadModalOpen(false)}
          onSaved={fetchCatalog}
        />
      </Modal>

      <Modal
        isOpen={isNewContentModalOpen}
        onClose={() => setIsNewContentModalOpen(false)}
        title="What would you like to add?"
      >
        <NewContentSelector
          onSelect={handleNewContentSelect}
          onClose={() => setIsNewContentModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAlbumId(null);
          setEditingTrackId(null);
          setFormData({
            title: '',
            artist: '',
            genres: [],
            format: 'Single',
            artistCredits: [],
            producers: [],
            songwriters: [],
            mixEngineers: [],
            masteringEngineers: [],
            newGenre: '',
          });
        }}
        title={editingTrackId ? 'Edit Track' : mainTab === 'demos' ? `Add Demo ${selectedFormat}` : `Add New ${selectedFormat}`}
      >
        <CatalogForm
          formData={formData}
          setFormData={setFormData}
          handleFileChange={handleFileChange}
          handleSubmit={handleSaveTrack}
          editingTrackId={editingTrackId}
        />
      </Modal>

      {currentArtistId && (
        <SpotifyImportModal
          isOpen={isSpotifyImportModalOpen}
          onClose={() => setIsSpotifyImportModalOpen(false)}
          artistId={currentArtistId}
          onImportComplete={() => {
            fetchCatalog();
            handlePreflightCheck();
          }}
        />
      )}

      {/* Track modals */}
      <DuplicateTrackDialog
        isOpen={trackModal?.type === 'duplicate'}
        onClose={() => setTrackModal(null)}
        trackId={trackModal?.trackId ?? ''}
        albumId={trackModal?.albumId ?? ''}
        trackTitle={trackModal?.trackTitle ?? ''}
        onDone={fetchCatalog}
      />

      <MoveTrackDialog
        isOpen={trackModal?.type === 'move'}
        onClose={() => setTrackModal(null)}
        trackId={trackModal?.trackId ?? ''}
        albumId={trackModal?.albumId ?? ''}
        trackTitle={trackModal?.trackTitle ?? ''}
        onDone={fetchCatalog}
      />

      <ReplaceAudioDialog
        isOpen={trackModal?.type === 'replace-audio'}
        onClose={() => setTrackModal(null)}
        trackId={trackModal?.trackId ?? ''}
        trackTitle={trackModal?.trackTitle ?? ''}
        audioUrl={trackModal?.audioUrl}
        audioVersions={trackModal?.audioVersions}
        onDone={fetchCatalog}
      />

      <ExportAudioDialog
        isOpen={trackModal?.type === 'export'}
        onClose={() => setTrackModal(null)}
        trackTitle={trackModal?.trackTitle ?? ''}
        audioUrl={trackModal?.audioUrl}
      />

      {/* Cover art lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Album cover"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 'min(80vw, 600px)',
              maxHeight: '80vh',
              objectFit: 'contain',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
            }}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-6 right-6 p-2 transition-opacity hover:opacity-70"
            style={{ background: 'none', border: 'none' }}
          >
            <img src="/TM-Close-negro.svg" className="pxi-xl icon-white" alt="Close" />
          </button>
        </div>
      )}

      {/* Metadata preflight confirmation modal */}
      {showMetadataConfirm && metadataPreflight && (
        <Modal
          isOpen={showMetadataConfirm}
          onClose={() => setShowMetadataConfirm(false)}
          title="Fetch Catalog Metadata"
          maxWidth="sm"
          closeOnBackdrop={false}
          hideCloseButton={true}
        >
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--t2)' }}>
              This will enrich your catalog with data from Spotify and MusicBrainz:
            </p>
            <div className="space-y-2">
              {[
                { label: 'ISRC codes, popularity & explicit flag', detail: `${metadataPreflight.tracksWithoutIsrc} track${metadataPreflight.tracksWithoutIsrc !== 1 ? 's' : ''}`, note: 'via Spotify' },
                { label: 'Songwriter, producer & engineer credits', detail: `${metadataPreflight.tracksWithIsrc} track${metadataPreflight.tracksWithIsrc !== 1 ? 's' : ''} with ISRC`, note: 'via MusicBrainz' },
                { label: 'UPC, label, genres & distributor', detail: `${metadataPreflight.albumsTotal} album${metadataPreflight.albumsTotal !== 1 ? 's' : ''}`, note: 'via Spotify + MusicBrainz' },
              ].map((row, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--t1)' }}>{row.label}</div>
                    <div className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.note}</div>
                  </div>
                  <span className="text-sm flex-shrink-0" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>{row.detail}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-3 py-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>Estimated time</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--t1)' }}>{formatEstimatedTime(metadataPreflight.estimatedSeconds)}</span>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMetadataConfirm(false)}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setShowMetadataConfirm(false); handleFetchMetadata(); }}
              >
                Continue
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Metadata fetch results modal */}
      {metadataResults && (
        <Modal
          isOpen={showMetadataModal}
          onClose={() => setShowMetadataModal(false)}
          title="Metadata Import"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="text-sm leading-relaxed space-y-1" style={{ color: 'var(--t2)' }}>
              {metadataResults.updated > 0 && (
                <div><span style={{ color: 'var(--brand-1)' }}>{metadataResults.updated}</span> track{metadataResults.updated !== 1 ? 's' : ''} updated with ISRC codes</div>
              )}
              {metadataResults.upcsUpdated > 0 && (
                <div><span style={{ color: 'var(--brand-1)' }}>{metadataResults.upcsUpdated}</span> album{metadataResults.upcsUpdated !== 1 ? 's' : ''} updated with UPC, label & genres</div>
              )}
              {(metadataResults.creditsAdded ?? 0) > 0 && (
                <div><span style={{ color: 'var(--brand-1)' }}>{metadataResults.creditsAdded}</span> credits added (songwriters, producers, engineers)</div>
              )}
              {metadataResults.updated === 0 && metadataResults.upcsUpdated === 0 && (metadataResults.creditsAdded ?? 0) === 0 && (
                <div style={{ color: 'var(--t3)' }}>No new metadata found — everything is up to date.</div>
              )}
              {metadataResults.failed > 0 && (
                <div style={{ color: 'var(--t3)' }}>{metadataResults.failed} track{metadataResults.failed !== 1 ? 's' : ''} not found on any source.</div>
              )}
            </div>

            {(metadataResults.details.updated.length > 0 || metadataResults.details.failed.length > 0 || (metadataResults.details.credits ?? []).length > 0) && (
              <button
                onClick={() => setShowMetadataDetails(d => !d)}
                className="text-sm transition-opacity hover:opacity-80"
                style={{ color: 'var(--brand-1)' }}
              >
                {showMetadataDetails ? 'Hide details' : 'See more'}
              </button>
            )}

            {showMetadataDetails && (
              <div className="space-y-5 pt-1">
                {metadataResults.details.updated.length > 0 && (
                  <div>
                    <div className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>
                      ISRC Updated ({metadataResults.details.updated.length})
                    </div>
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {metadataResults.details.updated.map((t, i) => (
                        <div key={i} className="flex items-center justify-between py-2 gap-4">
                          <span className="text-sm truncate" style={{ color: 'var(--t1)' }}>{t.title}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>{t.isrc}</span>
                            <span className="status-badge badge-neutral" style={{ fontSize: 10 }}>{t.source}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(metadataResults.details.credits ?? []).length > 0 && (
                  <div>
                    <div className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>
                      Credits Added ({metadataResults.details.credits.length} tracks)
                    </div>
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {metadataResults.details.credits.map((t, i) => (
                        <div key={i} className="flex items-center justify-between py-2 gap-4">
                          <span className="text-sm truncate" style={{ color: 'var(--t1)' }}>{t.title}</span>
                          <span className="text-xs flex-shrink-0" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>{t.count} credit{t.count !== 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {metadataResults.details.failed.length > 0 && (
                  <div>
                    <div className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>
                      Not found ({metadataResults.details.failed.length})
                    </div>
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {metadataResults.details.failed.map((t, i) => (
                        <div key={i} className="py-2">
                          <span className="text-sm" style={{ color: 'var(--t2)' }}>{t.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Hold date modal */}
      {holdModal && (
        <Modal
          isOpen={!!holdModal}
          onClose={() => setHoldModal(null)}
          title="Set Hold"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--t3)' }}>
              Another artist has requested a hold on this {holdModal.type === 'project' ? 'project' : 'track'}. Set the hold expiry date — after this date it becomes available again.
            </p>
            <div className="form-field">
              <label>Hold Until</label>
              <input
                type="date"
                value={holdDate}
                onChange={e => setHoldDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--t1)',
                  fontSize: 13,
                  outline: 'none',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost btn-sm" onClick={() => setHoldModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ borderColor: 'var(--status-yellow)', color: 'var(--status-yellow)' }}
                onClick={async () => {
                  if (holdModal.type === 'project') {
                    await handleSetProjectStatus(holdModal.id as number, 'on_hold', holdDate || undefined);
                  } else {
                    await handleSetTrackStatus(String(holdModal.id), 'on_hold', holdDate || undefined);
                  }
                  setHoldModal(null);
                }}
              >
                Set Hold
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
