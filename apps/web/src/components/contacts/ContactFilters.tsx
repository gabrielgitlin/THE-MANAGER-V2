import React from 'react';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (v: 'grid' | 'list') => void;
  onAdd: () => void;
}

export default function ContactFilters({
  search, onSearchChange,
  viewMode, onViewModeChange,
  onAdd,
}: Props) {
  return (
    <div className="flex gap-2 items-center">
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
          className="w-full pl-9 pr-4"
        />
      </div>

      {/* Add contact */}
      <button
        className="btn btn-primary btn-icon btn-md flex-shrink-0"
        onClick={onAdd}
        title="Add contact"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
      </button>

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
