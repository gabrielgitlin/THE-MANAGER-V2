import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc, Plus, Lock, Globe, Play, Pause, Image } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import ImageCropper from '../ImageCropper';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';
import RichTextEditor from './RichTextEditor';
import { ContactTagInput, type ContactTag } from '../ui/ContactTagInput';

interface Playlist {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  password_hash: string | null;
  share_token: string;
  created_at: string;
  updated_at: string;
  track_count?: number;
  total_duration?: number;
  cover_url?: string | null;
  tracks?: PlaylistTrack[];
}

interface PlaylistTrack {
  id: string;
  track_id: string;
  position: number;
  tracks: {
    id: string;
    title: string;
    duration: number;
    audio_url?: string;
    preview_url?: string;
    spotify_id?: string;
  };
  albums?: {
    title: string;
    cover_url?: string;
    artists?: {
      name: string;
    };
  }[];
}

interface AvailableTrack {
  id: string;
  title: string;
  duration: number;
  albumTitle: string;
  albumCover?: string;
  artist: string;
  isDemo: boolean;
}

const STOCK_COVERS = [
  '/covers/cover-green.jpg',
  '/covers/cover-dark.jpg',
  '/covers/cover-light.jpg',
];

function StockCoverPicker({ selected, onSelect }: { selected: string; onSelect: (url: string) => void }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
        Or choose a stock cover
      </p>
      <div className="grid grid-cols-3 gap-2">
        {STOCK_COVERS.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => onSelect(url)}
            className="w-full aspect-square overflow-hidden transition-all duration-[120ms]"
            style={{
              border: selected === url ? '2px solid var(--brand-1)' : '1px solid var(--border)',
              opacity: selected === url ? 1 : 0.7,
            }}
            onMouseEnter={(e) => { if (selected !== url) e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { if (selected !== url) e.currentTarget.style.opacity = '0.7'; }}
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function CoverPreview({ url, onRemove }: { url: string; onRemove: () => void }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
  }, [url]);

  if (!url) {
    return (
      <div className="w-32 h-32 flex items-center justify-center" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }}>
        <img src="/tm-vinil-negro_(2).png" alt="Playlist" className="w-8 h-8 object-contain opacity-50" />
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="relative">
        <div className="w-32 h-32 flex flex-col items-center justify-center" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }}>
          <img src="/tm-vinil-negro_(2).png" alt="Playlist" className="w-6 h-6 object-contain opacity-50 mb-1" />
          <span className="text-xs" style={{ color: 'var(--t3)' }}>Failed to load</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 p-1 text-white hover:opacity-80 transition-colors"
          style={{ backgroundColor: 'var(--t1)' }}
          title="Remove cover"
        >
          <img src="/TM-Close-negro.svg" className="pxi-md icon-white" alt="" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 w-32 h-32 flex items-center justify-center" style={{ backgroundColor: 'var(--surface-2)' }}>
          <div className="w-6 h-6 border-2 border-t-primary animate-spin" style={{ borderRadius: '50%', borderColor: 'var(--t3)', borderTopColor: 'var(--brand-1)' }} />
        </div>
      )}
      <img
        src={url}
        alt=""
        className={`w-32 h-32 object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => { setImageError(true); setIsLoading(false); }}
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 p-1 text-white hover:opacity-80 transition-colors"
        style={{ backgroundColor: 'var(--t1)' }}
        title="Remove cover"
      >
        <img src="/TM-Close-negro.svg" className="pxi-md icon-white" alt="" />
      </button>
    </div>
  );
}

export default function PlaylistsTab() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    playAlbum,
    tracks: playerTracks,
    currentTrackIndex,
    isPlaying,
    hasInteracted,
    setCurrentTrackIndex,
    togglePlayPause,
    setHasInteracted
  } = useMusicPlayerStore();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddTracksModalOpen, setIsAddTracksModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [availableTracks, setAvailableTracks] = useState<AvailableTrack[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);

  const [newPlaylist, setNewPlaylist] = useState({
    title: '',
    description: '',
    is_public: false,
    password: '',
    cover_url: '',
    creators: [] as ContactTag[],
  });

  const [editPlaylist, setEditPlaylist] = useState({
    title: '',
    description: '',
    is_public: false,
    password: '',
    cover_url: '',
    creators: [] as ContactTag[],
  });

  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperFile, setCropperFile] = useState<File | null>(null);
  const [cropperTarget, setCropperTarget] = useState<'create' | 'edit'>('create');
  const [shareLink, setShareLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchPlaylists();
      fetchAvailableTracks();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPlaylist) {
      fetchPlaylistTracks(selectedPlaylist.id);
    }
  }, [selectedPlaylist]);

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const playlistsWithDetails = await Promise.all(
        (data || []).map(async (playlist) => {
          const { data: tracksData } = await supabase
            .from('playlist_tracks')
            .select(`
              id,
              track_id,
              position,
              tracks (
                id,
                title,
                duration,
                audio_url,
                preview_url
              )
            `)
            .eq('playlist_id', playlist.id)
            .order('position', { ascending: true });

          const tracksWithAlbums = await Promise.all(
            (tracksData || []).filter((pt: any) => pt.tracks != null).map(async (pt: any) => {
              const { data: albumTracks } = await supabase
                .from('album_tracks')
                .select(`
                  albums (
                    title,
                    cover_url,
                    artists (
                      name
                    )
                  )
                `)
                .eq('track_id', pt.tracks.id)
                .limit(1)
                .maybeSingle();

              return {
                ...pt,
                albums: albumTracks?.albums ? [albumTracks.albums] : [],
              };
            })
          );

          const trackCount = tracksData?.length || 0;
          const totalDuration = tracksData?.reduce((sum, pt: any) => sum + (Number(pt.tracks?.duration) || 0), 0) || 0;

          return {
            ...playlist,
            track_count: trackCount,
            total_duration: totalDuration,
            tracks: tracksWithAlbums,
          };
        })
      );

      setPlaylists(playlistsWithDetails);

      if (selectedPlaylist) {
        const updatedSelectedPlaylist = playlistsWithDetails.find(p => p.id === selectedPlaylist.id);
        if (updatedSelectedPlaylist) {
          setSelectedPlaylist(updatedSelectedPlaylist);
          setPlaylistTracks(updatedSelectedPlaylist.tracks || []);
        }
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaylistTracks = async (playlistId: string) => {
    try {
      const { data, error } = await supabase
        .from('playlist_tracks')
        .select(`
          id,
          track_id,
          position,
          tracks (
            id,
            title,
            duration,
            audio_url,
            preview_url,
            spotify_id
          )
        `)
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (error) throw error;

      const tracksWithAlbums = await Promise.all(
        (data || []).map(async (pt: any) => {
          const { data: albumTracks } = await supabase
            .from('album_tracks')
            .select(`
              albums (
                title,
                cover_url,
                artists (
                  name
                )
              )
            `)
            .eq('track_id', pt.tracks.id)
            .limit(1)
            .maybeSingle();

          return {
            ...pt,
            albums: albumTracks?.albums ? [albumTracks.albums] : [],
          };
        })
      );

      setPlaylistTracks(tracksWithAlbums);
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
    }
  };

  const fetchAvailableTracks = async () => {
    try {
      // Step 1: fetch all albums (same query pattern as fetchCatalog in Catalog.tsx)
      const { data: albums, error: albumsError } = await supabase
        .from('albums')
        .select(`
          id,
          title,
          artwork_url,
          status,
          artists (
            name
          )
        `)
        .order('release_date', { ascending: false });

      if (albumsError) {
        console.error('Error fetching albums for tracks picker:', albumsError);
        return;
      }

      // Step 2: for each album, fetch its tracks via album_tracks (same as fetchCatalog)
      const trackMap = new Map<string, AvailableTrack>();

      await Promise.all(
        (albums || []).map(async (album) => {
          const { data: albumTracks, error: tracksError } = await supabase
            .from('album_tracks')
            .select(`
              tracks (
                id,
                title,
                duration
              )
            `)
            .eq('album_id', album.id);

          if (tracksError) {
            console.error('Error fetching tracks for album', album.id, tracksError);
            return;
          }

          const artistName = (album as any).artists?.name || 'Unknown Artist';

          for (const at of albumTracks || []) {
            const t = (at as any).tracks;
            if (!t?.id || trackMap.has(t.id)) continue;
            trackMap.set(t.id, {
              id: t.id,
              title: t.title,
              duration: Number(t.duration) || 0,
              albumTitle: album.title,
              albumCover: (album as any).artwork_url,
              artist: artistName,
              isDemo: album.status === 'demo',
            });
          }
        })
      );

      setAvailableTracks(Array.from(trackMap.values()));
    } catch (error) {
      console.error('Error fetching available tracks:', error);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPlaylist.title.trim()) return;

    try {
      const playlistData: any = {
        title: newPlaylist.title.trim(),
        description: newPlaylist.description.trim() || null,
        is_public: newPlaylist.is_public,
        cover_url: newPlaylist.cover_url.trim() || null,
        user_id: user.id,
        creator_contacts: JSON.stringify(newPlaylist.creators),
      };

      if (newPlaylist.password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(newPlaylist.password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        playlistData.password_hash = hashHex;
      }

      const { error } = await supabase
        .from('playlists')
        .insert(playlistData);

      if (error) throw error;

      setNewPlaylist({ title: '', description: '', is_public: false, password: '', cover_url: '', creators: [] });
      setIsCreateModalOpen(false);
      fetchPlaylists();
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist');
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;

      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
        setPlaylistTracks([]);
      }

      fetchPlaylists();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('Failed to delete playlist');
    }
  };

  const handleAddTracks = async () => {
    if (!selectedPlaylist || selectedTracks.length === 0) return;

    try {
      const maxPosition = playlistTracks.length > 0
        ? Math.max(...playlistTracks.map(pt => pt.position))
        : -1;

      const tracksToAdd = selectedTracks.map((trackId, index) => ({
        playlist_id: selectedPlaylist.id,
        track_id: trackId,
        position: maxPosition + index + 1,
        added_by: user?.id,
      }));

      const { error } = await supabase
        .from('playlist_tracks')
        .insert(tracksToAdd);

      if (error) throw error;

      setSelectedTracks([]);
      setIsAddTracksModalOpen(false);
      setSearchQuery('');
      fetchPlaylistTracks(selectedPlaylist.id);
      fetchPlaylists();
    } catch (error) {
      console.error('Error adding tracks:', error);
      alert('Failed to add tracks to playlist');
    }
  };

  const handleRemoveTrack = async (playlistTrackId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('id', playlistTrackId);

      if (error) throw error;

      if (selectedPlaylist) {
        fetchPlaylistTracks(selectedPlaylist.id);
        fetchPlaylists();
      }
    } catch (error) {
      console.error('Error removing track:', error);
      alert('Failed to remove track');
    }
  };

  const handleSharePlaylist = (playlist: Playlist) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/playlist/${playlist.share_token}`;
    setShareLink(link);
    setSelectedPlaylist(playlist);
    setIsShareModalOpen(true);
  };

  const handleEnableSharing = async () => {
    if (!selectedPlaylist) return;
    try {
      const { error } = await supabase
        .from('playlists')
        .update({ is_public: true })
        .eq('id', selectedPlaylist.id);

      if (error) throw error;

      const updated = { ...selectedPlaylist, is_public: true };
      setSelectedPlaylist(updated);
      const baseUrl = window.location.origin;
      setShareLink(`${baseUrl}/playlist/${updated.share_token}`);
      fetchPlaylists();
    } catch (error) {
      console.error('Error enabling sharing:', error);
      alert('Failed to enable sharing');
    }
  };

  const handleOpenEditModal = (playlist?: Playlist) => {
    const target = playlist || selectedPlaylist;
    if (!target) return;
    setSelectedPlaylist(target);
    let existingCreators: ContactTag[] = [];
    try {
      const raw = (target as any).creator_contacts;
      if (raw) existingCreators = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch { /* silent */ }
    setEditPlaylist({
      title: target.title,
      description: target.description || '',
      is_public: target.is_public,
      password: '',
      cover_url: target.cover_url || '',
      creators: existingCreators,
    });
    setIsEditModalOpen(true);
  };

  const handleEditPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaylist || !editPlaylist.title.trim()) return;

    try {
      const updateData: any = {
        title: editPlaylist.title.trim(),
        description: editPlaylist.description.trim() || null,
        is_public: editPlaylist.is_public,
        cover_url: editPlaylist.cover_url.trim() || null,
        creator_contacts: JSON.stringify(editPlaylist.creators),
      };

      if (editPlaylist.password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(editPlaylist.password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        updateData.password_hash = hashHex;
      }

      const { error } = await supabase
        .from('playlists')
        .update(updateData)
        .eq('id', selectedPlaylist.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      fetchPlaylists();
      setSelectedPlaylist({ ...selectedPlaylist, ...updateData });
    } catch (error) {
      console.error('Error updating playlist:', error);
      alert('Failed to update playlist');
    }
  };

  const uploadCoverImage = async (file: File, playlistId: string): Promise<string> => {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${playlistId}-${timestamp}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('playlist-covers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('playlist-covers')
      .getPublicUrl(filePath);

    return `${publicUrl}?t=${timestamp}`;
  };

  const handleEditCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (editFileInputRef.current) editFileInputRef.current.value = '';
    if (!file || !selectedPlaylist) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setCropperFile(file);
    setCropperTarget('edit');
    setShowCropper(true);
  };

  const handleCreateCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (createFileInputRef.current) createFileInputRef.current.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setCropperFile(file);
    setCropperTarget('create');
    setShowCropper(true);
  };

  const handleCropComplete = async (blob: Blob) => {
    setShowCropper(false);
    setCropperFile(null);
    setIsUploadingCover(true);

    try {
      const file = new File([blob], `cover-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const id = cropperTarget === 'edit' && selectedPlaylist
        ? selectedPlaylist.id
        : `temp-${Date.now()}`;
      const url = await uploadCoverImage(file, id);

      if (cropperTarget === 'edit') {
        setEditPlaylist(prev => ({ ...prev, cover_url: url }));
      } else {
        setNewPlaylist(prev => ({ ...prev, cover_url: url }));
      }
    } catch (error: any) {
      console.error('Error uploading cover:', error);
      alert(`Failed to upload: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (currentPlaylistId === playlist.id && hasInteracted) {
      togglePlayPause();
      return;
    }

    setCurrentPlaylistId(playlist.id);

    supabase
      .from('playlist_tracks')
      .select(`
        position,
        tracks (
          id,
          title,
          duration,
          audio_url,
          preview_url,
          spotify_id
        )
      `)
      .eq('playlist_id', playlist.id)
      .order('position', { ascending: true })
      .then(async ({ data, error }) => {
        if (error || !data || data.length === 0) {
          alert('No tracks available in this playlist');
          return;
        }

        const allTracks = await Promise.all(
          data.map(async (pt: any) => {
            const { data: albumData } = await supabase
              .from('album_tracks')
              .select('albums(title, cover_url, artists(name))')
              .eq('track_id', pt.tracks.id)
              .limit(1)
              .maybeSingle();

            return {
              id: pt.tracks.id,
              title: pt.tracks.title,
              artist: albumData?.albums?.artists?.name || playlist.title,
              duration: formatDuration(pt.tracks.duration || 0),
              audioUrl: pt.tracks.audio_url || pt.tracks.preview_url || undefined,
              coverArt: albumData?.albums?.cover_url || playlist.cover_url,
              trackNumber: pt.position + 1,
              spotifyId: pt.tracks.spotify_id || undefined,
            };
          })
        );

        playAlbum(allTracks);
      });
  };

  const handlePlayFromTrack = (trackIndex: number) => {
    if (!selectedPlaylist || playlistTracks.length === 0) return;

    setCurrentPlaylistId(selectedPlaylist.id);

    const allTracks = playlistTracks.map((pt) => ({
      id: pt.tracks.id as any,
      title: pt.tracks.title,
      artist: pt.albums?.[0]?.artists?.name || 'Unknown Artist',
      duration: formatDuration(pt.tracks.duration || 0),
      audioUrl: pt.tracks.audio_url || pt.tracks.preview_url || undefined,
      coverArt: pt.albums?.[0]?.cover_url || selectedPlaylist.cover_url,
      trackNumber: pt.position + 1,
      spotifyId: pt.tracks.spotify_id || undefined,
    }));

    playAlbum(allTracks, trackIndex);
  };

  const handleDragStart = (trackId: string) => {
    setDraggedTrackId(trackId);
  };

  const handleDragOver = (e: React.DragEvent, targetPosition: number) => {
    e.preventDefault();
    if (!draggedTrackId || !selectedPlaylist) return;

    const draggedIndex = playlistTracks.findIndex(pt => pt.id === draggedTrackId);
    const targetIndex = playlistTracks.findIndex(pt => pt.position === targetPosition);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const newTracks = [...playlistTracks];
    const [draggedTrack] = newTracks.splice(draggedIndex, 1);
    newTracks.splice(targetIndex, 0, draggedTrack);

    newTracks.forEach((track, index) => {
      track.position = index;
    });

    setPlaylistTracks(newTracks);
  };

  const handleDragEnd = async () => {
    if (!selectedPlaylist) return;

    try {
      const updates = playlistTracks.map(pt => ({
        id: pt.id,
        position: pt.position,
      }));

      for (const update of updates) {
        await supabase
          .from('playlist_tracks')
          .update({ position: update.position })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error updating track positions:', error);
    }

    setDraggedTrackId(null);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (): string => {
    const totalSeconds = playlistTracks.reduce((sum, pt) => sum + (pt.tracks.duration || 0), 0);
    const mins = Math.floor(totalSeconds / 60);
    return `${mins} min`;
  };

  const filteredTracks = availableTracks.filter(track => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query) ||
      track.albumTitle.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} />;
  }

  return (
    <div>
      <div className="overflow-hidden" style={{ backgroundColor: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-ghost btn-icon"
              title="Create Playlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div style={{ borderColor: 'var(--border)' }}>
          {playlists.length === 0 ? (
            <div className="p-12 text-center">
              <img src="/tm-vinil-negro_(2).png" alt="Playlist" className="mx-auto h-12 w-12 object-contain opacity-40" />
              <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--t1)' }}>No playlists yet</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--t3)' }}>
                Get started by creating a new playlist
              </p>
            </div>
          ) : (
            playlists.map((playlist) => (
              <div key={playlist.id} className="p-6">
                <div className="flex items-start gap-6 mb-4">
                  <div className="flex-shrink-0 w-48">
                    <div className="w-48 h-48 relative group mb-2">
                      {playlist.cover_url ? (
                        <>
                          <button
                            onClick={() => navigate(`/playlist/${playlist.share_token}`)}
                            className="w-full h-full overflow-hidden transition-transform duration-200 hover:scale-105"
                            style={{ backgroundColor: 'var(--surface-2)' }}
                          >
                            <img
                              src={playlist.cover_url}
                              alt={`${playlist.title} cover`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPlaylist(playlist);
                            }}
                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:opacity-80"
                            style={{ background: 'none', border: 'none', padding: 0, lineHeight: 0 }}
                          >
                            <img src="/pixel-play.svg" alt="Play" className="w-12 h-12" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--surface-2)' }}>
                          <img src="/tm-vinil-negro_(2).png" alt="Playlist" className="w-8 h-8 object-contain opacity-40" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-center uppercase tracking-wide" style={{ color: 'var(--t3)' }}>
                      {playlist.track_count} {playlist.track_count === 1 ? 'song' : 'songs'}
                      {playlist.total_duration ? `, ${Math.floor(playlist.total_duration / 60)} minutes` : ''}
                    </p>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <button
                          onClick={() => navigate(`/playlist/${playlist.share_token}`)}
                          className="text-lg font-medium"
                          style={{ color: 'var(--t1)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t1)')}
                        >
                          {playlist.title}
                        </button>
                        {/* Creator pills — click to edit */}
                        {(() => {
                          let creators: ContactTag[] = [];
                          try {
                            const raw = (playlist as any).creator_contacts;
                            if (raw && raw.length > 0) creators = typeof raw === 'string' ? JSON.parse(raw) : raw;
                          } catch { /* silent */ }
                          return (
                            <div
                              className="flex flex-wrap gap-1 mt-0.5 cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); handleOpenEditModal(playlist); }}
                              title="Click to edit creators"
                            >
                              {creators.length > 0 ? creators.map((tag, i) => (
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
                              )) : (
                                <span style={{ fontSize: 11, color: 'var(--t3)' }}>+ Add creators</span>
                              )}
                            </div>
                          );
                        })()}
                        {playlist.description && (
                          <div
                            className="text-sm mt-1"
                            style={{ color: 'var(--t3)' }}
                            dangerouslySetInnerHTML={{ __html: playlist.description }}
                          />
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {playlist.is_public && (
                            <span className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--t3)' }}>
                              <Globe className="w-4 h-4" />
                              {playlist.password_hash ? 'Personal' : 'Public'}
                            </span>
                          )}
                          {playlist.password_hash && (
                            <span className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--t3)' }}>
                              <Lock className="w-4 h-4" />
                              Protected
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlaylist(playlist);
                            setPlaylistTracks(playlist.tracks || []);
                            fetchAvailableTracks();
                            setTimeout(() => setIsAddTracksModalOpen(true), 100);
                          }}
                          className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t2)', border: '1px solid var(--border)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Tracks
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(playlist);
                          }}
                          className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t2)', border: '1px solid var(--border)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                        >
                          <img src="/TM-Pluma-negro.png" className="pxi-sm icon-muted" alt="" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSharePlaylist(playlist);
                          }}
                          className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t2)', border: '1px solid var(--border)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                        >
                          <img src="/TM-Share-negro.svg" className="pxi-sm icon-muted" alt="" />
                          Share
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlaylist(playlist.id);
                          }}
                          className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors text-red-600"
                          style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                        >
                          <img src="/TM-Trash-negro.svg" className="pxi-sm icon-danger" alt="" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 mt-4">
                      {(playlist.tracks || []).length === 0 ? (
                        <div className="text-center py-8" style={{ backgroundColor: 'var(--surface-2)', border: '2px dashed var(--border)' }}>
                          <img src="/tm-vinil-negro_(2).png" alt="Empty" className="mx-auto h-8 w-8 object-contain opacity-30 mb-2" />
                          <p className="text-sm mb-3" style={{ color: 'var(--t3)' }}>No tracks yet</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlaylist(playlist);
                              setPlaylistTracks([]);
                              fetchAvailableTracks();
                            setTimeout(() => setIsAddTracksModalOpen(true), 100);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm transition-colors"
                            style={{ backgroundColor: 'var(--brand-1)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-1)')}
                          >
                            <Plus className="w-4 h-4" />
                            Add Tracks to Playlist
                          </button>
                        </div>
                      ) : (
                        (playlist.tracks || []).map((pt) => {
                          const isTrackActive = currentPlaylistId === playlist.id
                            && playerTracks[currentTrackIndex]
                            && String(playerTracks[currentTrackIndex].id) === String(pt.tracks.id);
                          return (
                          <div
                            key={pt.id}
                            className="flex items-center gap-4 p-2 transition-colors group"
                            style={{ backgroundColor: 'var(--surface-2)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                          >
                            <span className="w-8 flex items-center justify-end">
                              {isTrackActive ? (
                                <span className={`eq-bars${isPlaying ? '' : ' paused'}`}>
                                  <span className="eq-bar" />
                                  <span className="eq-bar" />
                                  <span className="eq-bar" />
                                </span>
                              ) : (
                                <span className="text-sm" style={{ color: 'var(--t3)' }}>
                                  {pt.position + 1}.
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedPlaylist(playlist);
                                setPlaylistTracks(playlist.tracks || []);
                                setTimeout(() => {
                                  handlePlayFromTrack(playlist.tracks?.findIndex(t => t.id === pt.id) || 0);
                                }, 100);
                              }}
                              className="flex-1 text-left text-sm font-medium"
                              style={{ color: isTrackActive ? 'var(--brand-1)' : 'var(--t1)' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-1)')}
                              onMouseLeave={(e) => { if (!isTrackActive) e.currentTarget.style.color = 'var(--t1)'; }}
                            >
                              {pt.tracks.title}
                            </button>
                            <span className="text-sm" style={{ color: isTrackActive ? 'var(--brand-1)' : 'var(--t3)' }}>{formatDuration(pt.tracks.duration || 0)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Remove this track from the playlist?')) {
                                  handleRemoveTrack(pt.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-600 transition-all"
                              title="Remove track"
                            >
                              <img src="/TM-Close-negro.svg" className="pxi-md icon-danger" alt="" />
                            </button>
                          </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Playlist Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewPlaylist({ title: '', description: '', is_public: false, password: '', cover_url: '', creators: [] });
        }}
        title="Create New Playlist"
      >
        <form onSubmit={handleCreatePlaylist} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t1)' }}>
              Playlist Name *
            </label>
            <input
              type="text"
              value={newPlaylist.title}
              onChange={(e) => setNewPlaylist({ ...newPlaylist, title: e.target.value })}
              className="w-full px-3 py-2 focus:ring-1"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--t1)' }}
              placeholder="My Awesome Playlist"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t1)' }}>
              Creators
            </label>
            <ContactTagInput
              value={newPlaylist.creators}
              onChange={(tags) => setNewPlaylist({ ...newPlaylist, creators: tags })}
              placeholder="Tag artists or collaborators…"
              preferRole="Artist"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t1)' }}>
              Description
            </label>
            <RichTextEditor
              value={newPlaylist.description}
              onChange={(html) => setNewPlaylist({ ...newPlaylist, description: html })}
              placeholder="Optional description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--t1)' }}>
              Cover Image
            </label>
            <div className="flex items-start gap-4">
              {newPlaylist.cover_url ? (
                <CoverPreview
                  url={newPlaylist.cover_url}
                  onRemove={() => setNewPlaylist({ ...newPlaylist, cover_url: '' })}
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }}>
                  <img src="/tm-vinil-negro_(2).png" alt="Playlist" className="w-8 h-8 object-contain opacity-50" />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={createFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCreateCoverChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => createFileInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="inline-flex items-center gap-2 px-4 py-2 transition-colors disabled:opacity-50"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--t1)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
                >
                  {isUploadingCover ? (
                    <>
                      <div className="w-4 h-4 border-2 animate-spin" style={{ borderRadius: '50%', borderColor: 'var(--t3)', borderTopColor: 'var(--brand-1)' }} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <img src="/TM-Upload-negro.svg" className="pxi-md icon-muted" alt="" />
                      {newPlaylist.cover_url ? 'Change Image' : 'Add Cover'}
                    </>
                  )}
                </button>
                <p className="text-xs mt-2" style={{ color: 'var(--t3)' }}>
                  Square image recommended. JPEG, PNG, or WebP.
                </p>
              </div>
            </div>
            <StockCoverPicker
              selected={newPlaylist.cover_url}
              onSelect={(url) => setNewPlaylist({ ...newPlaylist, cover_url: url })}
            />
          </div>

          <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newPlaylist.is_public}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, is_public: e.target.checked })}
                style={{ accentColor: 'var(--brand-1)' }}
              />
              <span className="text-sm" style={{ color: 'var(--t1)' }}>Enable sharing</span>
            </label>
          </div>

          {newPlaylist.is_public && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t1)' }}>
                Password Protection (Optional)
              </label>
              <input
                type="password"
                value={newPlaylist.password}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, password: e.target.value })}
                className="w-full px-3 py-2 focus:ring-1"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--t1)' }}
                placeholder="Leave empty for public access"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
                Add a password to restrict access (personal sharing), or leave empty for public access
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewPlaylist({ title: '', description: '', is_public: false, password: '', cover_url: '' });
              }}
              className="px-4 py-2 transition-colors"
              style={{ color: 'var(--t1)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white transition-colors"
              style={{ backgroundColor: 'var(--brand-1)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-1)')}
            >
              Create Playlist
            </button>
          </div>
        </form>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setCopiedLink(false);
        }}
        title="Share Playlist"
      >
        <div className="space-y-4">
          {!selectedPlaylist?.is_public ? (
            <div>
              <p className="text-sm mb-4" style={{ color: 'var(--t3)' }}>
                This playlist is private. Enable sharing to generate a shareable link.
              </p>
              <button
                onClick={handleEnableSharing}
                className="px-4 py-2 text-white flex items-center gap-2 transition-colors"
                style={{ backgroundColor: 'var(--brand-1)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-1)')}
              >
                <Globe className="w-4 h-4" />
                Enable Sharing
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                {selectedPlaylist?.password_hash ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t2)', border: '1px solid var(--border)' }}>
                    <Lock className="w-3 h-3" />
                    Personal (Password Protected)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t2)', border: '1px solid var(--border)' }}>
                    <Globe className="w-3 h-3" />
                    Public (No Password)
                  </span>
                )}
              </div>
              <p className="text-sm mb-3" style={{ color: 'var(--t3)' }}>
                {selectedPlaylist?.password_hash
                  ? 'Share this link with others. They will need to enter the password to access the playlist.'
                  : 'Anyone with this link can view and listen to this playlist.'}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-2)', color: 'var(--t1)' }}
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 flex items-center gap-2 transition-colors text-white"
                  style={{ backgroundColor: copiedLink ? 'var(--brand-1)' : 'var(--t1)' }}
                >
                  <img src="/TM-Copy-negro.svg" className="pxi-md icon-white" alt="" />
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                setIsShareModalOpen(false);
                setCopiedLink(false);
              }}
              className="px-4 py-2 transition-colors"
              style={{ color: 'var(--t1)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Tracks Modal */}
      <Modal
        isOpen={isAddTracksModalOpen}
        onClose={() => {
          setIsAddTracksModalOpen(false);
          setSelectedTracks([]);
          setSearchQuery('');
        }}
        title="Add Tracks to Playlist"
      >
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracks..."
              className="w-full px-3 py-2 focus:ring-1"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--t1)' }}
            />
          </div>

          <div className="max-h-96 overflow-y-auto" style={{ border: '1px solid var(--border)' }}>
            {filteredTracks.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--t3)' }}>
                {searchQuery ? 'No tracks match your search' : 'No tracks available'}
              </div>
            ) : (
              filteredTracks.map((track) => {
                const isAdded = playlistTracks.some(pt => pt.tracks.id === track.id);
                const isSelected = selectedTracks.includes(track.id);

                return (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 p-3 transition-all ${
                      isAdded
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                    style={{
                      backgroundColor: isAdded
                        ? 'var(--surface-2)'
                        : isSelected
                        ? 'var(--surface-3)'
                        : 'var(--surface)',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onClick={() => {
                      if (isAdded) return;
                      if (isSelected) {
                        setSelectedTracks(selectedTracks.filter(id => id !== track.id));
                      } else {
                        setSelectedTracks([...selectedTracks, track.id]);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (!isAdded && !isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isAdded && !isSelected) e.currentTarget.style.backgroundColor = 'var(--surface)';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isAdded}
                      onChange={() => {}}
                      style={{ accentColor: 'var(--brand-1)' }}
                      className="disabled:opacity-50"
                    />
                    {track.albumCover && (
                      <img
                        src={track.albumCover}
                        alt=""
                        className="w-10 h-10 object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: 'var(--t1)' }}>{track.title}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--t3)' }}>
                        {track.artist} &middot; {track.albumTitle}
                        {track.isDemo && (
                          <span
                            className="ml-2 inline-flex items-center px-1.5 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: 'var(--surface-3)', color: 'var(--t2)', border: '1px solid var(--border)' }}
                          >
                            Demo
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-sm" style={{ color: 'var(--t3)' }}>
                      {formatDuration(track.duration)}
                    </span>
                    {isAdded && (
                      <span className="text-xs" style={{ color: 'var(--t3)' }}>Added</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-sm" style={{ color: 'var(--t3)' }}>
              {selectedTracks.length} track{selectedTracks.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsAddTracksModalOpen(false);
                  setSelectedTracks([]);
                  setSearchQuery('');
                }}
                className="px-4 py-2 transition-colors"
                style={{ color: 'var(--t1)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTracks}
                disabled={selectedTracks.length === 0}
                className="px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: 'var(--brand-1)' }}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'var(--brand-2)'; }}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-1)')}
              >
                Add Tracks
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Playlist Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Playlist"
      >
        <form onSubmit={handleEditPlaylist} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t1)' }}>
              Playlist Name *
            </label>
            <input
              type="text"
              value={editPlaylist.title}
              onChange={(e) => setEditPlaylist({ ...editPlaylist, title: e.target.value })}
              className="w-full px-3 py-2 focus:ring-1"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--t1)' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t1)' }}>
              Creators
            </label>
            <ContactTagInput
              value={editPlaylist.creators}
              onChange={(tags) => setEditPlaylist({ ...editPlaylist, creators: tags })}
              placeholder="Tag artists or collaborators…"
              preferRole="Artist"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t1)' }}>
              Description
            </label>
            <RichTextEditor
              value={editPlaylist.description}
              onChange={(html) => setEditPlaylist({ ...editPlaylist, description: html })}
              placeholder="Optional description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--t1)' }}>
              Cover Image
            </label>
            <div className="flex items-start gap-4">
              <CoverPreview
                url={editPlaylist.cover_url}
                onRemove={() => setEditPlaylist({ ...editPlaylist, cover_url: '' })}
              />
              <div className="flex-1">
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditCoverChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="inline-flex items-center gap-2 px-4 py-2 transition-colors disabled:opacity-50"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--t1)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
                >
                  {isUploadingCover ? (
                    <>
                      <div className="w-4 h-4 border-2 animate-spin" style={{ borderRadius: '50%', borderColor: 'var(--t3)', borderTopColor: 'var(--brand-1)' }} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <img src="/TM-Upload-negro.svg" className="pxi-md icon-muted" alt="" />
                      {editPlaylist.cover_url ? 'Change Image' : 'Add Cover'}
                    </>
                  )}
                </button>
                <p className="text-xs mt-2" style={{ color: 'var(--t3)' }}>
                  Square image recommended. JPEG, PNG, or WebP.
                </p>
              </div>
            </div>
            <StockCoverPicker
              selected={editPlaylist.cover_url}
              onSelect={(url) => setEditPlaylist({ ...editPlaylist, cover_url: url })}
            />
          </div>

          <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editPlaylist.is_public}
                onChange={(e) => setEditPlaylist({ ...editPlaylist, is_public: e.target.checked })}
                style={{ accentColor: 'var(--brand-1)' }}
              />
              <span className="text-sm" style={{ color: 'var(--t1)' }}>Enable sharing</span>
            </label>
          </div>

          {editPlaylist.is_public && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t1)' }}>
                {selectedPlaylist?.password_hash ? 'Change Password' : 'Add Password'} (Optional)
              </label>
              <input
                type="password"
                value={editPlaylist.password}
                onChange={(e) => setEditPlaylist({ ...editPlaylist, password: e.target.value })}
                className="w-full px-3 py-2 focus:ring-1"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--t1)' }}
                placeholder={selectedPlaylist?.password_hash ? 'Leave empty to keep current' : 'Leave empty for public access'}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
                Add a password to restrict access (personal sharing), or leave empty for public access
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 transition-colors"
              style={{ color: 'var(--t1)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white transition-colors"
              style={{ backgroundColor: 'var(--brand-1)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-1)')}
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {showCropper && (
        <ImageCropper
          initialFile={cropperFile || undefined}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setCropperFile(null);
          }}
        />
      )}
    </div>
  );
}
