import React from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarWithFallback from './AvatarWithFallback';
import type { Contact, ContactCategory } from '../../types/contacts';
import { ROLE_LABELS } from '../../lib/industryRoles';
import type { IndustryRole } from '../../lib/industryRoles';

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

  const primaryAff = contact.primaryAffiliation;
  const isActive = !primaryAff?.endDate || new Date(primaryAff.endDate) >= new Date();
  const roleDisplay = (primaryAff && isActive)
    ? `${ROLE_LABELS[primaryAff.role as IndustryRole] ?? primaryAff.roleCustom ?? primaryAff.role} at ${primaryAff.orgName}`
    : contact.role;

  return (
    <div
      className="tm-card p-4 cursor-pointer transition-all duration-[120ms] hover:border-border-3"
      onClick={() => navigate(`/team/${contact.id}`)}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <AvatarWithFallback contact={contact} size="lg" />
        <div className="w-full min-w-0">
          <p className="text-t1 font-semibold text-sm truncate">
            {contact.firstName} {contact.lastName}
          </p>
          {roleDisplay && (
            <p className="text-t3 text-xs truncate mt-0.5">{roleDisplay}</p>
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
