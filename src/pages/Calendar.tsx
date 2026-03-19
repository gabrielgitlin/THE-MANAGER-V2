import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Users, Info, Plane, Building, Disc, Calendar as CalendarIcon, ArrowRight, ArrowLeft, ExternalLink, Filter, Search, X, Download, FileSpreadsheet, FileText, Check, Settings, RefreshCw, Bell, CreditCard as Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import CalendarConnectionModal from '../components/calendar/CalendarConnectionModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import { calendarIntegrationService } from '../lib/calendarIntegration';
import { calendarEventSyncService } from '../lib/calendarEventSync';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime, formatDateTime } from '../lib/utils';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'show' | 'release' | 'other' | 'task' | 'travel_accommodation';
  date: string;
  time?: string;
  location?: string;
  description?: string;
  color: string;
  icon: React.FC<{ className?: string }>;
  tags?: string[];
  source?: 'internal' | 'google' | 'ical' | 'outlook' | 'database';
}

interface CalendarSource {
  id: string;
  name: string;
  type: 'google' | 'ical' | 'outlook' | 'internal';
  color: string;
  icon: string;
  connected: boolean;
  lastSync?: string;
  events?: number;
}

// No mock data - all events loaded from database

// Default calendar source - only THE MANAGER's internal calendar
// User-added calendars will be loaded from the database
const CALENDAR_SOURCES: CalendarSource[] = [
  {
    id: 'internal',
    name: 'THE MANAGER',
    type: 'internal',
    color: '#A58A67',
    icon: '/vite.svg',
    connected: true,
    lastSync: 'always synced',
    events: 0
  }
];

export default function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'show' | 'release' | 'other' | 'task' | 'travel_accommodation'>('all');
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'past' | 'upcoming' | 'thisMonth' | 'nextMonth' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [calendarSources, setCalendarSources] = useState<CalendarSource[]>(CALENDAR_SOURCES);
  const [isCalendarSourcesModalOpen, setIsCalendarSourcesModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [eventFormData, setEventFormData] = useState<Partial<CalendarEvent>>({});
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Function to load all events from database
  const loadAllDatabaseEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dbEvents = await calendarEventSyncService.syncAllEvents();

      // Only use database events - no mock data
      setAllEvents(dbEvents);
    } catch (error) {
      console.error('Error loading database events:', error);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        alert(`Authentication failed: ${error}`);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (code) {
        try {
          await calendarIntegrationService.handleOAuthCallback(code, 'google');
          alert('Google Calendar connected successfully!');
          await loadAllDatabaseEvents();
          window.history.replaceState({}, document.title, window.location.pathname);
          if (window.opener) {
            window.close();
          }
        } catch (err) {
          console.error('Error handling OAuth callback:', err);
          alert('Failed to connect Google Calendar. Please try again.');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleOAuthCallback();
  }, []);

  // Load all events from database only
  useEffect(() => {
    setAllEvents([]);

    // Load all database events (tasks, contracts, shows, releases, user calendar events)
    loadAllDatabaseEvents();
  }, []);

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

  const applyDateRangeFilter = (event: CalendarEvent) => {
    const eventDate = new Date(event.date);
    const today = new Date();
    
    switch (dateRangeFilter) {
      case 'past':
        return eventDate < today;
      case 'upcoming':
        return eventDate >= today;
      case 'thisMonth':
        return eventDate.getMonth() === today.getMonth() && 
               eventDate.getFullYear() === today.getFullYear();
      case 'nextMonth':
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return eventDate.getMonth() === nextMonth.getMonth() && 
               eventDate.getFullYear() === nextMonth.getFullYear();
      case 'custom':
        const start = customStartDate ? new Date(customStartDate) : new Date(0);
        const end = customEndDate ? new Date(customEndDate) : new Date(8640000000000000);
        return eventDate >= start && eventDate <= end;
      default:
        return true;
    }
  };

  const filteredEvents = allEvents.filter(event => {
    // Type filter
    if (typeFilter !== 'all' && event.type !== typeFilter) {
      return false;
    }

    // Search term filter
    if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !event.description?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !event.location?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Date range filter
    if (!applyDateRangeFilter(event)) {
      return false;
    }

    // Source filter
    if (sourceFilter.length > 0 && event.source && !sourceFilter.includes(event.source)) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const monthEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getMonth() === currentDate.getMonth() &&
      eventDate.getFullYear() === currentDate.getFullYear()
    );
  });

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);

    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }

    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);

    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }

    setCurrentDate(newDate);
  };

  const getEventsForDay = (day: number) => {
    return monthEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day;
    });
  };

  // Group events by month and year for the timeline view
  const groupEventsByMonth = (events: CalendarEvent[]) => {
    const grouped: Record<string, CalendarEvent[]> = {};

    events.forEach(event => {
      const date = new Date(event.date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(event);
    });

    return Object.entries(grouped)
      .sort(([keyA], [keyB]) => {
        const [yearA, monthA] = keyA.split('-').map(Number);
        const [yearB, monthB] = keyB.split('-').map(Number);

        const compareResult = yearA !== yearB ? yearA - yearB : monthA - monthB;
        return sortOrder === 'asc' ? compareResult : -compareResult;
      })
      .map(([key, events]) => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, month - 1, 1);

        return {
          monthYear: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          events: events // Events are already sorted in filteredEvents
        };
      });
  };

  const groupedTimelineEvents = groupEventsByMonth(filteredEvents);

  const clearFilters = () => {
    setTypeFilter('all');
    setSearchTerm('');
    setDateRangeFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSourceFilter([]);
    setSortOrder('desc');
  };

  // Export functions
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      // Prepare data for export
      const data = filteredEvents.map(event => ({
        Date: formatDate(event.date),
        Time: event.time || 'N/A',
        Title: event.title,
        Type: event.type.charAt(0).toUpperCase() + event.type.slice(1),
        Location: event.location || 'N/A',
        Description: event.description || 'N/A',
        Source: event.source?.charAt(0).toUpperCase() + (event.source?.slice(1) || 'Internal')
      }));

      // Create workbook and worksheet
      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Events');

      // Generate file name based on filters
      let fileName = 'calendar_events';
      if (typeFilter !== 'all') fileName += `_${typeFilter}`;
      if (dateRangeFilter !== 'all') fileName += `_${dateRangeFilter}`;
      fileName += '.xlsx';

      // Write and download file
      writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Calendar Events', doc.internal.pageSize.width / 2, 20, { align: 'center' });
      
      // Add filters information
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      let filterText = 'Filters: ';
      if (typeFilter !== 'all') filterText += `Type: ${typeFilter}, `;
      if (dateRangeFilter !== 'all') filterText += `Date Range: ${dateRangeFilter}`;
      if (filterText === 'Filters: ') filterText += 'None';
      
      doc.text(filterText, doc.internal.pageSize.width / 2, 30, { align: 'center' });
      doc.text(`Generated on ${formatDate(new Date())}`, doc.internal.pageSize.width / 2, 35, { align: 'center' });
      
      // Add events by month
      let yPos = 45;
      
      groupedTimelineEvents.forEach(({ monthYear, events }) => {
        // Add month header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(monthYear, 14, yPos);
        yPos += 10;
        
        // Add events table
        const tableData = events.map(event => [
          formatDate(event.date),
          event.time || '',
          event.title,
          event.type.charAt(0).toUpperCase() + event.type.slice(1),
          event.location || '',
          event.description || '',
          event.source?.charAt(0).toUpperCase() + (event.source?.slice(1) || 'Internal')
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Time', 'Title', 'Type', 'Location', 'Description', 'Source']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [165, 138, 103], textColor: [255, 255, 255] },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 15 },
            2: { cellWidth: 35 },
            3: { cellWidth: 20 },
            4: { cellWidth: 30 },
            5: { cellWidth: 35 },
            6: { cellWidth: 20 }
          },
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
        
        // Add page break if needed
        if (yPos > doc.internal.pageSize.height - 40 && groupedTimelineEvents.indexOf({ monthYear, events }) < groupedTimelineEvents.length - 1) {
          doc.addPage();
          yPos = 20;
        }
      });
      
      // Add summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Events: ${filteredEvents.length}`, 14, yPos);
      
      // Add footer with page numbers
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          'Generated by THE MANAGER',
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      }
      
      // Generate file name based on filters
      let fileName = 'calendar_events';
      if (typeFilter !== 'all') fileName += `_${typeFilter}`;
      if (dateRangeFilter !== 'all') fileName += `_${dateRangeFilter}`;
      fileName += '.pdf';
      
      doc.save(fileName);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export to PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSyncCalendars = () => {
    setIsSyncing(true);
    
    // Simulate syncing process
    setTimeout(() => {
      // Update last sync time
      const updatedSources = calendarSources.map(source => {
        if (source.connected) {
          return {
            ...source,
            lastSync: 'just now'
          };
        }
        return source;
      });
      
      setCalendarSources(updatedSources);
      setIsSyncing(false);
    }, 2000);
  };

  const handleToggleCalendarSource = (sourceId: string) => {
    const updatedSources = calendarSources.map(source => {
      if (source.id === sourceId) {
        return {
          ...source,
          connected: !source.connected
        };
      }
      return source;
    });
    
    setCalendarSources(updatedSources);
    
    // Update source filter
    if (sourceFilter.includes(sourceId)) {
      setSourceFilter(sourceFilter.filter(id => id !== sourceId));
    }
  };

  const handleSourceFilterToggle = (sourceType: string) => {
    if (sourceFilter.includes(sourceType)) {
      setSourceFilter(sourceFilter.filter(type => type !== sourceType));
    } else {
      setSourceFilter([...sourceFilter, sourceType]);
    }
  };

  const handleNavigateToSource = (event: CalendarEvent) => {
    if (!event.relatedId) {
      console.warn('No related ID found for event:', event);
      return;
    }

    switch (event.type) {
      case 'show':
        navigate(`/live/show/${event.relatedId}`);
        break;
      case 'release':
        navigate(`/catalog/album/${event.relatedId}`);
        break;
      case 'task':
        navigate('/tasks');
        break;
      case 'travel_accommodation':
        navigate('/live/logistics');
        break;
      case 'other':
        navigate('/calendar');
        break;
      default:
        console.warn('Unknown event type:', event.type);
    }

    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const getNavigationButtonText = (eventType: CalendarEvent['type']) => {
    switch (eventType) {
      case 'show':
        return 'Go to Show Details';
      case 'release':
        return 'Go to Album Details';
      case 'task':
        return 'Go to Tasks';
      case 'travel_accommodation':
        return 'View in Logistics';
      case 'other':
        return 'View Details';
      default:
        return 'View Details';
    }
  };

  return (
    <div>
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-charcoal font-title">CALENDAR</h1>
        <p className="mt-0.5 md:mt-1 text-sm text-gray-500">
          View and manage all upcoming events
        </p>
      </div>

      <div className="scroll-row mb-4 md:mb-6">
        <div className="flex items-center justify-between gap-3 md:gap-4 min-w-fit pb-1">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'day' | 'week' | 'month')}>
            <TabsList>
              <TabsTrigger value="day" className="uppercase text-xs md:text-sm">
                Day
              </TabsTrigger>
              <TabsTrigger value="week" className="uppercase text-xs md:text-sm">
                Week
              </TabsTrigger>
              <TabsTrigger value="month" className="uppercase text-xs md:text-sm">
                Month
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-sm md:text-lg font-medium text-gray-900 min-w-[130px] md:min-w-[180px] text-center whitespace-nowrap">
              {viewMode === 'day'
                ? currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="block border-gray-300 focus:border-primary focus:ring-primary text-sm"
          >
            <option value="all">All Types</option>
            <option value="other">Other</option>
            <option value="release">Release</option>
            <option value="show">Show</option>
            <option value="task">Task</option>
            <option value="travel_accommodation">Travel</option>
          </select>

          <button
            onClick={() => {
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              setSelectedDate(todayStr);
              setEventFormData({
                date: todayStr,
                type: 'show',
                color: 'bg-black text-white',
                icon: CalendarIcon
              });
              setIsEventFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-black text-white hover:bg-gray-800 active:bg-gray-700 transition-colors font-medium text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Add Event
          </button>
        </div>
      </div>

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="bg-white overflow-hidden mb-4 md:mb-8 border border-gray-200">
          <div className="border-b border-gray-200 p-3 md:p-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
          </div>
          <div className="p-3 md:p-6">
            {getEventsForDay(currentDate.getDate()).length > 0 ? (
              <div className="space-y-3">
                {getEventsForDay(currentDate.getDate()).map(event => (
                  <button
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsModalOpen(true);
                    }}
                    className={`w-full p-3 md:p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                      event.source === 'google' ? 'bg-blue-50 border-l-4 border-[#4285F4]' :
                      event.source === 'ical' ? 'bg-red-50 border-l-4 border-[#FF2D55]' :
                      event.source === 'outlook' ? 'bg-blue-50 border-l-4 border-[#0078D4]' :
                      event.color
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {event.source === 'google' ? (
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google" className="w-5 h-5 mt-1" />
                      ) : event.source === 'ical' ? (
                        <svg className="w-5 h-5 mt-1" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                      ) : event.source === 'outlook' ? (
                        <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" alt="Outlook" className="w-5 h-5 mt-1" />
                      ) : (
                        <event.icon className="w-5 h-5 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{event.title}</div>
                        {event.time && <div className="text-sm text-gray-600 mt-1">{event.time}</div>}
                        {event.location && <div className="text-sm text-gray-600 mt-1">{event.location}</div>}
                        {event.description && <div className="text-sm text-gray-500 mt-2">{event.description}</div>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No events scheduled for this day</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-white mb-4 md:mb-8 border border-gray-200 scroll-row">
          <div className="grid grid-cols-7 min-w-[700px]">
            {Array.from({ length: 7 }).map((_, i) => {
              const weekDay = new Date(currentDate);
              weekDay.setDate(currentDate.getDate() - currentDate.getDay() + i);
              const dayEvents = filteredEvents.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.toDateString() === weekDay.toDateString();
              });

              return (
                <div key={i} className="border-r border-gray-200 last:border-r-0">
                  <div className="p-2 md:p-3 text-center border-b border-gray-100 bg-gray-50">
                    <div className="text-xs font-medium text-gray-600">
                      {weekDay.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-base md:text-lg font-semibold text-gray-900 mt-1">
                      {weekDay.getDate()}
                    </div>
                  </div>
                  <div className="p-2 min-h-[300px] md:min-h-[400px]">
                    {dayEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsModalOpen(true);
                        }}
                        className={`w-full mb-2 p-2 text-left text-xs hover:brightness-95 active:brightness-90 transition-all ${
                          event.source === 'google' ? 'bg-blue-100 border-l-2 border-[#4285F4]' :
                          event.source === 'ical' ? 'bg-red-100 border-l-2 border-[#FF2D55]' :
                          event.source === 'outlook' ? 'bg-blue-100 border-l-2 border-[#0078D4]' :
                          event.color
                        }`}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {event.time && <div className="text-xs opacity-75 mt-0.5">{event.time}</div>}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white overflow-hidden mb-4 md:mb-8 border border-gray-200">
          <div className="grid grid-cols-7">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <div key={idx} className="px-1 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-gray-900 text-center border-r border-b border-gray-300 last:border-r-0">
                <span className="md:hidden">{day}</span>
                <span className="hidden md:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }, (_, i) => {
              const dayNumber = i - firstDayOfMonth + 1;
              const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
              const events = isCurrentMonth ? getEventsForDay(dayNumber) : [];
              const isLastRow = i >= 28;
              const isToday = isCurrentMonth &&
                dayNumber === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (isCurrentMonth && window.innerWidth < 768) {
                      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber));
                      setViewMode('day');
                    }
                  }}
                  onDoubleClick={() => {
                    if (isCurrentMonth && window.innerWidth >= 768) {
                      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                      setSelectedDate(dateStr);
                      if (events.length > 0) {
                        setEventFormData(events[0]);
                      } else {
                        setEventFormData({
                          date: dateStr,
                          type: 'show',
                          color: 'bg-black text-white',
                          icon: CalendarIcon
                        });
                      }
                      setIsEventFormOpen(true);
                    }
                  }}
                  className={`min-h-[48px] md:min-h-[120px] bg-white border-r border-gray-300 last:border-r-0 ${
                    !isLastRow ? 'border-b' : ''
                  } ${
                    isCurrentMonth ? 'text-gray-900 cursor-pointer hover:bg-gray-50 active:bg-gray-100' : 'text-gray-400'
                  }`}
                >
                  <div className="px-1 md:px-3 py-1 md:py-2">
                    <span className={`text-xs md:text-sm inline-flex items-center justify-center ${
                      isToday ? 'bg-black text-white w-6 h-6 md:w-7 md:h-7' : ''
                    }`}>
                      {isCurrentMonth ? dayNumber : ''}
                    </span>
                    {events.length > 0 && (
                      <div className="md:hidden flex gap-0.5 mt-0.5 justify-center flex-wrap">
                        {events.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                              event.type === 'show' ? 'bg-black' :
                              event.type === 'release' ? 'bg-[#009C55]' :
                              event.type === 'task' ? 'bg-[#CCDBE2]' :
                              'bg-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <div className="hidden md:block">
                      {events.map(event => (
                        <button
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setIsModalOpen(true);
                          }}
                          className={`w-full mt-1 px-2 py-1 text-left text-sm rounded-none hover:brightness-110 transition-all border border-black ${
                            event.source === 'google' ? 'bg-[#CCDBE2] text-black' :
                            event.source === 'ical' ? 'bg-[#CCDBE2] text-black' :
                            event.source === 'outlook' ? 'bg-[#CCDBE2] text-black' :
                            event.type === 'release' ? 'bg-[#009C55] text-white' :
                            event.type === 'show' ? 'bg-black text-white' :
                            event.type === 'other' ? 'bg-[#EEF2EA] text-black' :
                            event.type === 'task' ? 'bg-[#CCDBE2] text-black' :
                            event.type === 'travel_accommodation' ? 'bg-[#90928F] text-white' :
                            'bg-[#EEF2EA] text-black'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {event.source === 'google' ? (
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
                                alt="Google Calendar"
                                className="w-3 h-3"
                              />
                            ) : event.source === 'ical' ? (
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                              </svg>
                            ) : event.source === 'outlook' ? (
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg"
                                alt="Outlook Calendar"
                                className="w-3 h-3"
                              />
                            ) : (
                              <event.icon className="w-3 h-3" />
                            )}
                            <div className="font-medium truncate">{event.title}</div>
                          </div>
                          {event.time && <div className="text-xs opacity-75">{event.time}</div>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar Sources Banner */}
      <div className="bg-white border border-gray-200 p-3 md:p-4 mb-4 md:mb-6">
        <div className="scroll-row">
          <div className="flex items-center justify-between gap-3 min-w-fit pb-1">
            <div className="flex-shrink-0">
              <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
                {calendarSources.filter(s => s.connected).length} calendars connected
              </p>
              {calendarSources.filter(s => s.connected && s.type !== 'internal').length > 0 && (
                <p className="text-xs text-gray-500 whitespace-nowrap">
                  Last synced: {calendarSources.find(s => s.connected && s.type !== 'internal' && s.lastSync)?.lastSync || 'never'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <button
                onClick={handleSyncCalendars}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={() => {
                  console.log('Opening calendar connections modal');
                  setIsCalendarSourcesModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 text-sm font-bold text-white bg-black hover:bg-gray-800 active:bg-gray-700 transition-colors whitespace-nowrap"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                MANAGE CALENDARS
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200 scroll-row">
          <div className="flex gap-2 md:gap-2.5 md:flex-wrap min-w-fit pb-1">
          {calendarSources.filter(source => source.connected).map(source => (
            <button
              key={source.id}
              onClick={() => handleSourceFilterToggle(source.type)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                sourceFilter.includes(source.type)
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {source.type === 'google' && (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
                  alt="Google Calendar"
                  className="w-3.5 h-3.5"
                />
              )}
              {source.type === 'ical' && (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              {source.type === 'outlook' && (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg"
                  alt="Outlook Calendar"
                  className="w-3.5 h-3.5"
                />
              )}
              {source.type === 'internal' && (
                <CalendarIcon className="w-3.5 h-3.5" />
              )}
              <span className="whitespace-nowrap">{source.name}</span>
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Chronological Events Summary */}
      <div className="bg-white overflow-hidden border border-gray-200">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
            <h2 className="text-base md:text-lg font-medium text-gray-900 whitespace-nowrap">Chronological Events</h2>
            <div className="scroll-row">
              <div className="flex items-center gap-2 min-w-fit pb-1">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="block border-gray-300 focus:border-primary focus:ring-primary text-sm"
                >
                  <option value="asc">Earlier First</option>
                  <option value="desc">Latest First</option>
                </select>
                <button
                  onClick={handleExportExcel}
                  disabled={isExporting || filteredEvents.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting || filteredEvents.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors whitespace-nowrap"
                >
                  <Filter className="w-4 h-4" />
                  {isFilterExpanded ? 'Hide Filters' : 'Filters'}
                </button>
                {(typeFilter !== 'all' || searchTerm || dateRangeFilter !== 'all' || sourceFilter.length > 0 || sortOrder !== 'desc') && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 transition-colors whitespace-nowrap"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {isFilterExpanded && (
            <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Event Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="other">Other</option>
                    <option value="release">Release</option>
                    <option value="show">Show</option>
                    <option value="task">Task</option>
                    <option value="travel_accommodation">Travel and Accommodation</option>
                  </select>
                </div>
                
                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value as any)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="all">All Dates</option>
                    <option value="past">Past Events</option>
                    <option value="upcoming">Upcoming Events</option>
                    <option value="thisMonth">This Month</option>
                    <option value="nextMonth">Next Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                
                {/* Custom Date Range */}
                {dateRangeFilter === 'custom' && (
                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-3 md:p-6">
          {groupedTimelineEvents.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              {groupedTimelineEvents.map(({ monthYear, events }) => (
                <div key={monthYear} className="md:grid md:grid-cols-[140px_1fr] md:gap-4">
                  <div className="pb-2 md:pb-0 md:pt-3">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide">{monthYear}</h3>
                  </div>

                  <div className="border border-gray-300 overflow-hidden">
                    {events.map((event, idx) => (
                      <button
                        key={event.id}
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsModalOpen(true);
                        }}
                        className={`w-full cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100 text-left ${
                          idx !== events.length - 1 ? 'border-b border-gray-300' : ''
                        }`}
                      >
                        <div className="px-3 md:px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                {event.source === 'google' ? (
                                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google" className="w-5 h-5" />
                                ) : event.source === 'ical' ? (
                                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                                  </svg>
                                ) : event.source === 'outlook' ? (
                                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" alt="Outlook" className="w-5 h-5" />
                                ) : event.type === 'release' ? (
                                  <img src="/tm-vinil-negro_(2).png" alt="Release" className="w-5 h-5 object-contain" />
                                ) : event.type === 'task' ? (
                                  <img src="/tm-pin-negro_(1).png" alt="Task" className="w-5 h-5 object-contain" />
                                ) : event.type === 'other' ? (
                                  <img src="/tm-pin-negro_(1).png" alt="Event" className="w-5 h-5 object-contain" />
                                ) : event.icon ? (
                                  <event.icon className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {(() => {
                                  const d = new Date(event.date);
                                  const day = String(d.getDate()).padStart(2, '0');
                                  const month = String(d.getMonth() + 1).padStart(2, '0');
                                  const year = d.getFullYear();
                                  return `${day}/${month}/${year}`;
                                })()}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-900 truncate">{event.title}</p>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className={`text-xs px-2 py-0.5 ${
                                  event.type === 'show' ? 'bg-gray-900 text-white' :
                                  event.type === 'release' ? 'bg-green-100 text-green-700' :
                                  event.type === 'task' ? 'bg-blue-100 text-blue-700' :
                                  event.type === 'travel_accommodation' ? 'bg-gray-200 text-gray-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {event.type === 'travel_accommodation' ? 'Travel' : event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No events match your filter criteria.
              </p>
              <div className="mt-6">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        {groupedTimelineEvents.length > 0 && (
          <div className="px-3 md:px-6 py-3 md:py-4 border-t border-gray-200 flex justify-between items-center">
            <button className="flex items-center gap-1 md:gap-2 text-sm text-primary hover:text-black active:opacity-70">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous Events</span>
              <span className="sm:hidden">Prev</span>
            </button>
            <div className="text-xs md:text-sm text-gray-500">
              {filteredEvents.length} of {allEvents.length}
            </div>
            <button className="flex items-center gap-1 md:gap-2 text-sm text-primary hover:text-black active:opacity-70">
              <span className="hidden sm:inline">More Events</span>
              <span className="sm:hidden">More</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
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
              <div className="flex items-center gap-2">
                {selectedEvent.source === 'google' ? (
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" 
                    alt="Google Calendar" 
                    className="w-5 h-5"
                  />
                ) : selectedEvent.source === 'ical' ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                ) : selectedEvent.source === 'outlook' ? (
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg"
                    alt="Outlook Calendar"
                    className="w-5 h-5"
                  />
                ) : selectedEvent.icon ? (
                  <selectedEvent.icon className="w-5 h-5 text-gray-500" />
                ) : (
                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                )}
                <h3 className="text-lg font-medium text-gray-900">{selectedEvent.title}</h3>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${
                  selectedEvent.type === 'release' ? 'bg-[#009C55] text-white' :
                  selectedEvent.type === 'show' ? 'bg-black text-white' :
                  selectedEvent.type === 'other' ? 'bg-[#EEF2EA] text-black border border-black' :
                  selectedEvent.type === 'task' ? 'bg-[#CCDBE2] text-black' :
                  selectedEvent.type === 'travel_accommodation' ? 'bg-[#90928F] text-white' :
                  'bg-[#EEF2EA] text-black border border-black'
                }`}>
                  {selectedEvent.type === 'travel_accommodation' ? 'Travel and Accommodation' : selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                </span>
                {selectedEvent.source && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedEvent.source === 'google' ? 'bg-blue-100 text-blue-800' :
                    selectedEvent.source === 'ical' ? 'bg-red-100 text-red-800' :
                    selectedEvent.source === 'outlook' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedEvent.source === 'google' ? (
                      <>
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" 
                          alt="Google Calendar" 
                          className="w-3 h-3"
                        />
                        Google Calendar
                      </>
                    ) : selectedEvent.source === 'ical' ? (
                      <>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        iCloud Calendar
                      </>
                    ) : selectedEvent.source === 'outlook' ? (
                      <>
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" 
                          alt="Outlook Calendar" 
                          className="w-3 h-3"
                        />
                        Outlook Calendar
                      </>
                    ) : (
                      <>
                        <CalendarIcon className="w-3 h-3" />
                        THE MANAGER
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Date</p>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {selectedEvent.time && (
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Time</p>
                    <p className="text-sm text-gray-500">{selectedEvent.time}</p>
                  </div>
                </div>
              )}
            </div>

            {selectedEvent.location && (
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-500">{selectedEvent.location}</p>
                </div>
              </div>
            )}

            {selectedEvent.description && (
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Details</p>
                  <p className="text-sm text-gray-500">{selectedEvent.description}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedEvent(null);
                }}
                className="px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {selectedEvent.relatedId && selectedEvent.source === 'database' && (
                  <button
                    onClick={() => handleNavigateToSource(selectedEvent)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 active:bg-gray-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {getNavigationButtonText(selectedEvent.type)}
                  </button>
                )}
                {selectedEvent.source === 'database' || (!selectedEvent.source && selectedEvent.id.startsWith('cal-')) ? (
                  <>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this event?')) {
                          try {
                            const eventIdStr = selectedEvent.id.replace('cal-', '');
                            const eventIdNum = parseInt(eventIdStr, 10);

                            const { error } = await supabase
                              .from('calendar_events')
                              .delete()
                              .eq('id', eventIdNum);

                            if (error) throw error;

                            await loadAllDatabaseEvents();
                            setIsModalOpen(false);
                            setSelectedEvent(null);
                          } catch (error) {
                            console.error('Error deleting event:', error);
                            alert('Failed to delete event. Please try again.');
                          }
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setEventFormData({
                          ...selectedEvent,
                          id: selectedEvent.id.replace('cal-', '')
                        });
                        setIsModalOpen(false);
                        setIsEventFormOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-primary hover:bg-primary active:opacity-90 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Event Form Modal */}
      <Modal
        isOpen={isEventFormOpen}
        onClose={() => {
          setIsEventFormOpen(false);
          setEventFormData({});
          setSelectedDate('');
        }}
        title={eventFormData.id ? 'Edit Event' : 'Add New Event'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                alert('You must be logged in to create events');
                return;
              }

              const eventData = {
                user_id: user.id,
                title: eventFormData.title!,
                description: eventFormData.description || null,
                event_type: eventFormData.type || 'show',
                start_date: eventFormData.date!,
                start_time: eventFormData.time || null,
                location: eventFormData.location || null,
                color: eventFormData.color || '#3B82F6',
                tags: eventFormData.tags || []
              };

              if (eventFormData.id) {
                // Update existing event
                const { error } = await supabase
                  .from('calendar_events')
                  .update(eventData)
                  .eq('id', eventFormData.id);

                if (error) throw error;
              } else {
                // Create new event
                const { error } = await supabase
                  .from('calendar_events')
                  .insert([eventData]);

                if (error) throw error;
              }

              // Reload events
              await loadAllDatabaseEvents();

              setIsEventFormOpen(false);
              setEventFormData({});
              setSelectedDate('');
            } catch (error) {
              console.error('Error saving event:', error);
              alert('Failed to save event. Please try again.');
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={eventFormData.title || ''}
              onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Enter event title"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={eventFormData.date || selectedDate}
                onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                className="block w-full border-gray-300 focus:border-primary focus:ring-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={eventFormData.time || ''}
                onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
                className="block w-full border-gray-300 focus:border-primary focus:ring-primary text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type *
            </label>
            <select
              required
              value={eventFormData.type || 'show'}
              onChange={(e) => {
                const type = e.target.value as CalendarEvent['type'];
                let color = '';
                switch (type) {
                  case 'release':
                    color = 'bg-[#009C55] text-white';
                    break;
                  case 'show':
                    color = 'bg-black text-white';
                    break;
                  case 'other':
                    color = 'bg-[#EEF2EA] text-black';
                    break;
                  case 'task':
                    color = 'bg-[#CCDBE2] text-black';
                    break;
                  case 'travel_accommodation':
                    color = 'bg-[#90928F] text-white';
                    break;
                }
                setEventFormData({ ...eventFormData, type, color });
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="other">Other</option>
              <option value="release">Release</option>
              <option value="show">Show</option>
              <option value="task">Task</option>
              <option value="travel_accommodation">Travel and Accommodation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={eventFormData.location || ''}
              onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Enter location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={eventFormData.description || ''}
              onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Enter event description"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEventFormOpen(false);
                setEventFormData({});
                setSelectedDate('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
            >
              {eventFormData.id ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Calendar Connections Modal */}
      <CalendarConnectionModal
        isOpen={isCalendarSourcesModalOpen}
        onClose={() => setIsCalendarSourcesModalOpen(false)}
        onConnectionsUpdated={() => {
          console.log('Connections updated - you may want to reload calendar events');
        }}
      />
    </div>
  );
}