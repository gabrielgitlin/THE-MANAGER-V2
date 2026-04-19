import React, { useState, useRef, useEffect } from 'react';

export interface KebabMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
  dividerBefore?: boolean;
  isHeader?: boolean;  // non-clickable section label
  active?: boolean;    // show a brand-green check
}

interface KebabMenuProps {
  items: KebabMenuItem[];
  size?: 'sm' | 'md';
}

export function KebabMenu({ items, size = 'md' }: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const btnSize = size === 'sm' ? 24 : 28;

  return (
    <div ref={containerRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          width: btnSize,
          height: btnSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--t3)',
          gap: 2,
          flexDirection: 'column',
          padding: 0,
          transition: 'color 120ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--t1)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}
        title="Options"
      >
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: 'currentColor',
            display: 'block',
            flexShrink: 0,
          }} />
        ))}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: btnSize + 4,
            zIndex: 200,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-2)',
            minWidth: 172,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {items.map((item, i) => (
            <React.Fragment key={i}>
              {item.dividerBefore && (
                <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
              )}
              {item.isHeader ? (
                <div style={{
                  padding: '6px 12px 2px',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--t4)',
                  userSelect: 'none',
                }}>
                  {item.label}
                </div>
              ) : (
                <button
                  onClick={() => { item.onClick(); setOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: item.danger ? 'var(--status-red)' : item.active ? 'var(--brand-1)' : 'var(--t2)',
                    fontSize: 13,
                    textAlign: 'left',
                    transition: 'background 80ms, color 80ms',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = item.danger ? 'var(--status-red-bg)' : 'var(--surface-3)';
                    e.currentTarget.style.color = item.danger ? 'var(--status-red)' : 'var(--t1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = item.danger ? 'var(--status-red)' : item.active ? 'var(--brand-1)' : 'var(--t2)';
                  }}
                >
                  {item.icon && (
                    <img
                      src={item.icon}
                      alt=""
                      style={{
                        width: 14,
                        height: 14,
                        objectFit: 'contain',
                        flexShrink: 0,
                        filter: item.danger
                          ? 'invert(40%) sepia(80%) saturate(800%) hue-rotate(320deg)'
                          : item.active
                          ? 'invert(45%) sepia(80%) saturate(500%) hue-rotate(110deg)'
                          : 'invert(1)',
                        opacity: item.danger || item.active ? 1 : 0.6,
                      }}
                    />
                  )}
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.active && (
                    <span style={{ fontSize: 10, color: 'var(--brand-1)', fontWeight: 700 }}>✓</span>
                  )}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
