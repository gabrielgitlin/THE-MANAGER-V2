import React, { useState, useEffect, useRef } from 'react';
import { getArtists } from '../../lib/artists';
import type { Artist } from '../../lib/artists';

export interface ProjectTag {
  id: string;
  name: string;
}

interface ProjectTagInputProps {
  value: ProjectTag[];
  onChange: (tags: ProjectTag[]) => void;
  placeholder?: string;
  /** Visual size of the component */
  size?: 'sm' | 'md';
}

/**
 * Tag-input that searches the `artists` table (Projects) instead of contacts.
 * The pill data shape is { id: string, name: string } — identical to ContactTag
 * but always has an id since Artists are looked up from the DB.
 */
export function ProjectTagInput({
  value,
  onChange,
  placeholder = 'Search projects…',
  size = 'md',
}: ProjectTagInputProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load artists once on mount
  useEffect(() => {
    getArtists().then(setArtists).catch(() => {});
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

  const selectedIds = new Set(value.map(t => t.id));

  const filtered = artists
    .filter(a => {
      if (selectedIds.has(a.id)) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.genre?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 8);

  function addTag(tag: ProjectTag) {
    onChange([...value, tag]);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
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
              background: 'var(--surface-4)',
              color: 'var(--t1)',
              border: '1px solid var(--border-2)',
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
                color: 'var(--t3)',
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
      {open && filtered.length > 0 && (
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
          {filtered.map(artist => (
            <button
              key={artist.id}
              type="button"
              onMouseDown={e => { e.preventDefault(); addTag({ id: artist.id, name: artist.name }); }}
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
                {artist.name.charAt(0).toUpperCase()}
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ fontSize: 13, color: 'var(--t1)' }}>{artist.name}</span>
                {artist.genre && (
                  <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 6 }}>{artist.genre}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
