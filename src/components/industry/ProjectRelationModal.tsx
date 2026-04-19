import React, { useState } from 'react';
import Modal from '../Modal';
import { INDUSTRY_ROLES, ROLE_LABELS } from '../../lib/industryRoles';
import type { ProjectRelationFormData } from '../../types/projectRelations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProjectRelationFormData) => Promise<void>;
  projectId: string;
}

export default function ProjectRelationModal({ isOpen, onClose, onSave, projectId }: Props) {
  const [targetType, setTargetType] = useState<'contact' | 'org'>('contact');
  const [targetId, setTargetId] = useState('');
  const [role, setRole] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setTargetType('contact');
    setTargetId('');
    setRole('');
    setIsPrimary(false);
    setNotes('');
    setError(null);
    setSaving(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !targetId.trim()) {
      setError('Role and target are required');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onSave({
        projectId,
        contactId: targetType === 'contact' ? targetId.trim() : undefined,
        organizationId: targetType === 'org' ? targetId.trim() : undefined,
        role,
        isPrimary,
        notes: notes.trim() || undefined,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add to Network" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            className="text-sm px-3 py-2"
            style={{
              color: 'var(--status-red)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            {error}
          </div>
        )}

        {/* Target type toggle */}
        <div className="flex gap-4">
          <label
            className="flex items-center gap-2 cursor-pointer"
            style={{ color: 'var(--t2)', fontSize: 13 }}
          >
            <input
              type="radio"
              name="targetType"
              checked={targetType === 'contact'}
              onChange={() => { setTargetType('contact'); setTargetId(''); }}
              disabled={saving}
            />
            Person (contact)
          </label>
          <label
            className="flex items-center gap-2 cursor-pointer"
            style={{ color: 'var(--t2)', fontSize: 13 }}
          >
            <input
              type="radio"
              name="targetType"
              checked={targetType === 'org'}
              onChange={() => { setTargetType('org'); setTargetId(''); }}
              disabled={saving}
            />
            Organization
          </label>
        </div>

        {/* Target ID */}
        <div className="form-field">
          <label>{targetType === 'contact' ? 'Contact ID' : 'Organization ID'}</label>
          <input
            type="text"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Paste UUID..."
            disabled={saving}
          />
        </div>

        {/* Role */}
        <div className="form-field">
          <label>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={saving}
          >
            <option value="">Select a role...</option>
            {INDUSTRY_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        {/* Primary toggle */}
        <label
          className="flex items-center gap-2 cursor-pointer"
          style={{ color: 'var(--t2)', fontSize: 13 }}
        >
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            disabled={saving}
          />
          Mark as primary contact for this role
        </label>

        {/* Notes */}
        <div className="form-field">
          <label>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional context..."
            rows={3}
            disabled={saving}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-md"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
