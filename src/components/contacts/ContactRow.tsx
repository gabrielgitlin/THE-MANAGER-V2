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
  collaborator: 'Collaborator', crew: 'Crew', business: 'Business', other: 'Other',
};

export default function ContactRow({ contact }: { contact: Contact }) {
  const navigate = useNavigate();
  return (
    <tr
      className="cursor-pointer transition-all duration-[120ms] hover:bg-surface-2"
      onClick={() => navigate(`/team/${contact.id}`)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <AvatarWithFallback contact={contact} size="sm" />
          <div>
            <p className="text-t1 text-sm font-medium">
              {contact.firstName} {contact.lastName}
            </p>
            {contact.role && <p className="text-t3 text-xs">{contact.role}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`status-badge ${BADGE[contact.category]}`}>
          {LABEL[contact.category]}
        </span>
      </td>
      <td className="px-4 py-3 text-t2 text-sm">{contact.email ?? '—'}</td>
      <td className="px-4 py-3 text-t2 text-sm">{contact.phone ?? '—'}</td>
      <td className="px-4 py-3 text-t3 text-xs">{contact.city ?? '—'}</td>
    </tr>
  );
}
