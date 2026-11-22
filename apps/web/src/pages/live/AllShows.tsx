import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Plus, ChevronRight } from 'lucide-react';
import ShowModal from '../../components/shows/ShowModal';
import type { Show } from '../../types';
import { supabase } from '../../lib/supabase';
import { formatDate, formatTime } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import { syncShowToPlatforms } from '../../lib/platformSync';

export default function AllShows() {
  const navigate = useNavigate();
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<any | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past' | 'month'>('all');
  const [tourFilter, setTourFilter] = useState<string>('all');
  const [tours, setTours] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadShows();
  }, []);

  const loadShows = async () => {
    try {
      setLoading(true);
      const [showsRes, toursRes] = await Promise.all([
        supabase.from('shows').select('*, tours(id, name)').order('date', { ascending: false }),
        supabase.from('tours').select('id, name').order('name'),
      ]);

      if (showsRes.error) throw showsRes.error;

      const formattedShows: any[] = (showsRes.data || []).map(show => ({
        id: show.id,
        title: show.title,
        date: show.date,
        time: show.show_time || '',
        venue: show.venue_name,
        city: show.venue_city,
        country: show.venue_country,
        status: show.status,
        capacity: show.capacity,
        ticketsSold: 0,
        tour_id: show.tour_id || null,
        tour_name: show.tours?.name || null,
      }));

      setShows(formattedShows);
      setTours(toursRes.data || []);
    } catch (error) {
      console.error('Error loading shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShows = React.useMemo(() => {
    return shows.filter(show => {
      const matchesSearch =
        show.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        show.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        show.venue.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || show.status === statusFilter;

      const showDate = new Date(show.date);
      const now = new Date();

      let matchesDate = true;
      if (dateFilter === 'upcoming') {
        matchesDate = showDate >= now;
      } else if (dateFilter === 'past') {
        matchesDate = showDate < now;
      } else if (dateFilter === 'month') {
        matchesDate =
          showDate.getMonth() === now.getMonth() &&
          showDate.getFullYear() === now.getFullYear();
      }

      const matchesTour = tourFilter === 'all' ||
        (tourFilter === 'none' ? !show.tour_id : show.tour_id === tourFilter);

      return matchesSearch && matchesStatus && matchesDate && matchesTour;
    });
  }, [shows, searchTerm, statusFilter, dateFilter, tourFilter]);

  const handleAddShow = async (showData: Omit<Show, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to create shows');
        return;
      }

      let { data: artist, error: artistFetchError } = await supabase
        .from('artists')
        .select('id')
        .limit(1)
        .maybeSingle();

      console.log('Artist fetch result:', { artist, artistFetchError });

      if (artistFetchError) {
        console.error('Error fetching artist:', artistFetchError);
        alert(`Failed to fetch artist: ${artistFetchError.message}`);
        return;
      }

      if (!artist) {
        const { data: newArtist, error: artistError } = await supabase
          .from('artists')
          .insert({
            name: user.email?.split('@')[0] || 'Artist'
          })
          .select()
          .single();

        if (artistError) {
          console.error('Error creating artist:', artistError);
          alert('Failed to create artist profile. Please try again.');
          return;
        }
        artist = newArtist;
      }

      const insertData = {
        user_id: user.id,
        artist_id: artist.id,
        title: showData.title || showData.venue || '',
        venue_name: showData.venue || null,
        venue_city: showData.city || null,
        venue_country: showData.country || null,
        date: showData.date || null,
        show_time: showData.time || null,
        capacity: showData.capacity || null,
        status: showData.status || 'Pending',
      };
      console.log('Inserting show data:', insertData);

      const { data, error } = await supabase
        .from('shows')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      const newShow = {
        id: data.id,
        ...showData,
      };
      setShows([newShow, ...shows]);

      syncShowToPlatforms(data, artist.id).catch(error => {
        console.error('Error syncing show to platforms:', error);
      });
    } catch (error: unknown) {
      console.error('Error adding show:', error);
      const err = error as { message?: string; code?: string; details?: string };
      alert(`Failed to create show: ${err.message || err.code || 'Unknown error'}`);
    }
  };

  const handleEditShow = async (showData: Omit<Show, 'id'>) => {
    if (!editingShow) return;

    try {
      const { error } = await supabase
        .from('shows')
        .update({
          title: showData.title,
          venue_name: showData.venue,
          venue_city: showData.city,
          venue_country: showData.country,
          date: showData.date,
          show_time: showData.time,
          capacity: showData.capacity,
          status: showData.status,
        })
        .eq('id', editingShow.id);

      if (error) throw error;

      setShows(shows.map(show =>
        show.id === editingShow.id ? { ...show, ...showData } : show
      ));
      setEditingShow(undefined);
    } catch (error) {
      console.error('Error updating show:', error);
      alert('Failed to update show. Please try again.');
    }
  };

  const handleDeleteShow = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shows')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setShows(shows.filter(show => show.id !== id));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting show:', error);
      alert('Failed to delete show. Please try again.');
    }
  };

  const handleShowClick = (showId: string) => {
    navigate(`/live/show/${showId}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="shadow-md overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-2 flex-1">
              <div className="relative">
                <img src="/TM-Search-negro.svg" className="pxi-md icon-muted absolute left-3 top-1/2 -translate-y-1/2" alt="Search" />
                <input
                  type="text"
                  placeholder="Search shows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 block rounded-md shadow-sm focus:ring-primary sm:text-sm"
                  style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-md shadow-sm focus:ring-primary sm:text-sm"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
              >
                <option value="all" style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)' }}>All Status</option>
                <option value="confirmed" style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)' }}>Confirmed</option>
                <option value="pending" style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)' }}>Pending</option>
                <option value="cancelled" style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)' }}>Cancelled</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="rounded-md shadow-sm focus:ring-primary sm:text-sm"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
              >
                <option value="all">All Dates</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="month">This Month</option>
              </select>

              <select
                value={tourFilter}
                onChange={(e) => setTourFilter(e.target.value)}
                className="rounded-md shadow-sm focus:ring-primary sm:text-sm"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
              >
                <option value="all">All Tours</option>
                <option value="none">No Tour</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingShow(undefined);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:opacity-80"
              style={{ backgroundColor: 'var(--brand-1)', color: 'var(--t1)' }}
            >
              <Plus className="w-4 h-4" />
              Add Show
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShows.length > 0 ? (
              filteredShows.map((show) => {
                const showDate = new Date(show.date);
                return (
                  <div key={show.id} className="shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', border: '1px solid' }}>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 flex-1">
                          <div>
                            <h3 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>{show.title}</h3>
                            {show.tour_name && (
                              <span className="text-xs" style={{ color: 'var(--t3)' }}>{show.tour_name}</span>
                            )}
                          </div>
                          <span className={`status-badge ${
                            show.status === 'confirmed'
                              ? 'badge-green'
                              : show.status === 'cancelled'
                              ? 'badge-neutral'
                              : 'badge-yellow'
                          }`}>
                            {show.status.charAt(0).toUpperCase() + show.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingShow(show);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-500"
                          >
                            <img src="/TM-Pluma-negro.png" className="pxi-lg icon-muted" alt="Edit" />
                          </button>
                          {showDeleteConfirm === show.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteShow(show.id)}
                                className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowDeleteConfirm(show.id)}
                              className="p-2 text-gray-400 hover:text-red-500"
                            >
                              <img src="/TM-Trash-negro.svg" className="pxi-lg icon-danger" alt="Delete" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-end">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--t3)' }}>
                            <Clock className="w-4 h-4" style={{ color: 'var(--t3)' }} />
                            <span>{formatTime(show.time)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--t3)' }}>
                            <MapPin className="w-4 h-4" style={{ color: 'var(--t3)' }} />
                            <span>{show.venue}, {show.city}, {show.country}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold leading-none" style={{ color: 'var(--t1)' }}>
                            {showDate.getDate()}
                          </div>
                          <div className="text-lg font-medium uppercase" style={{ color: 'var(--t2)' }}>
                            {showDate.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-sm" style={{ color: 'var(--t3)' }}>
                            {showDate.getFullYear()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface-3)' }}>
                      <button
                        onClick={() => handleShowClick(show.id)}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium hover:opacity-80"
                        style={{ color: 'var(--brand-1)' }}
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 py-12 text-center">
                <Calendar className="mx-auto h-12 w-12" style={{ color: 'var(--t3)' }} />
                <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--t1)' }}>No shows found</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--t3)' }}>
                  Try adjusting your filters or add a new show
                </p>
                <button
                  onClick={() => {
                    setEditingShow(undefined);
                    setIsModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:opacity-80"
                  style={{ backgroundColor: 'var(--brand-1)', color: 'var(--t1)' }}
                >
                  <Plus className="w-4 h-4" />
                  Add Show
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ShowModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingShow(undefined);
        }}
        onSubmit={editingShow ? handleEditShow : handleAddShow}
        show={editingShow}
      />
    </div>
  );
}
