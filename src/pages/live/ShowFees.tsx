import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, DollarSign, Calendar, MapPin, Plus, Download, Search } from 'lucide-react';
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
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Live Events
        </button>
        <h1 className="text-2xl font-bold text-charcoal font-title">Show Fees</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage personnel fees for each show
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search shows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedShowId || ''}
              onChange={(e) => setSelectedShowId(e.target.value ? Number(e.target.value) : null)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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
          <div key={show.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-charcoal uppercase">{show.title}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(show.date)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>{show.venue}, {show.city}</span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-medium text-gray-700">Personnel Fees</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedShow(show);
                    setIsModalOpen(true);
                  }}
                  className="text-xs text-primary hover:text-black"
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
                    <div key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{member.name}</span>
                      <span className="text-sm font-medium text-black">
                        ${member.shows?.find(s => s.name === show.title)?.fee || 0}
                      </span>
                    </div>
                  ))}
                
                {crew.filter(member => 
                  member.role !== 'tour_manager' && 
                  member.role !== 'production_manager' &&
                  member.shows?.some(s => s.name === show.title && s.fee)
                ).length === 0 && (
                  <div className="text-center py-2 text-sm text-gray-500">
                    No fees set for this show
                  </div>
                )}
              </div>
              
              {/* Total fees for this show */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="text-sm font-bold text-black">
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">
          <button
            onClick={() => navigate('/live')}
            className="p-6 text-center"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-beige flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-charcoal">Add New Show</h3>
            <p className="mt-1 text-xs text-gray-500">
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