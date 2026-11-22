import React, { useState, useEffect, useRef } from 'react';
import { getContacts } from '../../lib/contacts';
import type { Contact } from '../../types/contacts';

export interface ContactTag {
  id?: string;   // undefined = not yet in Team DB
  name: string;
}

interface ContactTagInputProps {
  value: ContactTag[];
  onChange: (tags: ContactTag[]) => void;
  placeholder?: string;
  /** If provided, contacts whose role matches (case-insensitive) will be ranked first */
  preferRole?: string;
  /** Visual size of the component */
  size?: 'sm' | 'md';
  /** If true, automatically creates new contacts in Team on selection (default: true) */
  autoSync?: boolean;
}

export function ContactTagInput({
  value,
  onChange,
  placeholder = 'Search or add…',
  preferRole,
  size = 'md',
  autoSync = true,
}: ContactTagInputProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load contacts once on mount
  useEffect(() => {
    getContacts().then(setContacts).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectedIds = new Set(value.map(t => t.id).filter(Boolean));
  const selectedNames = new Set(value.map(t => t.name.toLowerCase()));

  const filtered = contacts
    .filter(c => {
      const fullName = `${c.firstName} ${c.lastName}`.trim();
      if (selectedIds.has(c.id)) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        fullName.toLowerCase().includes(q) ||
        c.role?.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      // Rank preferred role first
      if (preferRole) {
        const aMatch = a.role?.toLowerCase() === preferRole.toLowerCase() ? 0 : 1;
        const bMatch = b.role?.toLowerCase() === preferRole.toLowerCase() ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
      }
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    })
    .slice(0, 8);

  const trimmedQuery = query.trim();
  const canCreate =
    trimmedQuery.length > 1 && !selectedNames.has(trimmedQuery.toLowerCase());

  function addTag(tag: ContactTag) {
    onChange([...value, tag]);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  async function handleCreateNew() {
    const tag: ContactTag = { name: trimmedQuery };
    // Optimistically add to list
    addTag(tag);

    if (autoSync) {
      // Sync to Team in background
      try {
        const { syncArtistsToTeam } = await import('../../lib/contacts');
        await syncArtistsToTeam([{ name: trimmedQuery, role: preferRole }]);
        // Re-load contacts so the new one shows up in future searches
        getContacts().then(setContacts).catch(() => {});
      } catch {
        // silent
      }
    }
  }

  const inputSize = size === 'sm' ? { fontSize: 12, padding: '4px 6px' } : { fontSize: 13, padding: '6px 8px' };
  const pillSize = size === 'sm' ? { fontSize: 11, padding: '2px 6px' } : { fontSize: 12, padding: '3px 8px' };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Pills + input row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          minHeight: size === 'sm' ? 32 : 36,
          cursor: 'text',
          transition: 'border-color 120ms',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: tag.id ? 'var(--surface-4)' : 'var(--surface-3)',
              color: tag.id ? 'var(--t1)' : 'var(--t2)',
              border: `1px solid ${tag.id ? 'var(--border-2)' : 'var(--border-2)'}`,
              borderRadius: 9999,
              fontWeight: 500,
              ...pillSize,
            }}
          >
            {tag.name}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(i); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
                color: tag.id ? 'var(--t3)' : 'var(--t3)',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
              }}
              title={`Remove ${tag.name}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Backspace' && !query && value.length > 0) {
              removeTag(value.length - 1);
            }
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
            if (e.key === 'Enter' && canCreate && filtered.length === 0) {
              e.preventDefault();
              handleCreateNew();
            }
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          style={{
            flex: 1,
            minWidth: 80,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--t1)',
            ...inputSize,
          }}
        />
      </div>

      {/* Dropdown */}
      {open && (filtered.length > 0 || canCreate) && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 300,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-2)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {filtered.map(contact => {
            const fullName = `${contact.firstName} ${contact.lastName}`.trim();
            return (
              <button
                key={contact.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); addTag({ id: contact.id, name: fullName }); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 80ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Avatar circle */}
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'var(--brand-1)',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, color: 'var(--t1)' }}>{fullName}</span>
                  {contact.role && (
                    <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 6 }}>{contact.role}</span>
                  )}
                </span>
              </button>
            );
          })}

          {canCreate && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); handleCreateNew(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                borderTop: filtered.length > 0 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 80ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--surface-3)',
                  border: '1px dashed var(--border-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: 'var(--t3)',
                  flexShrink: 0,
                }}
              >
                +
              </span>
              <span style={{ fontSize: 13, color: 'var(--t2)' }}>
                Add <strong style={{ color: 'var(--t1)' }}>{trimmedQuery}</strong> to Team
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
