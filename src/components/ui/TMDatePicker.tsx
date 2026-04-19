import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TMDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_HEADERS = ['S','M','T','W','T','F','S'];

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function TMDatePicker({ value, onChange, required }: TMDatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseValue = (): Date | null => {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const selectedDate = parseValue();

  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build 6-row grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  type Cell = { date: Date; current: boolean };
  const cells: Cell[] = [];

  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i), current: false });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(viewYear, viewMonth, d), current: true });
  while (cells.length < 42)
    cells.push({ date: new Date(viewYear, viewMonth + 1, cells.length - firstDay - daysInMonth + 1), current: false });

  return (
    <div style={{ border: '1px solid var(--border-2)', background: 'var(--surface)', userSelect: 'none' }}>
      {/* Month / year header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button
          type="button"
          onClick={prevMonth}
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
          {MONTHS[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          className="flex items-center justify-center w-7 h-7 hover:opacity-70 transition-opacity"
          style={{ border: '1px solid var(--border-2)', background: 'var(--surface-2)' }}
        >
          <ChevronRight size={12} style={{ color: 'var(--t2)' }} />
        </button>
      </div>

      {/* Grid */}
      <div className="p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((d, i) => (
            <div key={i} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--t3)',
              textAlign: 'center',
              padding: '4px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map(({ date, current }, i) => {
            const iso = toISO(date);
            const isSelected = value === iso;
            const isToday = iso === toISO(today);

            if (!current) {
              return (
                <div key={i} style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--t4)',
                  textAlign: 'center',
                  padding: '6px 0',
                }}>
                  {date.getDate()}
                </div>
              );
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange(iso)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: isSelected ? '#fff' : isToday ? 'var(--brand-1)' : 'var(--t1)',
                  textAlign: 'center',
                  background: isSelected ? 'var(--brand-1)' : 'transparent',
                  border: isToday && !isSelected ? '1px solid var(--brand-1)' : '1px solid transparent',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-3)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hidden native input for form required validation */}
      {required && (
        <input
          type="text"
          required
          value={value}
          onChange={() => {}}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          tabIndex={-1}
        />
      )}
    </div>
  );
}
