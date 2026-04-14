// Placeholder — full implementation in Task 7
import React from 'react';
import type { Contact } from '../../types/contacts';

interface Props {
  contact?: Contact;
  onSaved: () => void;
  onClose: () => void;
}

export default function ContactFormModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div className="tm-card p-6" onClick={(e) => e.stopPropagation()}>
        <p className="text-t1">Contact form coming soon</p>
        <button className="btn btn-ghost btn-sm mt-4" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
