import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Building, DollarSign, FileText, X, Plus, Check } from 'lucide-react';
import { TMDatePicker } from '../ui/TMDatePicker';
import { AccommodationProvider, AccommodationBooking } from '../../types/logistics';
import { CREW_MEMBERS } from '../../data/logistics';

interface AccommodationFormProps {
  providers: AccommodationProvider[];
  initialData?: Partial<AccommodationBooking>;
  onSubmit: (data: Partial<AccommodationBooking>) => void;
  onCancel: () => void;
  showId: number;
}

const COMMON_AMENITIES = [
  'Free WiFi',
  'Breakfast included',
  'Room service',
  'Gym',
  'Pool',
  'Business center',
  'Airport shuttle',
  'Laundry service',
  'Parking',
  'Restaurant',
  'Bar',
  'Meeting rooms'
];

export default function AccommodationForm({
  providers,
  initialData,
  onSubmit,
  onCancel,
  showId
}: AccommodationFormProps) {
  const [formData, setFormData] = useState<Partial<AccommodationBooking>>(
    initialData || {
      showId,
      checkInDate: '',
      checkOutDate: '',
      numberOfRooms: 1,
      status: 'pending',
      guests: [],
      amenities: []
    }
  );

  const [newAmenity, setNewAmenity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return;
    
    const currentAmenities = formData.amenities || [];
    if (!currentAmenities.includes(newAmenity.trim())) {
      setFormData({
        ...formData,
        amenities: [...currentAmenities, newAmenity.trim()]
      });
    }
    setNewAmenity('');
  };

  const handleRemoveAmenity = (amenity: string) => {
    const currentAmenities = formData.amenities || [];
    setFormData({
      ...formData,
      amenities: currentAmenities.filter(a => a !== amenity)
    });
  };

  const selectedProvider = providers.find(p => p.id === formData.providerId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Building className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-medium uppercase" style={{ color: 'var(--t1)' }}>
          {initialData ? 'Edit Accommodation' : 'Add Accommodation'}
        </h3>
      </div>

      {/* Provider */}
      <div>
        <label htmlFor="provider" className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
          Accommodation Provider
        </label>
        <select
          id="provider"
          value={formData.providerId || ''}
          onChange={(e) => {
            const providerId = e.target.value;
            const provider = providers.find(p => p.id === providerId);
            setFormData({
              ...formData,
              providerId,
              amenities: provider?.amenities || []
            });
          }}
          className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
        >
          <option value="">Select a provider</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name} ({provider.type})
            </option>
          ))}
        </select>
      </div>

      {/* Check-in and Check-out */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--t2)' }}>
            <Calendar className="w-4 h-4 text-primary" />
            Check-in
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkInDate" className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                  Date
                </label>
                <div className="mt-1">
                  <TMDatePicker
                    value={formData.checkInDate || ''}
                    onChange={(date) => setFormData({ ...formData, checkInDate: date })}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="checkInTime" className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                  Time
                </label>
                <input
                  type="time"
                  id="checkInTime"
                  value={formData.checkInTime || ''}
                  onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                  className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--t2)' }}>
            <Calendar className="w-4 h-4 text-primary" />
            Check-out
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkOutDate" className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                  Date
                </label>
                <div className="mt-1">
                  <TMDatePicker
                    value={formData.checkOutDate || ''}
                    onChange={(date) => setFormData({ ...formData, checkOutDate: date })}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="checkOutTime" className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                  Time
                </label>
                <input
                  type="time"
                  id="checkOutTime"
                  value={formData.checkOutTime || ''}
                  onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                  className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="roomType" className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
            Room Type
          </label>
          <input
            type="text"
            id="roomType"
            value={formData.roomType || ''}
            onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
            className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
            placeholder="e.g., Standard, Deluxe, Suite"
          />
        </div>
        <div>
          <label htmlFor="numberOfRooms" className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
            Number of Rooms
          </label>
          <input
            type="number"
            id="numberOfRooms"
            value={formData.numberOfRooms || 1}
            onChange={(e) => setFormData({ ...formData, numberOfRooms: Number(e.target.value) })}
            className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
            min="1"
            required
          />
        </div>
      </div>

      {/* Booking Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="confirmationNumber" className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
            Confirmation Number
          </label>
          <input
            type="text"
            id="confirmationNumber"
            value={formData.confirmationNumber || ''}
            onChange={(e) => setFormData({ ...formData, confirmationNumber: e.target.value })}
            className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
            placeholder="e.g., HH123456789"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
            Status
          </label>
          <select
            id="status"
            value={formData.status || 'pending'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'confirmed' | 'pending' | 'cancelled' })}
            className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label htmlFor="cost" className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
            Cost
          </label>
          <div className="mt-1 relative shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="number"
              id="cost"
              value={formData.cost || ''}
              onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
              className="pl-10 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Guests */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--t2)' }}>
          <Users className="w-4 h-4 text-primary" />
          Guests
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto border p-2" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
          {CREW_MEMBERS.map((member) => (
            <label key={member.id} className="flex items-center p-2 rounded hover:opacity-80">
              <input
                type="checkbox"
                checked={(formData.guests || []).includes(String(member.id))}
                onChange={(e) => {
                  const currentGuests = formData.guests || [];
                  const memberId = String(member.id);

                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      guests: [...currentGuests, memberId]
                    });
                  } else {
                    setFormData({
                      ...formData,
                      guests: currentGuests.filter(id => id !== memberId)
                    });
                  }
                }}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <div className="ml-3">
                <p className="text-sm font-medium" style={{ color: 'var(--t1)' }}>{member.name}</p>
                <p className="text-xs" style={{ color: 'var(--t3)' }}>
                  {member.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--t2)' }}>
          Amenities
        </h4>
        <div className="mb-3 flex flex-wrap gap-2">
          {(formData.amenities || []).map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-beige text-black"
            >
              {amenity}
              <button
                type="button"
                onClick={() => handleRemoveAmenity(amenity)}
                className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-sand-400 hover:text-primary focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={newAmenity}
            onChange={(e) => setNewAmenity(e.target.value)}
            className="block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
          >
            <option value="">Select an amenity</option>
            {COMMON_AMENITIES.filter(amenity => !(formData.amenities || []).includes(amenity)).map((amenity) => (
              <option key={amenity} value={amenity}>
                {amenity}
              </option>
            ))}
            <option value="custom">Add custom amenity...</option>
          </select>
          <button
            type="button"
            onClick={handleAddAmenity}
            className="px-3 py-2 text-sm font-medium text-white bg-primary hover:opacity-80"
            disabled={!newAmenity}
          >
            Add
          </button>
        </div>
        {newAmenity === 'custom' && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value=""
              onChange={(e) => setNewAmenity(e.target.value)}
              className="block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
              placeholder="Enter custom amenity"
            />
            <button
              type="button"
              onClick={handleAddAmenity}
              className="px-3 py-2 text-sm font-medium text-white bg-primary hover:opacity-80"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
          placeholder="Add any special requirements or notes..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium border hover:opacity-80"
          style={{ color: 'var(--t2)', background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary hover:opacity-80"
        >
          {initialData ? 'Update Accommodation' : 'Add Accommodation'}
        </button>
      </div>
    </form>
  );
}