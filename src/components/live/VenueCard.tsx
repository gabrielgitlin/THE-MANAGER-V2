import React from 'react';
import { MapPin, Users, ChevronRight, Globe } from 'lucide-react';
import type { EnhancedVenue } from '../../types/venue';

interface VenueCardProps {
  venue: EnhancedVenue;
  onClick: () => void;
}

export default function VenueCard({ venue, onClick }: VenueCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 md:p-5 rounded-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate mb-1" style={{ color: 'var(--t1)' }}>
            {venue.name}
          </h3>

          <div className="flex items-center gap-1 text-sm mb-2" style={{ color: 'var(--t2)' }}>
            <MapPin size={13} />
            {venue.city}{venue.state ? `, ${venue.state}` : ''}, {venue.country}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--t3)' }}>
            {venue.capacity > 0 && (
              <span className="flex items-center gap-1">
                <Users size={12} />
                {venue.capacity.toLocaleString()} cap.
              </span>
            )}
            {venue.website && (
              <span className="flex items-center gap-1">
                <Globe size={12} />
                Website
              </span>
            )}
          </div>

          {venue.tags && venue.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {venue.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-white/5" style={{ color: 'var(--t3)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <ChevronRight size={18} style={{ color: 'var(--t3)' }} className="mt-1 flex-shrink-0" />
      </div>
    </button>
  );
}
