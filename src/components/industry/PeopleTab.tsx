import React, { useState, useEffect } from 'react';
import ContactCard from '../contacts/ContactCard';
import ContactRow from '../contacts/ContactRow';
import ContactFilters from '../contacts/ContactFilters';
import ContactFormModal from '../contacts/ContactFormModal';
import LoadingSpinner from '../LoadingSpinner';
import { getContacts } from '../../lib/contacts';
import type { Contact, ContactCategory } from '../../types/contacts';

export default function PeopleTab() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ContactCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setIsLoading(true);
      setContacts(await getContacts());
    } catch (err) {
      setError('Failed to load contacts.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.role?.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q));
    return matchesSearch && (category === 'all' || c.category === category);
  });

  if (isLoading) return <LoadingSpinner fullScreen={false} />;

  return (
    <div className="space-y-[28px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1>Contacts</h1>
        <button
          className="btn btn-primary btn-md"
          onClick={() => { setEditingContact(null); setIsFormOpen(true); }}
        >
          + Add Contact
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

      <ContactFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Count */}
      {contacts.length > 0 && (
        <p className="text-t3 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
          {filtered.length} OF {contacts.length} CONTACTS
        </p>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="empty-state">
          <img src="/TM-File-negro.svg" className="pxi-xl icon-muted empty-state-icon" alt="" />
          <p className="empty-state-title">No contacts found</p>
          <p className="empty-state-desc">
            {contacts.length === 0
              ? 'Add your first contact to get started.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      )}

      {/* Grid view */}
      {filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((c) => <ContactCard key={c.id} contact={c} />)}
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
                  <th>Category</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => <ContactRow key={c.id} contact={c} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isFormOpen && (
        <ContactFormModal
          contact={editingContact ?? undefined}
          onSaved={() => { setIsFormOpen(false); load(); }}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
