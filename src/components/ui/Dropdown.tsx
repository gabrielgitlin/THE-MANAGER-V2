import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export default function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>

      {open && (
        <div
          className="tm-dropdown absolute mt-1 animate-scale-in"
          style={{
            [align === 'right' ? 'right' : 'left']: 0,
            transformOrigin: align === 'right' ? 'top right' : 'top left',
          }}
        >
          {items.map((item) =>
            item.divider ? (
              <div key={item.id} className="tm-dropdown-divider" />
            ) : (
              <button
                key={item.id}
                className={cn('tm-dropdown-item', item.danger && 'danger')}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
              >
                {item.icon}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
