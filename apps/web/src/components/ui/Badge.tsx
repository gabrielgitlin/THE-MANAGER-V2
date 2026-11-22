import React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'green' | 'yellow' | 'orange' | 'red' | 'brand' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'neutral',
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span className={cn('status-badge', `badge-${variant}`, className)}>
      {dot && <span className={`tl tl-${variant === 'neutral' ? 'green' : variant}`} style={{ width: 6, height: 6 }} />}
      {children}
    </span>
  );
}
