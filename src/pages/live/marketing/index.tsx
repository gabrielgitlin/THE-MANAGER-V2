import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import MarketingChecklist from './MarketingChecklist';
import { formatDate } from '../../../lib/utils';
import type { Show, MarketingTask } from '../../../types';


export default function Marketing() {
  const navigate = useNavigate();
  const [shows] = useState<Show[]>([]);
  const [marketingTasks, setMarketingTasks] = useState<Record<number, MarketingTask[]>>({});

  const handleUpdateTasks = (showId: number, tasks: MarketingTask[]) => {
    setMarketingTasks(prev => ({
      ...prev,
      [showId]: tasks,
    }));
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/live')}
          className="flex items-center gap-2 text-sm mb-4 hover:opacity-80"
          style={{ color: 'var(--t3)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Live Events
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {shows.map((show) => (
          <div key={show.id} className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', border: '1px solid' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>{show.title}</h3>
                <p className="text-sm" style={{ color: 'var(--t3)' }}>
                  {formatDate(show.date)}
                </p>
              </div>
              <span className={`status-badge ${
                show.status === 'confirmed'
                  ? 'badge-green'
                  : show.status === 'cancelled'
                  ? 'badge-neutral'
                  : 'badge-yellow'
              }`}>
                {show.status.charAt(0).toUpperCase() + show.status.slice(1)}
              </span>
            </div>
            
            <MarketingChecklist
              show={show}
              onUpdate={(tasks) => handleUpdateTasks(show.id, tasks)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}