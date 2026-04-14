import React from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarWithFallback from './AvatarWithFallback';
import type { Contact, ContactCategory } from '../../types/contacts';

const BADGE: Record<ContactCategory, string> = {
  collaborator: 'badge-green',
  crew: 'badge-blue',
  business: 'badge-neutral',
  other: 'badge-neutral',
};
const LABEL: Record<ContactCategory, string> = {
  collaborator: 'Collaborator',
  crew: 'Crew',
  business: 'Business',
  other: 'Other',
};

export default function ContactCard({ contact }: { contact: Contact }) {
  const navigate = useNavigate();
  return (
    <div
      className="tm-card p-4 cursor-pointer transition-all duration-[120ms] hover:border-border-3"
      style={{ borderColor: 'var(--border-2)' }}
      onClick={() => navigate(`/team/${contact.id}`)}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <AvatarWithFallback contact={contact} size="lg" />
        <div className="w-full min-w-0">
          <p className="text-t1 font-semibold text-sm truncate">
            {contact.firstName} {contact.lastName}
          </p>
          {contact.role && (
            <p className="text-t3 text-xs truncate mt-0.5">{contact.role}</p>
          )}
        </div>
        <span className={`status-badge ${BADGE[contact.category]}`}>
          {LABEL[contact.category]}
        </span>
        {contact.email && (
          <p className="text-t3 text-xs truncate w-full">{contact.email}</p>
        )}
      </div>
    </div>
  );
}
