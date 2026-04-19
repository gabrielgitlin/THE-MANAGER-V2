import React from 'react';
import { Calendar, Clock, MapPin, Users, Plane, Bus, Brain as Train, Car, Building, DollarSign, Plus } from 'lucide-react';
import { TravelItinerary, AccommodationBooking, LogisticsOverview } from '../../types/logistics';
import { CREW_MEMBERS, TRANSPORTATION_PROVIDERS, ACCOMMODATION_PROVIDERS } from '../../data/logistics';
import { formatDate, formatTime } from '../../lib/utils';

interface LogisticsTimelineProps {
  overview: LogisticsOverview;
  onEditTransportation: (id: string) => void;
  onDeleteTransportation: (id: string) => void;
  onEditAccommodation: (id: string) => void;
  onDeleteAccommodation: (id: string) => void;
  onAddTransportation: () => void;
  onAddAccommodation: () => void;
}

interface TimelineEvent {
  id: string;
  type: 'transportation' | 'accommodation';
  date: Date;
  time?: string;
  title: string;
  subtitle: string;
  description: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  item: TravelItinerary | AccommodationBooking;
}

export default function LogisticsTimeline({
  overview,
  onEditTransportation,
  onDeleteTransportation,
  onEditAccommodation,
  onDeleteAccommodation,
  onAddTransportation,
  onAddAccommodation
}: LogisticsTimelineProps) {
  // Create a combined timeline of all events
  const createTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Add transportation events (both departure and arrival)
    overview.travelItineraries.forEach(itinerary => {
      const transportationType = itinerary.transportationType || 'flight';
      const capitalizedType = transportationType.charAt(0).toUpperCase() + transportationType.slice(1);
      
      // Departure event
      events.push({
        id: `dep-${itinerary.id}`,
        type: 'transportation',
        date: new Date(itinerary.departureDate),
        time: itinerary.departureTime,
        title: `${capitalizedType} Departure`,
        subtitle: TRANSPORTATION_PROVIDERS.find(p => p.id === itinerary.transportationProviderId)?.name || 'Unknown Provider',
        description: itinerary.departureLocation,
        status: itinerary.status || 'pending',
        item: itinerary
      });

      // Arrival event
      events.push({
        id: `arr-${itinerary.id}`,
        type: 'transportation',
        date: new Date(itinerary.arrivalDate),
        time: itinerary.arrivalTime,
        title: `${capitalizedType} Arrival`,
        subtitle: TRANSPORTATION_PROVIDERS.find(p => p.id === itinerary.transportationProviderId)?.name || 'Unknown Provider',
        description: itinerary.arrivalLocation,
        status: itinerary.status || 'pending',
        item: itinerary
      });
    });

    // Add accommodation events (both check-in and check-out)
    overview.accommodationBookings.forEach(booking => {
      // Check-in event
      events.push({
        id: `checkin-${booking.id}`,
        type: 'accommodation',
        date: new Date(booking.checkInDate),
        time: booking.checkInTime,
        title: 'Check-in',
        subtitle: ACCOMMODATION_PROVIDERS.find(p => p.id === booking.providerId)?.name || 'Unknown Provider',
        description: `${booking.numberOfRooms} ${booking.roomType || 'room(s)'}`,
        status: booking.status || 'pending',
        item: booking
      });

      // Check-out event
      events.push({
        id: `checkout-${booking.id}`,
        type: 'accommodation',
        date: new Date(booking.checkOutDate),
        time: booking.checkOutTime,
        title: 'Check-out',
        subtitle: ACCOMMODATION_PROVIDERS.find(p => p.id === booking.providerId)?.name || 'Unknown Provider',
        description: `${booking.numberOfRooms} ${booking.roomType || 'room(s)'}`,
        status: booking.status || 'pending',
        item: booking
      });
    });

    // Add show date as a special event
    events.push({
      id: `show-${overview.showId}`,
      type: 'transportation', // Just for icon purposes
      date: new Date(overview.showDate),
      title: 'SHOW DAY',
      subtitle: overview.showTitle,
      description: `${overview.showVenue}, ${overview.showCity}`,
      status: 'confirmed',
      item: {} as any // Not used for this special event
    });

    // Sort events by date and time
    return events.sort((a, b) => {
      const dateComparison = a.date.getTime() - b.date.getTime();
      if (dateComparison !== 0) return dateComparison;
      
      // If dates are the same, sort by time if available
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      
      // If one has time and the other doesn't, the one with time comes first
      if (a.time) return -1;
      if (b.time) return 1;
      
      return 0;
    });
  };

  const timelineEvents = createTimelineEvents();

  // Group events by date
  const groupedEvents: { [key: string]: TimelineEvent[] } = {};
  timelineEvents.forEach(event => {
    const dateKey = event.date.toISOString().split('T')[0];
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(event);
  });

  // Sort dates
  const sortedDates = Object.keys(groupedEvents).sort();

  const getEventIcon = (event: TimelineEvent) => {
    if (event.title === 'SHOW DAY') {
      return <Calendar className="w-5 h-5 text-white" />;
    }
    
    if (event.type === 'transportation') {
      const itinerary = event.item as TravelItinerary;
      switch (itinerary.transportationType) {
        case 'flight':
          return <Plane className="w-5 h-5 text-white" />;
        case 'bus':
          return <Bus className="w-5 h-5 text-white" />;
        case 'train':
          return <Train className="w-5 h-5 text-white" />;
        case 'car':
          return <Car className="w-5 h-5 text-white" />;
        default:
          return <Plane className="w-5 h-5 text-white" />;
      }
    } else {
      return <Building className="w-5 h-5 text-white" />;
    }
  };

  const getEventIconBackground = (event: TimelineEvent) => {
    if (event.title === 'SHOW DAY') {
      return 'bg-green-500';
    }

    if (event.type === 'transportation') {
      return 'bg-gray-500';
    } else {
      return 'bg-blue-500';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'badge-green';
      case 'cancelled':
        return 'badge-neutral';
      default:
        return 'badge-yellow';
    }
  };

  const formatDateLong = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleEditClick = (event: TimelineEvent) => {
    // Extract the original ID from the event ID
    const originalId = event.id.split('-')[1];
    
    if (event.type === 'transportation') {
      onEditTransportation(originalId);
    } else {
      onEditAccommodation(originalId);
    }
  };

  const handleDeleteClick = (event: TimelineEvent) => {
    // Extract the original ID from the event ID
    const originalId = event.id.split('-')[1];
    
    if (event.type === 'transportation') {
      onDeleteTransportation(originalId);
    } else {
      onDeleteAccommodation(originalId);
    }
  };

  return (
    <div className="rounded-lg shadow-md" style={{ background: 'var(--surface)' }}>
      <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h2 className="text-xl font-medium" style={{ color: 'var(--t1)' }}>{overview.showTitle}</h2>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--t2)' }}>
              <Calendar className="w-4 h-4 text-primary" />
              {formatDateLong(new Date(overview.showDate))}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-primary" />
              {overview.showVenue}, {overview.showCity}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onAddTransportation}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
          >
            <Plane className="w-4 h-4" />
            Add Transportation
          </button>
          <button
            onClick={onAddAccommodation}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            <Building className="w-4 h-4" />
            Add Accommodation
          </button>
        </div>
      </div>

      <div className="p-6">
        {sortedDates.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Timeline events */}
            <div className="space-y-8">
              {sortedDates.map(dateKey => (
                <div key={dateKey} className="relative">
                  {/* Date header */}
                  <div className="mb-4 ml-16">
                    <h3 className="text-lg font-medium text-charcoal uppercase">
                      {formatDateLong(new Date(dateKey))}
                    </h3>
                  </div>
                  
                  {/* Events for this date */}
                  <div className="space-y-6">
                    {groupedEvents[dateKey].map(event => (
                      <div key={event.id} className="relative">
                        {/* Event card */}
                        <div className={`ml-16 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                          event.title === 'SHOW DAY' ? 'bg-green-50 border-green-200' :
                          event.type === 'transportation' ? 'bg-gray-100 border-gray-200' : 'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="p-4 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${getEventIconBackground(event)}`}>
                                {getEventIcon(event)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium text-charcoal">{event.title}</h4>
                                  {event.title !== 'SHOW DAY' && (
                                    <span className={`status-badge ${getStatusBadgeColor(event.status)}`}>
                                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{event.subtitle}</p>
                                {event.time && (
                                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(event.time)}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {event.title !== 'SHOW DAY' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditClick(event)}
                                  className="p-1 text-gray-400 hover:text-primary rounded-full hover:bg-beige"
                                >
                                  <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(event)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                                >
                                  <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="px-4 pb-4">
                            <div className="flex items-start gap-1 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span>{event.description}</span>
                            </div>
                            
                            {event.type === 'transportation' && event.id.startsWith('dep-') && (
                              <div className="mt-2">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Users className="w-3 h-3" />
                                  <span>
                                    {(event.item as TravelItinerary).passengers.length} passengers
                                  </span>
                                </div>
                                {(event.item as TravelItinerary).cost && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                    <DollarSign className="w-3 h-3" />
                                    <span>
                                      {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD'
                                      }).format((event.item as TravelItinerary).cost || 0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {event.type === 'accommodation' && event.id.startsWith('checkin-') && (
                              <div className="mt-2">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Users className="w-3 h-3" />
                                  <span>
                                    {(event.item as AccommodationBooking).guests.length} guests
                                  </span>
                                </div>
                                {(event.item as AccommodationBooking).cost && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                    <DollarSign className="w-3 h-3" />
                                    <span>
                                      {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD'
                                      }).format((event.item as AccommodationBooking).cost || 0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-charcoal">No logistics found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add transportation and accommodation to see the timeline.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={onAddTransportation}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
              >
                <Plus className="w-4 h-4" />
                Add Transportation
              </button>
              <button
                onClick={onAddAccommodation}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                Add Accommodation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}