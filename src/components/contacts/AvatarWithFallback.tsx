import React, { useState } from 'react';
import { getInitials } from '../../lib/contacts';
import type { Contact } from '../../types/contacts';

interface Props {
  contact: Pick<Contact, 'firstName' | 'lastName' | 'profilePhotoUrl' | 'socialLinks' | 'category' | 'role'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

// Avatar bg mirrors the solid accent color used in the category's badge
const CATEGORY_SWATCH: Record<string, { bg: string; fg: string }> = {
  collaborator: { bg: '#009C55', fg: '#ffffff' }, // badge-green
  crew:         { bg: '#CCDBE2', fg: '#000000' }, // badge-blue
  business:     { bg: '#000000', fg: '#ffffff' }, // black
  other:        { bg: '#90928F', fg: '#ffffff' }, // badge-neutral
};
const ARTIST_SWATCH = { bg: '#1a5f8a', fg: '#ffffff' }; // deep blue

export default function AvatarWithFallback({ contact, size = 'md' }: Props) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(contact.firstName || '?', contact.lastName || '?');
  const { bg, fg } = contact.role === 'Artist'
    ? ARTIST_SWATCH
    : (CATEGORY_SWATCH[contact.category] ?? CATEGORY_SWATCH.other);

  // Only show a photo if one was explicitly uploaded — no social-handle scraping
  if (contact.profilePhotoUrl && !imgError) {
    return (
      <img
        src={contact.profilePhotoUrl}
        alt={`${contact.firstName} ${contact.lastName}`}
        className={`${SIZE[size]} rounded-full object-cover flex-shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${SIZE[size]} rounded-full flex items-center justify-center flex-shrink-0 font-semibold`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {initials}
    </div>
  );
}
