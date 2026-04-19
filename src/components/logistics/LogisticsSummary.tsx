import React from 'react';
import { Calendar, MapPin, DollarSign, Plane, Building, Users } from 'lucide-react';
import { LogisticsOverview } from '../../types/logistics';
import { CREW_MEMBERS } from '../../data/logistics';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../../lib/utils';

interface LogisticsSummaryProps {
  overview: LogisticsOverview;
}

export default function LogisticsSummary({ overview }: LogisticsSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get unique crew members across all transportation and accommodation
  const getUniqueCrewMembers = () => {
    const passengerIds = overview.travelItineraries.flatMap(ti => ti.passengers);
    const guestIds = overview.accommodationBookings.flatMap(ab => ab.guests);
    const allPersonnelIds = [...new Set([...passengerIds, ...guestIds])];
    return CREW_MEMBERS.filter(member => allPersonnelIds.includes(String(member.id)));
  };

  const crewMembers = getUniqueCrewMembers();
  const totalCost = overview.totalTransportationCost + overview.totalAccommodationCost;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`Logistics Summary: ${overview.showTitle}`, doc.internal.pageSize.width / 2, 20, { align: 'center' });
    
    // Add show details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatDate(overview.showDate)}`, 14, 35);
    doc.text(`Venue: ${overview.showVenue}`, 14, 42);
    doc.text(`Location: ${overview.showCity}, ${overview.showCountry}`, 14, 49);
    
    // Add transportation table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Transportation', 14, 65);
    
    const transportationData = overview.travelItineraries.map(item => [
      item.transportationType.charAt(0).toUpperCase() + item.transportationType.slice(1),
      formatDate(item.departureDate),
      item.departureTime || '',
      item.departureLocation,
      formatDate(item.arrivalDate),
      item.arrivalTime || '',
      item.arrivalLocation,
      item.status.charAt(0).toUpperCase() + item.status.slice(1),
      item.cost ? `$${item.cost}` : '-'
    ]);
    
    autoTable(doc, {
      startY: 70,
      head: [['Type', 'Dep. Date', 'Time', 'From', 'Arr. Date', 'Time', 'To', 'Status', 'Cost']],
      body: transportationData,
      theme: 'striped',
      headStyles: { fillColor: [165, 138, 103], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
    });
    
    // Add accommodation table
    const accommodationY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Accommodation', 14, accommodationY);
    
    const accommodationData = overview.accommodationBookings.map(item => [
      item.providerId || 'Unknown',
      formatDate(item.checkInDate),
      item.checkInTime || '',
      formatDate(item.checkOutDate),
      item.checkOutTime || '',
      item.roomType || '-',
      item.numberOfRooms.toString(),
      item.status.charAt(0).toUpperCase() + item.status.slice(1),
      item.cost ? `$${item.cost}` : '-'
    ]);
    
    autoTable(doc, {
      startY: accommodationY + 5,
      head: [['Provider', 'Check-in', 'Time', 'Check-out', 'Time', 'Room Type', 'Rooms', 'Status', 'Cost']],
      body: accommodationData,
      theme: 'striped',
      headStyles: { fillColor: [165, 138, 103], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
    });
    
    // Add crew members table
    const crewY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Crew Members', 14, crewY);
    
    const crewData = crewMembers.map(member => [
      member.name,
      member.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      member.email,
      member.phone,
      member.passportId || '-'
    ]);
    
    autoTable(doc, {
      startY: crewY + 5,
      head: [['Name', 'Role', 'Email', 'Phone', 'Passport/ID']],
      body: crewData,
      theme: 'striped',
      headStyles: { fillColor: [165, 138, 103], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
    });
    
    // Add cost summary
    const costY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Cost Summary', 14, costY);
    
    const costData = [
      ['Transportation', formatCurrency(overview.totalTransportationCost)],
      ['Accommodation', formatCurrency(overview.totalAccommodationCost)],
      ['Total', formatCurrency(totalCost)]
    ];
    
    autoTable(doc, {
      startY: costY + 5,
      body: costData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' }
      },
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
    
    doc.save(`logistics_${overview.showTitle.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="rounded-lg shadow-md" style={{ background: 'var(--surface)' }}>
      <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-medium" style={{ color: 'var(--t1)' }}>{overview.showTitle}</h2>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--t2)' }}>
                <Calendar className="w-4 h-4 text-primary" />
                {formatDate(overview.showDate)}
              </div>
              <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--t2)' }}>
                <MapPin className="w-4 h-4 text-primary" />
                {overview.showVenue}, {overview.showCity}
              </div>
            </div>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
          >
            <img src="/TM-Download-negro.svg" className="pxi-md icon-white" alt="" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Plane className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium text-charcoal uppercase">Transportation</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Itineraries:</span>
              <span className="text-sm font-medium text-charcoal">{overview.travelItineraries.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Cost:</span>
              <span className="text-sm font-medium text-black">{formatCurrency(overview.totalTransportationCost)}</span>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Itinerary Summary</h4>
              <div className="space-y-2">
                {overview.travelItineraries.map(itinerary => (
                  <div key={itinerary.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          {itinerary.transportationType.charAt(0).toUpperCase() + itinerary.transportationType.slice(1)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(itinerary.departureDate)} • {itinerary.passengers.length} passengers
                        </p>
                      </div>
                      <span className="text-sm font-medium text-black">
                        {itinerary.cost ? formatCurrency(itinerary.cost) : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium text-charcoal uppercase">Accommodation</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Bookings:</span>
              <span className="text-sm font-medium text-charcoal">{overview.accommodationBookings.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Cost:</span>
              <span className="text-sm font-medium text-black">{formatCurrency(overview.totalAccommodationCost)}</span>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Booking Summary</h4>
              <div className="space-y-2">
                {overview.accommodationBookings.map(booking => (
                  <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          {booking.roomType || 'Accommodation'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(booking.checkInDate)} to {formatDate(booking.checkOutDate)} • {booking.numberOfRooms} room(s)
                        </p>
                      </div>
                      <span className="text-sm font-medium text-black">
                        {booking.cost ? formatCurrency(booking.cost) : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-medium text-charcoal uppercase">Personnel</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crewMembers.map(member => (
            <div key={member.id} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-charcoal">{member.name}</p>
              <p className="text-xs text-gray-500">
                {member.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </p>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-xs text-gray-500">{member.email}</span>
                <span className="text-xs text-gray-500">{member.phone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/TM-File-negro.svg" className="pxi-lg icon-muted" alt="" />
            <h3 className="text-lg font-medium text-charcoal uppercase">Cost Summary</h3>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Transportation:</span>
              <span className="font-medium text-black">{formatCurrency(overview.totalTransportationCost)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Accommodation:</span>
              <span className="font-medium text-black">{formatCurrency(overview.totalAccommodationCost)}</span>
            </div>
            <div className="flex items-center gap-2 text-base font-medium text-charcoal mt-2">
              <span>Total:</span>
              <span>{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}