import React, { useState, useEffect } from 'react';
import type { Tour, TourFormData, TourStatus } from '../../types/tour';
import { supabase } from '../../lib/supabase';
import { TMDatePicker } from '../ui/TMDatePicker';

interface TourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TourFormData) => Promise<void>;
  tour?: Tour;
}

const statusOptions: { value: TourStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function TourModal({ isOpen, onClose, onSave, tour }: TourModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TourStatus>('planning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [artistId, setArtistId] = useState('');
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadArtists();
      if (tour) {
        setName(tour.name);
        setDescription(tour.description || '');
        setStatus(tour.status);
        setStartDate(tour.start_date || '');
        setEndDate(tour.end_date || '');
        setArtistId(tour.artist_id);
      } else {
        setName('');
        setDescription('');
        setStatus('planning');
        setStartDate('');
        setEndDate('');
        setArtistId('');
      }
    }
  }, [isOpen, tour]);

  const loadArtists = async () => {
    const { data } = await supabase.from('artists').select('id, name').order('name');
    if (data) {
      setArtists(data);
      if (data.length === 1 && !tour) setArtistId(data[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !artistId) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        artist_id: artistId,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-lg rounded-xl p-6" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border-2)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--t1)' }}>
            {tour ? 'Edit Tour' : 'New Tour'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <img src="/TM-Close-negro.svg" className="pxi-lg icon-muted" alt="" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Artist</label>
            <select
              value={artistId}
              onChange={e => setArtistId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
            >
              <option value="">Select artist...</option>
              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Tour Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. North America Summer 2026"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TourStatus)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
            >
              {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Start Date</label>
              <TMDatePicker value={startDate} onChange={(date) => setStartDate(date)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>End Date</label>
              <TMDatePicker value={endDate} onChange={(date) => setEndDate(date)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional tour description..."
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim() || !artistId}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-brand-1 text-white disabled:opacity-50">
              {saving ? 'Saving...' : tour ? 'Update Tour' : 'Create Tour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
