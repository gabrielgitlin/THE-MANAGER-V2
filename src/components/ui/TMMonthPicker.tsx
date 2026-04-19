import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TMMonthPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
}

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

export function TMMonthPicker({ value, onChange }: TMMonthPickerProps) {
  const today = new Date();

  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.split('-')[0]);
    return today.getFullYear();
  });

  const selectedYear  = value ? parseInt(value.split('-')[0]) : null;
  const selectedMonth = value ? parseInt(value.split('-')[1]) - 1 : null; // 0-indexed

  return (
    <div style={{ border: '1px solid var(--border-2)', background: 'var(--surface)', userSelect: 'none' }}>
      {/* Year navigation */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button
          type="button"
          onClick={() => setViewYear(y => y - 1)}
          className="flex items-center justify-center w-7 h-7 hover:opacity-70 transition-opacity"
          style={{ border: '1px solid var(--border-2)', background: 'var(--surface-2)' }}
        >
          <ChevronLeft size={12} style={{ color: 'var(--t2)' }} />
        </button>

        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--t1)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          {viewYear}
        </span>

        <button
          type="button"
          onClick={() => setViewYear(y => y + 1)}
          className="flex items-center justify-center w-7 h-7 hover:opacity-70 transition-opacity"
          style={{ border: '1px solid var(--border-2)', background: 'var(--surface-2)' }}
        >
          <ChevronRight size={12} style={{ color: 'var(--t2)' }} />
        </button>
      </div>

      {/* Month grid — 3 columns × 4 rows */}
      <div className="p-3 grid grid-cols-3 gap-1">
        {MONTHS.map((label, i) => {
          const isSelected = selectedYear === viewYear && selectedMonth === i;
          const isCurrent  = today.getFullYear() === viewYear && today.getMonth() === i;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(`${viewYear}-${String(i + 1).padStart(2, '0')}`)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? '#fff' : isCurrent ? 'var(--brand-1)' : 'var(--t1)',
                background: isSelected ? 'var(--brand-1)' : 'transparent',
                border: isCurrent && !isSelected ? '1px solid var(--brand-1)' : '1px solid transparent',
                padding: '7px 4px',
                textAlign: 'center',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-3)'; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
