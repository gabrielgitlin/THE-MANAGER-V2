import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc, Pencil, Plus, GripVertical, ArrowRight, Play, Download } from 'lucide-react';
import Modal from '../components/Modal';
import CatalogForm from '../components/CatalogForm';
import NewContentSelector from '../components/catalog/NewContentSelector';
import SpotifyImportModal from '../components/catalog/SpotifyImportModal';
import PlaylistsTab from '../components/catalog/PlaylistsTab';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import type { Album, Track } from '../types';
import { CATALOG } from '../data/catalog';
import { formatDate, formatTime, formatDateTime } from '../lib/utils';
import { isSupabaseReady, supabase } from '../lib/supabase';
import { useMusicPlayerStore } from '../store/musicPlayerStore';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Catalog() {
  const navigate = useNavigate();
  const { playAlbum } = useMusicPlayerStore();
  const { user } = useAuthStore();
  const [catalog, setCatalog] = useState<Album[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewContentModalOpen, setIsNewContentModalOpen] = useState(false);
  const [isSpotifyImportModalOpen, setIsSpotifyImportModalOpen] = useState(false);
  const [editingAlbumId, setEditingAlbumId] = useState<number | null>(null);
  const [editingTrackId, setEditingTrackId] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedTrackId, setDraggedTrackId] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'Single' | 'EP' | 'Album'>('Single');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<'All' | 'Album' | 'EP' | 'Single'>('All');
  const [currentArtistId, setCurrentArtistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mainTab, setMainTab] = useState<'catalog' | 'playlists'>('catalog');
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
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
          artist_projects: [{ id: artistId, name: formData.artist || 'Unknown' }],
          format: formData.format,
          cover_url: coverUrl,
          release_date: new Date().toISOString().split('T')[0],
          status: 'draft',
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

      // Reset form and close modal
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
          cover_url,
          format,
          status,
          artist_id,
          artist_projects,
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
                preview_url
              )
            `)
            .eq('album_id', album.id)
            .order('disc_number', { ascending: true })
            .order('track_number', { ascending: true });

          return {
            id: album.id as any,
            title: album.title,
            artist: album.artists?.name || 'Unknown Artist',
            releaseDate: album.release_date,
            artworkUrl: album.cover_url,
            format: album.format as 'Album' | 'EP' | 'Single',
            status: album.status,
            tracks: (albumTracks || []).map((at: any) => ({
              id: at.tracks.id as any,
              title: at.tracks.title,
              duration: formatDuration(at.tracks.duration || 0),
              trackNumber: at.track_number,
              artist: album.artists?.name || 'Unknown Artist',
              audioUrl: at.tracks.audio_url || at.tracks.preview_url || undefined,
            })),
          };
        })
      );

      setCatalog(albumsWithTracks);
    } catch (err) {
      console.error('Error fetching catalog:', err);
      setCatalog([...CATALOG].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [user]);

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

  const albumCount = catalog.filter(item => item.format === 'Album').length;
  const epCount = catalog.filter(item => item.format === 'EP').length;
  const singleCount = catalog.filter(item => item.format === 'Single').length;
  const totalCount = catalog.length;

  const handleDragStart = (trackId: number) => {
    setDraggedTrackId(trackId);
  };

  const handleDragOver = (e: React.DragEvent, albumId: number, trackNumber: number) => {
    e.preventDefault();
    if (!draggedTrackId) return;

    const updatedCatalog = catalog.map(album => {
      if (album.id !== albumId) return album;

      const tracks = [...album.tracks];
      const draggedTrackIndex = tracks.findIndex(t => t.id === draggedTrackId);
      const targetTrackIndex = tracks.findIndex(t => t.trackNumber === trackNumber);

      if (draggedTrackIndex === -1 || targetTrackIndex === -1) return album;

      const temp = tracks[draggedTrackIndex].trackNumber;
      tracks[draggedTrackIndex].trackNumber = tracks[targetTrackIndex].trackNumber;
      tracks[targetTrackIndex].trackNumber = temp;

      tracks.sort((a, b) => a.trackNumber - b.trackNumber);

      return { ...album, tracks };
    });

    setCatalog(updatedCatalog);
  };

  const handleNewContentSelect = (type: 'song' | 'ep' | 'album') => {
    setSelectedFormat(type === 'song' ? 'Single' : type === 'ep' ? 'EP' : 'Album');
    setIsNewContentModalOpen(false);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-title">CATALOG</h1>
            <p className="mt-1 text-sm text-gray-500">
              {mainTab === 'catalog'
                ? 'Manage and track your music releases'
                : 'Create and share custom playlists'}
            </p>
          </div>
          {mainTab === 'catalog' && (
            <button
              onClick={() => navigate('/catalog/list')}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors whitespace-nowrap"
            >
              <span className="font-medium">View All Splits</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <Tabs value={mainTab} onValueChange={(value) => setMainTab(value as 'catalog' | 'playlists')}>
          <TabsList>
            <TabsTrigger value="catalog" className="uppercase">
              Catalog
            </TabsTrigger>
            <TabsTrigger value="playlists" className="uppercase">
              Playlists
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {mainTab === 'catalog' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <Tabs value={formatFilter} onValueChange={(value) => setFormatFilter(value as 'All' | 'Album' | 'EP' | 'Single')}>
              <TabsList>
                <TabsTrigger value="All" className="uppercase">
                  All
                </TabsTrigger>
                <TabsTrigger value="Album" className="uppercase">
                  Albums
                </TabsTrigger>
                <TabsTrigger value="EP" className="uppercase">
                  EPs
                </TabsTrigger>
                <TabsTrigger value="Single" className="uppercase">
                  Singles
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span><span className="font-semibold text-gray-900">{albumCount}</span> Albums</span>
              <span className="text-gray-300">|</span>
              <span><span className="font-semibold text-gray-900">{epCount}</span> EPs</span>
              <span className="text-gray-300">|</span>
              <span><span className="font-semibold text-gray-900">{singleCount}</span> Singles</span>
            </div>
          </div>
        </>
      )}

      {mainTab === 'catalog' ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsNewContentModalOpen(true)}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
                <button
                  onClick={() => setIsSpotifyImportModalOpen(true)}
                  disabled={!currentArtistId}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Import entire catalog from Spotify"
                >
                  <Download className="w-4 h-4" />
                  Import from Spotify
                </button>
                <button
                  onClick={() => setIsReordering(!isReordering)}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    isReordering
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isReordering ? 'Done Reordering' : 'Reorder Tracks'}
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <LoadingSpinner fullScreen={false} />
            ) : catalog.length === 0 ? (
              <div className="p-12 text-center">
                <img src="/tm-vinil-negro_(2).png" alt="Catalog" className="mx-auto h-12 w-12 object-contain opacity-40" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No albums yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new album or importing from Spotify.</p>
              </div>
            ) : catalog.filter(album => formatFilter === 'All' || album.format === formatFilter).map((album) => (
              <div key={album.id} className="p-6">
                <div className="flex items-start gap-6 mb-4">
                  <div className="flex-shrink-0 w-48">
                    <div className="w-48 h-48 relative group mb-2">
                      {album.artworkUrl ? (
                        <>
                          <button
                            onClick={() => navigate(`/catalog/album/${album.id}`)}
                            className="w-full h-full rounded-lg overflow-hidden bg-gray-100 transition-transform duration-200 hover:scale-105"
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
                            style={{ borderRadius: '50%' }}
                            className="absolute bottom-2 right-2 w-12 h-12 aspect-square bg-blue-600 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-blue-700 ring-2 ring-white overflow-hidden"
                          >
                            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          <img src="/tm-vinil-negro_(2).png" alt="Album" className="w-8 h-8 object-contain opacity-40" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 text-center uppercase tracking-wide">
                      {album.tracks.length} {album.tracks.length === 1 ? 'song' : 'songs'}, {formatTotalMinutes(calculateTotalDuration(album.tracks))} minutes
                    </p>
                  </div>

                  <div className="flex-1">
                    <div>
                      <button
                        onClick={() => navigate(`/catalog/album/${album.id}`)}
                        className="text-lg font-medium text-gray-900 hover:text-primary"
                      >
                        {album.title}
                      </button>
                      <p className="text-sm text-gray-500">{album.artist}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Released {formatDate(album.releaseDate)}
                      </p>
                    </div>

                    <div className="space-y-1 mt-4">
                      {album.tracks.map((track) => (
                        <div
                          key={track.id}
                          draggable={isReordering}
                          onDragStart={() => handleDragStart(track.id)}
                          onDragOver={(e) => handleDragOver(e, album.id, track.trackNumber)}
                          className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {isReordering && (
                            <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                          )}
                          <span className="w-8 text-sm text-gray-500 text-right">
                            {track.trackNumber}.
                          </span>
                          <button
                            onClick={() => navigate(`/catalog/track/${track.id}`)}
                            className="flex-1 text-left text-sm text-gray-900 hover:text-primary"
                          >
                            {track.title}
                          </button>
                          <span className="text-sm text-gray-500">{track.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <PlaylistsTab />
      )}

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
        title={editingTrackId ? 'Edit Track' : `Add New ${selectedFormat}`}
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
          }}
        />
      )}
    </div>
  );
}