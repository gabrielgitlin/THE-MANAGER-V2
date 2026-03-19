import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

export default function Modal({ isOpen, onClose, children, title, maxWidth = '4xl' }: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'md:max-w-sm',
    md: 'md:max-w-md',
    lg: 'md:max-w-lg',
    xl: 'md:max-w-xl',
    '2xl': 'md:max-w-2xl',
    '3xl': 'md:max-w-3xl',
    '4xl': 'md:max-w-4xl',
    '5xl': 'md:max-w-5xl',
    '6xl': 'md:max-w-6xl',
    '7xl': 'md:max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen md:items-center md:justify-center md:p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={onClose} />

        <div
          className={`relative bg-white w-full min-h-screen md:min-h-0 md:shadow-xl ${maxWidthClasses[maxWidth]} animate-slide-up md:animate-fade-in`}
          style={{ paddingTop: 'var(--sat)' }}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10"
            style={{ paddingTop: 'max(var(--sat), 1rem)' }}
          >
            <h3 className="text-lg font-title text-charcoal">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-500 active:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 md:p-6" style={{ paddingBottom: 'max(var(--sab), 1rem)' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
