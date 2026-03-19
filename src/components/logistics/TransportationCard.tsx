import React from 'react';
import { Plane, Bus, Train, Car, Calendar, Clock, MapPin, Users, DollarSign, FileText, Edit2, Trash2, ExternalLink } from 'lucide-react';
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {getTransportIcon()}
            <div>
              <h3 className="text-sm font-medium text-charcoal">
                {itinerary.transportationType.charAt(0).toUpperCase() + itinerary.transportationType.slice(1)}
                {provider && ` - ${provider.name}`}
              </h3>
              <p className="text-xs text-gray-500">
                {formatDate(itinerary.departureDate)}
                {itinerary.departureTime && ` at ${itinerary.departureTime}`}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            itinerary.status === 'confirmed' 
              ? 'bg-green-100 text-green-800' 
              : itinerary.status === 'cancelled'
              ? 'bg-red-100 text-red-800'
              : 'bg-beige text-black'
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
              <FileText className="w-3 h-3" />
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
              <FileText className="w-3 h-3" />
              Notes
            </h4>
            <p className="text-sm text-gray-600">{itinerary.notes}</p>
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
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={() => onEdit(itinerary.id)}
          className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-beige"
          title="Edit transportation"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(itinerary.id)}
          className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
          title="Delete transportation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}