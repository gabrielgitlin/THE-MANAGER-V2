import React, { useState } from 'react';
import Modal from '../Modal';
import type { Organization, OrganizationFormData, OrganizationType } from '../../types/organizations';
import { ORG_TYPES, ORG_TYPE_LABELS } from '../../types/organizations';

interface Props {
  org?: Organization;
  onSave: (data: OrganizationFormData) => void;
  onClose: () => void;
}

const EMPTY: OrganizationFormData = {
  name: '',
  type: 'other',
  parentOrgId: undefined,
  website: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  logoUrl: undefined,
  bio: '',
  notes: '',
  tags: [],
  socialLinks: {},
  visibility: 'workspace',
};

export default function OrganizationFormModal({ org, onSave, onClose }: Props) {
  const [form, setForm] = useState<OrganizationFormData>(
    org
      ? {
          name: org.name,
          type: org.type,
          parentOrgId: org.parentOrgId,
          website: org.website ?? '',
          email: org.email ?? '',
          phone: org.phone ?? '',
          address: org.address ?? '',
          city: org.city ?? '',
          state: org.state ?? '',
          country: org.country ?? '',
          postalCode: org.postalCode ?? '',
          logoUrl: org.logoUrl,
          bio: org.bio ?? '',
          notes: org.notes ?? '',
          tags: org.tags ?? [],
          socialLinks: org.socialLinks ?? {},
          visibility: org.visibility,
        }
      : { ...EMPTY }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  function set<K extends keyof OrganizationFormData>(key: K, val: OrganizationFormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag)) return;
    set('tags', [...form.tags, tag]);
    setTagInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Organization name is required.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      onSave(form);
    } catch (err) {
      console.error(err);
      setError('Failed to save organization. Please try again.');
      setIsSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={org ? 'Edit Organization' : 'Add Organization'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-sm" style={{ color: 'var(--status-red)' }}>{error}</p>
        )}

        {/* Name & Type */}
        <div className="form-row-2">
          <div className="form-field">
            <label>Organization Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Sony Music, WME, Kobalt"
              required
            />
          </div>
          <div className="form-field">
            <label>Type *</label>
            <select
              value={form.type}
              onChange={e => set('type', e.target.value as OrganizationType)}
              required
            >
              {ORG_TYPES.map(t => (
                <option key={t} value={t}>{ORG_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Website & Email */}
        <div className="form-row-2">
          <div className="form-field">
            <label>Website</label>
            <input
              type="url"
              value={form.website ?? ''}
              onChange={e => set('website', e.target.value)}
              placeholder="https://"
            />
          </div>
          <div className="form-field">
            <label>Email</label>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={e => set('email', e.target.value)}
              placeholder="contact@example.com"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="form-field">
          <label>Phone</label>
          <input
            type="tel"
            value={form.phone ?? ''}
            onChange={e => set('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        {/* Address */}
        <div>
          <p className="section-header mb-3">Address</p>
          <div className="space-y-3">
            <div className="form-field">
              <label>Street Address</label>
              <input
                type="text"
                value={form.address ?? ''}
                onChange={e => set('address', e.target.value)}
              />
            </div>
            <div className="form-row-2">
              <div className="form-field">
                <label>City</label>
                <input
                  type="text"
                  value={form.city ?? ''}
                  onChange={e => set('city', e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Country</label>
                <input
                  type="text"
                  value={form.country ?? ''}
                  onChange={e => set('country', e.target.value)}
                />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-field">
                <label>State / Region</label>
                <input
                  type="text"
                  value={form.state ?? ''}
                  onChange={e => set('state', e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Postal Code</label>
                <input
                  type="text"
                  value={form.postalCode ?? ''}
                  onChange={e => set('postalCode', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="form-field">
          <label>Bio / Description</label>
          <textarea
            value={form.bio ?? ''}
            onChange={e => set('bio', e.target.value)}
            rows={3}
            placeholder="Brief description of the organization..."
          />
        </div>

        {/* Notes */}
        <div className="form-field">
          <label>Notes</label>
          <textarea
            value={form.notes ?? ''}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            placeholder="Internal notes..."
          />
        </div>

        {/* Tags */}
        <div className="form-field">
          <label>Tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Type a tag and press Enter"
              className="flex-1"
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>
              Add
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map(tag => (
                <span key={tag} className="status-badge badge-neutral flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => set('tags', form.tags.filter(t => t !== tag))}
                    className="ml-1 text-[var(--t3)] hover:text-[var(--t1)]"
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Visibility */}
        <div className="form-field">
          <label>Visibility</label>
          <select
            value={form.visibility}
            onChange={e => set('visibility', e.target.value as 'workspace' | 'private')}
          >
            <option value="workspace">Workspace — visible to all members</option>
            <option value="private">Private — only visible to you</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button type="button" className="btn btn-secondary btn-md" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-md" disabled={isSaving}>
            {isSaving ? 'Saving...' : org ? 'Save Changes' : 'Add Organization'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
