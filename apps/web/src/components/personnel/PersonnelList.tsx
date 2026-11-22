import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Flag, Import as Passport, Plane, MapPin, CreditCard, Plus } from 'lucide-react';
import type { PersonnelProfile } from '../../types/personnel';
import { formatDate } from '../../lib/utils';

interface PersonnelListProps {
  personnel: PersonnelProfile[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PersonnelList({ personnel, onEdit, onDelete }: PersonnelListProps) {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--surface)' }} className="shadow-md overflow-hidden">
      <div style={{ borderColor: 'var(--border)' }} className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>Personnel</h2>
          <button
            onClick={() => navigate('/personnel/new')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Add Personnel
          </button>
        </div>
      </div>

      <div style={{ borderColor: 'var(--border)' }} className="divide-y">
        {personnel.map((person) => (
          <div key={person.id} className="p-6 hover:opacity-80" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium" style={{ color: 'var(--t1)' }}>
                    {person.firstName} {person.lastName}
                  </h3>
                  <p className="text-sm capitalize" style={{ color: 'var(--t2)' }}>{person.type.replace('_', ' ')}</p>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {person.email && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--t2)' }}>
                        <Mail className="w-3 h-3" />
                        {person.email}
                      </div>
                    )}
                    {person.phone && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--t2)' }}>
                        <img src="/TM-Phone-negro.svg" className="pxi-sm icon-muted" alt="" />
                        {person.phone}
                      </div>
                    )}
                    {person.dateOfBirth && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--t2)' }}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(person.dateOfBirth)}
                      </div>
                    )}
                    {person.city && person.country && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--t2)' }}>
                        <MapPin className="w-3 h-3" />
                        {person.city}, {person.country}
                      </div>
                    )}
                    {person.website && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--t2)' }}>
                        <Globe className="w-3 h-3" />
                        <a 
                          href={person.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(person.id)}
                  className="p-1 hover:opacity-80" style={{ color: 'var(--t3)' }}
                >
                  <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="" />
                </button>
                <button
                  onClick={() => onDelete(person.id)}
                  className="p-1 hover:text-red-500" style={{ color: 'var(--t3)' }}
                >
                  <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {personnel.length === 0 && (
          <div className="p-8 text-center">
            <User className="mx-auto h-12 w-12" style={{ color: 'var(--t3)' }} />
            <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--t1)' }}>No personnel</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--t2)' }}>
              Get started by adding a new team member.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/personnel/new')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add Personnel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}