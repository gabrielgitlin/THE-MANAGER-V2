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

interface OrganizationRowProps {
  org: Organization;
  onClick?: () => void;
  onEdit?: (org: Organization) => void;
}

export default function OrganizationRow({ org, onClick, onEdit }: OrganizationRowProps) {
  return (
    <tr
      className="cursor-pointer hover:bg-[var(--surface-2)] transition-all duration-[120ms]"
      onClick={onClick}
    >
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2.5">
          <OrgLogo name={org.name} type={org.type} logoUrl={org.logoUrl} size="sm" />
          <span className="text-sm text-[var(--t1)] font-medium">{org.name}</span>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <span className={`status-badge ${ORG_TYPE_BADGE[org.type]}`}>
          {ORG_TYPE_LABELS[org.type]}
        </span>
      </td>
      <td className="py-2.5 px-3 text-sm text-[var(--t3)]">
        {org.city ?? '—'}{org.country ? `, ${org.country}` : ''}
      </td>
      <td className="py-2.5 px-3 text-sm text-[var(--t3)]">
        {org.email ?? '—'}
      </td>
      <td className="py-2.5 px-3" onClick={e => e.stopPropagation()}>
        {onEdit && (
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(org)}>Edit</button>
        )}
      </td>
    </tr>
  );
}
