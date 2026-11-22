import React from 'react';
import type { Organization, OrganizationType } from '../../types/organizations';
import { ORG_TYPE_LABELS } from '../../types/organizations';
import OrgLogo from './OrgLogo';

const ORG_TYPE_BADGE: Record<OrganizationType, string> = {
  label: 'badge-green', publisher: 'badge-green',
  management: 'badge-brand', booking: 'badge-brand',
  distributor: 'badge-blue', pr: 'badge-blue', marketing: 'badge-blue',
  law: 'badge-neutral', accounting: 'badge-neutral',
  studio: 'badge-yellow', venue: 'badge-yellow',
  festival: 'badge-orange', promoter: 'badge-orange',
  sync: 'badge-blue', pro: 'badge-neutral', mech_rights: 'badge-neutral',
  merch: 'badge-yellow', brand: 'badge-yellow', other: 'badge-neutral',
};

interface OrganizationCardProps {
  org: Organization;
  onClick?: () => void;
  onEdit?: (org: Organization) => void;
}

export default function OrganizationCard({ org, onClick, onEdit }: OrganizationCardProps) {
  return (
    <div
      className="tm-card p-4 flex flex-col gap-3 cursor-pointer hover:border-[var(--border-2)] transition-all duration-[120ms]"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <OrgLogo name={org.name} type={org.type} logoUrl={org.logoUrl} size="md" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--t1)] truncate">{org.name}</div>
            {org.city && (
              <div className="text-xs text-[var(--t3)] truncate">
                {org.city}{org.country ? `, ${org.country}` : ''}
              </div>
            )}
          </div>
        </div>
        <span className={`status-badge ${ORG_TYPE_BADGE[org.type]} shrink-0`}>
          {ORG_TYPE_LABELS[org.type]}
        </span>
      </div>

      {org.bio && (
        <p className="text-xs text-[var(--t3)] line-clamp-2 leading-relaxed">{org.bio}</p>
      )}

      {org.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {org.tags.slice(0, 3).map(tag => (
            <span key={tag} className="status-badge badge-neutral text-xs">{tag}</span>
          ))}
          {org.tags.length > 3 && (
            <span className="text-xs text-[var(--t4)]">+{org.tags.length - 3}</span>
          )}
        </div>
      )}

      {onEdit && (
        <button
          className="btn btn-ghost btn-sm self-start mt-1"
          onClick={e => { e.stopPropagation(); onEdit(org); }}
        >
          Edit
        </button>
      )}
    </div>
  );
}
