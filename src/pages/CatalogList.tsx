import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Filter, Download, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CATALOG } from '../data/catalog';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Track } from '../types';
import { formatDate, formatTime, formatDateTime } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CatalogList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingISRC, setIsFetchingISRC] = useState(false);
  const [isrcResults, setIsrcResults] = useState<{ updated: number; failed: number; upcsUpdated?: number } | null>(null);
  const [allTracks, setAllTracks] = useState<any[]>([]);

  useEffect(() => {
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
          (albumTracksData || []).map(async (at: any) => {
            const { data: credits } = await supabase
              .from('credits')
              .select('*')
              .eq('entity_id', at.tracks.id)
              .eq('entity_type', 'track');

            const artists = credits?.filter(c => c.role === 'artist') || [];
            const producers = credits?.filter(c => c.role === 'producer') || [];
            const songwriters = credits?.filter(c => c.role === 'songwriter') || [];
            const mixEngineers = credits?.filter(c => c.role === 'mix_engineer') || [];
            const masteringEngineers = credits?.filter(c => c.role === 'mastering_engineer') || [];

            return {
              id: at.tracks.id,
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
              mixEngineers: mixEngineers.map(e => ({ name: e.name })),
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

    fetchTracks();
  }, [user]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFetchISRCs = async () => {
    if (!user) return;

    setIsFetchingISRC(true);
    setIsrcResults(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-isrc-codes`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch ISRCs');
      }

      const result = await response.json();
      setIsrcResults({
        updated: result.updated,
        failed: result.failed,
        upcsUpdated: result.upcsUpdated || 0,
      });

      const fetchTracksFunc = async () => {
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
          (albumTracksData || []).map(async (at: any) => {
            const { data: credits } = await supabase
              .from('credits')
              .select('*')
              .eq('entity_id', at.tracks.id)
              .eq('entity_type', 'track');

            const artists = credits?.filter(c => c.role === 'artist') || [];
            const producers = credits?.filter(c => c.role === 'producer') || [];
            const songwriters = credits?.filter(c => c.role === 'songwriter') || [];
            const mixEngineers = credits?.filter(c => c.role === 'mix_engineer') || [];
            const masteringEngineers = credits?.filter(c => c.role === 'mastering_engineer') || [];

            return {
              id: at.tracks.id,
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
              mixEngineers: mixEngineers.map(e => ({ name: e.name })),
              masteringEngineers: masteringEngineers.map(e => ({ name: e.name })),
            };
          })
        );

        setAllTracks(tracksWithCredits);
      };

      await fetchTracksFunc();
    } catch (error) {
      console.error('Error fetching ISRCs:', error);
      alert('Failed to fetch ISRC codes. Please try again.');
    } finally {
      setIsFetchingISRC(false);
    }
  };

  const filteredTracks = allTracks.filter(track => {
    const matchesSearch = 
      track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.albumTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFormat = selectedFormat === 'all' || track.format === selectedFormat;

    return matchesSearch && matchesFormat;
  });

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const data = filteredTracks.map(track => ({
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
        'Mix Engineers': track.mixEngineers.map(e => e.name).join(', '),
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
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

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
        console.warn('Could not load logo, continuing without it:', logoError);
      }

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('CATALOG SPLITS', 15, 30);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${formatDate(new Date())}`, 15, 37);

      const tableData = filteredTracks.map(track => [
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
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
          halign: 'left',
          cellPadding: 2,
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 6,
          cellPadding: 2,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 15 },
          4: { cellWidth: 10 },
          5: { cellWidth: 15 },
          6: { cellWidth: 20 },
          7: { cellWidth: 25 },
          8: { cellWidth: 25 },
          9: { cellWidth: 55 },
          10: { cellWidth: 30 },
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
        doc.text(
          'THE MANAGER',
          15,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - 15,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      }

      doc.save('catalog-splits.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
    setIsExporting(false);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} />;
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-title">Catalog Splits</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage all track splits in your catalog
            </p>
          </div>
          <button
            onClick={() => navigate('/catalog')}
            style={{ backgroundColor: '#000000', color: '#ffffff' }}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold border border-black hover:opacity-80 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
            View All Splits
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tracks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="all">All Formats</option>
                <option value="Single">Singles</option>
                <option value="EP">EPs</option>
                <option value="Album">Albums</option>
              </select>
              {user && (
                <button
                  onClick={handleFetchISRCs}
                  disabled={isFetchingISRC}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetchingISRC ? 'animate-spin' : ''}`} />
                  {isFetchingISRC ? 'Fetching...' : 'Fetch ISRC & UPC'}
                </button>
              )}
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>

        {isrcResults && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800">Fetch Complete</h3>
                <div className="mt-1 text-sm text-green-700">
                  <p>Successfully updated {isrcResults.updated} tracks with ISRC codes{isrcResults.upcsUpdated ? ` and ${isrcResults.upcsUpdated} albums with UPC codes` : ''}.</p>
                  {isrcResults.failed > 0 && (
                    <p className="mt-1">Unable to find codes for {isrcResults.failed} tracks.</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsrcResults(null)}
                className="flex-shrink-0 text-green-600 hover:text-green-800"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artist</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Album</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Release Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISRC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UPC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Songwriters</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRO (IPI)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publisher (IPI)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mix Engineers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mastering Engineers</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTracks.map((track) => (
                <tr key={track.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/catalog/track/${track.id}`)}
                      className="text-sm text-gray-900 hover:text-primary"
                    >
                      {track.title}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{track.artist}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{track.albumTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{track.format}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(track.releaseDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{track.isrc}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{track.upc || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {track.songwriters.map((sw, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="text-gray-900">{sw.name}</span>
                          <span className="text-gray-500"> ({sw.publishingPercentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {track.songwriters.map((sw, idx) => (
                        <div key={idx} className="text-sm text-gray-900">
                          {sw.pros?.map(pro => `${pro.name} (${pro.ipiNumber})`).join(', ')}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {track.songwriters.map((sw, idx) => (
                        <div key={idx} className="text-sm text-gray-900">
                          {sw.publishers?.map(pub => `${pub.name} (${pub.ipiNumber})`).join(', ')}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {track.producers.map((p, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="text-gray-900">{p.name}</span>
                          <span className="text-gray-500"> ({p.masterPercentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {track.mixEngineers.map((e, idx) => (
                        <div key={idx} className="text-sm text-gray-900">{e.name}</div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {track.masteringEngineers.map((e, idx) => (
                        <div key={idx} className="text-sm text-gray-900">{e.name}</div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}