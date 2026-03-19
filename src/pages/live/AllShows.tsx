import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Plus, Pencil, Trash2, Search, Filter, ChevronRight } from 'lucide-react';
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

  useEffect(() => {
    loadShows();
  }, []);

  const loadShows = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedShows: any[] = data.map(show => ({
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
      }));

      setShows(formattedShows);
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

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [shows, searchTerm, statusFilter, dateFilter]);

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
        artist_id: artist.id,
        title: showData.title || showData.venue,
        venue_name: showData.venue,
        venue_city: showData.city,
        venue_country: showData.country,
        date: showData.date,
        show_time: showData.time || null,
        capacity: showData.capacity || 0,
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
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-charcoal font-title">ALL SHOWS</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all your shows
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-2 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search shows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="all">All Dates</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingShow(undefined);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
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
                  <div key={show.id} className="bg-green-100 rounded-lg shadow-sm overflow-hidden border border-green-300">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{show.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            show.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : show.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-beige text-black'
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
                            <Pencil className="w-5 h-5" />
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
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-end">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{formatTime(show.time)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{show.venue}, {show.city}, {show.country}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-gray-900 leading-none">
                            {showDate.getDate()}
                          </div>
                          <div className="text-lg font-medium text-gray-700 uppercase">
                            {showDate.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {showDate.getFullYear()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-green-200 border-t border-green-300">
                      <button
                        onClick={() => handleShowClick(show.id)}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
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
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No shows found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters or add a new show
                </p>
                <button
                  onClick={() => {
                    setEditingShow(undefined);
                    setIsModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
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
