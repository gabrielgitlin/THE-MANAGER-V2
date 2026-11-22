// src/components/contacts/ProfileHero.tsx
import React from 'react';
import AvatarWithFallback from './AvatarWithFallback';
import type { Contact, ContactCategory } from '../../types/contacts';

const BADGE: Record<ContactCategory, string> = {
  collaborator: 'badge-green',
  crew: 'badge-blue',
  business: 'badge-neutral',
  other: 'badge-neutral',
};
const LABEL: Record<ContactCategory, string> = {
  collaborator: 'Collaborator', crew: 'Crew', business: 'Business', other: 'Other',
};

const SOCIAL_PLATFORMS = [
  { key: 'instagram' as const, label: 'Instagram', url: (h: string) => `https://instagram.com/${h}` },
  { key: 'twitter'   as const, label: 'X (Twitter)', url: (h: string) => `https://twitter.com/${h}` },
  { key: 'tiktok'    as const, label: 'TikTok',      url: (h: string) => `https://tiktok.com/@${h}` },
  { key: 'spotify'   as const, label: 'Spotify',     url: (h: string) => h.startsWith('http') ? h : `https://open.spotify.com/artist/${h}` },
  { key: 'soundcloud'as const, label: 'SoundCloud',  url: (h: string) => `https://soundcloud.com/${h}` },
  { key: 'linkedin'  as const, label: 'LinkedIn',    url: (h: string) => h.startsWith('http') ? h : `https://linkedin.com/in/${h}` },
];

interface Props {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProfileHero({ contact, onEdit, onDelete }: Props) {
  return (
    <div
      className="px-4 md:px-6 py-8"
      style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
        <AvatarWithFallback contact={contact} size="xl" />

        <div className="flex-1 min-w-0">
          {/* Category + role */}
          <div className="flex flex-wrap gap-2 items-center mb-2">
            <span className={`status-badge ${BADGE[contact.category]}`}>
              {LABEL[contact.category]}
            </span>
            {contact.role && (
              <span
                className="text-t3 text-xs uppercase"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {contact.role}
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="mb-1">
            {contact.firstName} {contact.lastName}
          </h1>

          {/* Location */}
          {(contact.city || contact.country) && (
            <p className="text-t3 text-sm mb-3">
              {[contact.city, contact.country].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Quick contact links */}
          <div className="flex flex-wrap gap-4 mb-3">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="text-t2 text-sm hover:text-t1 transition-all duration-[120ms]"
              >
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="text-t2 text-sm hover:text-t1 transition-all duration-[120ms]"
              >
                {contact.phone}
              </a>
            )}
            {contact.website && (
              <a
                href={contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-t2 text-sm hover:text-t1 transition-all duration-[120ms] flex items-center gap-1"
              >
                Website
                <img src="/TM-ExternalLink-negro.svg" className="pxi-sm icon-muted" alt="" />
              </a>
            )}
          </div>

          {/* Social links */}
          {SOCIAL_PLATFORMS.some(({ key }) => contact.socialLinks[key]) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {SOCIAL_PLATFORMS.map(({ key, label, url }) => {
                const handle = contact.socialLinks[key];
                if (!handle) return null;
                return (
                  <a
                    key={key}
                    href={url(handle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="status-badge badge-neutral hover:text-t1 transition-all duration-[120ms] flex items-center gap-1"
                  >
                    {label}
                    <img src="/TM-ExternalLink-negro.svg" className="pxi-sm icon-muted" alt="" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Tags */}
          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {contact.tags.map((tag) => (
                <span key={tag} className="status-badge badge-neutral">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Edit / Delete actions */}
        <div className="flex gap-2 self-start flex-shrink-0">
          <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={onEdit}>
            <img src="/TM-Pluma-negro.png" className="pxi-sm icon-white" alt="" />
            Edit
          </button>
          <button className="btn btn-danger btn-sm btn-icon" onClick={onDelete} title="Delete contact">
            <img src="/TM-Trash-negro.svg" className="pxi-sm icon-danger" alt="Delete" />
          </button>
        </div>
      </div>
    </div>
  );
}
