import React from 'react';
import { cn } from '../../lib/utils';

/* Pixel art icon map for each section */
const PIXEL_ICONS: Record<string, string> = {
  dashboard: '/TM-Pin-negro.png',
  calendar: '/TM-Calendario-negro.png',
  catalog: '/TM-Vinil-negro.png',
  finance: '/TM-Monedas-negro.png',
  legal: '/TM-Contrato-negro.png',
  live: '/TM-Maletin-negro.png',
  marketing: '/TM-Ajedrez Caballo-negro.png',
  team: '/TM-Sello-negro.png',
  artist: '/TM-Icono-negro.png',
  notes: '/TM-Pluma-negro.png',
};

interface EmptyStateProps {
  icon?: string;        // pixel icon key (e.g. 'catalog') or custom path
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  const iconSrc = icon
    ? (PIXEL_ICONS[icon] || icon)
    : undefined;

  return (
    <div
      className={cn('empty-state', compact && 'py-8', className)}
    >
      {iconSrc && (
        <img
          src={iconSrc}
          alt=""
          className="empty-state-icon"
          style={compact ? { width: 40, height: 40 } : undefined}
        />
      )}
      <div className="empty-state-title">{title}</div>
      {description && <div className="empty-state-desc">{description}</div>}
      {action}
    </div>
  );
}
