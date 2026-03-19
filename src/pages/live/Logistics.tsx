import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Search, Filter, Calendar, MapPin, DollarSign, Plane, Building, Download, FileSpreadsheet, FileText, Clock } from 'lucide-react';
import Modal from '../../components/Modal';
import TransportationForm from '../../components/logistics/TransportationForm';
import AccommodationForm from '../../components/logistics/AccommodationForm';
import TransportationCard from '../../components/logistics/TransportationCard';
import AccommodationCard from '../../components/logistics/AccommodationCard';
import LogisticsOverviewCard from '../../components/logistics/LogisticsOverviewCard';
import LogisticsTimeline from '../../components/logistics/LogisticsTimeline';
import LogisticsSummary from '../../components/logistics/LogisticsSummary';
import { formatDate } from '../../lib/utils';
import { 
  TRANSPORTATION_PROVIDERS, 
  ACCOMMODATION_PROVIDERS, 
  TRAVEL_ITINERARIES, 
  ACCOMMODATION_BOOKINGS,
  LOGISTICS_OVERVIEW
} from '../../data/logistics';
import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TravelItinerary, AccommodationBooking, LogisticsOverview } from '../../types/logistics';

export default function Logistics() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [transportationModalOpen, setTransportationModalOpen] = useState(false);
  const [accommodationModalOpen, setAccommodationModalOpen] = useState(false);
  const [editingTransportationId, setEditingTransportationId] = useState<string | null>(null);
  const [editingAccommodationId, setEditingAccommodationId] = useState<string | null>(null);
  const [travelItineraries, setTravelItineraries] = useState<TravelItinerary[]>(TRAVEL_ITINERARIES);
  const [accommodationBookings, setAccommodationBookings] = useState<AccommodationBooking[]>(ACCOMMODATION_BOOKINGS);
  const [isExporting, setIsExporting] = useState(false);

  const handleShowSelect = (showId: number) => {
    setSelectedShowId(showId);
    setActiveTab('timeline');
  };

  const handleAddTransportation = (data: Partial<TravelItinerary>) => {
    const newItinerary: TravelItinerary = {
      id: `ti-${Date.now()}`,
      ...data as TravelItinerary
    };
    setTravelItineraries([...travelItineraries, newItinerary]);
    setTransportationModalOpen(false);
  };

  const handleEditTransportation = (data: Partial<TravelItinerary>) => {
    if (!editingTransportationId) return;
    
    setTravelItineraries(travelItineraries.map(item => 
      item.id === editingTransportationId ? { ...item, ...data } : item
    ));
    setEditingTransportationId(null);
    setTransportationModalOpen(false);
  };

  const handleDeleteTransportation = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transportation?')) {
      setTravelItineraries(travelItineraries.filter(item => item.id !== id));
    }
  };

  const handleAddAccommodation = (data: Partial<AccommodationBooking>) => {
    const newBooking: AccommodationBooking = {
      id: `ab-${Date.now()}`,
      ...data as AccommodationBooking
    };
    setAccommodationBookings([...accommodationBookings, newBooking]);
    setAccommodationModalOpen(false);
  };

  const handleEditAccommodation = (data: Partial<AccommodationBooking>) => {
    if (!editingAccommodationId) return;
    
    setAccommodationBookings(accommodationBookings.map(item => 
      item.id === editingAccommodationId ? { ...item, ...data } : item
    ));
    setEditingAccommodationId(null);
    setAccommodationModalOpen(false);
  };

  const handleDeleteAccommodation = (id: string) => {
    if (window.confirm('Are you sure you want to delete this accommodation?')) {
      setAccommodationBookings(accommodationBookings.filter(item => item.id !== id));
    }
  };

  const filteredOverviews = LOGISTICS_OVERVIEW.filter(overview => 
    overview.showTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    overview.showCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    overview.showVenue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedShow = LOGISTICS_OVERVIEW.find(overview => overview.showId === selectedShowId);

  // Create a modified overview with the updated itineraries and bookings
  const getUpdatedOverview = (showId: number): LogisticsOverview | undefined => {
    const baseOverview = LOGISTICS_OVERVIEW.find(o => o.showId === showId);
    if (!baseOverview) return undefined;

    const updatedItineraries = travelItineraries.filter(ti => ti.showId === showId);
    const updatedBookings = accommodationBookings.filter(ab => ab.showId === showId);
    
    return {
      ...baseOverview,
      travelItineraries: updatedItineraries,
      accommodationBookings: updatedBookings,
      totalTransportationCost: updatedItineraries.reduce((sum, ti) => sum + (ti.cost || 0), 0),
      totalAccommodationCost: updatedBookings.reduce((sum, ab) => sum + (ab.cost || 0), 0)
    };
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      // Create workbook with multiple sheets
      const wb = utils.book_new();
      
      // Transportation sheet
      const transportationData = travelItineraries.map(item => ({
        'Show': LOGISTICS_OVERVIEW.find(o => o.showId === item.showId)?.showTitle || '',
        'Type': item.transportationType.charAt(0).toUpperCase() + item.transportationType.slice(1),
        'Provider': TRANSPORTATION_PROVIDERS.find(p => p.id === item.transportationProviderId)?.name || '',
        'Departure Date': formatDate(item.departureDate),
        'Departure Time': item.departureTime || '',
        'Departure Location': item.departureLocation,
        'Arrival Date': formatDate(item.arrivalDate),
        'Arrival Time': item.arrivalTime || '',
        'Arrival Location': item.arrivalLocation,
        'Confirmation': item.confirmationNumber || '',
        'Status': item.status.charAt(0).toUpperCase() + item.status.slice(1),
        'Cost': item.cost ? `$${item.cost}` : '',
        'Passengers': item.passengers.length,
        'Notes': item.notes || ''
      }));
      
      const transportationWs = utils.json_to_sheet(transportationData);
      utils.book_append_sheet(wb, transportationWs, 'Transportation');
      
      // Accommodation sheet
      const accommodationData = accommodationBookings.map(item => ({
        'Show': LOGISTICS_OVERVIEW.find(o => o.showId === item.showId)?.showTitle || '',
        'Provider': ACCOMMODATION_PROVIDERS.find(p => p.id === item.providerId)?.name || '',
        'Check-in': formatDate(item.checkInDate),
        'Check-out': formatDate(item.checkOutDate),
        'Room Type': item.roomType || '',
        'Rooms': item.numberOfRooms,
        'Confirmation': item.confirmationNumber || '',
        'Status': item.status.charAt(0).toUpperCase() + item.status.slice(1),
        'Cost': item.cost ? `$${item.cost}` : '',
        'Guests': item.guests.length,
        'Amenities': (item.amenities || []).join(', '),
        'Notes': item.notes || ''
      }));
      
      const accommodationWs = utils.json_to_sheet(accommodationData);
      utils.book_append_sheet(wb, accommodationWs, 'Accommodation');
      
      // Write to file
      writeFile(wb, 'tour_logistics.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
    setIsExporting(false);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Tour Logistics Report', doc.internal.pageSize.width / 2, 20, { align: 'center' });
      
      // Add generation date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on ${formatDate(new Date())}`, doc.internal.pageSize.width / 2, 30, { align: 'center' });

      // Add show information if a show is selected
      let yPos = 40;
      if (selectedShow) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Show: ${selectedShow.showTitle}`, 14, yPos);
        yPos += 7;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${formatDate(selectedShow.showDate)}`, 14, yPos);
        yPos += 5;
        
        doc.text(`Venue: ${selectedShow.showVenue}, ${selectedShow.showCity}, ${selectedShow.showCountry}`, 14, yPos);
        yPos += 10;
      }

      // Add transportation table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Transportation', 14, yPos);
      yPos += 10;

      const transportationData = travelItineraries
        .filter(item => selectedShowId ? item.showId === selectedShowId : true)
        .map(item => [
          item.transportationType.charAt(0).toUpperCase() + item.transportationType.slice(1),
          formatDate(item.departureDate),
          item.departureLocation,
          formatDate(item.arrivalDate),
          item.arrivalLocation,
          item.status.charAt(0).toUpperCase() + item.status.slice(1),
          item.cost ? `$${item.cost}` : '-'
        ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Type', 'Departure Date', 'From', 'Arrival Date', 'To', 'Status', 'Cost']],
        body: transportationData,
        theme: 'striped',
        headStyles: { fillColor: [165, 138, 103], textColor: [255, 255, 255] },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Add accommodation table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Accommodation', 14, yPos);
      yPos += 10;

      const accommodationData = accommodationBookings
        .filter(item => selectedShowId ? item.showId === selectedShowId : true)
        .map(item => [
          ACCOMMODATION_PROVIDERS.find(p => p.id === item.providerId)?.name || 'Unknown',
          formatDate(item.checkInDate),
          formatDate(item.checkOutDate),
          item.roomType || '-',
          item.numberOfRooms.toString(),
          item.status.charAt(0).toUpperCase() + item.status.slice(1),
          item.cost ? `$${item.cost}` : '-'
        ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Provider', 'Check-in', 'Check-out', 'Room Type', 'Rooms', 'Status', 'Cost']],
        body: accommodationData,
        theme: 'striped',
        headStyles: { fillColor: [165, 138, 103], textColor: [255, 255, 255] },
        styles: { fontSize: 8 },
      });

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(128, 128, 128);
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

      doc.save('tour_logistics.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
    setIsExporting(false);
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/live')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Live Events
        </button>
        <h1 className="text-2xl font-bold text-charcoal font-title">Logistics Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Plan and manage transportation and accommodation for your tour
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('overview');
              setSelectedShowId(null);
            }}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Overview
          </button>
          {selectedShowId && (
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'timeline'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              Timeline
            </button>
          )}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'overview' ? 'shows' : 'logistics'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
          <div className="flex gap-4">
            {selectedShowId && activeTab !== 'timeline' && (
              <button
                onClick={() => setSelectedShowId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Show Filter
              </button>
            )}
            {activeTab === 'timeline' && (
              <>
                <button
                  onClick={() => {
                    setEditingTransportationId(null);
                    setTransportationModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
                >
                  <Plus className="w-4 h-4" />
                  Add Transportation
                </button>
                <button
                  onClick={() => {
                    setEditingAccommodationId(null);
                    setAccommodationModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Accommodation
                </button>
              </>
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

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOverviews.map(overview => (
            <LogisticsOverviewCard
              key={overview.showId}
              overview={overview}
              onClick={handleShowSelect}
            />
          ))}
          {filteredOverviews.length === 0 && (
            <div className="col-span-3 py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No shows found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or add a new show from the Live Events page.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && selectedShowId && selectedShow && (
        <div>
          <LogisticsTimeline 
            overview={getUpdatedOverview(selectedShowId) || selectedShow}
            onEditTransportation={(id) => {
              setEditingTransportationId(id);
              setTransportationModalOpen(true);
            }}
            onDeleteTransportation={handleDeleteTransportation}
            onEditAccommodation={(id) => {
              setEditingAccommodationId(id);
              setAccommodationModalOpen(true);
            }}
            onDeleteAccommodation={handleDeleteAccommodation}
            onAddTransportation={() => {
              setEditingTransportationId(null);
              setTransportationModalOpen(true);
            }}
            onAddAccommodation={() => {
              setEditingAccommodationId(null);
              setAccommodationModalOpen(true);
            }}
          />
          
          <div className="mt-8">
            <LogisticsSummary overview={getUpdatedOverview(selectedShowId) || selectedShow} />
          </div>
        </div>
      )}

      {/* Transportation Modal */}
      <Modal
        isOpen={transportationModalOpen}
        onClose={() => {
          setTransportationModalOpen(false);
          setEditingTransportationId(null);
        }}
        title={editingTransportationId ? "Edit Transportation" : "Add Transportation"}
        maxWidth="3xl"
      >
        <TransportationForm
          providers={TRANSPORTATION_PROVIDERS}
          initialData={editingTransportationId 
            ? travelItineraries.find(item => item.id === editingTransportationId) 
            : { showId: selectedShowId || 1 }
          }
          onSubmit={editingTransportationId ? handleEditTransportation : handleAddTransportation}
          onCancel={() => {
            setTransportationModalOpen(false);
            setEditingTransportationId(null);
          }}
          showId={selectedShowId || 1}
        />
      </Modal>

      {/* Accommodation Modal */}
      <Modal
        isOpen={accommodationModalOpen}
        onClose={() => {
          setAccommodationModalOpen(false);
          setEditingAccommodationId(null);
        }}
        title={editingAccommodationId ? "Edit Accommodation" : "Add Accommodation"}
        maxWidth="3xl"
      >
        <AccommodationForm
          providers={ACCOMMODATION_PROVIDERS}
          initialData={editingAccommodationId 
            ? accommodationBookings.find(item => item.id === editingAccommodationId) 
            : { showId: selectedShowId || 1 }
          }
          onSubmit={editingAccommodationId ? handleEditAccommodation : handleAddAccommodation}
          onCancel={() => {
            setAccommodationModalOpen(false);
            setEditingAccommodationId(null);
          }}
          showId={selectedShowId || 1}
        />
      </Modal>
    </div>
  );
}