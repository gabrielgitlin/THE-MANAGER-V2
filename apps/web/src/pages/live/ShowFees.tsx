import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, DollarSign, Calendar, MapPin, Plus, Download } from 'lucide-react';
import FeeSummaryTable from '../../components/FeeSummaryTable';
import ShowFeeModal from '../../components/personnel/ShowFeeModal';
import { formatDate } from '../../lib/utils';
import { CrewMember, Show } from '../../types';
import { CREW_MEMBERS } from '../../data/logistics';

const MOCK_SHOWS: Show[] = [];

export default function ShowFees() {
  const navigate = useNavigate();
  const [crew, setCrew] = useState<CrewMember[]>(CREW_MEMBERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);

  const filteredShows = MOCK_SHOWS.filter(show => 
    show.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    show.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    show.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveFees = (showId: number, fees: Record<number, number>) => {
    // Update crew members with new fees
    const updatedCrew = crew.map(member => {
      // Skip if this member isn't in the fees object
      if (fees[member.id] === undefined) return member;
      
      const show = MOCK_SHOWS.find(s => s.id === showId);
      if (!show) return member;
      
      // Check if member already has this show
      const existingShowIndex = member.shows?.findIndex(s => s.name === show.title);
      
      if (existingShowIndex !== undefined && existingShowIndex >= 0) {
        // Update existing show
        const updatedShows = [...(member.shows || [])];
        updatedShows[existingShowIndex] = {
          ...updatedShows[existingShowIndex],
          fee: fees[member.id]
        };
        
        return {
          ...member,
          shows: updatedShows
        };
      } else {
        // Add new show
        return {
          ...member,
          shows: [
            ...(member.shows || []),
            {
              name: show.title,
              date: show.date,
              status: 'Confirmed',
              fee: fees[member.id]
            }
          ]
        };
      }
    });
    
    setCrew(updatedCrew);
    setIsModalOpen(false);
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

      <div className="shadow-md rounded-lg p-6 mb-8" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <img src="/TM-Search-negro.svg" className="pxi-lg icon-muted absolute left-3 top-1/2 -translate-y-1/2" alt="" />
              <input
                type="text"
                placeholder="Search shows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full rounded-md shadow-sm focus:ring-primary sm:text-sm"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedShowId || ''}
              onChange={(e) => setSelectedShowId(e.target.value ? Number(e.target.value) : null)}
              className="block rounded-md shadow-sm focus:ring-primary sm:text-sm"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
            >
              <option value="">All Shows</option>
              {MOCK_SHOWS.map(show => (
                <option key={show.id} value={show.id}>
                  {show.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredShows.map(show => (
          <div key={show.id} className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-lg font-medium uppercase" style={{ color: 'var(--t1)' }}>{show.title}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: 'var(--t3)' }}>
                <Calendar className="w-4 h-4" />
                <span>{formatDate(show.date)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: 'var(--t3)' }}>
                <MapPin className="w-4 h-4" />
                <span>{show.venue}, {show.city}</span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" style={{ color: 'var(--brand-1)' }} />
                  <h3 className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Personnel Fees</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedShow(show);
                    setIsModalOpen(true);
                  }}
                  className="text-xs hover:opacity-80"
                  style={{ color: 'var(--brand-1)' }}
                >
                  Manage Fees
                </button>
              </div>
              
              {/* Show fee summary for this show */}
              <div className="space-y-2">
                {crew
                  .filter(member => 
                    member.role !== 'tour_manager' && 
                    member.role !== 'production_manager' &&
                    member.shows?.some(s => s.name === show.title && s.fee)
                  )
                  .map(member => (
                    <div key={member.id} className="flex justify-between items-center p-2 rounded" style={{ backgroundColor: 'var(--surface-2)' }}>
                      <span className="text-sm" style={{ color: 'var(--t2)' }}>{member.name}</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--t1)' }}>
                        ${member.shows?.find(s => s.name === show.title)?.fee || 0}
                      </span>
                    </div>
                  ))}
                
                {crew.filter(member => 
                  member.role !== 'tour_manager' && 
                  member.role !== 'production_manager' &&
                  member.shows?.some(s => s.name === show.title && s.fee)
                ).length === 0 && (
                  <div className="text-center py-2 text-sm" style={{ color: 'var(--t3)' }}>
                    No fees set for this show
                  </div>
                )}
              </div>

              {/* Total fees for this show */}
              <div className="mt-4 pt-4 flex justify-between items-center" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Total:</span>
                <span className="text-sm font-bold" style={{ color: 'var(--t1)' }}>
                  ${crew.reduce((total, member) => {
                    const showFee = member.shows?.find(s => s.name === show.title)?.fee || 0;
                    return total + showFee;
                  }, 0)}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {/* Add New Show Card */}
        <div className="rounded-lg shadow-md overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--surface)', border: '2px dashed var(--border-2)' }}>
          <button
            onClick={() => navigate('/live')}
            className="p-6 text-center"
          >
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--surface-2)' }}>
              <Plus className="w-6 h-6" style={{ color: 'var(--brand-1)' }} />
            </div>
            <h3 className="text-sm font-medium" style={{ color: 'var(--t1)' }}>Add New Show</h3>
            <p className="mt-1 text-xs" style={{ color: 'var(--t3)' }}>
              Create a new show to manage fees
            </p>
          </button>
        </div>
      </div>

      {/* Fee Summary Table */}
      <FeeSummaryTable crew={crew} showId={selectedShowId || undefined} />

      {/* Show Fee Modal */}
      {selectedShow && (
        <ShowFeeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveFees}
          show={selectedShow}
          crew={crew}
        />
      )}
    </div>
  );
}