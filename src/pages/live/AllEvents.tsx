import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Plus, Pencil, Trash2, Search, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate, formatTime } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Event {
  id: string;
  type: 'show' | 'travel' | 'accommodation' | 'release';
  title: string;
  date: string;
  time: string;
  location: string;
  showId?: number;
  status: string;
  description?: string;
}

export default function AllEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past' | 'month'>('all');
  const [selectedEventType, setSelectedEventType] = useState<'all' | 'show' | 'travel' | 'accommodation' | 'release'>('all');
  const [expandedEvents, setExpandedEvents] = useState<string[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const showsPromise = supabase
        .from('shows')
        .select('*')
        .order('date', { ascending: true });

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

      const allEvents: Event[] = [];

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
            type: event.event_type as any,
            title: event.title,
            date: event.start_date,
            time: event.start_time || '00:00',
            location: event.location || '',
            status: 'confirmed',
            description: event.description || '',
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
            time: departureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            location: `${transport.departure_location} to ${transport.arrival_location}`,
            status: 'confirmed',
          });
        });
      }

      if (accommodationsRes.data) {
        accommodationsRes.data.forEach(acc => {
          allEvents.push({
            id: `accommodation-${acc.id}`,
            type: 'accommodation',
            title: `Check-in: ${acc.hotel_name}`,
            date: acc.check_in_date,
            time: '15:00',
            location: acc.address,
            status: 'confirmed',
          });
          allEvents.push({
            id: `accommodation-out-${acc.id}`,
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
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const toggleEventExpand = (eventId: string) => {
    setExpandedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'show':
        return 'Show';
      case 'travel':
        return 'Travel';
      case 'accommodation':
        return 'Accommodation';
      case 'release':
        return 'Release';
      default:
        return type;
    }
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
        <h1 className="text-2xl font-bold text-charcoal font-title">ALL EVENTS</h1>
        <p className="mt-1 text-sm text-gray-500">
          View all your scheduled events
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
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>

              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value as any)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="all">All Events</option>
                <option value="show">Shows</option>
                <option value="travel">Travel</option>
                <option value="accommodation">Accommodation</option>
                <option value="release">Releases</option>
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
          </div>
        </div>

        <div className="p-6">
          {groupedEvents.length > 0 ? (
            <div className="space-y-6">
              {groupedEvents.map(({ monthYear, events }) => (
                <div key={monthYear} className="grid grid-cols-[140px_1fr] gap-4">
                  <div className="pt-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{monthYear}</h3>
                  </div>

                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    {events.map((event, idx) => (
                      <div
                        key={event.id}
                        className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                          idx !== events.length - 1 ? 'border-b border-gray-300' : ''
                        }`}
                        onClick={() => toggleEventExpand(event.id)}
                      >
                        <div className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                {event.type === 'show' && (
                                  <img src="/noun-pixel-microphone-6766182-009c55.svg" alt="Show" className="w-6 h-6" />
                                )}
                                {event.type === 'travel' && (
                                  <img src="/noun-pixel-6161973-59b0d8.svg" alt="Travel" className="w-6 h-6" />
                                )}
                                {event.type === 'accommodation' && (
                                  <img src="/noun-home-6740249-90928f.svg" alt="Accommodation" className="w-6 h-6" />
                                )}
                                {event.type === 'release' && (
                                  <Calendar className="w-6 h-6 text-gray-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-900 truncate">{event.title}</p>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-xs text-gray-500">
                                  {formatDate(event.date)}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  event.type === 'show' ? 'bg-green-100 text-green-700' :
                                  event.type === 'travel' ? 'bg-blue-100 text-blue-700' :
                                  event.type === 'accommodation' ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {getEventTypeLabel(event.type)}
                                </span>
                              </div>
                            </div>
                            {expandedEvents.includes(event.id) ? (
                              <ChevronUp className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                            )}
                          </div>

                          {expandedEvents.includes(event.id) && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-start gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span>{event.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span>{formatTime(event.time)}</span>
                              </div>

                              {event.description && (
                                <p className="mt-2 text-sm text-gray-600">{event.description}</p>
                              )}

                              {event.showId && (
                                <div className="mt-3 flex justify-end">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/live/show/${event.showId}`);
                                    }}
                                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                                  >
                                    View Show Details
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
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
  );
}
