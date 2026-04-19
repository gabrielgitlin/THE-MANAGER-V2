import React, { useState, useEffect, useRef } from 'react';
import { Plus, MapPin, Clock, Users, Plane, Building, Disc, Calendar as CalendarIcon, ArrowRight, FileSpreadsheet, Bell, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react';
import { TMDatePicker } from '../components/ui/TMDatePicker';
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

interface CalendarEvent {
  id: string;
  title: string;
  type: 'show' | 'release' | 'other' | 'task' | 'travel_accommodation' | 'birthday';
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
  const oauthHandled = useRef(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'show' | 'release' | 'other' | 'task' | 'travel_accommodation' | 'birthday'>('all');
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
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filterDropdownPos, setFilterDropdownPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [datePickerPos, setDatePickerPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const datePickerRef = useRef<HTMLDivElement>(null);
  const datePickerTriggerRef = useRef<HTMLButtonElement>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [exportDropdownPos, setExportDropdownPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const exportDropdownRef = useRef<HTMLDivElement>(null);

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
      if (oauthHandled.current) return;

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
        oauthHandled.current = true;
        try {
          await calendarIntegrationService.handleOAuthCallback(code, 'google');
          alert('Google Calendar connected successfully!');
          await loadAllDatabaseEvents();
          window.history.replaceState({}, document.title, window.location.pathname);
          if (window.opener) {
            window.close();
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('Error handling OAuth callback:', msg);
          alert(`Failed to connect Google Calendar: ${msg}`);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleOAuthCallback();
  }, []);

  // Load all events: read from DB immediately, then trigger a background sync from external calendars
  useEffect(() => {
    setAllEvents([]);

    const initLoad = async () => {
      // 1. Fast read from what's already in Supabase
      await loadAllDatabaseEvents();

      // 2. Background sync from Google / iCal — then reload
      try {
        await calendarIntegrationService.syncAllConnections();
        await loadAllDatabaseEvents();
      } catch (err) {
        // Sync errors are non-fatal — DB events already loaded above
        console.warn('Background calendar sync failed:', err);
      }
    };

    initLoad();
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    }
    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterDropdownOpen]);

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    }
    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDatePickerOpen]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    }
    if (isExportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportDropdownOpen]);

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
    setExpandedWeeks(new Set());
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
    setExpandedWeeks(new Set());
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

  const handleSyncCalendars = async () => {
    setIsSyncing(true);
    try {
      await calendarIntegrationService.syncAllConnections();
      await loadAllDatabaseEvents();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Calendar sync error:', msg);
      alert(`Sync failed — ${msg}\n\nIf your token has expired, disconnect and reconnect your calendar.`);
      // Still reload whatever is already in the DB
      await loadAllDatabaseEvents();
    } finally {
      setIsSyncing(false);
    }
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
      <div className="scroll-row mb-4 md:mb-6">
        <div className="flex items-center justify-between gap-3 md:gap-4 min-w-fit pb-1">

          {/* View mode sub-tabs */}
          <div className="sub-tabs">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                className={`sub-tab ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-1">
            <button className="btn-icon" onClick={handlePrevMonth}>
              <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-white" alt="prev" />
            </button>

            {/* Clickable month/year label → picker */}
            <div style={{ position: 'relative' }}>
              <button
                ref={datePickerTriggerRef}
                onClick={() => {
                  if (datePickerTriggerRef.current) {
                    const rect = datePickerTriggerRef.current.getBoundingClientRect();
                    setDatePickerPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
                  }
                  setPickerYear(currentDate.getFullYear());
                  setIsDatePickerOpen(prev => !prev);
                }}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--t1)',
                  minWidth: 140,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  transition: 'color 120ms',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-1)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--t1)'}
              >
                {viewMode === 'day'
                  ? currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </button>

              {isDatePickerOpen && (
                <div ref={datePickerRef} style={{
                  position: 'fixed',
                  top: datePickerPos.top,
                  left: datePickerPos.left,
                  transform: 'translateX(-50%)',
                  zIndex: 9999,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-2)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  width: 220,
                  padding: '12px',
                }}>
                  {/* Year selector */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <button
                      onClick={() => setPickerYear(y => y - 1)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--t2)', display: 'flex' }}
                    >
                      <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-muted" alt="prev year" />
                    </button>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                      {pickerYear}
                    </span>
                    <button
                      onClick={() => setPickerYear(y => y + 1)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--t2)', display: 'flex' }}
                    >
                      <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-muted" style={{ transform: 'scaleX(-1)' }} alt="next year" />
                    </button>
                  </div>

                  {/* Month grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((name, idx) => {
                      const isActive = pickerYear === currentDate.getFullYear() && idx === currentDate.getMonth();
                      return (
                        <button
                          key={name}
                          onClick={() => {
                            const d = new Date(currentDate);
                            d.setFullYear(pickerYear);
                            d.setMonth(idx);
                            setCurrentDate(d);
                            setIsDatePickerOpen(false);
                          }}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            padding: '6px 0',
                            background: isActive ? 'var(--surface-2)' : 'transparent',
                            border: isActive ? '1px solid var(--brand-1)' : '1px solid transparent',
                            color: isActive ? 'var(--brand-1)' : 'var(--t2)',
                            cursor: 'pointer',
                            transition: 'all 120ms',
                            textAlign: 'center',
                          }}
                          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.background = 'var(--surface-3)'; } }}
                          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.background = 'transparent'; } }}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button className="btn-icon" onClick={handleNextMonth}>
              <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-white" style={{ transform: 'scaleX(-1)' }} alt="next" />
            </button>
            {(() => {
              const today = new Date();
              const isToday = viewMode === 'day'
                ? currentDate.toDateString() === today.toDateString()
                : currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
              return (
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="btn btn-secondary btn-sm"
                  disabled={isToday}
                  style={{ marginLeft: 4 }}
                >
                  Today
                </button>
              );
            })()}
          </div>

          {/* Add · Filter · Manage Calendars */}
          <div className="flex items-center gap-2">

            {/* Add Event */}
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
              className="btn btn-primary btn-icon"
              title="Add Event"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Sync / Refresh */}
            <button
              onClick={handleSyncCalendars}
              disabled={isSyncing}
              className="btn btn-ghost btn-icon"
              title="Sync calendars"
            >
              <img
                src="/TM-Refresh-negro.svg"
                className={`pxi-md icon-muted${isSyncing ? ' animate-spin' : ''}`}
                alt="Sync"
              />
            </button>

            {/* Filter */}
            <div ref={filterDropdownRef} style={{ position: 'relative' }}>
              <button
                className={`btn btn-icon ${typeFilter !== 'all' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  setFilterDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                  setIsFilterDropdownOpen(prev => !prev);
                }}
                title="Filter by type"
                style={typeFilter !== 'all' ? { borderColor: 'var(--brand-1)' } : undefined}
              >
                <img src="/TM-Filter-negro.svg" className={`pxi-md ${typeFilter !== 'all' ? 'icon-green' : 'icon-white'}`} alt="Filter" />
              </button>
              {isFilterDropdownOpen && (
                <div style={{
                  position: 'fixed',
                  top: filterDropdownPos.top,
                  right: filterDropdownPos.right,
                  zIndex: 9999,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-2)',
                  minWidth: 160,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                }}>
                  {([
                    ['all', 'All Types'],
                    ['show', 'Show'],
                    ['release', 'Release'],
                    ['task', 'Task'],
                    ['travel_accommodation', 'Travel'],
                    ['birthday', 'Birthday'],
                    ['other', 'Other'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => { setTypeFilter(value); setIsFilterDropdownOpen(false); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 14px',
                        textAlign: 'left',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        background: typeFilter === value ? 'var(--surface-2)' : 'transparent',
                        color: typeFilter === value ? 'var(--brand-1)' : 'var(--t2)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 120ms, color 120ms',
                      }}
                      onMouseEnter={e => { if (typeFilter !== value) { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--t1)'; } }}
                      onMouseLeave={e => { if (typeFilter !== value) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t2)'; } }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Manage Calendars */}
            <button
              onClick={() => setIsCalendarSourcesModalOpen(true)}
              className="btn btn-ghost btn-icon"
              title="Manage Calendars"
            >
              <img src="/TM-Settings-negro.svg" className="pxi-md icon-white" alt="Manage Calendars" />
            </button>

          </div>
        </div>
      </div>

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="bg-[color:var(--surface)] overflow-hidden mb-4 md:mb-8 border border-[color:var(--border)]">
          <div className="border-b border-[color:var(--border)] p-3 md:p-4">
            <h3 className="text-base md:text-lg font-semibold text-[color:var(--t1)]">
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
                    className={`w-full p-3 md:p-4 text-left hover:bg-[color:var(--surface-2)] active:bg-[color:var(--surface-2)] transition-colors ${
                      event.source === 'google' ? 'bg-[color:var(--surface-4)] text-[color:var(--t1)] border-l-4 border-[color:var(--t3)]' :
                      event.source === 'ical' ? 'bg-[color:var(--surface-4)] text-[color:var(--t1)] border-l-4 border-[color:var(--t3)]' :
                      event.source === 'outlook' ? 'bg-[color:var(--surface-4)] text-[color:var(--t1)] border-l-4 border-[color:var(--t3)]' :
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
                        <div className="font-semibold text-[color:var(--t1)]">{event.title}</div>
                        {event.time && <div className="text-sm text-[color:var(--t2)] mt-1">{event.time}</div>}
                        {event.location && <div className="text-sm text-[color:var(--t2)] mt-1">{event.location}</div>}
                        {event.description && <div className="text-sm text-[color:var(--t3)] mt-2">{event.description}</div>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[color:var(--t3)]">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-[color:var(--t2)]" />
                <p>No events scheduled for this day</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-[color:var(--surface)] mb-4 md:mb-8 border border-[color:var(--border)] scroll-row">
          <div className="grid grid-cols-7 min-w-[700px]">
            {Array.from({ length: 7 }).map((_, i) => {
              const weekDay = new Date(currentDate);
              weekDay.setDate(currentDate.getDate() - currentDate.getDay() + i);
              const dayEvents = filteredEvents.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.toDateString() === weekDay.toDateString();
              });

              return (
                <div key={i} className="border-r border-[color:var(--border)] last:border-r-0">
                  <div className="p-2 md:p-3 text-center border-b border-[color:var(--border)] bg-[color:var(--surface-2)]">
                    <div className="text-xs font-medium text-[color:var(--t2)]">
                      {weekDay.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-base md:text-lg font-semibold text-[color:var(--t1)] mt-1">
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
                          event.source === 'google' ? 'bg-[color:var(--surface-4)] text-[color:var(--t1)] border-l-2 border-[color:var(--t3)]' :
                          event.source === 'ical' ? 'bg-[color:var(--surface-4)] text-[color:var(--t1)] border-l-2 border-[color:var(--t3)]' :
                          event.source === 'outlook' ? 'bg-[color:var(--surface-4)] text-[color:var(--t1)] border-l-2 border-[color:var(--t3)]' :
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
        <div className="bg-[color:var(--surface)] mb-4 md:mb-8 border border-[color:var(--border)]">
          <div className="grid grid-cols-7">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <div key={idx} className="px-1 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-[color:var(--t1)] text-center border-r border-b border-[color:var(--border)] last:border-r-0">
                <span className="md:hidden">{day}</span>
                <span className="hidden md:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}</span>
              </div>
            ))}
          </div>

          <div>
            {Array.from({ length: 5 }, (_, weekIdx) => {
              // Find a valid anchor day in this week for week-view navigation
              let weekAnchorDay = 1;
              for (let d = 0; d < 7; d++) {
                const candidate = weekIdx * 7 + d - firstDayOfMonth + 1;
                if (candidate >= 1 && candidate <= daysInMonth) {
                  weekAnchorDay = candidate;
                  break;
                }
              }

              const isWeekExpanded = expandedWeeks.has(weekIdx);
              const MAX_VISIBLE = 2;

              return (
                <div key={weekIdx} className="group/weekrow relative grid grid-cols-7">
                  {/* Week view trigger — full left-gutter clickable zone, one per row */}
                  <button
                    className="absolute -left-4 md:-left-6 top-0 h-full w-4 md:w-6 hidden md:block z-20 opacity-0 group-hover/weekrow:opacity-100 transition-all duration-[120ms] cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), weekAnchorDay));
                      setViewMode('week');
                    }}
                    title="View this week"
                  />

                  {Array.from({ length: 7 }, (_, dayIdx) => {
                    const i = weekIdx * 7 + dayIdx;
                    const dayNumber = i - firstDayOfMonth + 1;
                    const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
                    const events = isCurrentMonth ? getEventsForDay(dayNumber) : [];
                    const isLastRow = weekIdx === 4;
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
                        className={`min-h-[48px] ${isWeekExpanded ? 'md:min-h-[148px]' : 'md:h-[148px] md:overflow-hidden'} bg-[color:var(--surface)] border-r border-[color:var(--border)] last:border-r-0 ${
                          !isLastRow ? 'border-b' : ''
                        } ${
                          isCurrentMonth ? 'text-[color:var(--t1)] cursor-pointer hover:bg-[color:var(--surface-2)] active:bg-[color:var(--surface-2)]' : 'text-[color:var(--t3)]'
                        }`}
                      >
                        <div className="px-1 md:px-3 py-1 md:py-2">
                          {/* Day number — click to navigate to day view */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCurrentMonth) {
                                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber));
                                setViewMode('day');
                              }
                            }}
                            disabled={!isCurrentMonth}
                            className={`text-xs md:text-sm inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 transition-colors duration-[120ms] ${
                              isToday
                                ? 'bg-black text-white'
                                : isCurrentMonth
                                ? 'hover:bg-[color:var(--brand-1)] hover:text-black cursor-pointer'
                                : 'cursor-default'
                            }`}
                          >
                            {isCurrentMonth ? dayNumber : ''}
                          </button>
                          {events.length > 0 && (
                            <div className="md:hidden flex gap-0.5 mt-0.5 justify-center flex-wrap">
                              {events.slice(0, 3).map(event => (
                                <div
                                  key={event.id}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    event.type === 'show' ? 'bg-black' :
                                    event.type === 'release' ? 'bg-[#009C55]' :
                                    event.type === 'task' ? 'bg-[#CCDBE2]' :
                                    event.type === 'birthday' ? 'bg-[#EEF2EA]' :
                                    'bg-[color:var(--surface-3)]'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                          <div className="hidden md:block">
                            {(isWeekExpanded ? events : events.slice(0, MAX_VISIBLE)).map(event => (
                              <button
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                  setIsModalOpen(true);
                                }}
                                className={`w-full mt-1 px-2 py-1 text-left text-sm rounded-none hover:brightness-110 transition-all border border-black ${
                                  event.source === 'google' ? 'bg-[color:var(--surface-4)] text-[color:var(--t1)] border border-[color:var(--border-3)]' :
                                  event.source === 'ical' ? 'bg-[color:var(--surface-4)] text-[color:var(--t1)] border border-[color:var(--border-3)]' :
                                  event.source === 'outlook' ? 'bg-[color:var(--surface-4)] text-[color:var(--t1)] border border-[color:var(--border-3)]' :
                                  event.type === 'release' ? 'bg-[#009C55] text-white' :
                                  event.type === 'show' ? 'bg-black text-white' :
                                  event.type === 'other' ? 'bg-[#EEF2EA] text-black' :
                                  event.type === 'task' ? 'bg-[#CCDBE2] text-[color:var(--t1)]' :
                                  event.type === 'travel_accommodation' ? 'bg-[#90928F] text-white' :
                                  event.type === 'birthday' ? 'bg-[#EEF2EA]' :
                                  'bg-[#EEF2EA]'
                                }`}
                                style={(event.type === 'birthday' || event.type === 'other') && event.source !== 'google' && event.source !== 'ical' && event.source !== 'outlook' ? { color: '#000000' } : undefined}
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
                            {!isWeekExpanded && events.length > MAX_VISIBLE && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedWeeks(prev => new Set(prev).add(weekIdx));
                                }}
                                className="w-full mt-1 px-2 py-0.5 text-left text-xs text-[color:var(--t3)] hover:text-[color:var(--t2)] transition-colors duration-[120ms]"
                              >
                                +{events.length - MAX_VISIBLE} more
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Chronological Events Summary */}
      <div className="bg-[color:var(--surface)] overflow-hidden border border-[color:var(--border)]">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[color:var(--border)]">
          <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
            <h2 className="text-base md:text-lg font-medium text-[color:var(--t1)] whitespace-nowrap">Chronological Events</h2>
            <div className="flex items-center gap-1">

              {/* Sort: asc / desc toggle pair */}
              <button
                onClick={() => setSortOrder('asc')}
                className={`btn btn-icon ${sortOrder === 'asc' ? 'btn-secondary' : 'btn-ghost'}`}
                title="Earlier first"
                style={sortOrder === 'asc' ? { borderColor: 'var(--brand-1)' } : undefined}
              >
                <ArrowUp className={`w-4 h-4 ${sortOrder === 'asc' ? 'text-[color:var(--brand-1)]' : ''}`} />
              </button>
              <button
                onClick={() => setSortOrder('desc')}
                className={`btn btn-icon ${sortOrder === 'desc' ? 'btn-secondary' : 'btn-ghost'}`}
                title="Latest first"
                style={sortOrder === 'desc' ? { borderColor: 'var(--brand-1)' } : undefined}
              >
                <ArrowDown className={`w-4 h-4 ${sortOrder === 'desc' ? 'text-[color:var(--brand-1)]' : ''}`} />
              </button>

              {/* Filters toggle */}
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={`btn btn-icon ${isFilterExpanded ? 'btn-secondary' : 'btn-ghost'}`}
                title="Filters"
                style={isFilterExpanded ? { borderColor: 'var(--brand-1)' } : undefined}
              >
                <img src="/TM-Filter-negro.svg" className={`pxi-md ${isFilterExpanded ? 'icon-green' : 'icon-white'}`} alt="Filters" />
              </button>

              {/* Export ⋯ */}
              <div ref={exportDropdownRef} style={{ position: 'relative' }}>
                <button
                  className="btn btn-ghost btn-icon"
                  title="Export"
                  disabled={isExporting || filteredEvents.length === 0}
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    setExportDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                    setIsExportDropdownOpen(prev => !prev);
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {isExportDropdownOpen && (
                  <div style={{
                    position: 'fixed',
                    top: exportDropdownPos.top,
                    right: exportDropdownPos.right,
                    zIndex: 9999,
                    background: 'var(--surface)',
                    border: '1px solid var(--border-2)',
                    minWidth: 140,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  }}>
                    {[
                      { label: 'Export Excel', icon: <FileSpreadsheet className="w-4 h-4" />, action: () => { handleExportExcel(); setIsExportDropdownOpen(false); } },
                      { label: 'Export PDF',   icon: <img src="/TM-File-negro.svg" className="pxi-md icon-muted" alt="" />, action: () => { handleExportPDF(); setIsExportDropdownOpen(false); } },
                    ].map(({ label, icon, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '9px 14px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 500,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          background: 'transparent',
                          color: 'var(--t2)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background 120ms, color 120ms',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--t1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t2)'; }}
                      >
                        {icon}{label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear filters */}
              {(typeFilter !== 'all' || searchTerm || dateRangeFilter !== 'all' || sourceFilter.length > 0 || sortOrder !== 'desc') && (
                <button
                  onClick={clearFilters}
                  className="btn btn-ghost btn-icon"
                  title="Clear filters"
                >
                  <img src="/TM-Close-negro.svg" className="pxi-md icon-danger" alt="Clear" />
                </button>
              )}

            </div>
          </div>
          
          {isFilterExpanded && (
            <div className="mt-4 space-y-4 border-t border-[color:var(--border)] pt-4">
              {/* Search */}
              <div>
                <div className="relative">
                  <img src="/TM-Search-negro.svg" className="pxi-md icon-muted absolute left-3 top-1/2 -translate-y-1/2" alt="" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 block w-full  border-[color:var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Event Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-[color:var(--t2)] mb-1">
                    Event Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="block w-full  border-[color:var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="birthday">Birthday</option>
                    <option value="other">Other</option>
                    <option value="release">Release</option>
                    <option value="show">Show</option>
                    <option value="task">Task</option>
                    <option value="travel_accommodation">Travel and Accommodation</option>
                  </select>
                </div>
                
                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-[color:var(--t2)] mb-1">
                    Date Range
                  </label>
                  <select
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value as any)}
                    className="block w-full  border-[color:var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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
                      <label className="block text-sm font-medium text-[color:var(--t2)] mb-1">
                        Start Date
                      </label>
                      <TMDatePicker
                        value={customStartDate}
                        onChange={(date) => setCustomStartDate(date)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[color:var(--t2)] mb-1">
                        End Date
                      </label>
                      <TMDatePicker
                        value={customEndDate}
                        onChange={(date) => setCustomEndDate(date)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-3 md:p-6" style={{ maxHeight: 480, overflowY: 'auto' }}>
          {groupedTimelineEvents.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              {groupedTimelineEvents.map(({ monthYear, events }) => (
                <div key={monthYear} className="md:grid md:grid-cols-[140px_1fr] md:gap-4">
                  <div className="pb-2 md:pb-0 md:pt-3">
                    <h3 className="text-xs md:text-sm font-semibold text-[color:var(--t3)] uppercase tracking-wide">{monthYear}</h3>
                  </div>

                  <div className="border border-[color:var(--border)] overflow-hidden">
                    {events.map((event, idx) => (
                      <button
                        key={event.id}
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsModalOpen(true);
                        }}
                        className={`w-full cursor-pointer transition-colors hover:bg-[color:var(--surface-2)] active:bg-[color:var(--surface-2)] text-left ${
                          idx !== events.length - 1 ? 'border-b border-[color:var(--border)]' : ''
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
                                  <event.icon className="w-5 h-5 text-[color:var(--t3)]" />
                                ) : (
                                  <CalendarIcon className="w-5 h-5 text-[color:var(--t3)]" />
                                )}
                              </div>
                              <span className="text-xs text-[color:var(--t3)] flex-shrink-0">
                                {(() => {
                                  const d = new Date(event.date);
                                  const day = String(d.getDate()).padStart(2, '0');
                                  const month = String(d.getMonth() + 1).padStart(2, '0');
                                  const year = d.getFullYear();
                                  return `${day}/${month}/${year}`;
                                })()}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-[color:var(--t1)] truncate">{event.title}</p>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className={`text-xs px-2 py-0.5 ${
                                  event.type === 'show' ? 'bg-[color:var(--surface-2)] text-white' :
                                  event.type === 'release' ? 'bg-[#009C55] text-white' :
                                  event.type === 'task' ? 'bg-[#CCDBE2] text-black' :
                                  event.type === 'travel_accommodation' ? 'bg-[#90928F] text-white' :
                                  event.type === 'birthday' ? 'bg-[#EEF2EA] text-black' :
                                  'bg-[color:var(--surface-2)] text-[color:var(--t2)]'
                                }`}>
                                  {event.type === 'travel_accommodation' ? 'Travel' : event.type === 'birthday' ? 'Birthday' : event.type.charAt(0).toUpperCase() + event.type.slice(1)}
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
              <CalendarIcon className="mx-auto h-12 w-12 text-[color:var(--t3)]" />
              <h3 className="mt-2 text-sm font-medium text-[color:var(--t1)]">No events found</h3>
              <p className="mt-1 text-sm text-[color:var(--t3)]">
                No events match your filter criteria.
              </p>
              <div className="mt-6">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium  shadow-sm text-white bg-primary hover:bg-primary"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        {groupedTimelineEvents.length > 0 && (
          <div className="px-3 md:px-6 py-3 md:py-4 border-t border-[color:var(--border)] flex justify-between items-center">
            <button className="flex items-center gap-1 md:gap-2 text-sm text-primary hover:text-[color:var(--t1)] active:opacity-70">
              <img src="/TM-ArrowLeft-negro.svg" className="pxi-md icon-muted" alt="" />
              <span className="hidden sm:inline">Previous Events</span>
              <span className="sm:hidden">Prev</span>
            </button>
            <div className="text-xs md:text-sm text-[color:var(--t3)]">
              {filteredEvents.length} of {allEvents.length}
            </div>
            <button className="flex items-center gap-1 md:gap-2 text-sm text-primary hover:text-[color:var(--t1)] active:opacity-70">
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
                  <selectedEvent.icon className="w-5 h-5 text-[color:var(--t3)]" />
                ) : (
                  <CalendarIcon className="w-5 h-5 text-[color:var(--t3)]" />
                )}
                <h3 className="text-lg font-medium text-[color:var(--t1)]">{selectedEvent.title}</h3>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${
                  selectedEvent.type === 'release' ? 'bg-[#009C55] text-white' :
                  selectedEvent.type === 'show' ? 'bg-black text-white' :
                  selectedEvent.type === 'other' ? 'bg-[#EEF2EA] text-black border border-black' :
                  selectedEvent.type === 'task' ? 'bg-[#CCDBE2] text-[color:var(--t1)]' :
                  selectedEvent.type === 'travel_accommodation' ? 'bg-[#90928F] text-white' :
                  selectedEvent.type === 'birthday' ? 'bg-[#EEF2EA] text-black' :
                  'bg-[#EEF2EA] text-black border border-black'
                }`}>
                  {selectedEvent.type === 'travel_accommodation' ? 'Travel and Accommodation' : selectedEvent.type === 'birthday' ? 'Birthday' : selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                </span>
                {selectedEvent.source && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedEvent.source === 'google' ? 'bg-[color:var(--surface-4)] text-[color:var(--t1)] border border-[color:var(--border-3)]' :
                    selectedEvent.source === 'ical' ? 'bg-[color:var(--surface-4)] text-[color:var(--t1)] border border-[color:var(--border-3)]' :
                    selectedEvent.source === 'outlook' ? 'bg-[color:var(--surface-4)] text-[color:var(--t1)] border border-[color:var(--border-3)]' :
                    'bg-[color:var(--surface-2)] text-[color:var(--t1)]'
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
                <CalendarIcon className="w-5 h-5 text-[color:var(--t3)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[color:var(--t1)]">Date</p>
                  <p className="text-sm text-[color:var(--t3)]">
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
                  <Clock className="w-5 h-5 text-[color:var(--t3)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[color:var(--t1)]">Time</p>
                    <p className="text-sm text-[color:var(--t3)]">{selectedEvent.time}</p>
                  </div>
                </div>
              )}
            </div>

            {selectedEvent.location && (
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-[color:var(--t3)] mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[color:var(--t1)]">Location</p>
                  <p className="text-sm text-[color:var(--t3)]">{selectedEvent.location}</p>
                </div>
              </div>
            )}

            {selectedEvent.description && (
              <div className="flex items-start gap-2">
                <img src="/TM-Info-negro.svg" className="pxi-lg icon-muted mt-0.5" alt="" />
                <div>
                  <p className="text-sm font-medium text-[color:var(--t1)]">Details</p>
                  <p className="text-sm text-[color:var(--t3)]">{selectedEvent.description}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedEvent(null);
                }}
                className="px-4 py-2.5 sm:py-2 text-sm font-medium text-[color:var(--t2)] bg-[color:var(--surface)] border border-[color:var(--border)] hover:bg-[color:var(--surface-2)] active:bg-[color:var(--surface-2)] transition-colors"
              >
                Close
              </button>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {selectedEvent.relatedId && selectedEvent.source === 'database' && (
                  <button
                    onClick={() => handleNavigateToSource(selectedEvent)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-black hover:bg-[color:var(--surface-3)] active:bg-[color:var(--surface-2)] transition-colors"
                  >
                    <img src="/TM-ExternalLink-negro.svg" className="pxi-md icon-white" alt="" />
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
                      <img src="/TM-Close-negro.svg" className="pxi-md icon-white" alt="" />
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
                      <img src="/TM-Pluma-negro.png" className="pxi-md icon-white" alt="" />
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
            <label className="block text-sm font-medium text-[color:var(--t2)] mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={eventFormData.title || ''}
              onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
              className="block w-full  border-[color:var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Enter event title"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--t2)] mb-1">
                Date *
              </label>
              <TMDatePicker
                value={eventFormData.date || selectedDate || ''}
                onChange={(date) => setEventFormData({ ...eventFormData, date })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--t2)] mb-1">
                Time
              </label>
              <input
                type="time"
                value={eventFormData.time || ''}
                onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
                className="block w-full border-[color:var(--border)] focus:border-primary focus:ring-primary text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--t2)] mb-1">
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
                    color = 'bg-[#CCDBE2] text-[color:var(--t1)]';
                    break;
                  case 'travel_accommodation':
                    color = 'bg-[#90928F] text-white';
                    break;
                  case 'birthday':
                    color = 'bg-[#EEF2EA] text-black';
                    break;
                }
                setEventFormData({ ...eventFormData, type, color });
              }}
              className="block w-full  border-[color:var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="other">Other</option>
              <option value="release">Release</option>
              <option value="show">Show</option>
              <option value="task">Task</option>
              <option value="travel_accommodation">Travel and Accommodation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--t2)] mb-1">
              Location
            </label>
            <input
              type="text"
              value={eventFormData.location || ''}
              onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
              className="block w-full  border-[color:var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Enter location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--t2)] mb-1">
              Description
            </label>
            <textarea
              value={eventFormData.description || ''}
              onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
              rows={3}
              className="block w-full  border-[color:var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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
              className="px-4 py-2 text-sm font-medium text-[color:var(--t2)] bg-[color:var(--surface)] border border-[color:var(--border)]  hover:bg-[color:var(--surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary  hover:bg-primary"
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
        onConnectionsUpdated={loadAllDatabaseEvents}
      />
    </div>
  );
}