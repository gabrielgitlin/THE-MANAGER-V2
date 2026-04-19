// src/pages/ContactProfile.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProfileHero from '../components/contacts/ProfileHero';
import OverviewTab from '../components/contacts/OverviewTab';
import DocumentsTab from '../components/contacts/DocumentsTab';
import PaymentTab from '../components/contacts/PaymentTab';
import NotesTab from '../components/contacts/NotesTab';
import ContactFormModal from '../components/contacts/ContactFormModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getContact, deleteContact } from '../lib/contacts';
import type { Contact } from '../types/contacts';

type Tab = 'overview' | 'documents' | 'payment' | 'notes';

export default function ContactProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (id) load(id); }, [id]);

  async function load(contactId: string) {
    try {
      setIsLoading(true);
      setContact(await getContact(contactId));
    } catch {
      setError('Contact not found.');
    } finally {
      setIsLoading(false);
    }
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
          {(['overview', 'documents', 'payment', 'notes'] as Tab[]).map((tab) => (
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
        {activeTab === 'overview'   && <OverviewTab contact={contact} />}
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
    </div>
  );
}
