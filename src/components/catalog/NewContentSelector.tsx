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
          className="flex flex-col items-start p-6 text-left border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors h-full"
        >
          <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg mb-4">
            <img src="/tm-vinil-negro_(2).png" alt={title} className="w-6 h-6 object-contain" />
          </div>
          <div className="min-w-0 w-full">
            <h3 className="font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 break-words">{description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}