// src/pages/ContactProfile.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProfileHero from '../components/contacts/ProfileHero';
import OverviewTab from '../components/contacts/OverviewTab';
import DocumentsTab from '../components/contacts/DocumentsTab';
import PaymentTab from '../components/contacts/PaymentTab';
import NotesTab from '../components/contacts/NotesTab';
import ContactFormModal from '../components/contacts/ContactFormModal';
import AffiliationCard from '../components/industry/AffiliationCard';
import AffiliationFormModal from '../components/industry/AffiliationFormModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getContact, deleteContact } from '../lib/contacts';
import {
  getAffiliationsForContact,
  createAffiliation,
  updateAffiliation,
  deleteAffiliation,
} from '../lib/affiliations';
import { getOrganization } from '../lib/organizations';
import type { Contact } from '../types/contacts';
import type { ContactAffiliation, AffiliationFormData } from '../types/affiliations';

type Tab = 'overview' | 'documents' | 'payment' | 'notes' | 'affiliations';

export default function ContactProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Affiliations state
  const [affiliations, setAffiliations] = useState<ContactAffiliation[]>([]);
  const [orgNames, setOrgNames] = useState<Record<string, string>>({});
  const [showAffForm, setShowAffForm] = useState(false);
  const [editAff, setEditAff] = useState<ContactAffiliation | null>(null);

  useEffect(() => { if (id) load(id); }, [id]);

  async function load(contactId: string) {
    try {
      setIsLoading(true);
      const [contactData, affs] = await Promise.all([
        getContact(contactId),
        getAffiliationsForContact(contactId),
      ]);
      setContact(contactData);
      setAffiliations(affs);
      // Fetch org names for all affiliations
      const orgIds = [...new Set(affs.map(a => a.organizationId))];
      const entries = await Promise.all(
        orgIds.map(async orgId => {
          const org = await getOrganization(orgId);
          return org ? [org.id, org.name] as [string, string] : null;
        })
      );
      const namesMap: Record<string, string> = {};
      for (const entry of entries) {
        if (entry) namesMap[entry[0]] = entry[1];
      }
      setOrgNames(namesMap);
    } catch {
      setError('Contact not found.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveAffiliation(form: AffiliationFormData) {
    if (editAff) {
      const updated = await updateAffiliation(editAff.id, form);
      setAffiliations(prev => prev.map(a => a.id === updated.id ? updated : a));
      // Refresh org name if org changed
      if (!orgNames[updated.organizationId]) {
        const org = await getOrganization(updated.organizationId);
        if (org) setOrgNames(prev => ({ ...prev, [org.id]: org.name }));
      }
    } else {
      const created = await createAffiliation(form);
      setAffiliations(prev => [...prev, created]);
      if (!orgNames[created.organizationId]) {
        const org = await getOrganization(created.organizationId);
        if (org) setOrgNames(prev => ({ ...prev, [org.id]: org.name }));
      }
    }
  }

  async function handleDeleteAffiliation(affId: string) {
    await deleteAffiliation(affId);
    setAffiliations(prev => prev.filter(a => a.id !== affId));
  }

  async function handleDelete() {
    if (!contact) return;
    if (!window.confirm(`Delete ${contact.firstName} ${contact.lastName}? This cannot be undone.`)) return;
    try {
      await deleteContact(contact.id);
      navigate('/industry');
    } catch {
      setError('Failed to delete contact. Please try again.');
    }
  }

  if (isLoading) return <LoadingSpinner fullScreen={false} />;

  if (error || !contact) {
    return (
      <div className="p-6">
        <button className="btn btn-ghost btn-sm flex items-center gap-1 mb-6" onClick={() => navigate('/industry')}>
          <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-muted" alt="" />
          <span className="text-t3 text-xs uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Contacts</span>
        </button>
        <p className="text-t3">{error ?? 'Contact not found.'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back navigation */}
      <div className="px-4 md:px-6 pt-5">
        <button
          className="btn btn-ghost btn-sm flex items-center gap-1"
          onClick={() => navigate('/industry')}
        >
          <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-muted" alt="" />
          <span className="text-t3 text-xs uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
            Contacts
          </span>
        </button>
      </div>

      {/* Hero */}
      <ProfileHero
        contact={contact}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
      />

      {/* Page-level tabs */}
      <div
        className="px-4 md:px-6"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="tm-tabs">
          {(['overview', 'affiliations', 'documents', 'payment', 'notes'] as Tab[]).map((tab) => (
            <button
              key={tab}
              className={`tm-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 md:p-6">
        {activeTab === 'overview'      && <OverviewTab contact={contact} />}
        {activeTab === 'affiliations'  && (
          <div>
            <div className="folder-label flex items-center justify-between mb-3">
              <span>Affiliations</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setEditAff(null); setShowAffForm(true); }}
              >
                + Add
              </button>
            </div>
            <div className="folder-body">
              {affiliations.length === 0 ? (
                <p className="text-sm py-2" style={{ color: 'var(--t3)' }}>No affiliations yet.</p>
              ) : (
                affiliations.map(aff => (
                  <AffiliationCard
                    key={aff.id}
                    affiliation={aff}
                    orgName={orgNames[aff.organizationId]}
                    onEdit={() => { setEditAff(aff); setShowAffForm(true); }}
                    onDelete={() => handleDeleteAffiliation(aff.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}
        {activeTab === 'documents'  && <DocumentsTab contactId={contact.id} />}
        {activeTab === 'payment'    && <PaymentTab contactId={contact.id} />}
        {activeTab === 'notes'      && (
          <NotesTab
            contact={contact}
            onUpdate={(notes) => setContact({ ...contact, notes })}
          />
        )}
      </div>

      {isEditing && (
        <ContactFormModal
          contact={contact}
          onSaved={() => { setIsEditing(false); if (id) load(id); }}
          onClose={() => setIsEditing(false)}
        />
      )}

      {showAffForm && (
        <AffiliationFormModal
          isOpen={showAffForm}
          onClose={() => { setShowAffForm(false); setEditAff(null); }}
          onSave={handleSaveAffiliation}
          contactId={contact.id}
          existing={editAff ? {
            ...editAff,
            id: editAff.id,
          } : undefined}
        />
      )}
    </div>
  );
}
