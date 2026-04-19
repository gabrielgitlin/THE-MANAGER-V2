import React from 'react';
import { MapPin, Calendar, Music, ChevronRight } from 'lucide-react';
import type { Tour } from '../../types/tour';
import { formatDate } from '../../lib/utils';

const statusColors: Record<string, string> = {
  planning: 'status-badge badge-yellow',
  confirmed: 'status-badge badge-green',
  in_progress: 'status-badge badge-brand',
  completed: 'status-badge badge-neutral',
  cancelled: 'status-badge badge-neutral',
};

const statusLabels: Record<string, string> = {
  planning: 'Planning',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface TourCardProps {
  tour: Tour;
  onClick: () => void;
}

export default function TourCard({ tour, onClick }: TourCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 md:p-5 rounded-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate" style={{ color: 'var(--t1)' }}>
              {tour.name}
            </h3>
            <span className={statusColors[tour.status]}>
              {statusLabels[tour.status]}
            </span>
          </div>

          {tour.artist_name && (
            <p className="text-sm mb-2" style={{ color: 'var(--t2)' }}>{tour.artist_name}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--t3)' }}>
            {tour.start_date && tour.end_date && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(tour.start_date)} — {formatDate(tour.end_date)}
              </span>
            )}
            {tour.total_shows !== undefined && (
              <span className="flex items-center gap-1">
                <Music size={12} />
                {tour.total_shows} show{tour.total_shows !== 1 ? 's' : ''}
              </span>
            )}
            {tour.total_days !== undefined && tour.total_days > 0 && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {tour.total_days} day{tour.total_days !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <ChevronRight size={18} style={{ color: 'var(--t3)' }} className="mt-1 flex-shrink-0" />
      </div>
    </button>
  );
}
