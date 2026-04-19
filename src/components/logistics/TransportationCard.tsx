import React from 'react';
import { Plane, Bus, Train, Car, Calendar, Clock, MapPin, Users, DollarSign } from 'lucide-react';
import { TravelItinerary } from '../../types/logistics';
import { CREW_MEMBERS, TRANSPORTATION_PROVIDERS } from '../../data/logistics';
import { formatDate } from '../../lib/utils';

interface TransportationCardProps {
  itinerary: TravelItinerary;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TransportationCard({ itinerary, onEdit, onDelete }: TransportationCardProps) {
  const getTransportIcon = () => {
    switch (itinerary.transportationType) {
      case 'flight':
        return <Plane className="w-5 h-5 text-primary" />;
      case 'bus':
        return <Bus className="w-5 h-5 text-primary" />;
      case 'train':
        return <Train className="w-5 h-5 text-primary" />;
      case 'car':
        return <Car className="w-5 h-5 text-primary" />;
      default:
        return <Plane className="w-5 h-5 text-primary" />;
    }
  };

  const provider = TRANSPORTATION_PROVIDERS.find(p => p.id === itinerary.transportationProviderId);
  const passengers = CREW_MEMBERS.filter(m => itinerary.passengers.includes(String(m.id)));

  return (
    <div className="rounded-lg border shadow-sm hover:shadow-md transition-shadow" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {getTransportIcon()}
            <div>
              <h3 className="text-sm font-medium" style={{ color: 'var(--t1)' }}>
                {itinerary.transportationType.charAt(0).toUpperCase() + itinerary.transportationType.slice(1)}
                {provider && ` - ${provider.name}`}
              </h3>
              <p className="text-xs text-gray-500">
                {formatDate(itinerary.departureDate)}
                {itinerary.departureTime && ` at ${itinerary.departureTime}`}
              </p>
            </div>
          </div>
          <span className={`status-badge ${
            itinerary.status === 'confirmed'
              ? 'badge-green'
              : itinerary.status === 'cancelled'
              ? 'badge-neutral'
              : 'badge-yellow'
          }`}>
            {itinerary.status.charAt(0).toUpperCase() + itinerary.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Departure
            </h4>
            <p className="text-sm text-gray-900">{itinerary.departureLocation}</p>
            <p className="text-xs text-gray-500">
              {formatDate(itinerary.departureDate)}
              {itinerary.departureTime && ` at ${itinerary.departureTime}`}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Arrival
            </h4>
            <p className="text-sm text-gray-900">{itinerary.arrivalLocation}</p>
            <p className="text-xs text-gray-500">
              {formatDate(itinerary.arrivalDate)}
              {itinerary.arrivalTime && ` at ${itinerary.arrivalTime}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <img src="/TM-File-negro.svg" className="pxi-sm icon-muted" alt="" />
              Confirmation
            </h4>
            <p className="text-sm text-gray-900">{itinerary.confirmationNumber || 'Not available'}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Cost
            </h4>
            <p className="text-sm text-gray-900">
              {itinerary.cost 
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itinerary.cost)
                : 'Not specified'
              }
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Passengers ({passengers.length})
          </h4>
          <div className="flex flex-wrap gap-2 mt-1">
            {passengers.map(passenger => (
              <span
                key={passenger.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
              >
                {passenger.name}
              </span>
            ))}
          </div>
        </div>

        {itinerary.notes && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <img src="/TM-File-negro.svg" className="pxi-sm icon-muted" alt="" />
              Notes
            </h4>
            <p className="text-sm text-gray-600">{itinerary.notes}</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
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
          onClick={() => onEdit(itinerary.id)}
          className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-beige"
          title="Edit transportation"
        >
          <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="" />
        </button>
        <button
          onClick={() => onDelete(itinerary.id)}
          className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
          title="Delete transportation"
        >
          <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
        </button>
      </div>
    </div>
  );
}