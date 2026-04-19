import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { EnhancedVenue, VenueFormData, VenueContact } from '../../types/venue';
import PlacesAutocomplete from '../ui/PlacesAutocomplete';

interface VenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VenueFormData) => Promise<void>;
  venue?: EnhancedVenue;
}

const tagOptions = ['club', 'theater', 'arena', 'stadium', 'festival', 'outdoor', 'bar', 'lounge', 'amphitheater', 'hall'];

export default function VenueModal({ isOpen, onClose, onSave, venue }: VenueModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [capacity, setCapacity] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [contacts, setContacts] = useState<VenueContact[]>([]);
  const [technicalRiderUrl, setTechnicalRiderUrl] = useState('');
  const [hospitalityRiderUrl, setHospitalityRiderUrl] = useState('');
  const [stagePlotUrl, setStagePlotUrl] = useState('');
  const [parkingInfo, setParkingInfo] = useState('');
  const [loadInInfo, setLoadInInfo] = useState('');
  const [wifiInfo, setWifiInfo] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'contacts' | 'docs' | 'notes'>('basic');

  useEffect(() => {
    if (isOpen) {
      if (venue) {
        setName(venue.name);
        setAddress(venue.address);
        setCity(venue.city);
        setState(venue.state || '');
        setCountry(venue.country);
        setPostalCode(venue.postal_code || '');
        setCapacity(venue.capacity?.toString() || '');
        setWebsite(venue.website || '');
        setPhone(venue.phone || '');
        setEmail(venue.email || '');
        setNotes(venue.notes || '');
        setTags(venue.tags || []);
        setContacts(venue.contacts || []);
        setTechnicalRiderUrl(venue.technical_rider_url || '');
        setHospitalityRiderUrl(venue.hospitality_rider_url || '');
        setStagePlotUrl(venue.stage_plot_url || '');
        setParkingInfo(venue.parking_info || '');
        setLoadInInfo(venue.load_in_info || '');
        setWifiInfo(venue.wifi_info || '');
      } else {
        setName(''); setAddress(''); setCity(''); setState(''); setCountry('');
        setPostalCode(''); setCapacity(''); setWebsite(''); setPhone(''); setEmail('');
        setNotes(''); setTags([]); setContacts([]); setTechnicalRiderUrl('');
        setHospitalityRiderUrl(''); setStagePlotUrl(''); setParkingInfo('');
        setLoadInInfo(''); setWifiInfo('');
      }
      setActiveTab('basic');
    }
  }, [isOpen, venue]);

  const handleAddContact = () => {
    setContacts(prev => [...prev, { id: crypto.randomUUID(), name: '', role: '', email: '', phone: '' }]);
  };

  const handleUpdateContact = (id: string, field: keyof VenueContact, value: string) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleRemoveContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !country.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim() || undefined,
        country: country.trim(),
        postal_code: postalCode.trim() || undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
        website: website.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        contacts: contacts.filter(c => c.name.trim()),
        technical_rider_url: technicalRiderUrl.trim() || undefined,
        hospitality_rider_url: hospitalityRiderUrl.trim() || undefined,
        stage_plot_url: stagePlotUrl.trim() || undefined,
        parking_info: parkingInfo.trim() || undefined,
        load_in_info: loadInInfo.trim() || undefined,
        wifi_info: wifiInfo.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = { backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' };

  const tabs = [
    { id: 'basic' as const, label: 'Basic Info' },
    { id: 'contacts' as const, label: 'Contacts' },
    { id: 'docs' as const, label: 'Documents' },
    { id: 'notes' as const, label: 'Notes & Info' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border-2)' }}>
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--t1)' }}>
            {venue ? 'Edit Venue' : 'New Venue'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <img src="/TM-Close-negro.svg" className="pxi-md icon-muted" alt="" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-1 border-b" style={{ borderColor: 'var(--border-2)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${activeTab === tab.id ? 'text-brand-1 border-b-2 border-brand-1' : ''}`}
              style={activeTab !== tab.id ? { color: 'var(--t3)' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'basic' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Venue Name *</label>
                <PlacesAutocomplete
                  value={name}
                  onChange={setName}
                  onPlaceSelect={(place) => {
                    setName(place.name);
                    if (place.address) setAddress(place.address);
                    if (place.city) setCity(place.city);
                    if (place.state) setState(place.state);
                    if (place.country) setCountry(place.country);
                    if (place.postalCode) setPostalCode(place.postalCode);
                    if (place.phone && !phone) setPhone(place.phone);
                    if (place.website && !website) setWebsite(place.website);
                  }}
                  placeholder="Search venue name or address…"
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>City *</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} required
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>State</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Country *</label>
                  <input type="text" value={country} onChange={e => setCountry(e.target.value)} required
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Capacity</label>
                  <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Website</label>
                <input type="url" value={website} onChange={e => setWebsite(e.target.value)}
                  placeholder="https://" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--t2)' }}>Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${tags.includes(tag) ? 'bg-brand-1 text-white' : ''}`}
                      style={!tags.includes(tag) ? { backgroundColor: 'var(--surface)', color: 'var(--t3)', border: '1px solid var(--border-2)' } : {}}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'contacts' && (
            <>
              {contacts.map(contact => (
                <div key={contact.id} className="p-3 rounded-lg space-y-2" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: 'var(--t2)' }}>Contact</span>
                    <button type="button" onClick={() => handleRemoveContact(contact.id)} className="p-1 rounded hover:bg-red-500/20">
                      <img src="/TM-Trash-negro.svg" className="pxi-sm icon-danger" alt="" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={contact.name} onChange={e => handleUpdateContact(contact.id, 'name', e.target.value)}
                      placeholder="Name" className="px-2 py-1.5 rounded text-sm" style={inputStyle} />
                    <input type="text" value={contact.role} onChange={e => handleUpdateContact(contact.id, 'role', e.target.value)}
                      placeholder="Role (e.g. Production Mgr)" className="px-2 py-1.5 rounded text-sm" style={inputStyle} />
                    <input type="email" value={contact.email || ''} onChange={e => handleUpdateContact(contact.id, 'email', e.target.value)}
                      placeholder="Email" className="px-2 py-1.5 rounded text-sm" style={inputStyle} />
                    <input type="tel" value={contact.phone || ''} onChange={e => handleUpdateContact(contact.id, 'phone', e.target.value)}
                      placeholder="Phone" className="px-2 py-1.5 rounded text-sm" style={inputStyle} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddContact}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm w-full justify-center"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px dashed var(--border-2)' }}>
                <Plus size={14} /> Add Contact
              </button>
            </>
          )}

          {activeTab === 'docs' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Technical Rider URL</label>
                <input type="url" value={technicalRiderUrl} onChange={e => setTechnicalRiderUrl(e.target.value)}
                  placeholder="https://..." className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Hospitality Rider URL</label>
                <input type="url" value={hospitalityRiderUrl} onChange={e => setHospitalityRiderUrl(e.target.value)}
                  placeholder="https://..." className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Stage Plot URL</label>
                <input type="url" value={stagePlotUrl} onChange={e => setStagePlotUrl(e.target.value)}
                  placeholder="https://..." className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
            </>
          )}

          {activeTab === 'notes' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Parking Info</label>
                <textarea value={parkingInfo} onChange={e => setParkingInfo(e.target.value)} rows={2}
                  placeholder="Truck parking, bus parking, load-in dock..." className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Load-In Info</label>
                <textarea value={loadInInfo} onChange={e => setLoadInInfo(e.target.value)} rows={2}
                  placeholder="Loading dock location, elevator access..." className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>WiFi Info</label>
                <input type="text" value={wifiInfo} onChange={e => setWifiInfo(e.target.value)}
                  placeholder="Network: VenueWiFi / Password: ..." className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>General Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                  placeholder="Any additional notes about this venue..." className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={inputStyle} />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim() || !city.trim() || !country.trim()}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-brand-1 text-white disabled:opacity-50">
              {saving ? 'Saving...' : venue ? 'Update Venue' : 'Add Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
