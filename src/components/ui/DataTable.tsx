import React from 'react';
import { cn } from '../../lib/utils';

/* ── Column definition ── */
export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

/* ── DataTable props ── */
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T, index: number) => void;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
  stickyHeader?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyIcon,
  emptyTitle = 'No data yet',
  emptyDescription,
  emptyAction,
  className,
  stickyHeader = false,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="empty-state">
        {emptyIcon && (
          <img src={emptyIcon} alt="" className="empty-state-icon" />
        )}
        <div className="empty-state-title">{emptyTitle}</div>
        {emptyDescription && (
          <div className="empty-state-desc">{emptyDescription}</div>
        )}
        {emptyAction}
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(col.align === 'right' && 'num')}
                style={{
                  width: col.width,
                  textAlign: col.align || 'left',
                  ...(stickyHeader ? { position: 'sticky', top: 0, zIndex: 2 } : {}),
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className={cn(onRowClick && 'clickable')}
              onClick={() => onRowClick?.(row, i)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(col.align === 'right' && 'num')}
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.render ? col.render(row, i) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
