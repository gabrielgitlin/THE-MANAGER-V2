import React, { useState, useEffect } from 'react';
import { Plus, Music, Album as AlbumIcon, ChevronDown, ChevronRight } from 'lucide-react';
import type { Album, Track } from '../../types';
import { supabase } from '../../lib/supabase';
import { CATALOG } from '../../data/catalog';
import { useAuthStore } from '../../store/authStore';

interface CatalogSelectorProps {
  selectedTracks: number[];
  onSelectionChange: (trackIds: number[], newTracks?: NewTrack[]) => void;
  releaseType?: 'single' | 'ep' | 'album';
}

interface NewTrack {
  tempId: string;
  title: string;
  duration?: string;
  isrc?: string;
}

export default function CatalogSelector({ selectedTracks, onSelectionChange, releaseType }: CatalogSelectorProps) {
  const { user } = useAuthStore();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [expandedAlbums, setExpandedAlbums] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTrackForm, setShowNewTrackForm] = useState(false);
  const [newTracks, setNewTracks] = useState<NewTrack[]>([]);
  const [newTrackForm, setNewTrackForm] = useState<NewTrack>({
    tempId: '',
    title: '',
    duration: '',
    isrc: '',
  });

  useEffect(() => {
    fetchAlbums();
  }, [user]);

  const fetchAlbums = async () => {
    if (!user) {
      setAlbums(CATALOG);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('albums')
        .select(`
          *,
          tracks:album_tracks(
            track:tracks(*)
          )
        `)
        .order('release_date', { ascending: false });

      if (error) throw error;

      const formattedAlbums = data?.map(album => ({
        ...album,
        tracks: album.tracks?.map((t: any) => t.track).filter(Boolean) || [],
      })) || [];

      setAlbums(formattedAlbums.length > 0 ? formattedAlbums : CATALOG);
    } catch (error) {
      console.error('Error fetching albums:', error);
      setAlbums(CATALOG);
    }
  };

  const toggleAlbumExpansion = (albumId: number) => {
    const newExpanded = new Set(expandedAlbums);
    if (newExpanded.has(albumId)) {
      newExpanded.delete(albumId);
    } else {
      newExpanded.add(albumId);
    }
    setExpandedAlbums(newExpanded);
  };

  const isAlbumSelected = (album: Album) => {
    if (!album.tracks || album.tracks.length === 0) return false;
    return album.tracks.every(track => selectedTracks.includes(track.id));
  };

  const handleAlbumSelection = (album: Album) => {
    if (!album.tracks || album.tracks.length === 0) return;
    const albumTrackIds = album.tracks.map(t => t.id);
    const isSelected = isAlbumSelected(album);

    let newSelection: number[];
    if (isSelected) {
      newSelection = selectedTracks.filter(id => !albumTrackIds.includes(id));
    } else {
      const uniqueIds = new Set([...selectedTracks, ...albumTrackIds]);
      newSelection = Array.from(uniqueIds);
    }

    onSelectionChange(newSelection, newTracks);
  };

  const handleTrackSelection = (trackId: number) => {
    let newSelection: number[];
    if (selectedTracks.includes(trackId)) {
      newSelection = selectedTracks.filter(id => id !== trackId);
    } else {
      newSelection = [...selectedTracks, trackId];
    }

    onSelectionChange(newSelection, newTracks);
  };

  const handleAddNewTrack = () => {
    if (!newTrackForm.title.trim()) return;

    const tempId = `new-${Date.now()}`;
    const track: NewTrack = {
      ...newTrackForm,
      tempId,
    };

    const updatedNewTracks = [...newTracks, track];
    setNewTracks(updatedNewTracks);
    onSelectionChange(selectedTracks, updatedNewTracks);

    setNewTrackForm({
      tempId: '',
      title: '',
      duration: '',
      isrc: '',
    });
    setShowNewTrackForm(false);
  };

  const handleRemoveNewTrack = (tempId: string) => {
    const updatedNewTracks = newTracks.filter(t => t.tempId !== tempId);
    setNewTracks(updatedNewTracks);
    onSelectionChange(selectedTracks, updatedNewTracks);
  };

  const filteredAlbums = albums.filter(album => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      album?.title?.toLowerCase().includes(query) ||
      album?.artist?.toLowerCase().includes(query) ||
      album?.tracks?.some(t => t?.title?.toLowerCase().includes(query))
    );
  });

  const totalSelected = selectedTracks.length + newTracks.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--t1)' }}>
            Catalog {totalSelected > 0 && <span className="text-primary">({totalSelected} selected)</span>}
          </label>
          <p className="text-xs" style={{ color: 'var(--t2)' }}>
            Select existing tracks or create new ones
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <img src="/TM-Search-negro.svg" className="pxi-md icon-muted absolute left-3 top-1/2 transform -translate-y-1/2" alt="" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search albums and tracks..."
          className="w-full pl-10 pr-4 py-2 border focus:ring-2 focus:ring-primary focus:border-transparent"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
        />
      </div>

      {/* New Track Button */}
      <button
        type="button"
        onClick={() => setShowNewTrackForm(!showNewTrackForm)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed text-sm font-medium hover:opacity-80 transition-opacity"
        style={{ borderColor: 'var(--border)', color: 'var(--t2)' }}
      >
        <Plus className="w-4 h-4" />
        Create New Track (Not in Catalog)
      </button>

      {/* New Track Form */}
      {showNewTrackForm && (
        <div className="p-4 border space-y-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium" style={{ color: 'var(--t1)' }}>New Track</h4>
            <button
              type="button"
              onClick={() => setShowNewTrackForm(false)}
              className="hover:opacity-80"
              style={{ color: 'var(--t2)' }}
            >
              <img src="/TM-Close-negro.svg" className="pxi-md icon-muted" alt="" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--t1)' }}>
              Track Title *
            </label>
            <input
              type="text"
              value={newTrackForm.title}
              onChange={(e) => setNewTrackForm({ ...newTrackForm, title: e.target.value })}
              placeholder="Enter track title"
              className="w-full px-3 py-2 text-sm border focus:ring-2 focus:ring-primary focus:border-transparent"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--t1)' }}>
                Duration
              </label>
              <input
                type="text"
                value={newTrackForm.duration}
                onChange={(e) => setNewTrackForm({ ...newTrackForm, duration: e.target.value })}
                placeholder="3:45"
                className="w-full px-3 py-2 text-sm border focus:ring-2 focus:ring-primary focus:border-transparent"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--t1)' }}>
                ISRC (Optional)
              </label>
              <input
                type="text"
                value={newTrackForm.isrc}
                onChange={(e) => setNewTrackForm({ ...newTrackForm, isrc: e.target.value })}
                placeholder="USRC12345678"
                className="w-full px-3 py-2 text-sm border focus:ring-2 focus:ring-primary focus:border-transparent"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddNewTrack}
            disabled={!newTrackForm.title.trim()}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Track
          </button>
        </div>
      )}

      {/* New Tracks List */}
      {newTracks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--t2)' }}>
            New Tracks (Not Yet in Catalog)
          </h4>
          {newTracks.map((track) => (
            <div
              key={track.tempId}
              className="flex items-center justify-between p-3 border"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3 flex-1">
                <Music className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--t1)' }}>{track.title}</p>
                  <div className="flex gap-3 text-xs" style={{ color: 'var(--t2)' }}>
                    {track.duration && <span>{track.duration}</span>}
                    {track.isrc && <span>ISRC: {track.isrc}</span>}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveNewTrack(track.tempId)}
                className="p-1 hover:text-red-500"
                style={{ color: 'var(--t2)' }}
              >
                <img src="/TM-Close-negro.svg" className="pxi-md icon-muted" alt="" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Catalog Albums and Tracks */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <h4 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--t2)' }}>
          Catalog
        </h4>

        {filteredAlbums.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--t2)' }}>
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No albums found</p>
          </div>
        ) : (
          filteredAlbums.map((album) => {
            const isExpanded = expandedAlbums.has(album.id);
            const isSelected = isAlbumSelected(album);

            return (
              <div key={album.id} className="border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                {/* Album Header */}
                <div style={{ background: 'var(--surface)' }}>
                  <div className="flex items-center gap-2 p-3 hover:opacity-80">
                    <button
                      type="button"
                      onClick={() => toggleAlbumExpansion(album.id)}
                      className="p-1 hover:opacity-80"
                      style={{ color: 'var(--t2)' }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleAlbumSelection(album)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <AlbumIcon className="w-5 h-5" style={{ color: 'var(--t2)' }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'var(--t1)' }}>{album.title || 'Untitled'}</p>
                        <p className="text-xs" style={{ color: 'var(--t2)' }}>
                          {album.artist || 'Unknown Artist'} • {album.format || 'Album'} • {album.tracks?.length || 0} tracks
                        </p>
                      </div>
                      {isSelected && (
                        <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-green" alt="" />
                      )}
                    </label>
                  </div>

                  {/* Track List */}
                  {isExpanded && album.tracks && album.tracks.length > 0 && (
                    <div className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                      {album.tracks.map((track) => {
                        const isTrackSelected = selectedTracks.includes(track.id);

                        return (
                          <label
                            key={track.id}
                            className="flex items-center gap-3 px-3 py-2 pl-12 hover:opacity-80 cursor-pointer"
                            style={{ color: 'var(--t1)' }}
                          >
                            <input
                              type="checkbox"
                              checked={isTrackSelected}
                              onChange={() => handleTrackSelection(track.id)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Music className="w-4 h-4" style={{ color: 'var(--t2)' }} />
                            <div className="flex-1">
                              <p className="text-sm" style={{ color: 'var(--t1)' }}>{track?.title || 'Untitled Track'}</p>
                              <p className="text-xs" style={{ color: 'var(--t2)' }}>
                                {track?.trackNumber && `Track ${track.trackNumber}`}
                                {track?.duration && ` • ${track.duration}`}
                                {track?.isrc && ` • ${track.isrc}`}
                              </p>
                            </div>
                            {isTrackSelected && (
                              <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-green" alt="" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
