import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Plus, Pencil, Trash2, ChevronRight, Search, Filter, DollarSign, Users } from 'lucide-react';
import ShowModal from '../../components/shows/ShowModal';
import type { Show } from '../../types';
import { LOGISTICS_OVERVIEW } from '../../data/logistics';
import { supabase } from '../../lib/supabase';
import { formatDate, formatTime } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import { syncShowToPlatforms } from '../../lib/platformSync';

export default function Overview() {
  const navigate = useNavigate();
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<any | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past' | 'month'>('all');
  const [selectedEventType, setSelectedEventType] = useState<'all' | 'show' | 'travel' | 'accommodation'>('all');

  useEffect(() => {
    loadShowsAndEvents();
  }, []);

  const loadShowsAndEvents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const showsPromise = supabase
        .from('shows')
        .select('*, artists(name)')
        .order('date', { ascending: false })
        .limit(6);

      const calendarEventsPromise = supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      const transportationPromise = supabase
        .from('transportation')
        .select('*, shows!inner(date)')
        .order('departure_time', { ascending: true });

      const accommodationsPromise = supabase
        .from('accommodations')
        .select('*, shows!inner(date)')
        .order('check_in_date', { ascending: true });

      const [showsRes, calendarRes, transportationRes, accommodationsRes] = await Promise.all([
        showsPromise,
        calendarEventsPromise,
        transportationPromise,
        accommodationsPromise,
      ]);

      if (showsRes.data) {
        const formattedShows: any[] = showsRes.data.map(show => ({
          id: show.id,
          title: show.title,
          artist_name: show.artists?.name || '',
          date: show.date,
          time: show.show_time || '',
          venue: show.venue_name,
          venue_address: show.venue_address,
          city: show.venue_city,
          state: show.venue_state,
          country: show.venue_country,
          status: show.status,
          capacity: show.capacity,
          ticketsSold: 0,
        }));
        setShows(formattedShows);
      }

      const allEvents: any[] = [];

      if (showsRes.data) {
        showsRes.data.forEach(show => {
          allEvents.push({
            id: `show-${show.id}`,
            type: 'show',
            title: show.title,
            date: show.date,
            time: show.show_time || '20:00',
            location: `${show.venue_name}, ${show.venue_city}, ${show.venue_country}`,
            showId: show.id,
            status: show.status,
          });
        });
      }

      if (calendarRes.data) {
        calendarRes.data.forEach(event => {
          allEvents.push({
            id: `calendar-${event.id}`,
            type: event.event_type,
            title: event.title,
            date: event.start_date,
            time: event.start_time || '00:00',
            location: event.location || '',
            status: 'confirmed',
          });
        });
      }

      if (transportationRes.data) {
        transportationRes.data.forEach(transport => {
          const departureDate = new Date(transport.departure_time);
          allEvents.push({
            id: `transport-${transport.id}`,
            type: 'travel',
            title: `${transport.type}: ${transport.departure_location} to ${transport.arrival_location}`,
            date: departureDate.toISOString().split('T')[0],
            time: departureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            location: `${transport.departure_location} to ${transport.arrival_location}`,
            status: 'confirmed',
          });
        });
      }

      if (accommodationsRes.data) {
        accommodationsRes.data.forEach(acc => {
          allEvents.push({
            id: `accommodation-checkin-${acc.id}`,
            type: 'accommodation',
            title: `Check-in: ${acc.hotel_name}`,
            date: acc.check_in_date,
            time: '15:00',
            location: acc.address,
            status: 'confirmed',
          });
          allEvents.push({
            id: `accommodation-checkout-${acc.id}`,
            type: 'accommodation',
            title: `Check-out: ${acc.hotel_name}`,
            date: acc.check_out_date,
            time: '11:00',
            location: acc.address,
            status: 'confirmed',
          });
        });
      }

      allEvents.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading shows and events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group events by month and year
  const groupedEvents = React.useMemo(() => {
    const filtered = events.filter(event => {
      const matchesSearch = 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedEventType === 'all' || event.type === selectedEventType;
      
      const eventDate = new Date(event.date);
      const now = new Date();
      
      let matchesDate = true;
      if (dateFilter === 'upcoming') {
        matchesDate = eventDate >= now;
      } else if (dateFilter === 'past') {
        matchesDate = eventDate < now;
      } else if (dateFilter === 'month') {
        matchesDate = 
          eventDate.getMonth() === now.getMonth() && 
          eventDate.getFullYear() === now.getFullYear();
      }
      
      return matchesSearch && matchesType && matchesDate;
    });
    
    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Group by month and year
    const grouped: Record<string, typeof events> = {};
    filtered.forEach(event => {
      const date = new Date(event.date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      
      grouped[key].push(event);
    });
    
    return Object.entries(grouped).map(([key, events]) => {
      const [year, month] = key.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      
      return {
        monthYear: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        events
      };
    });
  }, [events, searchTerm, dateFilter, selectedEventType]);

  // Filter shows based on search and date filter
  const filteredShows = React.useMemo(() => {
    return shows.filter(show => {
      const matchesSearch = 
        show.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        show.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        show.venue.toLowerCase().includes(searchTerm.toLowerCase());
      
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
      
      return matchesSearch && matchesDate;
    });
  }, [shows, searchTerm, dateFilter]);

  const handleAddShow = async (showData: Omit<Show, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to create shows');
        return;
      }

      let { data: artist } = await supabase
        .from('artists')
        .select('id')
        .limit(1)
        .maybeSingle();

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

      const { data, error } = await supabase
        .from('shows')
        .insert({
          artist_id: artist.id,
          title: showData.title || showData.venue,
          venue_name: showData.venue,
          venue_city: showData.city,
          venue_country: showData.country,
          date: showData.date,
          show_time: showData.time || null,
          capacity: showData.capacity || 0,
          status: showData.status || 'Pending',
        })
        .select()
        .single();

      if (error) throw error;

      const newShow = {
        id: data.id,
        ...showData,
      };
      setShows([newShow, ...shows]);
      loadShowsAndEvents();

      syncShowToPlatforms(data, artist.id).catch(error => {
        console.error('Error syncing show to platforms:', error);
      });
    } catch (error: unknown) {
      console.error('Error adding show:', error);
      const err = error as { message?: string; code?: string };
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
      loadShowsAndEvents();
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
      loadShowsAndEvents();
    } catch (error) {
      console.error('Error deleting show:', error);
      alert('Failed to delete show. Please try again.');
    }
  };

  const handleShowClick = (showId: string) => {
    navigate(`/live/show/${showId}`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen={false} />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column - Shows (2/3 width) */}
      <div className="lg:w-2/3">
        <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium text-charcoal uppercase">Shows</h2>
                <button
                  onClick={() => navigate('/live/shows')}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  See All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
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
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="all">All Dates</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                  <option value="month">This Month</option>
                </select>

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
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredShows.length > 0 ? (
                filteredShows.map((show) => {
                  const showDate = new Date(show.date);
                  return (
                  <div
                    key={show.id}
                    className="relative !rounded-none shadow-sm overflow-hidden border border-gray-800 transition-transform duration-200 hover:scale-105 cursor-pointer text-left w-full group"
                    style={{ backgroundColor: '#eef2ea' }}
                    onClick={() => navigate(`/live/show/${show.id}`)}
                  >
                    <div className="px-4 py-2 !rounded-none font-mono">
                      <div className="text-center border-b-2 border-black pb-1.5">
                        <h3 className="text-3xl font-black text-black uppercase tracking-wider">
                          {show.venue}
                        </h3>
                        <p className="text-xs font-bold text-black uppercase tracking-wide">
                          {show.city}, {show.country}
                        </p>
                      </div>

                      <div className="mt-2 flex items-stretch gap-0" style={{ minHeight: '120px' }}>
                        <div className="flex-shrink-0 pr-3 border-r-2 border-black text-center flex flex-col justify-center" style={{ width: '110px' }}>
                          <div className="text-xs font-bold text-black uppercase tracking-wide">
                            {showDate.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-xs font-bold text-black uppercase tracking-wide">
                            {showDate.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-5xl font-black text-black leading-none my-0.5">
                            {showDate.getDate()}
                          </div>
                          <div className="text-base font-bold text-black">
                            {showDate.getFullYear()}
                          </div>
                          <div className="text-xs font-bold text-black mt-1">
                            {formatTime(show.time)}
                          </div>
                        </div>

                        <div className="flex-1 px-4 border-r-2 border-dashed border-black flex flex-col justify-between py-1">
                          <div className="text-center">
                            <p className="text-xs font-bold text-black uppercase tracking-wider">
                              {show.venue_address || `${show.city}${show.state ? `, ${show.state}` : ''}, ${show.country}`}
                            </p>
                          </div>

                          <div className="text-center my-2">
                            <h2 className="text-2xl font-black text-black uppercase tracking-wide">
                              {show.artist_name || show.title}
                            </h2>
                          </div>

                          <div className="border-t-2 border-black pt-1.5">
                            <p className="text-center text-sm font-black text-black uppercase tracking-widest">
                              {show.status}
                            </p>
                          </div>
                        </div>

                        <div className="w-8"></div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingShow({
                          id: show.id,
                          title: show.title,
                          venue: show.venue,
                          venue_address: show.venue_address,
                          city: show.city,
                          venue_state: show.state,
                          country: show.country,
                          date: show.date,
                          time: show.time,
                          capacity: show.capacity,
                          status: show.status,
                        });
                        setIsModalOpen(true);
                      }}
                      className="absolute bottom-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
                      title="Quick Edit"
                    >
                      <img
                        src="/tm-pluma-negro_(2).png"
                        alt="Edit"
                        className="w-6 h-6"
                      />
                    </button>
                  </div>
                );})
              ) : (
                <div className="col-span-2 py-8 text-center">
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
      </div>

      {/* Right Column - Timeline Overview (1/3 width) */}
      <div className="lg:w-1/3">
        <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium text-charcoal uppercase">EVENTS</h2>
                <span className="text-sm text-gray-500">
                  ({groupedEvents.reduce((acc, g) => acc + g.events.length, 0)} events)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/live/events')}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  See All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value as any)}
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary flex-1"
              >
                <option value="all">All Events</option>
                <option value="show">Shows</option>
                <option value="travel">Travel</option>
                <option value="accommodation">Accommodation</option>
              </select>
            </div>
          </div>

          <div className="px-4 py-2 overflow-y-auto flex-1">
            {groupedEvents.length > 0 ? (
              <div className="space-y-8">
                {groupedEvents.map(({ monthYear, events }) => (
                  <div key={monthYear}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {monthYear}
                    </h3>

                    <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
                      {events.map(event => (
                        <div
                          key={event.id}
                          className="py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => event.showId && navigate(`/live/show/${event.showId}`)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-semibold text-gray-900">
                                {event.title}
                              </h4>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {formatDate(event.date)} - {formatTime(event.time)}
                              </p>
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wide whitespace-nowrap ${
                              event.type === 'show' ? 'text-green' :
                              event.type === 'accommodation' ? 'text-blue-600' :
                              event.type === 'travel' ? 'text-red-500' :
                              'text-gray'
                            }`}>
                              {event.type === 'show' ? 'SHOW' :
                               event.type === 'accommodation' ? 'ACCOMMODATION' :
                               event.type === 'travel' ? 'TRAVEL' :
                               event.type.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters or adding new events
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Show Modal */}
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