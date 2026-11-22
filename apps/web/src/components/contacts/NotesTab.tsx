// src/components/contacts/NotesTab.tsx
import React, { useState } from 'react';
import { updateContact } from '../../lib/contacts';
import type { Contact } from '../../types/contacts';

interface Props {
  contact: Contact;
  onUpdate: (notes: string) => void;
}

export default function NotesTab({ contact, onUpdate }: Props) {
  const [notes, setNotes] = useState(contact.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = notes !== (contact.notes ?? '');

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await updateContact(contact.id, { notes });
      onUpdate(notes);
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch { setError('Failed to save notes.'); }
    finally { setIsSaving(false); }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {error && <p className="text-sm" style={{ color: 'var(--status-red)' }}>{error}</p>}
      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        placeholder="Add notes about this contact — previous quotes, context, relationship history..."
        rows={14}
        className="w-full text-sm leading-relaxed"
        style={{
          backgroundColor: 'var(--surface-2)',
          color: 'var(--t1)',
          border: '1px solid var(--border-2)',
          padding: '14px',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />
      <div className="flex items-center justify-between">
        <p className="text-t3 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
          {notes.length > 0 ? `${notes.length} characters` : ''}
        </p>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs" style={{ color: 'var(--status-green)' }}>Saved</span>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}
