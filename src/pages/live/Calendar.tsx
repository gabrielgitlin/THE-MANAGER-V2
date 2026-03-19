import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Users, Info, Settings, RefreshCw } from 'lucide-react';
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
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Calendar Integrations
            </p>
            <p className="text-xs text-gray-500">
              Connect Google Calendar, iCal, and more
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncCalendars}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={() => {
                console.log('Opening calendar connections modal');
                setIsCalendarConnectionsModalOpen(true);
              }}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg border-2 border-blue-700"
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
          <h2 className="text-lg font-medium text-gray-900">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-sm text-gray-500">
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
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-px border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="px-4 py-2 text-sm font-medium text-gray-900 text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {Array.from({ length: 42 }, (_, i) => {
            const dayNumber = i - firstDayOfMonth + 1;
            const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
            const events = isCurrentMonth ? getEventsForDay(dayNumber) : [];

            return (
              <div
                key={i}
                className={`min-h-[120px] bg-white ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}
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
                      className="w-full mt-1 px-2 py-1 text-left text-sm bg-primary/10 text-primary rounded hover:bg-primary/20"
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
              <h3 className="text-lg font-medium text-gray-900">{selectedEvent.title}</h3>
              <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedEvent.status === 'upcoming'
                  ? 'bg-green-100 text-green-800'
                  : selectedEvent.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Time</p>
                  <p className="text-sm text-gray-500">
                    {selectedEvent.startTime} - {selectedEvent.endTime}
                  </p>
                  <p className="text-xs text-gray-500">{selectedEvent.timezone}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Venue</p>
                  <p className="text-sm text-gray-500">{selectedEvent.venue.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedEvent.venue.city}, {selectedEvent.venue.country}
                  </p>
                </div>
              </div>
            </div>

            {selectedEvent.venue.accessibility && (
              <div className="flex items-start gap-2">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Accessibility</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedEvent.venue.accessibility.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
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
                <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Notes</p>
                  <p className="text-sm text-gray-500">{selectedEvent.notes}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedEvent(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
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