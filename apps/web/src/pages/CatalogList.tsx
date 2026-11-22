import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreVertical, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CATALOG } from '../data/catalog';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { TMMonthPicker } from '../components/ui/TMMonthPicker';

type SortDir = 'asc' | 'desc';

const COLUMNS = [
  { key: 'title',              label: 'Title' },
  { key: 'artist',             label: 'Artist' },
  { key: 'album',              label: 'Album' },
  { key: 'format',             label: 'Format' },
  { key: 'releaseDate',        label: 'Release Date' },
  { key: 'isrc',               label: 'ISRC' },
  { key: 'upc',                label: 'UPC' },
  { key: 'songwriters',        label: 'Songwriters' },
  { key: 'pro',                label: 'PRO (IPI)' },
  { key: 'publisher',          label: 'Publisher (IPI)' },
  { key: 'producers',          label: 'Producers' },
  { key: 'mixEngineers',       label: 'Mix Engineers' },
  { key: 'masteringEngineers', label: 'Mastering Engineers' },
];

function getSortValue(track: any, key: string): string {
  switch (key) {
    case 'title':              return track.title || '';
    case 'artist':             return track.artist || '';
    case 'album':              return track.albumTitle || '';
    case 'format':             return track.format || '';
    case 'releaseDate':        return track.releaseDate || '';
    case 'isrc':               return track.isrc || '';
    case 'upc':                return track.upc || '';
    case 'songwriters':        return track.songwriters?.[0]?.name || '';
    case 'pro':                return track.songwriters?.[0]?.pros?.[0]?.name || '';
    case 'publisher':          return track.songwriters?.[0]?.publishers?.[0]?.name || '';
    case 'producers':          return track.producers?.[0]?.name || '';
    case 'mixEngineers':       return track.mixEngineers?.[0]?.name || '';
    case 'masteringEngineers': return track.masteringEngineers?.[0]?.name || '';
    default:                   return '';
  }
}

export default function CatalogList({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all'); // kept for export compat
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingISRC, setIsFetchingISRC] = useState(false);
  const [isrcResults, setIsrcResults] = useState<{
    updated: number;
    failed: number;
    upcsUpdated: number;
    details: {
      updated: { title: string; isrc: string; source: string }[];
      failed: { title: string; reason: string }[];
      albumsUpdated: { albumId: string; upc: string }[];
    };
  } | null>(null);
  const [showIsrcModal, setShowIsrcModal] = useState(false);
  const [showIsrcDetails, setShowIsrcDetails] = useState(false);
  const [allTracks, setAllTracks] = useState<any[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [editState, setEditState] = useState<{ trackId: string; field: string; value: string } | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<{
    formats: string[];
    artists: string[];
    dateFrom: string;
    dateTo: string;
  }>({ formats: [], artists: [], dateFrom: '', dateTo: '' });

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) setFilterPanelOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchTracks = async () => {
    if (!user) {
      const mockTracks = CATALOG.flatMap(album =>
        album.tracks.map(track => ({
          ...track,
          albumTitle: album.title,
          artist: album.artist,
          format: album.format,
          label: album.label,
          distributor: album.distributor,
          releaseDate: album.releaseDate,
          genres: album.genres,
          masteringEngineers: album.masteringEngineers,
          mixEngineers: album.mixEngineers,
          producers: album.producers,
        }))
      );
      setAllTracks(mockTracks);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: albumTracksData, error: tracksError } = await supabase
        .from('album_tracks')
        .select(`
          track_number,
          albums (
            id,
            title,
            release_date,
            format,
            genres_array,
            upc,
            artist_id,
            artists (
              name
            )
          ),
          tracks (
            id,
            title,
            duration,
            isrc
          )
        `)
        .order('albums(release_date)', { ascending: false });

      if (tracksError) throw tracksError;

      const tracksWithCredits = await Promise.all(
        (albumTracksData || []).filter((at: any) => at.tracks != null).map(async (at: any) => {
          const { data: credits } = await supabase
            .from('credits')
            .select('*')
            .eq('entity_id', at.tracks.id)
            .eq('entity_type', 'track');

          const producers          = credits?.filter(c => c.role === 'producer') || [];
          const songwriters        = credits?.filter(c => c.role === 'songwriter') || [];
          const mixEngineers       = credits?.filter(c => c.role === 'mix_engineer') || [];
          const masteringEngineers = credits?.filter(c => c.role === 'mastering_engineer') || [];

          return {
            id: at.tracks.id,
            albumId: at.albums?.id || null,
            title: at.tracks.title,
            trackNumber: at.track_number,
            duration: formatDuration(at.tracks.duration || 0),
            isrc: at.tracks.isrc || '',
            upc: at.albums?.upc || '',
            albumTitle: at.albums?.title || 'Unknown Album',
            artist: at.albums?.artists?.name || 'Unknown Artist',
            format: at.albums?.format || 'Album',
            releaseDate: at.albums?.release_date || '',
            genres: at.albums?.genres_array || [],
            label: '',
            distributor: '',
            songwriters: songwriters.map(s => ({
              name: s.name,
              publishingPercentage: s.publishing_percentage || 0,
              pros: [],
              publishers: [],
            })),
            producers: producers.map(p => ({
              name: p.name,
              masterPercentage: p.master_percentage || 0,
            })),
            mixEngineers:       mixEngineers.map(e => ({ name: e.name })),
            masteringEngineers: masteringEngineers.map(e => ({ name: e.name })),
          };
        })
      );

      setAllTracks(tracksWithCredits);
    } catch (err) {
      console.error('Error fetching tracks:', err);
      const mockTracks = CATALOG.flatMap(album =>
        album.tracks.map(track => ({
          ...track,
          albumTitle: album.title,
          artist: album.artist,
          format: album.format,
          label: album.label,
          distributor: album.distributor,
          releaseDate: album.releaseDate,
          genres: album.genres,
          masteringEngineers: album.masteringEngineers,
          mixEngineers: album.mixEngineers,
          producers: album.producers,
        }))
      );
      setAllTracks(mockTracks);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTracks(); }, [user]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFetchISRCs = async () => {
    if (!user) return;
    setIsFetchingISRC(true);
    setIsrcResults(null);
    setMenuOpen(false);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-isrc-codes', {
        body: {},
      });
      if (error) throw error;
      setIsrcResults({
        updated:      data.updated,
        failed:       data.failed,
        upcsUpdated:  data.upcsUpdated || 0,
        details:      data.details || { updated: [], failed: [], albumsUpdated: [] },
      });
      setShowIsrcDetails(false);
      setShowIsrcModal(true);
      await fetchTracks();
    } catch (error: any) {
      console.error('Error fetching ISRCs:', error);
      alert(`Failed to fetch ISRC codes: ${error.message || 'Please try again.'}`);
    } finally {
      setIsFetchingISRC(false);
    }
  };

  const startEdit = (trackId: string, field: string, value: string) => {
    if (!user) return;
    setEditState({ trackId, field, value });
  };

  const handleEditSave = async () => {
    if (!editState) return;
    const { trackId, field, value } = editState;
    setEditState(null);

    const track = allTracks.find(t => t.id === trackId);
    if (!track) return;

    try {
      // Track-level fields
      if (field === 'title') {
        await supabase.from('tracks').update({ title: value }).eq('id', trackId);
        setAllTracks(prev => prev.map(t => t.id === trackId ? { ...t, title: value } : t));
      } else if (field === 'isrc') {
        await supabase.from('tracks').update({ isrc: value }).eq('id', trackId);
        setAllTracks(prev => prev.map(t => t.id === trackId ? { ...t, isrc: value } : t));
      }
      // Album-level fields — update all tracks sharing the same albumId
      else if (field === 'upc' && track.albumId) {
        await supabase.from('albums').update({ upc: value }).eq('id', track.albumId);
        setAllTracks(prev => prev.map(t => t.albumId === track.albumId ? { ...t, upc: value } : t));
      } else if (field === 'releaseDate' && track.albumId) {
        await supabase.from('albums').update({ release_date: value }).eq('id', track.albumId);
        setAllTracks(prev => prev.map(t => t.albumId === track.albumId ? { ...t, releaseDate: value } : t));
      }
    } catch (err) {
      console.error('Inline edit save failed:', err);
    }
  };

  const availableArtists = useMemo(
    () => [...new Set(allTracks.map(t => t.artist).filter(Boolean))].sort() as string[],
    [allTracks]
  );

  const activeFilterCount =
    filters.formats.length + filters.artists.length +
    (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0);

  const toggleFormat = (fmt: string) =>
    setFilters(f => ({
      ...f,
      formats: f.formats.includes(fmt) ? f.formats.filter(x => x !== fmt) : [...f.formats, fmt],
    }));

  const toggleArtist = (artist: string) =>
    setFilters(f => ({
      ...f,
      artists: f.artists.includes(artist) ? f.artists.filter(x => x !== artist) : [...f.artists, artist],
    }));

  const clearFilters = () => setFilters({ formats: [], artists: [], dateFrom: '', dateTo: '' });

  const filteredTracks = useMemo(() => allTracks.filter(track => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = !s ||
      track.title.toLowerCase().includes(s) ||
      track.artist.toLowerCase().includes(s) ||
      track.albumTitle.toLowerCase().includes(s);
    const matchesFormat  = filters.formats.length === 0 || filters.formats.includes(track.format);
    const matchesArtist  = filters.artists.length === 0 || filters.artists.includes(track.artist);
    const matchesDateFrom = !filters.dateFrom || track.releaseDate >= filters.dateFrom + '-01';
    const matchesDateTo   = !filters.dateTo   || track.releaseDate <= filters.dateTo   + '-31';
    return matchesSearch && matchesFormat && matchesArtist && matchesDateFrom && matchesDateTo;
  }), [allTracks, searchTerm, filters]);

  const sortedTracks = useMemo(() => {
    if (!sortColumn) return filteredTracks;
    return [...filteredTracks].sort((a, b) => {
      const aVal = getSortValue(a, sortColumn);
      const bVal = getSortValue(b, sortColumn);
      const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredTracks, sortColumn, sortDir]);

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(key);
      setSortDir('asc');
    }
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    setMenuOpen(false);
    try {
      const data = sortedTracks.map(track => ({
        Title: track.title,
        Artist: track.artist,
        Album: track.albumTitle,
        Format: track.format,
        'Track Number': track.trackNumber,
        Duration: track.duration,
        'Release Date': formatDate(track.releaseDate),
        Label: track.label,
        Distributor: track.distributor,
        ISRC: track.isrc,
        UPC: track.upc,
        Genres: track.genres.join(', '),
        'Songwriters (Publishing %)': track.songwriters.map(sw =>
          `${sw.name} (${sw.publishingPercentage}%)`
        ).join('\n'),
        'PROs (IPI)': track.songwriters.map(sw =>
          sw.pros?.map(pro => `${pro.name} (${pro.ipiNumber})`).join(', ')
        ).join('\n'),
        'Publishers (IPI)': track.songwriters.map(sw =>
          sw.publishers?.map(pub => `${pub.name} (${pub.ipiNumber})`).join(', ')
        ).join('\n'),
        'Producers (Master %)': track.producers.map(p =>
          `${p.name} (${p.masterPercentage}%)`
        ).join('\n'),
        'Mix Engineers':       track.mixEngineers.map(e => e.name).join(', '),
        'Mastering Engineers': track.masteringEngineers.map(e => e.name).join(', '),
      }));
      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Catalog');
      writeFile(wb, 'catalog.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
    setIsExporting(false);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setMenuOpen(false);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      try {
        const response = await fetch('/The Manager_Logo_PNG-2.png');
        const blob = await response.blob();
        const reader = new FileReader();
        const imageData = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        doc.addImage(imageData, 'PNG', 15, 10, 40, 12);
      } catch (logoError) {
        console.warn('Could not load logo:', logoError);
      }

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('CATALOG SPLITS', 15, 30);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${formatDate(new Date())}`, 15, 37);

      const tableData = sortedTracks.map(track => [
        track.title,
        track.artist,
        track.albumTitle,
        track.format,
        track.trackNumber,
        track.duration || '-',
        formatDate(track.releaseDate),
        track.isrc || '-',
        track.upc || '-',
        track.songwriters.map(sw =>
          `${sw.name} (${sw.publishingPercentage}%)\n` +
          `PRO: ${sw.pros?.map(pro => `${pro.name} (${pro.ipiNumber})`).join(', ') || '-'}\n` +
          `Publisher: ${sw.publishers?.map(pub => `${pub.name} (${pub.ipiNumber})`).join(', ') || '-'}`
        ).join('\n\n') || '-',
        track.producers.map(p => `${p.name} (${p.masterPercentage}%)`).join('\n') || '-',
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Title', 'Artist', 'Album', 'Format', '#', 'Duration', 'Release Date', 'ISRC', 'UPC', 'Songwriters & Rights', 'Producers']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0,0,0], textColor: [255,255,255], fontStyle: 'bold', fontSize: 7, halign: 'left', cellPadding: 2 },
        bodyStyles: { textColor: [0,0,0], fontSize: 6, cellPadding: 2 },
        alternateRowStyles: { fillColor: [245,245,245] },
        styles: { lineColor: [200,200,200], lineWidth: 0.1 },
        columnStyles: {
          0: { cellWidth: 30 }, 1: { cellWidth: 25 }, 2: { cellWidth: 25 },
          3: { cellWidth: 15 }, 4: { cellWidth: 10 }, 5: { cellWidth: 15 },
          6: { cellWidth: 20 }, 7: { cellWidth: 25 }, 8: { cellWidth: 25 },
          9: { cellWidth: 55 }, 10: { cellWidth: 30 },
        },
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(15, doc.internal.pageSize.height - 15, doc.internal.pageSize.width - 15, doc.internal.pageSize.height - 15);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('THE MANAGER', 15, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 15, doc.internal.pageSize.height - 10, { align: 'right' });
      }

      doc.save('catalog-splits.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
    setIsExporting(false);
  };

  if (isLoading) return <LoadingSpinner fullScreen={false} />;

  return (
    <div>
      {!embedded && (
        <div className="mb-8">
          <button
            onClick={() => navigate('/catalog')}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border)' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Catalog
          </button>
        </div>
      )}

      <div style={{ backgroundColor: 'var(--surface)' }}>
        {/* Toolbar */}
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
          {/* Search */}
          <div className="relative flex-1">
            <img src="/TM-Search-negro.svg" className="pxi-md icon-muted absolute left-3 top-1/2 -translate-y-1/2" alt="" />
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:text-sm"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
            />
          </div>

          {/* Filter button (icon-only) */}
          <div className="relative" ref={filterPanelRef}>
            <button
              onClick={() => setFilterPanelOpen(o => !o)}
              className="btn btn-secondary btn-icon relative"
              title="Filters"
            >
              <img src="/TM-Filter-negro.svg" className="pxi-md icon-muted" alt="Filters" />
              {activeFilterCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: 'var(--brand-1)', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {filterPanelOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 w-72 p-4 space-y-5"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-2)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
              >
                {/* Format */}
                <div>
                  <div className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>Format</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Single', 'EP', 'Album', 'Demo'].map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => toggleFormat(fmt)}
                        className="text-xs px-2.5 py-1 border transition-colors"
                        style={{
                          borderColor: filters.formats.includes(fmt) ? 'var(--brand-1)' : 'var(--border-2)',
                          color: filters.formats.includes(fmt) ? 'var(--brand-1)' : 'var(--t2)',
                          backgroundColor: filters.formats.includes(fmt) ? 'rgba(0,156,85,0.08)' : 'transparent',
                        }}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Artist */}
                {availableArtists.length > 1 && (
                  <div>
                    <div className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>Artist</div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {availableArtists.map(artist => (
                        <label key={artist} className="flex items-center gap-2 cursor-pointer py-0.5">
                          <input
                            type="checkbox"
                            checked={filters.artists.includes(artist)}
                            onChange={() => toggleArtist(artist)}
                            className="flex-shrink-0"
                            style={{ accentColor: 'var(--brand-1)' }}
                          />
                          <span className="text-sm truncate" style={{ color: 'var(--t2)' }}>{artist}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Release date range */}
                <div>
                  <div className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>Release Date</div>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t4)' }}>From</div>
                      <TMMonthPicker
                        value={filters.dateFrom}
                        onChange={v => setFilters(f => ({ ...f, dateFrom: v }))}
                      />
                    </div>
                    <div>
                      <div className="mb-1" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t4)' }}>To</div>
                      <TMMonthPicker
                        value={filters.dateTo}
                        onChange={v => setFilters(f => ({ ...f, dateTo: v }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Clear */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs w-full text-center pt-1 transition-opacity hover:opacity-70"
                    style={{ color: 'var(--t3)', borderTop: '1px solid var(--border)', paddingTop: 12 }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3-dot menu — only show actions to authenticated users */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="btn btn-secondary btn-icon"
                title="Actions"
                disabled={isExporting || isFetchingISRC}
              >
                {isFetchingISRC
                  ? <img src="/TM-Refresh-negro.svg" className="pxi-md icon-muted animate-spin" alt="" />
                  : <MoreVertical className="w-4 h-4" />
                }
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-50 min-w-[200px] py-1"
                  style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-2)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                >
                  <button
                    onClick={handleFetchISRCs}
                    disabled={isFetchingISRC}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left disabled:opacity-50 transition-colors"
                    style={{ color: 'var(--t1)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <img
                      src="/TM-Refresh-negro.svg"
                      className={`pxi-md icon-muted${isFetchingISRC ? ' animate-spin' : ''}`}
                      alt=""
                    />
                    {isFetchingISRC ? 'Fetching...' : 'Fetch ISRC & UPC'}
                  </button>

                  <div style={{ height: 1, backgroundColor: 'var(--border)', margin: '2px 0' }} />

                  <button
                    onClick={handleExportExcel}
                    disabled={isExporting}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left disabled:opacity-50 transition-colors"
                    style={{ color: 'var(--t1)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <img src="/TM-Download-negro.svg" className="pxi-md icon-muted" alt="" />
                    Export Excel
                  </button>

                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left disabled:opacity-50 transition-colors"
                    style={{ color: 'var(--t1)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <img src="/TM-File-negro.svg" className="pxi-md icon-muted" alt="" />
                    Export PDF
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fetching loading strip */}
        {isFetchingISRC && (
          <div className="px-4 py-2.5 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
            <img src="/TM-Refresh-negro.svg" className="pxi-sm icon-muted animate-spin flex-shrink-0" alt="" />
            <span className="text-sm" style={{ color: 'var(--t2)' }}>Looking for ISRC &amp; UPC codes…</span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table min-w-full">
            <thead>
              <tr>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left cursor-pointer select-none whitespace-nowrap"
                    style={{ color: sortColumn === col.key ? 'var(--brand-1)' : 'var(--t3)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {col.label}
                      </span>
                      {sortColumn === col.key
                        ? sortDir === 'asc'
                          ? <ChevronUp className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--brand-1)' }} />
                          : <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--brand-1)' }} />
                        : <ChevronsUpDown className="w-3 h-3 flex-shrink-0 opacity-30" />
                      }
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTracks.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center" style={{ color: 'var(--t3)' }}>
                    No tracks found.
                  </td>
                </tr>
              ) : (
                sortedTracks.map(track => (
                  <tr key={track.id}>
                    {/* Title — click to navigate, double-click to edit */}
                    <td
                      className="px-4 py-3 whitespace-nowrap group/cell"
                      onDoubleClick={() => startEdit(track.id, 'title', track.title)}
                      title={user ? 'Double-click to edit' : undefined}
                    >
                      {editState?.trackId === track.id && editState?.field === 'title' ? (
                        <input
                          autoFocus
                          type="text"
                          value={editState.value}
                          onChange={e => setEditState(s => s ? { ...s, value: e.target.value } : s)}
                          onBlur={handleEditSave}
                          onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditState(null); }}
                          className="w-full bg-transparent outline-none text-sm"
                          style={{ color: 'var(--t1)', borderBottom: '1px solid var(--brand-1)', padding: 0 }}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm" style={{ color: 'var(--t1)' }}>{track.title}</span>
                          <button
                            onClick={() => navigate(`/catalog/track/${track.id}`)}
                            className="opacity-0 group-hover/cell:opacity-40 hover:!opacity-100 transition-opacity flex-shrink-0"
                            title="Open track"
                            onDoubleClick={e => e.stopPropagation()}
                          >
                            <img src="/TM-ExternalLink-negro.svg" className="pxi-sm icon-muted" alt="Open" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--t1)' }}>{track.artist}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--t2)' }}>{track.albumTitle}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--t2)' }}>{track.format}</td>
                    {/* Release Date — double-click to edit */}
                    <td
                      className="px-4 py-3 whitespace-nowrap text-sm"
                      style={{ color: 'var(--t2)', cursor: user ? 'text' : 'default' }}
                      onDoubleClick={() => startEdit(track.id, 'releaseDate', track.releaseDate)}
                      title={user ? 'Double-click to edit' : undefined}
                    >
                      {editState?.trackId === track.id && editState?.field === 'releaseDate' ? (
                        <input
                          autoFocus
                          type="text"
                          value={editState.value}
                          onChange={e => setEditState(s => s ? { ...s, value: e.target.value } : s)}
                          onBlur={handleEditSave}
                          onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditState(null); }}
                          className="w-full bg-transparent outline-none text-sm"
                          style={{ color: 'var(--t1)', borderBottom: '1px solid var(--brand-1)', padding: 0, width: 100 }}
                        />
                      ) : (
                        formatDate(track.releaseDate)
                      )}
                    </td>
                    {/* ISRC — double-click to edit */}
                    <td
                      className="px-4 py-3 whitespace-nowrap text-sm"
                      style={{ color: 'var(--t2)', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: user ? 'text' : 'default' }}
                      onDoubleClick={() => startEdit(track.id, 'isrc', track.isrc)}
                      title={user ? 'Double-click to edit' : undefined}
                    >
                      {editState?.trackId === track.id && editState?.field === 'isrc' ? (
                        <input
                          autoFocus
                          type="text"
                          value={editState.value}
                          onChange={e => setEditState(s => s ? { ...s, value: e.target.value } : s)}
                          onBlur={handleEditSave}
                          onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditState(null); }}
                          className="w-full bg-transparent outline-none"
                          style={{ color: 'var(--t1)', fontFamily: 'var(--font-mono)', fontSize: 12, borderBottom: '1px solid var(--brand-1)', padding: 0, width: 120 }}
                        />
                      ) : (
                        track.isrc || <span style={{ color: 'var(--t4)' }}>—</span>
                      )}
                    </td>
                    {/* UPC — double-click to edit */}
                    <td
                      className="px-4 py-3 whitespace-nowrap text-sm"
                      style={{ color: 'var(--t2)', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: user ? 'text' : 'default' }}
                      onDoubleClick={() => startEdit(track.id, 'upc', track.upc)}
                      title={user ? 'Double-click to edit' : undefined}
                    >
                      {editState?.trackId === track.id && editState?.field === 'upc' ? (
                        <input
                          autoFocus
                          type="text"
                          value={editState.value}
                          onChange={e => setEditState(s => s ? { ...s, value: e.target.value } : s)}
                          onBlur={handleEditSave}
                          onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditState(null); }}
                          className="w-full bg-transparent outline-none"
                          style={{ color: 'var(--t1)', fontFamily: 'var(--font-mono)', fontSize: 12, borderBottom: '1px solid var(--brand-1)', padding: 0, width: 120 }}
                        />
                      ) : (
                        track.upc || <span style={{ color: 'var(--t4)' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {track.songwriters.map((sw: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            <span style={{ color: 'var(--t1)' }}>{sw.name}</span>
                            <span style={{ color: 'var(--t3)' }}> ({sw.publishingPercentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {track.songwriters.map((sw: any, idx: number) => (
                          <div key={idx} className="text-sm" style={{ color: 'var(--t2)' }}>
                            {sw.pros?.map((pro: any) => `${pro.name} (${pro.ipiNumber})`).join(', ')}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {track.songwriters.map((sw: any, idx: number) => (
                          <div key={idx} className="text-sm" style={{ color: 'var(--t2)' }}>
                            {sw.publishers?.map((pub: any) => `${pub.name} (${pub.ipiNumber})`).join(', ')}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {track.producers.map((p: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            <span style={{ color: 'var(--t1)' }}>{p.name}</span>
                            <span style={{ color: 'var(--t3)' }}> ({p.masterPercentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {track.mixEngineers.map((e: any, idx: number) => (
                          <div key={idx} className="text-sm" style={{ color: 'var(--t2)' }}>{e.name}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {track.masteringEngineers.map((e: any, idx: number) => (
                          <div key={idx} className="text-sm" style={{ color: 'var(--t2)' }}>{e.name}</div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ISRC / UPC results modal */}
      {isrcResults && (
        <Modal
          isOpen={showIsrcModal}
          onClose={() => setShowIsrcModal(false)}
          title="ISRC & UPC Fetch Results"
          maxWidth="md"
        >
          {/* Summary */}
          <div className="space-y-4">
            <div className="text-sm leading-relaxed" style={{ color: 'var(--t2)' }}>
              {isrcResults.updated > 0 ? (
                <><span style={{ color: 'var(--brand-1)' }}>{isrcResults.updated}</span> track{isrcResults.updated !== 1 ? 's' : ''} updated with ISRC codes</>
              ) : (
                <span>No new ISRC codes found</span>
              )}
              {isrcResults.upcsUpdated > 0 && (
                <>, <span style={{ color: 'var(--brand-1)' }}>{isrcResults.upcsUpdated}</span> album{isrcResults.upcsUpdated !== 1 ? 's' : ''} updated with UPC codes</>
              )}
              {isrcResults.failed > 0 && (
                <>. <span style={{ color: 'var(--t1)' }}>{isrcResults.failed}</span> track{isrcResults.failed !== 1 ? 's' : ''} not found</>
              )}
              .
            </div>

            {(isrcResults.details.updated.length > 0 || isrcResults.details.failed.length > 0) && (
              <button
                onClick={() => setShowIsrcDetails(d => !d)}
                className="text-sm transition-opacity hover:opacity-80"
                style={{ color: 'var(--brand-1)' }}
              >
                {showIsrcDetails ? 'Hide details' : 'See more'}
              </button>
            )}

            {showIsrcDetails && (
              <div className="space-y-5 pt-1">
                {isrcResults.details.updated.length > 0 && (
                  <div>
                    <div className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>
                      Updated ({isrcResults.details.updated.length})
                    </div>
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {isrcResults.details.updated.map((t, i) => (
                        <div key={i} className="flex items-center justify-between py-2 gap-4">
                          <span className="text-sm truncate" style={{ color: 'var(--t1)' }}>{t.title}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)' }}>{t.isrc}</span>
                            <span className="text-xs px-1.5 py-0.5" style={{ backgroundColor: 'var(--surface-3)', color: 'var(--t3)' }}>{t.source}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isrcResults.details.failed.length > 0 && (
                  <div>
                    <div className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>
                      Not found ({isrcResults.details.failed.length})
                    </div>
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {isrcResults.details.failed.map((t, i) => (
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
    </div>
  );
}
