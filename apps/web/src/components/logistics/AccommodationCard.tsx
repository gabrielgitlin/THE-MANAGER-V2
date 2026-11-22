import React from 'react';
import { Building, Calendar, Clock, MapPin, Users, DollarSign } from 'lucide-react';
import { AccommodationBooking } from '../../types/logistics';
import { CREW_MEMBERS, ACCOMMODATION_PROVIDERS } from '../../data/logistics';
import { formatDate } from '../../lib/utils';

interface AccommodationCardProps {
  booking: AccommodationBooking;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function AccommodationCard({ booking, onEdit, onDelete }: AccommodationCardProps) {
  const provider = ACCOMMODATION_PROVIDERS.find(p => p.id === booking.providerId);
  const guests = CREW_MEMBERS.filter(m => booking.guests.includes(String(m.id)));

  const calculateNights = () => {
    if (!booking.checkInDate || !booking.checkOutDate) return 0;
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nights = calculateNights();

  return (
    <div className="rounded-lg border shadow-sm hover:shadow-md transition-shadow" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-medium" style={{ color: 'var(--t1)' }}>
                {provider?.name || 'Accommodation'}
                {booking.roomType && ` - ${booking.roomType}`}
              </h3>
              <p className="text-xs" style={{ color: 'var(--t3)' }}>
                {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                {nights > 0 && ` (${nights} night${nights !== 1 ? 's' : ''})`}
              </p>
            </div>
          </div>
          <span className={`status-badge ${
            booking.status === 'confirmed'
              ? 'badge-green'
              : booking.status === 'cancelled'
              ? 'badge-neutral'
              : 'badge-yellow'
          }`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Check-in
            </h4>
            <p className="text-sm text-gray-900">{formatDate(booking.checkInDate)}</p>
            <p className="text-xs text-gray-500">{booking.checkInTime || 'Standard time'}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Check-out
            </h4>
            <p className="text-sm text-gray-900">{formatDate(booking.checkOutDate)}</p>
            <p className="text-xs text-gray-500">{booking.checkOutTime || 'Standard time'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Building className="w-3 h-3" />
              Rooms
            </h4>
            <p className="text-sm text-gray-900">
              {booking.numberOfRooms} {booking.roomType ? booking.roomType : 'room(s)'}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <img src="/TM-File-negro.svg" className="pxi-sm icon-muted" alt="" />
              Confirmation
            </h4>
            <p className="text-sm text-gray-900">{booking.confirmationNumber || 'Not available'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Guests ({guests.length})
            </h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {guests.map(guest => (
                <span
                  key={guest.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                >
                  {guest.name}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Cost
            </h4>
            <p className="text-sm text-gray-900">
              {booking.cost 
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(booking.cost)
                : 'Not specified'
              }
            </p>
          </div>
        </div>

        {booking.amenities && booking.amenities.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <img src="/The Manager_Iconografia-11.svg" className="pxi-sm icon-muted" alt="" />
              Amenities
            </h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {booking.amenities.map(amenity => (
                <span
                  key={amenity}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-beige text-black"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {booking.notes && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <img src="/TM-File-negro.svg" className="pxi-sm icon-muted" alt="" />
              Notes
            </h4>
            <p className="text-sm text-gray-600">{booking.notes}</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
        {provider?.website && (
          <a
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-beige"
            title="Visit provider website"
          >
            <img src="/TM-ExternalLink-negro.svg" className="pxi-md icon-muted" alt="" />
          </a>
        )}
        <button
          onClick={() => onEdit(booking.id)}
          className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-beige"
          title="Edit accommodation"
        >
          <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="" />
        </button>
        <button
          onClick={() => onDelete(booking.id)}
          className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
          title="Delete accommodation"
        >
          <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
        </button>
      </div>
    </div>
  );
}