import React from 'react';
import type { ContactAffiliation } from '../../types/affiliations';
import { displayRole } from '../../lib/industryRoles';

interface AffiliationCardProps {
  affiliation: ContactAffiliation;
  orgName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function AffiliationCard({ affiliation, orgName, onEdit, onDelete }: AffiliationCardProps) {
  const dateRange = [affiliation.startDate, affiliation.endDate]
    .filter(Boolean)
    .join(' – ') || 'Ongoing';

  return (
    <div className="flex items-start justify-between gap-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium" style={{ color: 'var(--t1)' }}>
            {displayRole(affiliation.role, affiliation.roleCustom)}
          </span>
          {orgName && (
            <span className="text-sm" style={{ color: 'var(--t3)' }}>at {orgName}</span>
          )}
          {affiliation.isPrimary && (
            <span className="status-badge badge-brand">Primary</span>
          )}
        </div>
        {affiliation.title && (
          <div className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>{affiliation.title}</div>
        )}
        <div className="text-xs mt-0.5" style={{ color: 'var(--t4)' }}>{dateRange}</div>
      </div>
      <div className="flex gap-1 shrink-0">
        {onEdit && (
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit</button>
        )}
        {onDelete && (
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--status-red)' }} onClick={onDelete}>×</button>
        )}
      </div>
    </div>
  );
}
