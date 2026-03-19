import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Plane, Bus, Brain as Train, Car, DollarSign, FileText, X, Plus } from 'lucide-react';
import { TransportationProvider, TravelItinerary } from '../../types/logistics';
import { CREW_MEMBERS } from '../../data/logistics';

interface TransportationFormProps {
  providers: TransportationProvider[];
  initialData?: Partial<TravelItinerary>;
  onSubmit: (data: Partial<TravelItinerary>) => void;
  onCancel: () => void;
  showId: number;
}

export default function TransportationForm({
  providers,
  initialData,
  onSubmit,
  onCancel,
  showId
}: TransportationFormProps) {
  const [formData, setFormData] = useState<Partial<TravelItinerary>>(
    initialData || {
      showId,
      departureDate: '',
      departureTime: '',
      departureLocation: '',
      arrivalDate: '',
      arrivalTime: '',
      arrivalLocation: '',
      transportationType: 'flight',
      status: 'pending',
      passengers: [],
      cost: 0
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getTransportIcon = () => {
    switch (formData.transportationType) {
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

  const filteredProviders = providers.filter(provider => {
    if (formData.transportationType === 'flight') return provider.type === 'airline';
    if (formData.transportationType === 'bus') return provider.type === 'bus';
    if (formData.transportationType === 'car') return provider.type === 'car_rental';
    return true;
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        {getTransportIcon()}
        <h3 className="text-lg font-medium text-charcoal uppercase">
          {initialData ? 'Edit Transportation' : 'Add Transportation'}
        </h3>
      </div>

      {/* Transportation Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Transportation Type
        </label>
        <div className="grid grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, transportationType: 'flight' })}
            className={`flex flex-col items-center justify-center p-3 border rounded-lg ${
              formData.transportationType === 'flight' 
                ? 'border-primary bg-beige text-black' 
                : 'border-gray-200 hover:border-light-blue hover:bg-beige'
            }`}
          >
            <Plane className="w-5 h-5 mb-1" />
            <span className="text-sm">Flight</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, transportationType: 'bus' })}
            className={`flex flex-col items-center justify-center p-3 border rounded-lg ${
              formData.transportationType === 'bus' 
                ? 'border-primary bg-beige text-black' 
                : 'border-gray-200 hover:border-light-blue hover:bg-beige'
            }`}
          >
            <Bus className="w-5 h-5 mb-1" />
            <span className="text-sm">Bus</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, transportationType: 'train' })}
            className={`flex flex-col items-center justify-center p-3 border rounded-lg ${
              formData.transportationType === 'train' 
                ? 'border-primary bg-beige text-black' 
                : 'border-gray-200 hover:border-light-blue hover:bg-beige'
            }`}
          >
            <Train className="w-5 h-5 mb-1" />
            <span className="text-sm">Train</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, transportationType: 'car' })}
            className={`flex flex-col items-center justify-center p-3 border rounded-lg ${
              formData.transportationType === 'car' 
                ? 'border-primary bg-beige text-black' 
                : 'border-gray-200 hover:border-light-blue hover:bg-beige'
            }`}
          >
            <Car className="w-5 h-5 mb-1" />
            <span className="text-sm">Car</span>
          </button>
        </div>
      </div>

      {/* Provider */}
      <div>
        <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
          Provider
        </label>
        <select
          id="provider"
          value={formData.transportationProviderId || ''}
          onChange={(e) => setFormData({ ...formData, transportationProviderId: e.target.value })}
          className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        >
          <option value="">Select a provider</option>
          {filteredProviders.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      {/* Departure and Arrival */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Departure
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="departureDate"
                    value={formData.departureDate || ''}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="departureTime" className="block text-sm font-medium text-gray-700">
                  Time
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="time"
                    id="departureTime"
                    value={formData.departureTime || ''}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="departureLocation" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="departureLocation"
                value={formData.departureLocation || ''}
                onChange={(e) => setFormData({ ...formData, departureLocation: e.target.value })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="e.g., London Heathrow Airport (LHR)"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Arrival
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="arrivalDate" className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="arrivalDate"
                    value={formData.arrivalDate || ''}
                    onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                    className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700">
                  Time
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="time"
                    id="arrivalTime"
                    value={formData.arrivalTime || ''}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="arrivalLocation" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="arrivalLocation"
                value={formData.arrivalLocation || ''}
                onChange={(e) => setFormData({ ...formData, arrivalLocation: e.target.value })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="e.g., John F. Kennedy Airport (JFK), New York"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Booking Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="confirmationNumber" className="block text-sm font-medium text-gray-700">
              Confirmation Number
            </label>
            <input
              type="text"
              id="confirmationNumber"
              value={formData.confirmationNumber || ''}
              onChange={(e) => setFormData({ ...formData, confirmationNumber: e.target.value })}
              className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="e.g., BA1234567"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={formData.status || 'pending'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'confirmed' | 'pending' | 'cancelled' })}
              className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
              Cost
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                id="cost"
                value={formData.cost || ''}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Passengers */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Passengers
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
          {CREW_MEMBERS.map((member) => (
            <label key={member.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={(formData.passengers || []).includes(String(member.id))}
                onChange={(e) => {
                  const currentPassengers = formData.passengers || [];
                  const memberId = String(member.id);
                  
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      passengers: [...currentPassengers, memberId]
                    });
                  } else {
                    setFormData({
                      ...formData,
                      passengers: currentPassengers.filter(id => id !== memberId)
                    });
                  }
                }}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-500">
                  {member.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          placeholder="Add any special requirements or notes..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
        >
          {initialData ? 'Update Transportation' : 'Add Transportation'}
        </button>
      </div>
    </form>
  );
}