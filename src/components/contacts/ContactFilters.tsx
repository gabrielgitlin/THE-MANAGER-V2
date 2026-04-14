import React from 'react';
import type { ContactCategory } from '../../types/contacts';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  category: ContactCategory | 'all';
  onCategoryChange: (v: ContactCategory | 'all') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (v: 'grid' | 'list') => void;
}

const CATEGORIES: Array<{ value: ContactCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'collaborator', label: 'Collaborators' },
  { value: 'crew', label: 'Crew' },
  { value: 'business', label: 'Business' },
  { value: 'other', label: 'Other' },
];

export default function ContactFilters({
  search, onSearchChange,
  category, onCategoryChange,
  viewMode, onViewModeChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <img
          src="/TM-Search-negro.svg"
          className="pxi-md icon-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          alt=""
        />
        <input
          type="text"
          placeholder="Search by name, email, role, or tag..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm"
        />
      </div>

      {/* Category sub-tabs */}
      <div className="sub-tabs flex-shrink-0">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={`sub-tab ${category === c.value ? 'active' : ''}`}
            onClick={() => onCategoryChange(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid / List toggle */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          className={`btn btn-sm btn-icon ${viewMode === 'grid' ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => onViewModeChange('grid')}
          title="Grid view"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="0" y="0" width="6" height="6" /><rect x="8" y="0" width="6" height="6" />
            <rect x="0" y="8" width="6" height="6" /><rect x="8" y="8" width="6" height="6" />
          </svg>
        </button>
        <button
          className={`btn btn-sm btn-icon ${viewMode === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => onViewModeChange('list')}
          title="List view"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="0" y="1" width="14" height="2" /><rect x="0" y="6" width="14" height="2" />
            <rect x="0" y="11" width="14" height="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
