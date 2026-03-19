import React, { useState } from 'react';
import { DollarSign, Calendar, X } from 'lucide-react';
import Modal from '../Modal';
import { CrewMember, Show } from '../../types';
import { formatDate } from '../../lib/utils';

interface ShowFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (showId: number, fees: Record<number, number>) => void;
  show: Show;
  crew: CrewMember[];
}

export default function ShowFeeModal({ isOpen, onClose, onSave, show, crew }: ShowFeeModalProps) {
  // Filter out managers
  const eligibleCrew = crew.filter(member => 
    member.role !== 'tour_manager' && member.role !== 'production_manager'
  );
  
  // Initialize fees with current values or standard fees
  const [fees, setFees] = useState<Record<number, number>>(() => {
    const initialFees: Record<number, number> = {};
    
    eligibleCrew.forEach(member => {
      // Check if member has this show and a fee for it
      const showEntry = member.shows?.find(s => s.name === show.title);
      if (showEntry?.fee) {
        initialFees[member.id] = showEntry.fee;
      } else if (member.standardFee) {
        initialFees[member.id] = member.standardFee;
      } else {
        initialFees[member.id] = 0;
      }
    });
    
    return initialFees;
  });
  
  const [selectedCrew, setSelectedCrew] = useState<Record<number, boolean>>(() => {
    const initialSelection: Record<number, boolean> = {};
    
    eligibleCrew.forEach(member => {
      // Check if member is already assigned to this show
      const isAssigned = member.shows?.some(s => s.name === show.title);
      initialSelection[member.id] = !!isAssigned;
    });
    
    return initialSelection;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only include fees for selected crew members
    const selectedFees: Record<number, number> = {};
    Object.entries(selectedCrew).forEach(([memberId, isSelected]) => {
      if (isSelected) {
        selectedFees[Number(memberId)] = fees[Number(memberId)] || 0;
      }
    });
    
    onSave(show.id, selectedFees);
  };

  const calculateTotal = () => {
    return Object.entries(selectedCrew).reduce((total, [memberId, isSelected]) => {
      if (isSelected) {
        return total + (fees[Number(memberId)] || 0);
      }
      return total;
    }, 0);
  };

  const handleSelectAll = (selected: boolean) => {
    const newSelection = { ...selectedCrew };
    eligibleCrew.forEach(member => {
      newSelection[member.id] = selected;
    });
    setSelectedCrew(newSelection);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Set Fees for ${show.title}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-beige p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-charcoal">{show.title}</h3>
          </div>
          <p className="text-sm text-gray-600">
            {formatDate(show.date)}
          </p>
          <p className="text-sm text-gray-600">
            {show.venue}, {show.city}, {show.country}
          </p>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-700">Personnel Fees</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-xs text-primary hover:text-black"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-xs text-primary hover:text-black"
              >
                Deselect All
              </button>
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Standard Fee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Show Fee
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eligibleCrew.map((member) => (
                  <tr key={member.id} className={selectedCrew[member.id] ? 'bg-beige' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCrew[member.id] || false}
                        onChange={(e) => setSelectedCrew({
                          ...selectedCrew,
                          [member.id]: e.target.checked
                        })}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charcoal">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.standardFee ? `$${member.standardFee}` : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative rounded-md shadow-sm w-24">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          value={fees[member.id] || ''}
                          onChange={(e) => setFees({
                            ...fees,
                            [member.id]: e.target.value === '' ? 0 : Number(e.target.value)
                          })}
                          className="pl-7 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          placeholder="0.00"
                          min="0"
                          step="25"
                          disabled={!selectedCrew[member.id]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Fees:</span>
            <span className="text-lg font-bold text-black">${calculateTotal()}</span>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
          >
            Save Fees
          </button>
        </div>
      </form>
    </Modal>
  );
}