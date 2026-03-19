import React, { useState } from 'react';
import { Plus, X, Globe, Phone, Mail, MapPin, Calendar, Flag, Import as Passport, Link2 } from 'lucide-react';
import type { PersonnelFormData } from '../../types/personnel';

interface PersonnelFormProps {
  initialData?: Partial<PersonnelFormData>;
  onSubmit: (data: PersonnelFormData) => void;
  onCancel: () => void;
  pros: Array<{ id: string; name: string; country?: string }>;
  publishers: Array<{ id: string; name: string }>;
}

const PERSONNEL_TYPES = [
  { value: 'songwriter', label: 'Songwriter' },
  { value: 'producer', label: 'Producer' },
  { value: 'artist', label: 'Artist' },
  { value: 'mix_engineer', label: 'Mix Engineer' },
  { value: 'mastering_engineer', label: 'Mastering Engineer' },
];

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
];

const DEFAULT_PROS = [
  { id: 'ascap', name: 'ASCAP', country: 'United States' },
  { id: 'bmi', name: 'BMI', country: 'United States' }
];

export default function PersonnelForm({ initialData, onSubmit, onCancel, pros: initialPros = DEFAULT_PROS, publishers: initialPublishers = [] }: PersonnelFormProps) {
  const [formData, setFormData] = useState<PersonnelFormData>({
    type: initialData?.type || 'songwriter',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    country: initialData?.country || '',
    postalCode: initialData?.postalCode || '',
    bio: initialData?.bio || '',
    website: initialData?.website || '',
    socialLinks: initialData?.socialLinks || {},
    pros: initialData?.pros || [],
    publishers: initialData?.publishers || [],
  });

  // State for managing PROs and Publishers
  const [pros, setPros] = useState(initialPros);
  const [publishers, setPublishers] = useState(initialPublishers);
  const [isAddingPRO, setIsAddingPRO] = useState(false);
  const [isAddingPublisher, setIsAddingPublisher] = useState(false);
  const [newPRO, setNewPRO] = useState({ name: '', country: '' });
  const [newPublisher, setNewPublisher] = useState({ name: '' });

  const handleAddPRO = () => {
    setFormData(prev => ({
      ...prev,
      pros: [...prev.pros, { proId: '', ipiNumber: '', isPrimary: false }],
    }));
  };

  const handleRemovePRO = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pros: prev.pros.filter((_, i) => i !== index),
    }));
  };

  const handleAddPublisher = () => {
    setFormData(prev => ({
      ...prev,
      publishers: [...prev.publishers, { publisherId: '', ipiNumber: '', isPrimary: false }],
    }));
  };

  const handleRemovePublisher = (index: number) => {
    setFormData(prev => ({
      ...prev,
      publishers: prev.publishers.filter((_, i) => i !== index),
    }));
  };

  const handleCreatePRO = () => {
    if (!newPRO.name) return;

    const id = newPRO.name.toLowerCase().replace(/\s+/g, '_');
    const pro = {
      id,
      name: newPRO.name,
      country: newPRO.country,
    };

    setPros([...pros, pro]);
    setNewPRO({ name: '', country: '' });
    setIsAddingPRO(false);
  };

  const handleCreatePublisher = () => {
    if (!newPublisher.name) return;

    const id = newPublisher.name.toLowerCase().replace(/\s+/g, '_');
    const publisher = {
      id,
      name: newPublisher.name,
    };

    setPublishers([...publishers, publisher]);
    setNewPublisher({ name: '' });
    setIsAddingPublisher(false);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(formData);
    }} className="space-y-8">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as PersonnelFormData['type'] })}
              className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              {PERSONNEL_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Street Address
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              State / Province
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Flag className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Postal Code
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* PROs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Performance Rights Organizations</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingPRO(true)}
              className="text-sm text-primary hover:text-primary/80"
            >
              Create New PRO
            </button>
            <button
              type="button"
              onClick={handleAddPRO}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
            >
              <Plus className="w-4 h-4" />
              Add PRO
            </button>
          </div>
        </div>

        {isAddingPRO && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  PRO Name
                </label>
                <input
                  type="text"
                  value={newPRO.name}
                  onChange={(e) => setNewPRO({ ...newPRO, name: e.target.value })}
                  className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="e.g., SESAC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  value={newPRO.country}
                  onChange={(e) => setNewPRO({ ...newPRO, country: e.target.value })}
                  className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="e.g., United States"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingPRO(false);
                  setNewPRO({ name: '', country: '' });
                }}
                className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePRO}
                className="px-3 py-1 text-sm text-white bg-primary rounded hover:bg-primary/90"
              >
                Create PRO
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {formData.pros.map((pro, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    PRO
                  </label>
                  <select
                    value={pro.proId}
                    onChange={(e) => {
                      const newPros = [...formData.pros];
                      newPros[index] = { ...pro, proId: e.target.value };
                      setFormData({ ...formData, pros: newPros });
                    }}
                    className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  >
                    <option value="">Select PRO</option>
                    {pros.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    IPI Number
                  </label>
                  <input
                    type="text"
                    value={pro.ipiNumber}
                    onChange={(e) => {
                      const newPros = [...formData.pros];
                      newPros[index] = { ...pro, ipiNumber: e.target.value };
                      setFormData({ ...formData, pros: newPros });
                    }}
                    className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pro.isPrimary}
                      onChange={(e) => {
                        const newPros = [...formData.pros];
                        newPros[index] = { ...pro, isPrimary: e.target.checked };
                        setFormData({ ...formData, pros: newPros });
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-gray-900">Primary PRO</span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemovePRO(index)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Publishers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Publishers</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingPublisher(true)}
              className="text-sm text-primary hover:text-primary/80"
            >
              Create New Publisher
            </button>
            <button
              type="button"
              onClick={handleAddPublisher}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
            >
              <Plus className="w-4 h-4" />
              Add Publisher
            </button>
          </div>
        </div>

        {isAddingPublisher && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Publisher Name
              </label>
              <input
                type="text"
                value={newPublisher.name}
                onChange={(e) => setNewPublisher({ name: e.target.value })}
                className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="e.g., Universal Music Publishing"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingPublisher(false);
                  setNewPublisher({ name: '' });
                }}
                className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePublisher}
                className="px-3 py-1 text-sm text-white bg-primary rounded hover:bg-primary/90"
              >
                Create Publisher
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {formData.publishers.map((pub, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Publisher
                  </label>
                  <select
                    value={pub.publisherId}
                    onChange={(e) => {
                      const newPublishers = [...formData.publishers];
                      newPublishers[index] = { ...pub, publisherId: e.target.value };
                      setFormData({ ...formData, publishers: newPublishers });
                    }}
                    className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  >
                    <option value="">Select Publisher</option>
                    {publishers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    IPI Number
                  </label>
                  <input
                    type="text"
                    value={pub.ipiNumber}
                    onChange={(e) => {
                      const newPublishers = [...formData.publishers];
                      newPublishers[index] = { ...pub, ipiNumber: e.target.value };
                      setFormData({ ...formData, publishers: newPublishers });
                    }}
                    className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pub.isPrimary}
                      onChange={(e) => {
                        const newPublishers = [...formData.publishers];
                        newPublishers[index] = { ...pub, isPrimary: e.target.checked };
                        setFormData({ ...formData, publishers: newPublishers });
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-gray-900">Primary Publisher</span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemovePublisher(index)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Online Presence */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Online Presence</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Website
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Social Media
            </label>
            {SOCIAL_PLATFORMS.map(platform => (
              <div key={platform.id} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Link2 className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={formData.socialLinks?.[platform.id] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialLinks: {
                        ...formData.socialLinks,
                        [platform.id]: e.target.value
                      }
                    })}
                    className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder={`${platform.label} URL`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Biography
        </label>
        <div className="mt-1">
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
        >
          Save
        </button>
      </div>
    </form>
  );
}