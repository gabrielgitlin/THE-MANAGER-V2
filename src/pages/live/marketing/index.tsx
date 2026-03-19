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
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Live Events
        </button>
        <h1 className="text-2xl font-bold text-gray-900 font-title">Marketing Advances</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track marketing tasks and promotional activities for upcoming shows
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {shows.map((show) => (
          <div key={show.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{show.title}</h3>
                <p className="text-sm text-gray-500">
                  {formatDate(show.date)}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                show.status === 'confirmed'
                  ? 'bg-green-100 text-green-800'
                  : show.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-beige text-black'
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