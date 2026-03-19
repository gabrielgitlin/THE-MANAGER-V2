import React, { useState } from 'react';
import { Clock, Mail, Phone } from 'lucide-react';
import Modal from '../Modal';
import type { ShowAdvances } from '../../types';

interface ShowAdvancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (advances: ShowAdvances) => void;
  advances?: ShowAdvances;
}

export default function ShowAdvancesModal({ isOpen, onClose, onSave, advances }: ShowAdvancesModalProps) {
  const [formData, setFormData] = useState<ShowAdvances>(advances || {
    productionManager: {
      name: '',
      email: '',
      phone: '',
    },
    venueContact: {
      name: '',
      email: '',
      phone: '',
    },
    schedule: {
      loadIn: '',
      soundcheck: '',
      doors: '',
      showtime: '',
      curfew: '',
    },
    catering: {
      mealTimes: {
        lunch: '',
        dinner: '',
      },
      requirements: '',
    },
    parking: {
      trucks: '',
      buses: '',
      cars: '',
      location: '',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Show Advances"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Production Manager */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Production Manager</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={formData.productionManager.name}
                onChange={(e) => setFormData({
                  ...formData,
                  productionManager: {
                    ...formData.productionManager,
                    name: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={formData.productionManager.email}
                onChange={(e) => setFormData({
                  ...formData,
                  productionManager: {
                    ...formData.productionManager,
                    email: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={formData.productionManager.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  productionManager: {
                    ...formData.productionManager,
                    phone: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Venue Contact */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Venue Contact</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={formData.venueContact.name}
                onChange={(e) => setFormData({
                  ...formData,
                  venueContact: {
                    ...formData.venueContact,
                    name: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={formData.venueContact.email}
                onChange={(e) => setFormData({
                  ...formData,
                  venueContact: {
                    ...formData.venueContact,
                    email: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={formData.venueContact.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  venueContact: {
                    ...formData.venueContact,
                    phone: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Day Schedule</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Load In
              </label>
              <input
                type="time"
                value={formData.schedule.loadIn}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: {
                    ...formData.schedule,
                    loadIn: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Soundcheck
              </label>
              <input
                type="time"
                value={formData.schedule.soundcheck}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: {
                    ...formData.schedule,
                    soundcheck: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Doors
              </label>
              <input
                type="time"
                value={formData.schedule.doors}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: {
                    ...formData.schedule,
                    doors: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Show Time
              </label>
              <input
                type="time"
                value={formData.schedule.showtime}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: {
                    ...formData.schedule,
                    showtime: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Curfew
              </label>
              <input
                type="time"
                value={formData.schedule.curfew}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: {
                    ...formData.schedule,
                    curfew: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Catering */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Catering</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lunch Time
                </label>
                <input
                  type="time"
                  value={formData.catering.mealTimes.lunch}
                  onChange={(e) => setFormData({
                    ...formData,
                    catering: {
                      ...formData.catering,
                      mealTimes: {
                        ...formData.catering.mealTimes,
                        lunch: e.target.value,
                      },
                    },
                  })}
                  className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dinner Time
                </label>
                <input
                  type="time"
                  value={formData.catering.mealTimes.dinner}
                  onChange={(e) => setFormData({
                    ...formData,
                    catering: {
                      ...formData.catering,
                      mealTimes: {
                        ...formData.catering.mealTimes,
                        dinner: e.target.value,
                      },
                    },
                  })}
                  className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Requirements
              </label>
              <textarea
                value={formData.catering.requirements}
                onChange={(e) => setFormData({
                  ...formData,
                  catering: {
                    ...formData.catering,
                    requirements: e.target.value,
                  },
                })}
                rows={3}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Parking */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Parking</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Trucks
              </label>
              <input
                type="text"
                value={formData.parking.trucks}
                onChange={(e) => setFormData({
                  ...formData,
                  parking: {
                    ...formData.parking,
                    trucks: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Buses
              </label>
              <input
                type="text"
                value={formData.parking.buses}
                onChange={(e) => setFormData({
                  ...formData,
                  parking: {
                    ...formData.parking,
                    buses: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cars
              </label>
              <input
                type="text"
                value={formData.parking.cars}
                onChange={(e) => setFormData({
                  ...formData,
                  parking: {
                    ...formData.parking,
                    cars: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={formData.parking.location}
                onChange={(e) => setFormData({
                  ...formData,
                  parking: {
                    ...formData.parking,
                    location: e.target.value,
                  },
                })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}