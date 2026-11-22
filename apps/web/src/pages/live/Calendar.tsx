import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Users, Settings } from 'lucide-react';
import Modal from '../../components/Modal';
import CalendarConnectionModal from '../../components/calendar/CalendarConnectionModal';

interface Venue {
  name: string;
  address: string;
  city: string;
  country: string;
  website?: string;
  accessibility?: string[];
}

interface CalendarEvent {
  id: number;
  title: string;
  type: 'arena' | 'stadium' | 'festival' | 'private';
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  venue: Venue;
  status: 'upcoming' | 'completed' | 'cancelled';
  ageRestriction?: string;
  notes?: string;
  region: 'north_america' | 'europe' | 'asia' | 'other';
}


export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date('1973-05-01'));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarConnectionsModalOpen, setIsCalendarConnectionsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthEvents = [].filter((event: CalendarEvent) => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getMonth() === currentDate.getMonth() &&
      eventDate.getFullYear() === currentDate.getFullYear()
    );
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const getEventsForDay = (day: number) => {
    return monthEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day;
    });
  };

  const handleSyncCalendars = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 2000);
  };

  return (
    <div>
      {/* Calendar Integration Banner */}
      <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', border: '1px solid' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--t1)' }}>
              Calendar Integrations
            </p>
            <p className="text-xs" style={{ color: 'var(--t3)' }}>
              Connect Google Calendar, iCal, and more
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncCalendars}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)', border: '1px solid' }}
            >
              <img src="/TM-Refresh-negro.svg" className={`pxi-md icon-white ${isSyncing ? 'animate-spin' : ''}`} alt="" />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={() => {
                console.log('Opening calendar connections modal');
                setIsCalendarConnectionsModalOpen(true);
              }}
              className="px-5 py-2.5 text-sm font-bold rounded-lg hover:opacity-80 shadow-lg"
              style={{ backgroundColor: 'var(--brand-1)', color: 'var(--t1)', borderColor: 'var(--brand-2)', border: '2px solid' }}
            >
              <span className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                MANAGE CALENDARS
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {monthEvents.length} events this month
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-md hover:opacity-80" style={{ backgroundColor: 'var(--brand-1)', color: 'var(--t1)' }}>
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      <div className="rounded-lg shadow overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-px" style={{ borderBottom: '1px solid var(--border)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="px-4 py-2 text-sm font-medium text-center" style={{ color: 'var(--t1)' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px" style={{ backgroundColor: 'var(--border)' }}>
          {Array.from({ length: 42 }, (_, i) => {
            const dayNumber = i - firstDayOfMonth + 1;
            const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
            const events = isCurrentMonth ? getEventsForDay(dayNumber) : [];

            return (
              <div
                key={i}
                className={`min-h-[120px]`}
                style={{ backgroundColor: isCurrentMonth ? 'var(--surface)' : 'var(--surface-2)', color: isCurrentMonth ? 'var(--t1)' : 'var(--t3)' }}
              >
                <div className="px-3 py-2">
                  <span className="text-sm">{isCurrentMonth ? dayNumber : ''}</span>
                  {events.map(event => (
                    <button
                      key={event.id}
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsModalOpen(true);
                      }}
                      className="w-full mt-1 px-2 py-1 text-left text-sm rounded hover:opacity-80"
                      style={{ backgroundColor: 'var(--brand-1)', color: 'var(--surface)' }}/10',' opacity:0.1' }}
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        title="Event Details"
      >
        {selectedEvent && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>{selectedEvent.title}</h3>
              <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}
                style={{
                  backgroundColor: selectedEvent.status === 'upcoming' ? 'var(--status-green)' : selectedEvent.status === 'cancelled' ? 'var(--status-red)' : 'var(--surface-2)',
                  color: 'var(--t1)'
                }}>
                {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 mt-0.5" style={{ color: 'var(--t3)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--t1)' }}>Time</p>
                  <p className="text-sm" style={{ color: 'var(--t3)' }}>
                    {selectedEvent.startTime} - {selectedEvent.endTime}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--t3)' }}>{selectedEvent.timezone}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 mt-0.5" style={{ color: 'var(--t3)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--t1)' }}>Venue</p>
                  <p className="text-sm" style={{ color: 'var(--t2)' }}>{selectedEvent.venue.name}</p>
                  <p className="text-xs" style={{ color: 'var(--t3)' }}>
                    {selectedEvent.venue.city}, {selectedEvent.venue.country}
                  </p>
                </div>
              </div>
            </div>

            {selectedEvent.venue.accessibility && (
              <div className="flex items-start gap-2">
                <Users className="w-5 h-5 mt-0.5" style={{ color: 'var(--t3)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--t1)' }}>Accessibility</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedEvent.venue.accessibility.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: 'var(--brand-1)', color: 'var(--t1)' }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedEvent.notes && (
              <div className="flex items-start gap-2">
                <img src="/TM-Info-negro.svg" className="pxi-lg icon-muted mt-0.5" alt="" />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--t1)' }}>Notes</p>
                  <p className="text-sm" style={{ color: 'var(--t2)' }}>{selectedEvent.notes}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedEvent(null);
                }}
                className="px-4 py-2 text-sm font-medium rounded-md hover:opacity-80"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)', border: '1px solid' }}
              >
                Close
              </button>
              <button
                className="px-4 py-2 text-sm font-medium rounded-md hover:opacity-80"
                style={{ backgroundColor: 'var(--brand-1)', color: 'var(--t1)' }}
              >
                Edit Event
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Calendar Connections Modal */}
      <CalendarConnectionModal
        isOpen={isCalendarConnectionsModalOpen}
        onClose={() => setIsCalendarConnectionsModalOpen(false)}
        onConnectionsUpdated={() => {
          console.log('Connections updated - reload calendar events');
        }}
      />
    </div>
  );
}