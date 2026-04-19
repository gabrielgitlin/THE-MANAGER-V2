import React from 'react';
import { cn } from '../../lib/utils';

/* ── Card container ── */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function TMCard({ padded = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(padded ? 'tm-card-padded' : 'tm-card', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Card header ── */
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function TMCardHeader({ title, subtitle, action, className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('tm-card-header', className)} {...props}>
      <div>
        {title && <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{title}</h2>}
        {subtitle && <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{subtitle}</p>}
        {children}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

/* ── Card body ── */
export function TMCardBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('tm-card-body', className)} {...props}>
      {children}
    </div>
  );
}

/* ── Card footer ── */
export function TMCardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('tm-card-footer', className)} {...props}>
      {children}
    </div>
  );
}
