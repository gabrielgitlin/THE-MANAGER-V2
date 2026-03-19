import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc, Plus, Lock, Globe, Share2, Copy, Trash2, Play, Pause, GripVertical, Pencil, Image, X, Clock, MoreHorizontal, ExternalLink, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import ImageCropper from '../ImageCropper';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';
import MusicPlayer from '../MusicPlayer';

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
      <div className="w-32 h-32 border border-black flex items-center justify-center bg-beige">
        <img src="/tm-vinil-negro_(2).png" alt="Playlist" className="w-8 h-8 object-contain opacity-50" />
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="relative">
        <div className="w-32 h-32 border border-black flex flex-col items-center justify-center bg-beige">
          <img src="/tm-vinil-negro_(2).png" alt="Playlist" className="w-6 h-6 object-contain opacity-50 mb-1" />
          <span className="text-xs text-gray">Failed to load</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 p-1 bg-black text-white hover:bg-gray-800 transition-colors"
          title="Remove cover"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 w-32 h-32 bg-beige flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray border-t-primary animate-spin" style={{ borderRadius: '50%' }} />
        </div>
      )}
      <img
        src={url}
        alt=""
        className={`w-32 h-32 object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 p-1 bg-black text-white hover:bg-gray-800 transition-colors"
        title="Remove cover"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function PlaylistCard({
  playlist,
  isSelected,
  onSelect,
  onShare,
  onEdit,
  onDelete,
  onPlay,
  isCurrentlyPlaying
}: {
  playlist: Playlist;
  isSelected: boolean;
  onSelect: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPlay: () => void;
  isCurrentlyPlaying: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`group relative bg-white border transition-all cursor-pointer ${
        isSelected ? 'border-primary ring-1 ring-primary' : 'border-black hover:border-gray'
      }`}
      style={{ borderTopLeftRadius: '16px' }}
      onClick={onSelect}
    >
      <div className="aspect-square relative overflow-hidden bg-beige" style={{ borderTopLeftRadius: '15px' }}>
        {playlist.cover_url ? (
          <img
            src={playlist.cover_url}
            alt={playlist.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img src="/tm-vinil-negro_(2).png" alt="Playlist" className="w-12 h-12 object-contain opacity-50" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="w-14 h-14 bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 hover:bg-green"
            style={{ borderRadius: '50%' }}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>
        </div>

        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 bg-white/90 text-black hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 mt-1 w-40 bg-white border border-black z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-beige flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-beige flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-beige flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          {playlist.password_hash ? (
            <span className="px-2 py-0.5 bg-black/80 text-white text-xs flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Protected
            </span>
          ) : playlist.is_public ? (
            <span className="px-2 py-0.5 bg-primary text-white text-xs flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Public
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-medium text-black truncate">{playlist.title}</h3>
        <p className="text-xs text-gray mt-1">
          {playlist.track_count} {playlist.track_count === 1 ? 'track' : 'tracks'}
          {playlist.total_duration ? ` • ${Math.floor(playlist.total_duration / 60)} min` : ''}
        </p>
      </div>
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
  });

  const [editPlaylist, setEditPlaylist] = useState({
    title: '',
    description: '',
    is_public: false,
    password: '',
    cover_url: '',
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
            (tracksData || []).map(async (pt: any) => {
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
          const totalDuration = tracksData?.reduce((sum, pt: any) => sum + (pt.tracks?.duration || 0), 0) || 0;

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
            preview_url
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
      const { data: albumTracksData, error } = await supabase
        .from('album_tracks')
        .select(`
          tracks (
            id,
            title,
            duration
          ),
          albums (
            title,
            cover_url,
            artists (
              name
            )
          )
        `);

      if (error) throw error;

      const tracks = (albumTracksData || []).map((at: any) => ({
        id: at.tracks.id,
        title: at.tracks.title,
        duration: at.tracks.duration,
        albumTitle: at.albums?.title || 'Unknown Album',
        albumCover: at.albums?.cover_url,
        artist: at.albums?.artists?.name || 'Unknown Artist',
      }));

      setAvailableTracks(tracks);
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

      setNewPlaylist({ title: '', description: '', is_public: false, password: '', cover_url: '' });
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

  const handleOpenEditModal = (playlist?: Playlist) => {
    const target = playlist || selectedPlaylist;
    if (!target) return;
    setSelectedPlaylist(target);
    setEditPlaylist({
      title: target.title,
      description: target.description || '',
      is_public: target.is_public,
      password: '',
      cover_url: target.cover_url || '',
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
          preview_url
        )
      `)
      .eq('playlist_id', playlist.id)
      .order('position', { ascending: true })
      .then(async ({ data, error }) => {
        if (error || !data || data.length === 0) {
          alert('No tracks available in this playlist');
          return;
        }

        const tracksWithAlbums = await Promise.all(
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
              audioUrl: pt.tracks.audio_url || pt.tracks.preview_url,
              coverArt: albumData?.albums?.cover_url || playlist.cover_url,
              trackNumber: pt.position + 1,
            };
          })
        );

        const tracksWithAudio = tracksWithAlbums.filter(t => t.audioUrl);

        if (tracksWithAudio.length === 0) {
          alert('No tracks with audio available in this playlist');
          return;
        }

        playAlbum(tracksWithAudio);
      });
  };

  const handlePlayFromTrack = (trackIndex: number) => {
    if (!selectedPlaylist || playlistTracks.length === 0) return;

    setCurrentPlaylistId(selectedPlaylist.id);

    const tracks = playlistTracks.map((pt) => ({
      id: pt.tracks.id as any,
      title: pt.tracks.title,
      artist: pt.albums?.[0]?.artists?.name || 'Unknown Artist',
      duration: formatDuration(pt.tracks.duration || 0),
      audioUrl: pt.tracks.audio_url || pt.tracks.preview_url,
      coverArt: pt.albums?.[0]?.cover_url || selectedPlaylist.cover_url,
      trackNumber: pt.position + 1,
    }));

    const tracksWithAudio = tracks.filter(t => t.audioUrl);

    if (tracksWithAudio.length === 0) {
      alert('No tracks with audio available');
      return;
    }

    playAlbum(tracksWithAudio, Math.min(trackIndex, tracksWithAudio.length - 1));
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
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Playlist
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {playlists.length === 0 ? (
            <div className="p-12 text-center">
              <img src="/tm-vinil-negro_(2).png" alt="Playlist" className="mx-auto h-12 w-12 object-contain opacity-40" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No playlists yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new playlist
              </p>
            </div>
          ) : (
            playlists.map((playlist) => {
              return (
                <div key={playlist.id} className="p-6">
                  <div className="flex items-start gap-6 mb-4">
                    <div className="flex-shrink-0 w-48">
                      <div className="w-48 h-48 relative group mb-2">
                        {playlist.cover_url ? (
                          <>
                            <button
                              onClick={() => navigate(`/playlist/${playlist.share_token}`)}
                              className="w-full h-full rounded-lg overflow-hidden bg-gray-100 transition-transform duration-200 hover:scale-105"
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
                              style={{ borderRadius: '50%' }}
                              className="absolute bottom-2 right-2 w-12 h-12 aspect-square bg-blue-600 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-blue-700 ring-2 ring-white overflow-hidden"
                            >
                              {currentPlaylistId === playlist.id && isPlaying ? (
                                <Pause className="w-6 h-6 text-white fill-white" />
                              ) : (
                                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                              )}
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            <img src="/tm-vinil-negro_(2).png" alt="Playlist" className="w-8 h-8 object-contain opacity-40" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 text-center uppercase tracking-wide">
                        {playlist.track_count} {playlist.track_count === 1 ? 'song' : 'songs'}
                        {playlist.total_duration ? `, ${Math.floor(playlist.total_duration / 60)} minutes` : ''}
                      </p>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <button
                            onClick={() => navigate(`/playlist/${playlist.share_token}`)}
                            className="text-lg font-medium text-gray-900 hover:text-primary"
                          >
                            {playlist.title}
                          </button>
                          {playlist.description && (
                            <p className="text-sm text-gray-500 mt-1">{playlist.description}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {playlist.is_public && (
                              <span className="inline-flex items-center gap-1">
                                <Globe className="w-4 h-4" />
                                Public
                              </span>
                            )}
                            {playlist.password_hash && (
                              <span className="inline-flex items-center gap-1 ml-3">
                                <Lock className="w-4 h-4" />
                                Protected
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlaylist(playlist);
                              setPlaylistTracks(playlist.tracks || []);
                              setTimeout(() => setIsAddTracksModalOpen(true), 100);
                            }}
                            className="px-3 py-1.5 text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            Add Tracks
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(playlist);
                            }}
                            className="px-3 py-1.5 text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSharePlaylist(playlist);
                            }}
                            className="px-3 py-1.5 text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                          >
                            <Share2 className="w-4 h-4" />
                            Share
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 mt-4">
                        {(playlist.tracks || []).length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <img src="/tm-vinil-negro_(2).png" alt="Empty" className="mx-auto h-8 w-8 object-contain opacity-30 mb-2" />
                            <p className="text-sm text-gray-500 mb-3">No tracks yet</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlaylist(playlist);
                                setPlaylistTracks([]);
                                setTimeout(() => setIsAddTracksModalOpen(true), 100);
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-green transition-colors text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              Add Tracks to Playlist
                            </button>
                          </div>
                        ) : (
                          (playlist.tracks || []).map((pt) => (
                            <div
                              key={pt.id}
                              className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                            >
                              <span className="w-8 text-sm text-gray-500 text-right">
                                {pt.position + 1}.
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedPlaylist(playlist);
                                  setPlaylistTracks(playlist.tracks || []);
                                  setTimeout(() => {
                                    handlePlayFromTrack(playlist.tracks?.findIndex(t => t.id === pt.id) || 0);
                                  }, 100);
                                }}
                                className="flex-1 text-left text-sm text-gray-900 hover:text-primary"
                              >
                                {pt.tracks.title}
                              </button>
                              <span className="text-sm text-gray-500">{formatDuration(pt.tracks.duration || 0)}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Remove this track from the playlist?')) {
                                    handleRemoveTrack(pt.id);
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 transition-all"
                                title="Remove track"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewPlaylist({ title: '', description: '', is_public: false, password: '', cover_url: '' });
        }}
        title="Create New Playlist"
      >
        <form onSubmit={handleCreatePlaylist} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Playlist Name *
            </label>
            <input
              type="text"
              value={newPlaylist.title}
              onChange={(e) => setNewPlaylist({ ...newPlaylist, title: e.target.value })}
              className="w-full px-3 py-2 border border-black focus:ring-primary focus:border-primary"
              placeholder="My Awesome Playlist"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Description
            </label>
            <textarea
              value={newPlaylist.description}
              onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
              className="w-full px-3 py-2 border border-black focus:ring-primary focus:border-primary"
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Cover Image
            </label>
            <div className="flex items-start gap-4">
              {newPlaylist.cover_url ? (
                <CoverPreview
                  url={newPlaylist.cover_url}
                  onRemove={() => setNewPlaylist({ ...newPlaylist, cover_url: '' })}
                />
              ) : (
                <div className="w-32 h-32 border border-black flex items-center justify-center bg-beige">
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
                  className="inline-flex items-center gap-2 px-4 py-2 border border-black bg-white text-black hover:bg-beige transition-colors disabled:opacity-50"
                >
                  {isUploadingCover ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray border-t-primary animate-spin" style={{ borderRadius: '50%' }} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {newPlaylist.cover_url ? 'Change Image' : 'Add Cover'}
                    </>
                  )}
                </button>
                <p className="text-xs text-gray mt-2">
                  Square image recommended. JPEG, PNG, or WebP.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray/30 pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newPlaylist.is_public}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, is_public: e.target.checked })}
                className="border-black text-primary focus:ring-primary"
              />
              <span className="text-sm text-black">Make playlist shareable</span>
            </label>
          </div>

          {newPlaylist.is_public && (
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Password Protection (Optional)
              </label>
              <input
                type="password"
                value={newPlaylist.password}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, password: e.target.value })}
                className="w-full px-3 py-2 border border-black focus:ring-primary focus:border-primary"
                placeholder="Leave empty for no password"
              />
              <p className="text-xs text-gray mt-1">
                Add a password to protect your shared playlist
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
              className="px-4 py-2 text-black hover:bg-beige transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white hover:bg-green transition-colors"
            >
              Create Playlist
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setCopiedLink(false);
        }}
        title="Share Playlist"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray mb-3">
              {selectedPlaylist?.password_hash
                ? 'Share this link with others. They will need to enter the password to access the playlist.'
                : selectedPlaylist?.is_public
                ? 'Anyone with this link can view and listen to this playlist.'
                : 'This playlist is private. Enable sharing in the edit settings to get a shareable link.'}
            </p>

            {selectedPlaylist?.is_public && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-black bg-beige text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                    copiedLink
                      ? 'bg-primary text-white'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                setIsShareModalOpen(false);
                setCopiedLink(false);
              }}
              className="px-4 py-2 text-black hover:bg-beige transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

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
              className="w-full px-3 py-2 border border-black focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="max-h-96 overflow-y-auto border border-black">
            {filteredTracks.length === 0 ? (
              <div className="p-8 text-center text-gray">
                {searchQuery ? 'No tracks match your search' : 'No tracks available'}
              </div>
            ) : (
              filteredTracks.map((track) => {
                const isAdded = playlistTracks.some(pt => pt.tracks.id === track.id);
                const isSelected = selectedTracks.includes(track.id);

                return (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 p-3 border-b border-gray/30 last:border-b-0 transition-all ${
                      isAdded
                        ? 'bg-beige opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-light-blue'
                        : 'bg-white hover:bg-beige cursor-pointer'
                    }`}
                    onClick={() => {
                      if (isAdded) return;
                      if (isSelected) {
                        setSelectedTracks(selectedTracks.filter(id => id !== track.id));
                      } else {
                        setSelectedTracks([...selectedTracks, track.id]);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isAdded}
                      onChange={() => {}}
                      className="border-black text-primary focus:ring-primary disabled:opacity-50"
                    />
                    {track.albumCover && (
                      <img
                        src={track.albumCover}
                        alt=""
                        className="w-10 h-10 object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-black truncate">{track.title}</p>
                      <p className="text-xs text-gray truncate">
                        {track.artist} • {track.albumTitle}
                      </p>
                    </div>
                    <span className="text-sm text-gray">
                      {formatDuration(track.duration)}
                    </span>
                    {isAdded && (
                      <span className="text-xs text-gray">Added</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray/30">
            <span className="text-sm text-gray">
              {selectedTracks.length} track{selectedTracks.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsAddTracksModalOpen(false);
                  setSelectedTracks([]);
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-black hover:bg-beige transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTracks}
                disabled={selectedTracks.length === 0}
                className="px-4 py-2 bg-primary text-white hover:bg-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Tracks
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Playlist"
      >
        <form onSubmit={handleEditPlaylist} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Playlist Name *
            </label>
            <input
              type="text"
              value={editPlaylist.title}
              onChange={(e) => setEditPlaylist({ ...editPlaylist, title: e.target.value })}
              className="w-full px-3 py-2 border border-black focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Description
            </label>
            <textarea
              value={editPlaylist.description}
              onChange={(e) => setEditPlaylist({ ...editPlaylist, description: e.target.value })}
              className="w-full px-3 py-2 border border-black focus:ring-primary focus:border-primary"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
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
                  className="inline-flex items-center gap-2 px-4 py-2 border border-black bg-white text-black hover:bg-beige transition-colors disabled:opacity-50"
                >
                  {isUploadingCover ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray border-t-primary animate-spin" style={{ borderRadius: '50%' }} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {editPlaylist.cover_url ? 'Change Image' : 'Add Cover'}
                    </>
                  )}
                </button>
                <p className="text-xs text-gray mt-2">
                  Square image recommended. JPEG, PNG, or WebP.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray/30 pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editPlaylist.is_public}
                onChange={(e) => setEditPlaylist({ ...editPlaylist, is_public: e.target.checked })}
                className="border-black text-primary focus:ring-primary"
              />
              <span className="text-sm text-black">Make playlist shareable</span>
            </label>
          </div>

          {editPlaylist.is_public && (
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                {selectedPlaylist?.password_hash ? 'Change Password' : 'Add Password'} (Optional)
              </label>
              <input
                type="password"
                value={editPlaylist.password}
                onChange={(e) => setEditPlaylist({ ...editPlaylist, password: e.target.value })}
                className="w-full px-3 py-2 border border-black focus:ring-primary focus:border-primary"
                placeholder={selectedPlaylist?.password_hash ? 'Leave empty to keep current' : 'Leave empty for no password'}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-black hover:bg-beige transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white hover:bg-green transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {hasInteracted && playerTracks.length > 0 && (
        <MusicPlayer
          tracks={playerTracks}
          currentTrackIndex={currentTrackIndex}
          onTrackChange={setCurrentTrackIndex}
          isPlaying={isPlaying}
          onPlayPause={togglePlayPause}
          onClose={() => setHasInteracted(false)}
        />
      )}

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
