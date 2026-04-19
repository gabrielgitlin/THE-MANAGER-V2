import React, { useState } from 'react';
import Modal from '../Modal';
import { INDUSTRY_ROLES, ROLE_LABELS } from '../../lib/industryRoles';
import { findOrganizationByName, createOrganization } from '../../lib/organizations';
import type { AffiliationFormData } from '../../types/affiliations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AffiliationFormData) => Promise<void>;
  contactId: string;
  existing?: AffiliationFormData & { id?: string };
}

export default function AffiliationFormModal({ isOpen, onClose, onSave, contactId, existing }: Props) {
  const [orgSearch, setOrgSearch] = useState(existing?.organizationId ? '' : '');
  const [orgId, setOrgId] = useState<string>(existing?.organizationId ?? '');
  const [role, setRole] = useState<string>(existing?.role ?? '');
  const [roleCustom, setRoleCustom] = useState(existing?.roleCustom ?? '');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [startDate, setStartDate] = useState(existing?.startDate ?? '');
  const [endDate, setEndDate] = useState(existing?.endDate ?? '');
  const [isPrimary, setIsPrimary] = useState(existing?.isPrimary ?? false);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingOrg, setCreatingOrg] = useState(false);

  async function resolveOrg(): Promise<string> {
    if (orgId) return orgId;
    const name = orgSearch.trim();
    if (!name) throw new Error('Organization is required');
    const found = await findOrganizationByName(name);
    if (found) return found.id;
    setCreatingOrg(true);
    const created = await createOrganization({
      name,
      type: 'other',
      tags: [],
      socialLinks: {},
      visibility: 'workspace',
    });
    setCreatingOrg(false);
    return created.id;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) { setError('Role is required'); return; }
    try {
      setSaving(true);
      setError(null);
      const resolvedOrgId = await resolveOrg();
      await onSave({
        contactId,
        organizationId: resolvedOrgId,
        role,
        roleCustom: role === 'other' ? roleCustom || undefined : undefined,
        title: title || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isPrimary,
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existing?.id ? 'Edit Affiliation' : 'Add Affiliation'} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-sm" style={{ color: 'var(--status-red)' }}>{error}</div>}

        <div className="form-field">
          <label>Organization</label>
          <input
            type="text"
            placeholder="Search or type org name (will create if not found)"
            value={orgSearch}
            onChange={e => { setOrgSearch(e.target.value); setOrgId(''); }}
            disabled={saving}
          />
        </div>

        <div className="form-field">
          <label>Role</label>
          <select value={role} onChange={e => setRole(e.target.value)} disabled={saving}>
            <option value="">Select role...</option>
            {INDUSTRY_ROLES.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>

        {role === 'other' && (
          <div className="form-field">
            <label>Custom Role</label>
            <input type="text" value={roleCustom} onChange={e => setRoleCustom(e.target.value)} disabled={saving} />
          </div>
        )}

        <div className="form-field">
          <label>Title (optional)</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. SVP, A&R" disabled={saving} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-field">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={saving} />
          </div>
          <div className="form-field">
            <label>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={saving} />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--t2)', fontSize: 13 }}>
          <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} disabled={saving} />
          Mark as primary affiliation
        </label>

        <div className="form-field">
          <label>Notes</label>
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} disabled={saving} className="resize-none" />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn btn-secondary btn-md" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-md" disabled={saving || creatingOrg}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
