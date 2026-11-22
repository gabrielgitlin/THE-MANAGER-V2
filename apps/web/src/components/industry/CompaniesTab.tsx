import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizationCard from './OrganizationCard';
import OrganizationRow from './OrganizationRow';
import OrganizationFormModal from './OrganizationFormModal';
import LoadingSpinner from '../LoadingSpinner';
import { getOrganizations, createOrganization, updateOrganization } from '../../lib/organizations';
import type { Organization, OrganizationFormData, OrganizationType } from '../../types/organizations';

type TypeFilter = OrganizationType | 'all';

const SUB_TAB_TYPES: TypeFilter[] = [
  'all', 'label', 'publisher', 'management', 'booking', 'venue', 'studio', 'other',
];

const SUB_TAB_LABELS: Record<TypeFilter, string> = {
  all: 'ALL',
  label: 'LABELS',
  publisher: 'PUBLISHERS',
  management: 'MANAGEMENT',
  booking: 'BOOKING',
  venue: 'VENUES',
  studio: 'STUDIOS',
  other: 'OTHER',
};

export default function CompaniesTab() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showForm, setShowForm] = useState(false);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setOrgs(await getOrganizations());
    } catch (err) {
      setError('Failed to load organizations.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(form: OrganizationFormData) {
    if (editOrg) {
      const updated = await updateOrganization(editOrg.id, form);
      setOrgs(prev => prev.map(o => o.id === updated.id ? updated : o));
    } else {
      const created = await createOrganization(form);
      setOrgs(prev => [...prev, created]);
    }
    setShowForm(false);
    setEditOrg(null);
  }

  const filtered = orgs.filter(o => {
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || o.type === typeFilter;
    return matchSearch && matchType;
  });

  const visibleSubTabs = SUB_TAB_TYPES.filter(t =>
    t === 'all' || orgs.some(o => o.type === t)
  );

  if (loading) return <LoadingSpinner fullScreen={false} />;

  return (
    <div className="space-y-[28px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1>Companies</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setEditOrg(null); setShowForm(true); }}
        >
          + Add Company
        </button>
      </div>

      {error && (
        <div
          className="p-4 border-l-4 text-sm"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--status-red)',
            color: 'var(--status-red)',
          }}
        >
          {error}
        </div>
      )}

      {/* Search + view toggle */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          className="flex-1"
          placeholder="Search organizations…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-1">
          <button
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            ⊞
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            ≡
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      {visibleSubTabs.length > 1 && (
        <div className="sub-tabs">
          {visibleSubTabs.map(t => (
            <button
              key={t}
              className={`sub-tab${typeFilter === t ? ' active' : ''}`}
              onClick={() => setTypeFilter(t)}
              style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
            >
              {SUB_TAB_LABELS[t]}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      {orgs.length > 0 && (
        <p className="text-t3 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
          {filtered.length} OF {orgs.length} COMPANIES
        </p>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="empty-state">
          <img src="/TM-File-negro.svg" className="pxi-xl icon-muted empty-state-icon" alt="" />
          <p className="empty-state-title">No companies found</p>
          <p className="empty-state-desc">
            {orgs.length === 0
              ? 'Add your first organization to get started.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      )}

      {/* Grid view */}
      {filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(o => (
            <OrganizationCard
              key={o.id}
              org={o}
              onClick={() => navigate(`/industry/companies/${o.id}`)}
              onEdit={org => { setEditOrg(org); setShowForm(true); }}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {filtered.length > 0 && viewMode === 'list' && (
        <div className="tm-card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>City</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <OrganizationRow
                    key={o.id}
                    org={o}
                    onClick={() => navigate(`/industry/companies/${o.id}`)}
                    onEdit={org => { setEditOrg(org); setShowForm(true); }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <OrganizationFormModal
          org={editOrg ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditOrg(null); }}
        />
      )}
    </div>
  );
}
