import React from 'react';
import type { OrganizationType } from '../../types/organizations';

const TYPE_COLORS: Record<string, string> = {
  label: 'var(--surface-4)',
  publisher: 'var(--surface-4)',
  management: 'var(--surface-3)',
  booking: 'var(--surface-3)',
  distributor: 'var(--surface-2)',
  pr: 'var(--surface-2)',
  marketing: 'var(--surface-2)',
  default: 'var(--surface)',
};

interface OrgLogoProps {
  name: string;
  type: OrganizationType;
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = { sm: 32, md: 40, lg: 56 };

export default function OrgLogo({ name, type, logoUrl, size = 'md' }: OrgLogoProps) {
  const px = SIZE_MAP[size];
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const bg = TYPE_COLORS[type] ?? TYPE_COLORS.default;

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: px, height: px, minWidth: px }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: px,
        height: px,
        minWidth: px,
        background: bg,
        color: 'var(--t2)',
        fontSize: size === 'lg' ? 18 : size === 'md' ? 14 : 11,
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        letterSpacing: '0.05em',
      }}
    >
      {initials}
    </div>
  );
}
