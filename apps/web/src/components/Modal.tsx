import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  closeOnBackdrop?: boolean;
  hideCloseButton?: boolean;
}

export default function Modal({ isOpen, onClose, children, title, maxWidth = '4xl', closeOnBackdrop = true, hideCloseButton = false }: ModalProps) {
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
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={closeOnBackdrop ? onClose : undefined}
        />

        <div
          className={`relative w-full min-h-screen md:min-h-0 ${maxWidthClasses[maxWidth]} animate-slide-up md:animate-fade-in`}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-2)',
            paddingTop: 'var(--sat)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div
            className="flex items-center justify-between p-4 sticky top-0 z-10"
            style={{
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface)',
              paddingTop: 'max(var(--sat), 1rem)',
            }}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--t1)' }}>{title}</h3>
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -mr-2 transition-colors"
                style={{ color: 'var(--t3)' }}
              >
                <img src="/TM-Close-negro.svg" className="pxi-lg icon-muted" alt="Close" />
              </button>
            )}
          </div>

          <div className="p-4 md:p-6" style={{ paddingBottom: 'max(var(--sab), 1rem)' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
