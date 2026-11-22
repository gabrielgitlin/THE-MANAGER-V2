import React, { useState, useEffect } from 'react';
import type { TourDay, TourDayFormData, DayType } from '../../types/tour';
import { supabase } from '../../lib/supabase';
import { TMDatePicker } from '../ui/TMDatePicker';

interface TourDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TourDayFormData) => Promise<void>;
  tourId: string;
  existingDay?: TourDay;
}

const dayTypes: { value: DayType; label: string }[] = [
  { value: 'show', label: 'Show Day' },
  { value: 'travel', label: 'Travel Day' },
  { value: 'off', label: 'Day Off' },
  { value: 'rehearsal', label: 'Rehearsal' },
];

export default function TourDayModal({ isOpen, onClose, onSave, tourId, existingDay }: TourDayModalProps) {
  const [dayType, setDayType] = useState<DayType>('show');
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const [showId, setShowId] = useState('');
  const [availableShows, setAvailableShows] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvailableShows();
      if (existingDay) {
        setDayType(existingDay.day_type);
        setDate(existingDay.date);
        setTitle(existingDay.title || '');
        setCity(existingDay.city || '');
        setCountry(existingDay.country || '');
        setNotes(existingDay.notes || '');
        setShowId(existingDay.show_id || '');
      } else {
        setDayType('show');
        setDate('');
        setTitle('');
        setCity('');
        setCountry('');
        setNotes('');
        setShowId('');
      }
    }
  }, [isOpen, existingDay]);

  const loadAvailableShows = async () => {
    const { data } = await supabase
      .from('shows')
      .select('id, title, date, venue_name, venue_city')
      .or(`tour_id.is.null,tour_id.eq.${tourId}`)
      .order('date', { ascending: true });
    if (data) setAvailableShows(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    try {
      await onSave({
        date,
        day_type: dayType,
        show_id: dayType === 'show' && showId ? showId : undefined,
        title: dayType !== 'show' ? title.trim() || undefined : undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        notes: notes.trim() || undefined,
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
            {existingDay ? 'Edit Day' : 'Add Tour Day'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <img src="/TM-Close-negro.svg" className="pxi-lg icon-muted" alt="" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Day type selector */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--t2)' }}>Day Type</label>
            <div className="grid grid-cols-4 gap-2">
              {dayTypes.map(dt => (
                <button
                  key={dt.value}
                  type="button"
                  onClick={() => setDayType(dt.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    dayType === dt.value ? 'bg-brand-1 text-white' : ''
                  }`}
                  style={dayType !== dt.value ? { backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' } : {}}
                >
                  {dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Date</label>
            <TMDatePicker value={date} onChange={(date) => setDate(date)} required />
          </div>

          {/* Show-specific: select existing show */}
          {dayType === 'show' && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Link to Show</label>
              <select
                value={showId}
                onChange={e => {
                  const selectedId = e.target.value;
                  setShowId(selectedId);
                  if (selectedId) {
                    const show = availableShows.find(s => s.id === selectedId);
                    if (show) {
                      if (show.date) setDate(show.date);
                      if (show.venue_city) setCity(show.venue_city);
                    }
                  }
                }}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
              >
                <option value="">Select a show...</option>
                {availableShows.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {s.venue_name}, {s.venue_city} ({s.date})
                  </option>
                ))}
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
                Select an existing show or leave blank to add later.
              </p>
            </div>
          )}

          {/* Non-show fields */}
          {dayType !== 'show' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={dayType === 'travel' ? 'e.g. Fly NYC → London' : dayType === 'rehearsal' ? 'e.g. Production Rehearsal' : 'e.g. Rest Day'}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Country</label>
                  <input type="text" value={country} onChange={e => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }} />
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !date}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-brand-1 text-white disabled:opacity-50">
              {saving ? 'Saving...' : existingDay ? 'Update Day' : 'Add Day'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
