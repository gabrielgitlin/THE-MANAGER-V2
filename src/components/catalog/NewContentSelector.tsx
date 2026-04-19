import React from 'react';

interface NewContentSelectorProps {
  onSelect: (type: 'song' | 'ep' | 'album') => void;
  onClose: () => void;
}

export default function NewContentSelector({ onSelect, onClose }: NewContentSelectorProps) {
  const options = [
    {
      type: 'song' as const,
      title: 'New Song',
      description: 'Add a single track release',
    },
    {
      type: 'ep' as const,
      title: 'New EP',
      description: 'Add an extended play release',
    },
    {
      type: 'album' as const,
      title: 'New Album',
      description: 'Add a full album release',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {options.map(({ type, title, description }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '24px',
            textAlign: 'left',
            border: `1px solid var(--border)`,
            borderRadius: 0,
            height: '100%'
          }}
          className="hover:opacity-80"
        >
          <div style={{ flexShrink: 0, padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 0, marginBottom: '16px' }}>
            <img src="/tm-vinil-negro_(2).png" alt={title} className="w-6 h-6 object-contain" />
          </div>
          <div style={{ minWidth: 0, width: '100%' }}>
            <h3 style={{ fontWeight: '500', color: 'var(--t1)', marginBottom: '8px' }}>{title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--t2)', wordBreak: 'break-word' }}>{description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}