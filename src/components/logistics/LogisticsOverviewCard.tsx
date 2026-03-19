import React from 'react';
import { Calendar, MapPin, DollarSign, Plane, Building, Users, ChevronRight } from 'lucide-react';
import { LogisticsOverview } from '../../types/logistics';
import { CREW_MEMBERS } from '../../data/logistics';
import { formatDate } from '../../lib/utils';

interface LogisticsOverviewCardProps {
  overview: LogisticsOverview;
  onClick: (showId: number) => void;
}

export default function LogisticsOverviewCard({ overview, onClick }: LogisticsOverviewCardProps) {
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

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(overview.showId)}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-charcoal uppercase">{overview.showTitle}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{formatDate(overview.showDate)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {overview.showVenue}, {overview.showCity}, {overview.showCountry}
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Plane className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-medium text-gray-700">Transportation</h4>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              {overview.travelItineraries.length} {overview.travelItineraries.length === 1 ? 'itinerary' : 'itineraries'}
            </p>
            <p className="text-sm font-medium text-black">
              {formatCurrency(overview.totalTransportationCost)}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-medium text-gray-700">Accommodation</h4>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              {overview.accommodationBookings.length} {overview.accommodationBookings.length === 1 ? 'booking' : 'bookings'}
            </p>
            <p className="text-sm font-medium text-black">
              {formatCurrency(overview.totalAccommodationCost)}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{crewMembers.length} crew members</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-charcoal">Total: {formatCurrency(totalCost)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}