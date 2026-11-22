import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Music, Plane, Coffee, Mic, Ticket } from 'lucide-react';
import type { TourDay, DayType } from '../../types/tour';
import { formatTime } from '../../lib/utils';

const dayTypeConfig: Record<DayType, { label: string; color: string; icon: React.ElementType }> = {
  show: { label: 'Show', color: 'status-badge badge-green', icon: Music },
  travel: { label: 'Travel', color: 'status-badge badge-yellow', icon: Plane },
  off: { label: 'Day Off', color: 'status-badge badge-neutral', icon: Coffee },
  rehearsal: { label: 'Rehearsal', color: 'status-badge badge-brand', icon: Mic },
};

interface TourDayRowProps {
  day: TourDay;
  onEdit: (day: TourDay) => void;
  onDelete: (day: TourDay) => void;
  onTicket?: (day: TourDay) => void;
}

export default function TourDayRow({ day, onEdit, onDelete, onTicket }: TourDayRowProps) {
  const navigate = useNavigate();
  const config = dayTypeConfig[day.day_type];
  const Icon = config.icon;

  const handleClick = () => {
    if (day.day_type === 'show' && day.show_id) {
      navigate(`/live/show/${day.show_id}`);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 md:p-4 rounded-lg transition-colors ${day.day_type === 'show' ? 'cursor-pointer hover:bg-white/5' : ''}`}
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}
      onClick={handleClick}
    >
      {/* Date column */}
      <div className="text-center min-w-[50px]">
        <div className="text-xs font-medium uppercase" style={{ color: 'var(--t3)' }}>
          {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
        <div className="text-lg font-bold" style={{ color: 'var(--t1)' }}>
          {new Date(day.date + 'T00:00:00').getDate()}
        </div>
        <div className="text-xs" style={{ color: 'var(--t3)' }}>
          {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
        </div>
      </div>

      {/* Day type badge */}
      <div className={`${config.color} flex items-center gap-1`}>
        <Icon size={12} />
        {config.label}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {day.day_type === 'show' && day.show ? (
          <>
            <div className="font-medium truncate" style={{ color: 'var(--t1)' }}>{day.show.title}</div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--t3)' }}>
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {day.show.venue_name}, {day.show.venue_city}
              </span>
              {day.show.show_time && (
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {formatTime(day.show.show_time)}
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="font-medium truncate" style={{ color: 'var(--t1)' }}>
              {day.title || config.label}
            </div>
            {day.city && (
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--t3)' }}>
                <MapPin size={11} /> {day.city}{day.country ? `, ${day.country}` : ''}
              </div>
            )}
          </>
        )}
        {day.notes && (
          <div className="text-xs mt-1 truncate" style={{ color: 'var(--t3)' }}>{day.notes}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        {day.day_type === 'show' && onTicket && (
          <button onClick={() => onTicket(day)} className="p-1.5 rounded hover:bg-white/10" title="Generate Ticket">
            <Ticket size={14} style={{ color: 'var(--t3)' }} />
          </button>
        )}
        <button onClick={() => onEdit(day)} className="p-1.5 rounded hover:bg-white/10">
          <img src="/TM-Pluma-negro.png" className="pxi-sm icon-muted" alt="" />
        </button>
        <button onClick={() => onDelete(day)} className="p-1.5 rounded hover:bg-red-500/20">
          <img src="/TM-Trash-negro.svg" className="pxi-sm icon-danger" alt="" />
        </button>
      </div>
    </div>
  );
}
