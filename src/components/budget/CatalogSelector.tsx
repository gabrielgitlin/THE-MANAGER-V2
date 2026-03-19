import React, { useState, useEffect } from 'react';
import { Search, Plus, Music, Album as AlbumIcon, ChevronDown, ChevronRight, X, Check } from 'lucide-react';
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catalog {totalSelected > 0 && <span className="text-primary">({totalSelected} selected)</span>}
          </label>
          <p className="text-xs text-gray-500">
            Select existing tracks or create new ones
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search albums and tracks..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* New Track Button */}
      <button
        type="button"
        onClick={() => setShowNewTrackForm(!showNewTrackForm)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create New Track (Not in Catalog)
      </button>

      {/* New Track Form */}
      {showNewTrackForm && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">New Track</h4>
            <button
              type="button"
              onClick={() => setShowNewTrackForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Track Title *
            </label>
            <input
              type="text"
              value={newTrackForm.title}
              onChange={(e) => setNewTrackForm({ ...newTrackForm, title: e.target.value })}
              placeholder="Enter track title"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Duration
              </label>
              <input
                type="text"
                value={newTrackForm.duration}
                onChange={(e) => setNewTrackForm({ ...newTrackForm, duration: e.target.value })}
                placeholder="3:45"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                ISRC (Optional)
              </label>
              <input
                type="text"
                value={newTrackForm.isrc}
                onChange={(e) => setNewTrackForm({ ...newTrackForm, isrc: e.target.value })}
                placeholder="USRC12345678"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddNewTrack}
            disabled={!newTrackForm.title.trim()}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add Track
          </button>
        </div>
      )}

      {/* New Tracks List */}
      {newTracks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
            New Tracks (Not Yet in Catalog)
          </h4>
          {newTracks.map((track) => (
            <div
              key={track.tempId}
              className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <Music className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{track.title}</p>
                  <div className="flex gap-3 text-xs text-gray-500">
                    {track.duration && <span>{track.duration}</span>}
                    {track.isrc && <span>ISRC: {track.isrc}</span>}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveNewTrack(track.tempId)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Catalog Albums and Tracks */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
          Catalog
        </h4>

        {filteredAlbums.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No albums found</p>
          </div>
        ) : (
          filteredAlbums.map((album) => {
            const isExpanded = expandedAlbums.has(album.id);
            const isSelected = isAlbumSelected(album);

            return (
              <div key={album.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Album Header */}
                <div className="bg-white">
                  <div className="flex items-center gap-2 p-3 hover:bg-gray-50">
                    <button
                      type="button"
                      onClick={() => toggleAlbumExpansion(album.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleAlbumSelection(album)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <AlbumIcon className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{album.title || 'Untitled'}</p>
                        <p className="text-xs text-gray-500">
                          {album.artist || 'Unknown Artist'} • {album.format || 'Album'} • {album.tracks?.length || 0} tracks
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </label>
                  </div>

                  {/* Track List */}
                  {isExpanded && album.tracks && album.tracks.length > 0 && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      {album.tracks.map((track) => {
                        const isTrackSelected = selectedTracks.includes(track.id);

                        return (
                          <label
                            key={track.id}
                            className="flex items-center gap-3 px-3 py-2 pl-12 hover:bg-gray-100 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isTrackSelected}
                              onChange={() => handleTrackSelection(track.id)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Music className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{track?.title || 'Untitled Track'}</p>
                              <p className="text-xs text-gray-500">
                                {track?.trackNumber && `Track ${track.trackNumber}`}
                                {track?.duration && ` • ${track.duration}`}
                                {track?.isrc && ` • ${track.isrc}`}
                              </p>
                            </div>
                            {isTrackSelected && (
                              <Check className="w-4 h-4 text-primary" />
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
