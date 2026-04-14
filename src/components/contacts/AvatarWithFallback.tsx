import React, { useState } from 'react';
import { getInitials, getAvatarUrl } from '../../lib/contacts';
import type { Contact } from '../../types/contacts';

interface Props {
  contact: Pick<Contact, 'firstName' | 'lastName' | 'profilePhotoUrl' | 'socialLinks'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

const COLORS = [
  '#009C55', '#4A7FA5', '#A0522D', '#6B5B95',
  '#DD5555', '#DDAA44', '#E08A3C',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function AvatarWithFallback({ contact, size = 'md' }: Props) {
  const [imgError, setImgError] = useState(false);
  const url = !imgError ? getAvatarUrl(contact) : null;
  const initials = getInitials(contact.firstName || '?', contact.lastName || '?');
  const bg = avatarColor(`${contact.firstName}${contact.lastName}`);

  if (url) {
    return (
      <img
        src={url}
        alt={`${contact.firstName} ${contact.lastName}`}
        className={`${SIZE[size]} rounded-full object-cover flex-shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${SIZE[size]} rounded-full flex items-center justify-center flex-shrink-0 font-semibold`}
      style={{ backgroundColor: bg, color: '#fff' }}
    >
      {initials}
    </div>
  );
}
