import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import TourCard from '../../components/live/TourCard';
import TourModal from '../../components/live/TourModal';
import { getTours, createTour } from '../../lib/tourService';
import type { Tour, TourFormData, TourStatus } from '../../types/tour';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Tours() {
  const navigate = useNavigate();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TourStatus>('all');

  useEffect(() => { loadTours(); }, []);

  const loadTours = async () => {
    try {
      setLoading(true);
      const data = await getTours();
      setTours(data);
    } catch (err) {
      console.error('Error loading tours:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTour = async (formData: TourFormData) => {
    await createTour(formData);
    await loadTours();
  };

  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tour.artist_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tour.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <img src="/TM-Search-negro.svg" className="pxi-md icon-muted absolute left-3 top-1/2 -translate-y-1/2" alt="" />
          <input
            type="text"
            placeholder="Search tours..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-1 text-white"
          >
            <Plus size={16} /> New Tour
          </button>
        </div>
      </div>

      {/* Tour list */}
      {filteredTours.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--t3)' }}>
          {tours.length === 0 ? (
            <>
              <p className="text-lg mb-2" style={{ color: 'var(--t2)' }}>No tours yet</p>
              <p className="text-sm">Create your first tour to start managing your live shows.</p>
            </>
          ) : (
            <p className="text-sm">No tours match your search.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredTours.map(tour => (
            <TourCard
              key={tour.id}
              tour={tour}
              onClick={() => navigate(`/live/tour/${tour.id}`)}
            />
          ))}
        </div>
      )}

      <TourModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateTour}
      />
    </div>
  );
}
