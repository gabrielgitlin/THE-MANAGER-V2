// src/components/contacts/ContactFormModal.tsx
import React, { useState } from 'react';
import Modal from '../Modal';
import AvatarWithFallback from './AvatarWithFallback';
import { createContact, updateContact, uploadContactPhoto } from '../../lib/contacts';
import type {
  Contact, ContactCategory, ContactFormData, SeatingPreference, SocialLinks,
} from '../../types/contacts';

interface Props {
  contact?: Contact;
  onSaved: () => void;
  onClose: () => void;
}

const EMPTY: ContactFormData = {
  category: 'other',
  role: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  website: '',
  homeAirport: '',
  seatingPreference: undefined,
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  socialLinks: {},
  proAffiliations: [],
  publisherAffiliations: [],
  bio: '',
  notes: '',
  tags: [],
};

export default function ContactFormModal({ contact, onSaved, onClose }: Props) {
  const [form, setForm] = useState<ContactFormData>(
    contact
      ? {
          category: contact.category,
          role: contact.role ?? '',
          firstName: contact.firstName,
          lastName: contact.lastName,
          profilePhotoUrl: contact.profilePhotoUrl,
          email: contact.email ?? '',
          phone: contact.phone ?? '',
          website: contact.website ?? '',
          homeAirport: contact.homeAirport ?? '',
          seatingPreference: contact.seatingPreference,
          address: contact.address ?? '',
          city: contact.city ?? '',
          state: contact.state ?? '',
          country: contact.country ?? '',
          postalCode: contact.postalCode ?? '',
          socialLinks: contact.socialLinks ?? {},
          proAffiliations: contact.proAffiliations ?? [],
          publisherAffiliations: contact.publisherAffiliations ?? [],
          bio: contact.bio ?? '',
          notes: contact.notes ?? '',
          tags: contact.tags ?? [],
        }
      : { ...EMPTY }
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(contact?.profilePhotoUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  function set<K extends keyof ContactFormData>(key: K, val: ContactFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function setSocial(key: keyof SocialLinks, val: string) {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: val || undefined },
    }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag)) return;
    set('tags', [...form.tags, tag]);
    setTagInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const saved = contact
        ? await updateContact(contact.id, form)
        : await createContact(form);
      if (photoFile) {
        const photoUrl = await uploadContactPhoto(saved.id, photoFile);
        await updateContact(saved.id, { profilePhotoUrl: photoUrl });
      }
      onSaved();
    } catch (err) {
      console.error(err);
      setError('Failed to save contact. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={contact ? 'Edit Contact' : 'Add Contact'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-sm" style={{ color: 'var(--status-red)' }}>{error}</p>
        )}

        {/* Photo */}
        <div className="flex justify-center">
          <label className="cursor-pointer group relative">
            <div className="w-20 h-20 rounded-full overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} className="w-full h-full object-cover" alt="" />
              ) : (
                <AvatarWithFallback
                  contact={{
                    firstName: form.firstName || '?',
                    lastName: form.lastName || '?',
                    profilePhotoUrl: undefined,
                    socialLinks: form.socialLinks,
                  }}
                  size="xl"
                />
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-[120ms] flex items-center justify-center">
              <img src="/TM-Upload-negro.svg" className="pxi-md icon-white" alt="Upload" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>

        {/* Category & Role */}
        <div className="form-row-2">
          <div className="form-field">
            <label>Category *</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value as ContactCategory)}
              required
            >
              <option value="collaborator">Collaborator</option>
              <option value="crew">Crew</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-field">
            <label>Role / Title</label>
            <input
              type="text"
              value={form.role ?? ''}
              onChange={(e) => set('role', e.target.value)}
              placeholder="e.g. Songwriter, Tour Manager, Attorney"
            />
          </div>
        </div>

        {/* Name */}
        <div className="form-row-2">
          <div className="form-field">
            <label>First Name *</label>
            <input type="text" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Last Name *</label>
            <input type="text" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
          </div>
        </div>

        {/* Contact */}
        <div className="form-row-2">
          <div className="form-field">
            <label>Email</label>
            <input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Phone</label>
            <input type="tel" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
          </div>
        </div>

        <div className="form-field">
          <label>Website</label>
          <input type="url" value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
        </div>

        {/* Address */}
        <div>
          <p className="section-header mb-3">Address</p>
          <div className="space-y-3">
            <div className="form-field">
              <label>Street Address</label>
              <input type="text" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="form-row-3">
              <div className="form-field">
                <label>City</label>
                <input type="text" value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div className="form-field">
                <label>State / Region</label>
                <input type="text" value={form.state ?? ''} onChange={(e) => set('state', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Country</label>
                <input type="text" value={form.country ?? ''} onChange={(e) => set('country', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Travel (crew + collaborators only) */}
        {(form.category === 'crew' || form.category === 'collaborator') && (
          <div>
            <p className="section-header mb-3">Travel Preferences</p>
            <div className="form-row-2">
              <div className="form-field">
                <label>Home Airport</label>
                <input
                  type="text"
                  value={form.homeAirport ?? ''}
                  onChange={(e) => set('homeAirport', e.target.value)}
                  placeholder="e.g. LAX, JFK, LHR"
                />
              </div>
              <div className="form-field">
                <label>Seating Preference</label>
                <select
                  value={form.seatingPreference ?? ''}
                  onChange={(e) =>
                    set('seatingPreference', (e.target.value as SeatingPreference) || undefined)
                  }
                >
                  <option value="">No preference</option>
                  <option value="window">Window</option>
                  <option value="aisle">Aisle</option>
                  <option value="middle">Middle</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Social Media */}
        <div>
          <p className="section-header mb-3">Social Media</p>
          <div className="form-row-2">
            {([
              ['instagram', 'Instagram', 'handle (no @)'],
              ['twitter', 'Twitter / X', 'handle (no @)'],
              ['tiktok', 'TikTok', 'handle (no @)'],
              ['spotify', 'Spotify', 'artist ID or URL'],
              ['soundcloud', 'SoundCloud', 'username'],
              ['linkedin', 'LinkedIn', 'linkedin.com/in/...'],
            ] as Array<[keyof SocialLinks, string, string]>).map(([key, label, placeholder]) => (
              <div key={key} className="form-field">
                <label>{label}</label>
                <input
                  type="text"
                  value={form.socialLinks[key] ?? ''}
                  onChange={(e) => setSocial(key, e.target.value)}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
          <p className="text-t3 text-xs mt-2">
            Instagram or Twitter handle will be used as profile photo if no photo is uploaded.
          </p>
        </div>

        {/* Collaborator: PRO affiliations */}
        {form.category === 'collaborator' && (
          <div>
            <p className="section-header mb-3">PRO & Publishing</p>
            <div className="space-y-2 mb-3">
              <p className="text-t2 text-xs font-medium">PRO Affiliations</p>
              {form.proAffiliations.map((pro, i) => (
                <div key={`${i}-${pro.name}`} className="flex gap-2 items-center">
                  <input
                    className="flex-1"
                    type="text"
                    value={pro.name}
                    onChange={(e) => {
                      const updated = [...form.proAffiliations];
                      updated[i] = { ...updated[i], name: e.target.value };
                      set('proAffiliations', updated);
                    }}
                    placeholder="PRO name (ASCAP, BMI, SESAC...)"
                  />
                  <input
                    className="w-28"
                    type="text"
                    value={pro.ipiNumber ?? ''}
                    onChange={(e) => {
                      const updated = [...form.proAffiliations];
                      updated[i] = { ...updated[i], ipiNumber: e.target.value };
                      set('proAffiliations', updated);
                    }}
                    placeholder="IPI #"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() =>
                      set('proAffiliations', form.proAffiliations.filter((_, j) => j !== i))
                    }
                  >
                    <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="Remove" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  set('proAffiliations', [...form.proAffiliations, { name: '', isPrimary: false }])
                }
              >
                + Add PRO
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-t2 text-xs font-medium">Publisher Affiliations</p>
              {form.publisherAffiliations.map((pub, i) => (
                <div key={`${i}-${pub.name}`} className="flex gap-2 items-center">
                  <input
                    className="flex-1"
                    type="text"
                    value={pub.name}
                    onChange={(e) => {
                      const updated = [...form.publisherAffiliations];
                      updated[i] = { ...updated[i], name: e.target.value };
                      set('publisherAffiliations', updated);
                    }}
                    placeholder="Publisher name"
                  />
                  <input
                    className="w-28"
                    type="text"
                    value={pub.ipiNumber ?? ''}
                    onChange={(e) => {
                      const updated = [...form.publisherAffiliations];
                      updated[i] = { ...updated[i], ipiNumber: e.target.value };
                      set('publisherAffiliations', updated);
                    }}
                    placeholder="IPI #"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() =>
                      set('publisherAffiliations', form.publisherAffiliations.filter((_, j) => j !== i))
                    }
                  >
                    <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="Remove" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  set('publisherAffiliations', [...form.publisherAffiliations, { name: '', isPrimary: false }])
                }
              >
                + Add Publisher
              </button>
            </div>
          </div>
        )}

        {/* Bio */}
        <div className="form-field">
          <label>Bio</label>
          <textarea
            value={form.bio ?? ''}
            onChange={(e) => set('bio', e.target.value)}
            rows={3}
            placeholder="Brief bio or background..."
          />
        </div>

        {/* Tags */}
        <div className="form-field">
          <label>Tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Type a tag and press Enter"
              className="flex-1"
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>
              Add
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map((tag) => (
                <span key={tag} className="status-badge badge-neutral flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => set('tags', form.tags.filter((t) => t !== tag))}
                    className="ml-1 flex items-center"
                  >
                    <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="Remove" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button type="button" className="btn btn-ghost btn-md" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-md" disabled={isSaving}>
            {isSaving ? 'Saving...' : contact ? 'Save Changes' : 'Add Contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
