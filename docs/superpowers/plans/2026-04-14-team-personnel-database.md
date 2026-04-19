# Team / Personnel Database — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing `/team` page with a unified, full-featured contact database covering crew, collaborators, business contacts, and all other people the user manages — each with a profile page, file attachments, payment info, and social-linked profile photos.

**Architecture:** A new `contacts` table replaces `personnel_profiles` + the old Team/crew system. Contact profiles live at `/team/:id` (full-page, tabbed). The list page at `/team` shows a photo-card grid (default) or table list with search and category filtering. Payment info lives in a separate table with its own RLS policy. Files go in private Supabase Storage buckets.

**Tech Stack:** React, TypeScript, Supabase (postgres + storage + RLS), React Router, Tailwind CSS with The Manager design system, `unavatar.io` for social-handle photo fallback.

---

## Notes on Contact Categories

The four planned categories cover most use cases. Two you may want to add later via the `other` category + tags:
- **Vendors** — catering, equipment rental, travel agencies, tour buses
- **Media/Press** — journalists, playlist curators, radio pluggers

The `tags` field handles these without schema changes.

## Profile Photo Approach

Profile photos resolve in this priority order:
1. Uploaded photo (Supabase Storage — most reliable)
2. Instagram handle → `unavatar.io/instagram/{handle}` (works inconsistently; Instagram restricts this)
3. Twitter/X handle → `unavatar.io/twitter/{handle}` (works well)
4. Initials avatar (deterministic color from name hash — always works)

The `<AvatarWithFallback>` component handles the `onError` fallback chain automatically.

---

## File Structure

```
New files:
  supabase/migrations/20260414000000_unified_contacts.sql
  src/types/contacts.ts
  src/lib/contacts.ts
  src/lib/contacts.test.ts
  src/pages/ContactProfile.tsx
  src/components/contacts/AvatarWithFallback.tsx
  src/components/contacts/ContactCard.tsx
  src/components/contacts/ContactRow.tsx
  src/components/contacts/ContactFilters.tsx
  src/components/contacts/ContactFormModal.tsx
  src/components/contacts/ProfileHero.tsx
  src/components/contacts/OverviewTab.tsx
  src/components/contacts/PaymentTab.tsx
  src/components/contacts/DocumentsTab.tsx
  src/components/contacts/NotesTab.tsx

Modified files:
  src/pages/Team.tsx           (complete rewrite — delete all existing content)
  src/App.tsx                  (add /team/:id route + lazy import)
```

---

## Task 1: Database Schema Migration

**Files:**
- Create: `supabase/migrations/20260414000000_unified_contacts.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260414000000_unified_contacts.sql

-- ─── contacts ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category              TEXT NOT NULL CHECK (category IN ('collaborator','crew','business','other')),
  role                  TEXT,
  first_name            TEXT NOT NULL DEFAULT '',
  last_name             TEXT NOT NULL DEFAULT '',
  profile_photo_url     TEXT,
  email                 TEXT,
  phone                 TEXT,
  website               TEXT,
  home_airport          TEXT,
  seating_preference    TEXT CHECK (seating_preference IN ('window','aisle','middle','no_preference')),
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  country               TEXT,
  postal_code           TEXT,
  social_links          JSONB NOT NULL DEFAULT '{}',
  pro_affiliations      JSONB NOT NULL DEFAULT '[]',
  publisher_affiliations JSONB NOT NULL DEFAULT '[]',
  bio                   TEXT,
  notes                 TEXT,
  tags                  TEXT[] NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_select" ON contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "contacts_insert" ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_update" ON contacts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_delete" ON contacts FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION contacts_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts FOR EACH ROW
  EXECUTE FUNCTION contacts_set_updated_at();

-- ─── contact_payment_info ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_payment_info (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id           UUID NOT NULL UNIQUE REFERENCES contacts(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name            TEXT,
  account_holder_name  TEXT,
  routing_number       TEXT,
  account_number       TEXT,
  account_type         TEXT CHECK (account_type IN ('checking','savings')),
  swift_code           TEXT,
  iban                 TEXT,
  bank_address         TEXT,
  paypal_email         TEXT,
  venmo_handle         TEXT,
  zelle_contact        TEXT,
  tax_id               TEXT,
  w9_on_file           BOOLEAN NOT NULL DEFAULT FALSE,
  w9_file_url          TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contact_payment_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_info_all" ON contact_payment_info
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── contact_files ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_type   TEXT NOT NULL DEFAULT '',
  file_path   TEXT NOT NULL,
  file_size   INTEGER,
  description TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contact_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_files_all" ON contact_files
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Storage buckets ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('contact-photos', 'contact-photos', true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('contact-files',  'contact-files',  false, 26214400, NULL)
ON CONFLICT (id) DO NOTHING;

-- contact-photos: public read, owner write
CREATE POLICY "contact_photos_public_read"   ON storage.objects FOR SELECT USING (bucket_id = 'contact-photos');
CREATE POLICY "contact_photos_owner_insert"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contact-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "contact_photos_owner_update"  ON storage.objects FOR UPDATE USING  (bucket_id = 'contact-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "contact_photos_owner_delete"  ON storage.objects FOR DELETE USING  (bucket_id = 'contact-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- contact-files: private, owner only
CREATE POLICY "contact_files_owner_all" ON storage.objects
  FOR ALL USING  (bucket_id = 'contact-files' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK     (bucket_id = 'contact-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `mcp__b971411f...apply_migration` tool with the SQL above and name `unified_contacts`.
Expected: migration applies with no errors; confirm tables exist with `list_tables`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260414000000_unified_contacts.sql
git commit -m "feat: add unified contacts schema (contacts, payment_info, files, storage)"
```

---

## Task 2: TypeScript Types + API Layer

**Files:**
- Create: `src/types/contacts.ts`
- Create: `src/lib/contacts.ts`
- Create: `src/lib/contacts.test.ts`

- [ ] **Step 1: Write the failing tests first**

```ts
// src/lib/contacts.test.ts
import { describe, it, expect } from 'vitest';
import { getInitials, formatContactName, getAvatarUrl } from './contacts';

describe('getInitials', () => {
  it('returns uppercase initials from first and last name', () => {
    expect(getInitials('John', 'Doe')).toBe('JD');
  });
  it('handles lowercase input', () => {
    expect(getInitials('jane', 'smith')).toBe('JS');
  });
});

describe('formatContactName', () => {
  it('joins first and last name with a space', () => {
    expect(formatContactName({ firstName: 'Taylor', lastName: 'Swift' })).toBe('Taylor Swift');
  });
});

describe('getAvatarUrl', () => {
  it('returns profilePhotoUrl when present', () => {
    expect(getAvatarUrl({ profilePhotoUrl: 'https://example.com/pic.jpg', socialLinks: {} }))
      .toBe('https://example.com/pic.jpg');
  });
  it('falls back to instagram unavatar when no photo', () => {
    expect(getAvatarUrl({ profilePhotoUrl: undefined, socialLinks: { instagram: 'johndoe' } }))
      .toBe('https://unavatar.io/instagram/johndoe');
  });
  it('falls back to twitter unavatar when no photo and no instagram', () => {
    expect(getAvatarUrl({ profilePhotoUrl: undefined, socialLinks: { twitter: 'johndoe' } }))
      .toBe('https://unavatar.io/twitter/johndoe');
  });
  it('returns null when no photo or social handles available', () => {
    expect(getAvatarUrl({ profilePhotoUrl: undefined, socialLinks: {} })).toBeNull();
  });
});
```

- [ ] **Step 2: Add vitest if not already in package.json**

Check `package.json`. If `vitest` is not in devDependencies:
```bash
npm install -D vitest
```
Then add to `package.json` scripts:
```json
"test": "vitest"
```

- [ ] **Step 3: Run tests — expect FAIL (functions not defined yet)**

```bash
npm test -- --run
```
Expected: `getInitials is not a function` or similar import error.

- [ ] **Step 4: Write `src/types/contacts.ts`**

```ts
// src/types/contacts.ts

export type ContactCategory = 'collaborator' | 'crew' | 'business' | 'other';
export type SeatingPreference = 'window' | 'aisle' | 'middle' | 'no_preference';

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  facebook?: string;
  linkedin?: string;
  spotify?: string;
  soundcloud?: string;
}

export interface ProAffiliation {
  name: string;
  ipiNumber?: string;
  isPrimary: boolean;
}

export interface PublisherAffiliation {
  name: string;
  ipiNumber?: string;
  isPrimary: boolean;
}

export interface Contact {
  id: string;
  userId: string;
  category: ContactCategory;
  role?: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl?: string;
  email?: string;
  phone?: string;
  website?: string;
  homeAirport?: string;
  seatingPreference?: SeatingPreference;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  socialLinks: SocialLinks;
  proAffiliations: ProAffiliation[];
  publisherAffiliations: PublisherAffiliation[];
  bio?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ContactFormData = Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export interface ContactPaymentInfo {
  id: string;
  contactId: string;
  userId: string;
  bankName?: string;
  accountHolderName?: string;
  routingNumber?: string;
  accountNumber?: string;
  accountType?: 'checking' | 'savings';
  swiftCode?: string;
  iban?: string;
  bankAddress?: string;
  paypalEmail?: string;
  venmoHandle?: string;
  zelleContact?: string;
  taxId?: string;
  w9OnFile: boolean;
  w9FileUrl?: string;
  updatedAt: string;
}

export type ContactPaymentFormData = Omit<ContactPaymentInfo, 'id' | 'contactId' | 'userId' | 'updatedAt'>;

export interface ContactFile {
  id: string;
  contactId: string;
  userId: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize?: number;
  description?: string;
  uploadedAt: string;
}
```

- [ ] **Step 5: Write `src/lib/contacts.ts`**

```ts
// src/lib/contacts.ts
import { supabase } from './supabase';
import type {
  Contact, ContactFormData,
  ContactPaymentInfo, ContactPaymentFormData,
  ContactFile,
} from '../types/contacts';

// ─── Pure helpers (exported for tests) ─────────────────────────────────────────

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatContactName(contact: Pick<Contact, 'firstName' | 'lastName'>): string {
  return `${contact.firstName} ${contact.lastName}`;
}

export function getAvatarUrl(
  contact: Pick<Contact, 'profilePhotoUrl' | 'socialLinks'>
): string | null {
  if (contact.profilePhotoUrl) return contact.profilePhotoUrl;
  if (contact.socialLinks?.instagram)
    return `https://unavatar.io/instagram/${contact.socialLinks.instagram}`;
  if (contact.socialLinks?.twitter)
    return `https://unavatar.io/twitter/${contact.socialLinks.twitter}`;
  return null;
}

// ─── Row mapper ────────────────────────────────────────────────────────────────

function rowToContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    category: row.category as Contact['category'],
    role: (row.role as string) ?? undefined,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    profilePhotoUrl: (row.profile_photo_url as string) ?? undefined,
    email: (row.email as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    website: (row.website as string) ?? undefined,
    homeAirport: (row.home_airport as string) ?? undefined,
    seatingPreference: (row.seating_preference as Contact['seatingPreference']) ?? undefined,
    address: (row.address as string) ?? undefined,
    city: (row.city as string) ?? undefined,
    state: (row.state as string) ?? undefined,
    country: (row.country as string) ?? undefined,
    postalCode: (row.postal_code as string) ?? undefined,
    socialLinks: (row.social_links as Contact['socialLinks']) ?? {},
    proAffiliations: (row.pro_affiliations as Contact['proAffiliations']) ?? [],
    publisherAffiliations: (row.publisher_affiliations as Contact['publisherAffiliations']) ?? [],
    bio: (row.bio as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    tags: (row.tags as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Contacts CRUD ─────────────────────────────────────────────────────────────

export async function getContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('last_name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToContact);
}

export async function getContact(id: string): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return rowToContact(data);
}

export async function createContact(formData: ContactFormData): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      category: formData.category,
      role: formData.role || null,
      first_name: formData.firstName,
      last_name: formData.lastName,
      profile_photo_url: formData.profilePhotoUrl || null,
      email: formData.email || null,
      phone: formData.phone || null,
      website: formData.website || null,
      home_airport: formData.homeAirport || null,
      seating_preference: formData.seatingPreference || null,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country || null,
      postal_code: formData.postalCode || null,
      social_links: formData.socialLinks ?? {},
      pro_affiliations: formData.proAffiliations ?? [],
      publisher_affiliations: formData.publisherAffiliations ?? [],
      bio: formData.bio || null,
      notes: formData.notes || null,
      tags: formData.tags ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return rowToContact(data);
}

export async function updateContact(id: string, formData: Partial<ContactFormData>): Promise<Contact> {
  const updates: Record<string, unknown> = {};
  if (formData.category !== undefined)            updates.category = formData.category;
  if (formData.role !== undefined)                updates.role = formData.role || null;
  if (formData.firstName !== undefined)           updates.first_name = formData.firstName;
  if (formData.lastName !== undefined)            updates.last_name = formData.lastName;
  if (formData.profilePhotoUrl !== undefined)     updates.profile_photo_url = formData.profilePhotoUrl || null;
  if (formData.email !== undefined)               updates.email = formData.email || null;
  if (formData.phone !== undefined)               updates.phone = formData.phone || null;
  if (formData.website !== undefined)             updates.website = formData.website || null;
  if (formData.homeAirport !== undefined)         updates.home_airport = formData.homeAirport || null;
  if (formData.seatingPreference !== undefined)   updates.seating_preference = formData.seatingPreference || null;
  if (formData.address !== undefined)             updates.address = formData.address || null;
  if (formData.city !== undefined)                updates.city = formData.city || null;
  if (formData.state !== undefined)               updates.state = formData.state || null;
  if (formData.country !== undefined)             updates.country = formData.country || null;
  if (formData.postalCode !== undefined)          updates.postal_code = formData.postalCode || null;
  if (formData.socialLinks !== undefined)         updates.social_links = formData.socialLinks;
  if (formData.proAffiliations !== undefined)     updates.pro_affiliations = formData.proAffiliations;
  if (formData.publisherAffiliations !== undefined) updates.publisher_affiliations = formData.publisherAffiliations;
  if (formData.bio !== undefined)                 updates.bio = formData.bio || null;
  if (formData.notes !== undefined)               updates.notes = formData.notes || null;
  if (formData.tags !== undefined)                updates.tags = formData.tags;

  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToContact(data);
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw error;
}

// ─── Payment info ──────────────────────────────────────────────────────────────

export async function getContactPaymentInfo(contactId: string): Promise<ContactPaymentInfo | null> {
  const { data, error } = await supabase
    .from('contact_payment_info')
    .select('*')
    .eq('contact_id', contactId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    contactId: data.contact_id,
    userId: data.user_id,
    bankName: data.bank_name ?? undefined,
    accountHolderName: data.account_holder_name ?? undefined,
    routingNumber: data.routing_number ?? undefined,
    accountNumber: data.account_number ?? undefined,
    accountType: data.account_type ?? undefined,
    swiftCode: data.swift_code ?? undefined,
    iban: data.iban ?? undefined,
    bankAddress: data.bank_address ?? undefined,
    paypalEmail: data.paypal_email ?? undefined,
    venmoHandle: data.venmo_handle ?? undefined,
    zelleContact: data.zelle_contact ?? undefined,
    taxId: data.tax_id ?? undefined,
    w9OnFile: data.w9_on_file ?? false,
    w9FileUrl: data.w9_file_url ?? undefined,
    updatedAt: data.updated_at,
  };
}

export async function upsertContactPaymentInfo(
  contactId: string,
  formData: ContactPaymentFormData
): Promise<ContactPaymentInfo> {
  const { data, error } = await supabase
    .from('contact_payment_info')
    .upsert(
      {
        contact_id: contactId,
        bank_name: formData.bankName || null,
        account_holder_name: formData.accountHolderName || null,
        routing_number: formData.routingNumber || null,
        account_number: formData.accountNumber || null,
        account_type: formData.accountType || null,
        swift_code: formData.swiftCode || null,
        iban: formData.iban || null,
        bank_address: formData.bankAddress || null,
        paypal_email: formData.paypalEmail || null,
        venmo_handle: formData.venmoHandle || null,
        zelle_contact: formData.zelleContact || null,
        tax_id: formData.taxId || null,
        w9_on_file: formData.w9OnFile ?? false,
        w9_file_url: formData.w9FileUrl || null,
      },
      { onConflict: 'contact_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id, contactId: data.contact_id, userId: data.user_id,
    bankName: data.bank_name ?? undefined, accountHolderName: data.account_holder_name ?? undefined,
    routingNumber: data.routing_number ?? undefined, accountNumber: data.account_number ?? undefined,
    accountType: data.account_type ?? undefined, swiftCode: data.swift_code ?? undefined,
    iban: data.iban ?? undefined, bankAddress: data.bank_address ?? undefined,
    paypalEmail: data.paypal_email ?? undefined, venmoHandle: data.venmo_handle ?? undefined,
    zelleContact: data.zelle_contact ?? undefined, taxId: data.tax_id ?? undefined,
    w9OnFile: data.w9_on_file ?? false, w9FileUrl: data.w9_file_url ?? undefined,
    updatedAt: data.updated_at,
  };
}

// ─── Files ─────────────────────────────────────────────────────────────────────

export async function getContactFiles(contactId: string): Promise<ContactFile[]> {
  const { data, error } = await supabase
    .from('contact_files')
    .select('*')
    .eq('contact_id', contactId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id, contactId: row.contact_id, userId: row.user_id,
    fileName: row.file_name, fileType: row.file_type, filePath: row.file_path,
    fileSize: row.file_size ?? undefined, description: row.description ?? undefined,
    uploadedAt: row.uploaded_at,
  }));
}

export async function uploadContactFile(
  contactId: string,
  file: File,
  description?: string
): Promise<ContactFile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const ext = file.name.split('.').pop();
  const filePath = `${user.id}/${contactId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('contact-files')
    .upload(filePath, file);
  if (uploadError) throw uploadError;
  const { data, error } = await supabase
    .from('contact_files')
    .insert({ contact_id: contactId, file_name: file.name, file_type: file.type,
              file_path: filePath, file_size: file.size, description: description ?? null })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id, contactId: data.contact_id, userId: data.user_id,
    fileName: data.file_name, fileType: data.file_type, filePath: data.file_path,
    fileSize: data.file_size ?? undefined, description: data.description ?? undefined,
    uploadedAt: data.uploaded_at,
  };
}

export async function deleteContactFile(file: ContactFile): Promise<void> {
  await supabase.storage.from('contact-files').remove([file.filePath]);
  const { error } = await supabase.from('contact_files').delete().eq('id', file.id);
  if (error) throw error;
}

export async function getContactFileDownloadUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('contact-files')
    .createSignedUrl(filePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// ─── Photo upload ──────────────────────────────────────────────────────────────

export async function uploadContactPhoto(contactId: string, file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const ext = file.name.split('.').pop();
  const filePath = `${user.id}/${contactId}/photo.${ext}`;
  const { error } = await supabase.storage
    .from('contact-photos')
    .upload(filePath, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('contact-photos').getPublicUrl(filePath);
  return data.publicUrl;
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
npm test -- --run
```
Expected: 6 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/types/contacts.ts src/lib/contacts.ts src/lib/contacts.test.ts package.json
git commit -m "feat: add contacts types, API lib, and utility function tests"
```

---

## Task 3: AvatarWithFallback Component

**Files:**
- Create: `src/components/contacts/AvatarWithFallback.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/contacts/AvatarWithFallback.tsx
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
  '#009C55','#4A7FA5','#A0522D','#6B5B95',
  '#DD5555','#DDAA44','#E08A3C',
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/contacts/AvatarWithFallback.tsx
git commit -m "feat: add AvatarWithFallback component with social-handle photo fallback"
```

---

## Task 4: ContactCard + ContactRow Components

**Files:**
- Create: `src/components/contacts/ContactCard.tsx`
- Create: `src/components/contacts/ContactRow.tsx`

- [ ] **Step 1: Write ContactCard (grid view)**

```tsx
// src/components/contacts/ContactCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarWithFallback from './AvatarWithFallback';
import type { Contact, ContactCategory } from '../../types/contacts';

const BADGE: Record<ContactCategory, string> = {
  collaborator: 'badge-green',
  crew: 'badge-blue',
  business: 'badge-neutral',
  other: 'badge-neutral',
};
const LABEL: Record<ContactCategory, string> = {
  collaborator: 'Collaborator',
  crew: 'Crew',
  business: 'Business',
  other: 'Other',
};

export default function ContactCard({ contact }: { contact: Contact }) {
  const navigate = useNavigate();
  return (
    <div
      className="tm-card p-4 cursor-pointer transition-all duration-[120ms] hover:border-border-3"
      style={{ borderColor: 'var(--border-2)' }}
      onClick={() => navigate(`/team/${contact.id}`)}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <AvatarWithFallback contact={contact} size="lg" />
        <div className="w-full min-w-0">
          <p className="text-t1 font-semibold text-sm truncate">
            {contact.firstName} {contact.lastName}
          </p>
          {contact.role && (
            <p className="text-t3 text-xs truncate mt-0.5">{contact.role}</p>
          )}
        </div>
        <span className={`status-badge ${BADGE[contact.category]}`}>
          {LABEL[contact.category]}
        </span>
        {contact.email && (
          <p className="text-t3 text-xs truncate w-full">{contact.email}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write ContactRow (list/table view)**

```tsx
// src/components/contacts/ContactRow.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function ContactRow({ contact }: { contact: Contact }) {
  const navigate = useNavigate();
  return (
    <tr
      className="cursor-pointer transition-all duration-[120ms] hover:bg-surface-2"
      onClick={() => navigate(`/team/${contact.id}`)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <AvatarWithFallback contact={contact} size="sm" />
          <div>
            <p className="text-t1 text-sm font-medium">
              {contact.firstName} {contact.lastName}
            </p>
            {contact.role && <p className="text-t3 text-xs">{contact.role}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`status-badge ${BADGE[contact.category]}`}>
          {LABEL[contact.category]}
        </span>
      </td>
      <td className="px-4 py-3 text-t2 text-sm">{contact.email ?? '—'}</td>
      <td className="px-4 py-3 text-t2 text-sm">{contact.phone ?? '—'}</td>
      <td className="px-4 py-3 text-t3 text-xs">{contact.city ?? '—'}</td>
    </tr>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/contacts/ContactCard.tsx src/components/contacts/ContactRow.tsx
git commit -m "feat: add ContactCard and ContactRow display components"
```

---

## Task 5: ContactFilters Component

**Files:**
- Create: `src/components/contacts/ContactFilters.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/contacts/ContactFilters.tsx
import React from 'react';
import type { ContactCategory } from '../../types/contacts';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  category: ContactCategory | 'all';
  onCategoryChange: (v: ContactCategory | 'all') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (v: 'grid' | 'list') => void;
}

const CATEGORIES: Array<{ value: ContactCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'collaborator', label: 'Collaborators' },
  { value: 'crew', label: 'Crew' },
  { value: 'business', label: 'Business' },
  { value: 'other', label: 'Other' },
];

export default function ContactFilters({
  search, onSearchChange,
  category, onCategoryChange,
  viewMode, onViewModeChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <img
          src="/TM-Search-negro.svg"
          className="pxi-md icon-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          alt=""
        />
        <input
          type="text"
          placeholder="Search by name, email, role, or tag..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm"
          style={{
            backgroundColor: 'var(--surface-2)',
            color: 'var(--t1)',
            border: '1px solid var(--border-2)',
          }}
        />
      </div>

      {/* Category tabs */}
      <div className="sub-tabs flex-shrink-0">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={`sub-tab ${category === c.value ? 'active' : ''}`}
            onClick={() => onCategoryChange(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          className={`btn btn-sm btn-icon ${viewMode === 'grid' ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => onViewModeChange('grid')}
          title="Grid view"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="0" y="0" width="6" height="6" /><rect x="8" y="0" width="6" height="6" />
            <rect x="0" y="8" width="6" height="6" /><rect x="8" y="8" width="6" height="6" />
          </svg>
        </button>
        <button
          className={`btn btn-sm btn-icon ${viewMode === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => onViewModeChange('list')}
          title="List view"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="0" y="1" width="14" height="2" /><rect x="0" y="6" width="14" height="2" />
            <rect x="0" y="11" width="14" height="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/contacts/ContactFilters.tsx
git commit -m "feat: add ContactFilters component (search, category tabs, view toggle)"
```

---

## Task 6: Team.tsx Rewrite (Contact List Page)

**Files:**
- Modify: `src/pages/Team.tsx` (delete all existing content, write from scratch)

- [ ] **Step 1: Replace the entire file**

```tsx
// src/pages/Team.tsx
import React, { useState, useEffect } from 'react';
import ContactCard from '../components/contacts/ContactCard';
import ContactRow from '../components/contacts/ContactRow';
import ContactFilters from '../components/contacts/ContactFilters';
import ContactFormModal from '../components/contacts/ContactFormModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getContacts } from '../lib/contacts';
import type { Contact, ContactCategory } from '../types/contacts';

export default function Team() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ContactCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setIsLoading(true);
      setContacts(await getContacts());
    } catch (err) {
      setError('Failed to load contacts.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.role?.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q));
    return matchesSearch && (category === 'all' || c.category === category);
  });

  if (isLoading) return <LoadingSpinner fullScreen={false} />;

  return (
    <div className="p-4 md:p-6 space-y-[28px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1>Contacts</h1>
        <button
          className="btn btn-primary btn-md"
          onClick={() => { setEditingContact(null); setIsFormOpen(true); }}
        >
          + Add Contact
        </button>
      </div>

      {error && (
        <div
          className="p-4 border-l-4 text-sm"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--status-red)', color: 'var(--status-red)' }}
        >
          {error}
        </div>
      )}

      <ContactFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Count */}
      {contacts.length > 0 && (
        <p className="text-t3 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
          {filtered.length} OF {contacts.length} CONTACTS
        </p>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="empty-state">
          <img src="/TM-File-negro.svg" className="pxi-xl icon-muted empty-state-icon" alt="" />
          <p className="empty-state-title">No contacts found</p>
          <p className="empty-state-desc">
            {contacts.length === 0
              ? 'Add your first contact to get started.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      )}

      {/* Grid view */}
      {filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((c) => <ContactCard key={c.id} contact={c} />)}
        </div>
      )}

      {/* List view */}
      {filtered.length > 0 && viewMode === 'list' && (
        <div className="tm-card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => <ContactRow key={c.id} contact={c} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isFormOpen && (
        <ContactFormModal
          contact={editingContact ?? undefined}
          onSaved={() => { setIsFormOpen(false); load(); }}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Start dev server and verify the Team tab renders**

```bash
npm run dev
```
Navigate to `/team`. Expected: page loads with "Contacts" header, "+ Add Contact" button, filters, and empty state (since no contacts exist yet).
Check browser console for no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Team.tsx
git commit -m "feat: rewrite Team page as unified contacts list with grid/list views"
```

---

## Task 7: ContactFormModal

**Files:**
- Create: `src/components/contacts/ContactFormModal.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/contacts/ContactFormModal.tsx
import React, { useState } from 'react';
import Modal from '../Modal';
import AvatarWithFallback from './AvatarWithFallback';
import { createContact, updateContact, uploadContactPhoto } from '../../lib/contacts';
import type {
  Contact, ContactCategory, ContactFormData, SeatingPreference, SocialLinks,
} from '../../types/contacts';

interface Props {
  contact?: Contact;
  onSaved: () => void;
  onClose: () => void;
}

const EMPTY: ContactFormData = {
  category: 'other',
  role: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  website: '',
  homeAirport: '',
  seatingPreference: undefined,
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  socialLinks: {},
  proAffiliations: [],
  publisherAffiliations: [],
  bio: '',
  notes: '',
  tags: [],
};

export default function ContactFormModal({ contact, onSaved, onClose }: Props) {
  const [form, setForm] = useState<ContactFormData>(
    contact
      ? {
          category: contact.category,
          role: contact.role ?? '',
          firstName: contact.firstName,
          lastName: contact.lastName,
          profilePhotoUrl: contact.profilePhotoUrl,
          email: contact.email ?? '',
          phone: contact.phone ?? '',
          website: contact.website ?? '',
          homeAirport: contact.homeAirport ?? '',
          seatingPreference: contact.seatingPreference,
          address: contact.address ?? '',
          city: contact.city ?? '',
          state: contact.state ?? '',
          country: contact.country ?? '',
          postalCode: contact.postalCode ?? '',
          socialLinks: contact.socialLinks ?? {},
          proAffiliations: contact.proAffiliations ?? [],
          publisherAffiliations: contact.publisherAffiliations ?? [],
          bio: contact.bio ?? '',
          notes: contact.notes ?? '',
          tags: contact.tags ?? [],
        }
      : { ...EMPTY }
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(contact?.profilePhotoUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  function set<K extends keyof ContactFormData>(key: K, val: ContactFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function setSocial(key: keyof SocialLinks, val: string) {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: val || undefined },
    }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag)) return;
    set('tags', [...form.tags, tag]);
    setTagInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const saved = contact
        ? await updateContact(contact.id, form)
        : await createContact(form);
      if (photoFile) {
        const photoUrl = await uploadContactPhoto(saved.id, photoFile);
        await updateContact(saved.id, { profilePhotoUrl: photoUrl });
      }
      onSaved();
    } catch (err) {
      console.error(err);
      setError('Failed to save contact. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={contact ? 'Edit Contact' : 'Add Contact'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-sm" style={{ color: 'var(--status-red)' }}>{error}</p>
        )}

        {/* Photo */}
        <div className="flex justify-center">
          <label className="cursor-pointer group relative">
            <div className="w-20 h-20 rounded-full overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} className="w-full h-full object-cover" alt="" />
              ) : (
                <AvatarWithFallback
                  contact={{
                    firstName: form.firstName || '?',
                    lastName: form.lastName || '?',
                    profilePhotoUrl: undefined,
                    socialLinks: form.socialLinks,
                  }}
                  size="xl"
                />
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-[120ms] flex items-center justify-center">
              <img src="/TM-Upload-negro.svg" className="pxi-md icon-white" alt="Upload" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>

        {/* Category & Role */}
        <div className="form-row-2">
          <div className="form-field">
            <label>Category *</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value as ContactCategory)}
              required
            >
              <option value="collaborator">Collaborator</option>
              <option value="crew">Crew</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-field">
            <label>Role / Title</label>
            <input
              type="text"
              value={form.role ?? ''}
              onChange={(e) => set('role', e.target.value)}
              placeholder="e.g. Songwriter, Tour Manager, Attorney"
            />
          </div>
        </div>

        {/* Name */}
        <div className="form-row-2">
          <div className="form-field">
            <label>First Name *</label>
            <input type="text" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Last Name *</label>
            <input type="text" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
          </div>
        </div>

        {/* Contact */}
        <div className="form-row-2">
          <div className="form-field">
            <label>Email</label>
            <input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Phone</label>
            <input type="tel" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
          </div>
        </div>

        <div className="form-field">
          <label>Website</label>
          <input type="url" value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
        </div>

        {/* Address */}
        <div>
          <p className="section-header mb-3">Address</p>
          <div className="space-y-3">
            <div className="form-field">
              <label>Street Address</label>
              <input type="text" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="form-row-3">
              <div className="form-field">
                <label>City</label>
                <input type="text" value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div className="form-field">
                <label>State / Region</label>
                <input type="text" value={form.state ?? ''} onChange={(e) => set('state', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Country</label>
                <input type="text" value={form.country ?? ''} onChange={(e) => set('country', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Travel (crew + collaborators only) */}
        {(form.category === 'crew' || form.category === 'collaborator') && (
          <div>
            <p className="section-header mb-3">Travel Preferences</p>
            <div className="form-row-2">
              <div className="form-field">
                <label>Home Airport</label>
                <input
                  type="text"
                  value={form.homeAirport ?? ''}
                  onChange={(e) => set('homeAirport', e.target.value)}
                  placeholder="e.g. LAX, JFK, LHR"
                />
              </div>
              <div className="form-field">
                <label>Seating Preference</label>
                <select
                  value={form.seatingPreference ?? ''}
                  onChange={(e) =>
                    set('seatingPreference', (e.target.value as SeatingPreference) || undefined)
                  }
                >
                  <option value="">No preference</option>
                  <option value="window">Window</option>
                  <option value="aisle">Aisle</option>
                  <option value="middle">Middle</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Social Media */}
        <div>
          <p className="section-header mb-3">Social Media</p>
          <div className="form-row-2">
            {([
              ['instagram', 'Instagram', 'handle (no @)'],
              ['twitter', 'Twitter / X', 'handle (no @)'],
              ['tiktok', 'TikTok', 'handle (no @)'],
              ['spotify', 'Spotify', 'artist ID or URL'],
              ['soundcloud', 'SoundCloud', 'username'],
              ['linkedin', 'LinkedIn', 'linkedin.com/in/...'],
            ] as Array<[keyof SocialLinks, string, string]>).map(([key, label, placeholder]) => (
              <div key={key} className="form-field">
                <label>{label}</label>
                <input
                  type="text"
                  value={form.socialLinks[key] ?? ''}
                  onChange={(e) => setSocial(key, e.target.value)}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
          <p className="text-t3 text-xs mt-2">
            Instagram or Twitter handle will be used as profile photo if no photo is uploaded.
          </p>
        </div>

        {/* Collaborator: PRO affiliations */}
        {form.category === 'collaborator' && (
          <div>
            <p className="section-header mb-3">PRO & Publishing</p>
            <div className="space-y-2 mb-3">
              <p className="text-t2 text-xs font-medium">PRO Affiliations</p>
              {form.proAffiliations.map((pro, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="flex-1"
                    type="text"
                    value={pro.name}
                    onChange={(e) => {
                      const updated = [...form.proAffiliations];
                      updated[i] = { ...updated[i], name: e.target.value };
                      set('proAffiliations', updated);
                    }}
                    placeholder="PRO name (ASCAP, BMI, SESAC...)"
                  />
                  <input
                    className="w-28"
                    type="text"
                    value={pro.ipiNumber ?? ''}
                    onChange={(e) => {
                      const updated = [...form.proAffiliations];
                      updated[i] = { ...updated[i], ipiNumber: e.target.value };
                      set('proAffiliations', updated);
                    }}
                    placeholder="IPI #"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() =>
                      set('proAffiliations', form.proAffiliations.filter((_, j) => j !== i))
                    }
                  >
                    <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="Remove" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  set('proAffiliations', [...form.proAffiliations, { name: '', isPrimary: false }])
                }
              >
                + Add PRO
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-t2 text-xs font-medium">Publisher Affiliations</p>
              {form.publisherAffiliations.map((pub, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="flex-1"
                    type="text"
                    value={pub.name}
                    onChange={(e) => {
                      const updated = [...form.publisherAffiliations];
                      updated[i] = { ...updated[i], name: e.target.value };
                      set('publisherAffiliations', updated);
                    }}
                    placeholder="Publisher name"
                  />
                  <input
                    className="w-28"
                    type="text"
                    value={pub.ipiNumber ?? ''}
                    onChange={(e) => {
                      const updated = [...form.publisherAffiliations];
                      updated[i] = { ...updated[i], ipiNumber: e.target.value };
                      set('publisherAffiliations', updated);
                    }}
                    placeholder="IPI #"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() =>
                      set('publisherAffiliations', form.publisherAffiliations.filter((_, j) => j !== i))
                    }
                  >
                    <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="Remove" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  set('publisherAffiliations', [...form.publisherAffiliations, { name: '', isPrimary: false }])
                }
              >
                + Add Publisher
              </button>
            </div>
          </div>
        )}

        {/* Bio */}
        <div className="form-field">
          <label>Bio</label>
          <textarea
            value={form.bio ?? ''}
            onChange={(e) => set('bio', e.target.value)}
            rows={3}
            placeholder="Brief bio or background..."
          />
        </div>

        {/* Tags */}
        <div className="form-field">
          <label>Tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Type a tag and press Enter"
              className="flex-1"
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>
              Add
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map((tag) => (
                <span key={tag} className="status-badge badge-neutral flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => set('tags', form.tags.filter((t) => t !== tag))}
                    className="ml-1 flex items-center"
                  >
                    <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="Remove" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button type="button" className="btn btn-ghost btn-md" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-md" disabled={isSaving}>
            {isSaving ? 'Saving...' : contact ? 'Save Changes' : 'Add Contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Test — open the form, add a contact, verify it appears in the grid**

Open the app, click "+ Add Contact". Fill in: Category = Crew, First = "Test", Last = "User", Email = "test@test.com". Submit.
Expected: modal closes, contact card appears in the grid with initials avatar.

- [ ] **Step 3: Commit**

```bash
git add src/components/contacts/ContactFormModal.tsx
git commit -m "feat: add ContactFormModal with photo upload, social links, PRO/publisher fields, tags"
```

---

## Task 8: ContactProfile Page + Route

**Files:**
- Create: `src/pages/ContactProfile.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add the route in `src/App.tsx`**

Find the existing `/team` route in App.tsx. Add the new detail route directly after it:

```tsx
// At the top of App.tsx, with other lazy imports:
const ContactProfile = React.lazy(() => import('./pages/ContactProfile'));

// In the routes, after the /team route:
<Route path="/team/:id" element={
  <ProtectedRoute requiredPermission="view_personnel">
    <ContactProfile />
  </ProtectedRoute>
} />
```

- [ ] **Step 2: Write the ContactProfile page shell**

```tsx
// src/pages/ContactProfile.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProfileHero from '../components/contacts/ProfileHero';
import OverviewTab from '../components/contacts/OverviewTab';
import DocumentsTab from '../components/contacts/DocumentsTab';
import PaymentTab from '../components/contacts/PaymentTab';
import NotesTab from '../components/contacts/NotesTab';
import ContactFormModal from '../components/contacts/ContactFormModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getContact, deleteContact } from '../lib/contacts';
import type { Contact } from '../types/contacts';

type Tab = 'overview' | 'documents' | 'payment' | 'notes';

export default function ContactProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (id) load(id); }, [id]);

  async function load(contactId: string) {
    try {
      setIsLoading(true);
      setContact(await getContact(contactId));
    } catch {
      setError('Contact not found.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!contact) return;
    if (!window.confirm(`Delete ${contact.firstName} ${contact.lastName}? This cannot be undone.`)) return;
    await deleteContact(contact.id);
    navigate('/team');
  }

  if (isLoading) return <LoadingSpinner fullScreen={false} />;

  if (error || !contact) {
    return (
      <div className="p-6">
        <button className="btn btn-ghost btn-sm flex items-center gap-1 mb-6" onClick={() => navigate('/team')}>
          <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-muted" alt="" />
          <span className="text-t3 text-xs uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Contacts</span>
        </button>
        <p className="text-t3">{error ?? 'Contact not found.'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back navigation */}
      <div className="px-4 md:px-6 pt-5">
        <button
          className="btn btn-ghost btn-sm flex items-center gap-1"
          onClick={() => navigate('/team')}
        >
          <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-muted" alt="" />
          <span className="text-t3 text-xs uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
            Contacts
          </span>
        </button>
      </div>

      {/* Hero */}
      <ProfileHero
        contact={contact}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
      />

      {/* Page-level tabs */}
      <div
        className="px-4 md:px-6"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="tm-tabs">
          {(['overview', 'documents', 'payment', 'notes'] as Tab[]).map((tab) => (
            <button
              key={tab}
              className={`tm-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 md:p-6">
        {activeTab === 'overview'   && <OverviewTab contact={contact} />}
        {activeTab === 'documents'  && <DocumentsTab contactId={contact.id} />}
        {activeTab === 'payment'    && <PaymentTab contactId={contact.id} />}
        {activeTab === 'notes'      && (
          <NotesTab
            contact={contact}
            onUpdate={(notes) => setContact({ ...contact, notes })}
          />
        )}
      </div>

      {isEditing && (
        <ContactFormModal
          contact={contact}
          onSaved={() => { setIsEditing(false); if (id) load(id); }}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Test navigation**

Click a contact card in the grid. Expected: browser navigates to `/team/:id`. Page shows loading state, then "ProfileHero not found" or similar error (ProfileHero not yet created — that's fine, confirms routing works).

- [ ] **Step 4: Commit**

```bash
git add src/pages/ContactProfile.tsx src/App.tsx
git commit -m "feat: add ContactProfile page and /team/:id route"
```

---

## Task 9: ProfileHero Component

**Files:**
- Create: `src/components/contacts/ProfileHero.tsx`

- [ ] **Step 1: Write the component**

```tsx
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
```

- [ ] **Step 2: Verify profile page renders fully**

Navigate to `/team/:id`. Expected: hero section shows avatar, name, role, category badge, contact links, social badge links, edit/delete buttons. Tabs below are visible.

- [ ] **Step 3: Commit**

```bash
git add src/components/contacts/ProfileHero.tsx
git commit -m "feat: add ProfileHero with avatar, social links, and contact actions"
```

---

## Task 10: Overview Tab

**Files:**
- Create: `src/components/contacts/OverviewTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/contacts/OverviewTab.tsx
import React from 'react';
import type { Contact } from '../../types/contacts';

const SEATING_LABELS = {
  window: 'Window', aisle: 'Aisle', middle: 'Middle', no_preference: 'No preference',
} as const;

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p
        className="text-t3 text-xs uppercase mb-0.5"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </p>
      <p className="text-t1 text-sm">{value}</p>
    </div>
  );
}

export default function OverviewTab({ contact }: { contact: Contact }) {
  const hasAddress = contact.address || contact.city || contact.state || contact.country;
  const hasTravel = contact.homeAirport || contact.seatingPreference;
  const hasCollab = contact.category === 'collaborator' &&
    (contact.proAffiliations.length > 0 || contact.publisherAffiliations.length > 0);

  return (
    <div className="space-y-[28px]">
      {/* Contact info */}
      <div className="tm-card tm-card-padded">
        <div className="tm-card-header"><h2>Contact Information</h2></div>
        <div className="tm-card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <Field label="Email"   value={contact.email} />
            <Field label="Phone"   value={contact.phone} />
            <Field label="Website" value={contact.website} />
          </div>
        </div>
      </div>

      {/* Address */}
      {hasAddress && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Address</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <Field label="Street"       value={contact.address} />
              <Field label="City"         value={contact.city} />
              <Field label="State/Region" value={contact.state} />
              <Field label="Country"      value={contact.country} />
              <Field label="Postal Code"  value={contact.postalCode} />
            </div>
          </div>
        </div>
      )}

      {/* Travel */}
      {hasTravel && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Travel Preferences</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Home Airport"       value={contact.homeAirport} />
              <Field
                label="Seating Preference"
                value={contact.seatingPreference ? SEATING_LABELS[contact.seatingPreference] : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* PRO & Publishing (collaborators only) */}
      {hasCollab && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>PRO & Publishing</h2></div>
          <div className="tm-card-body space-y-6">
            {contact.proAffiliations.length > 0 && (
              <div>
                <p className="section-header mb-2">PRO Affiliations</p>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Organization</th><th>IPI Number</th></tr></thead>
                    <tbody>
                      {contact.proAffiliations.map((pro, i) => (
                        <tr key={i}>
                          <td className="text-t1">{pro.name}</td>
                          <td className="text-t2">{pro.ipiNumber ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {contact.publisherAffiliations.length > 0 && (
              <div>
                <p className="section-header mb-2">Publisher Affiliations</p>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Publisher</th><th>IPI Number</th></tr></thead>
                    <tbody>
                      {contact.publisherAffiliations.map((pub, i) => (
                        <tr key={i}>
                          <td className="text-t1">{pub.name}</td>
                          <td className="text-t2">{pub.ipiNumber ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bio */}
      {contact.bio && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Bio</h2></div>
          <div className="tm-card-body">
            <p className="text-t2 text-sm leading-relaxed whitespace-pre-wrap">{contact.bio}</p>
          </div>
        </div>
      )}

      {/* No data state */}
      {!contact.email && !contact.phone && !contact.website && !hasAddress && !hasTravel && !hasCollab && !contact.bio && (
        <div className="empty-state">
          <p className="empty-state-title">No overview information</p>
          <p className="empty-state-desc">Edit this contact to add details.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Test in browser**

Open a contact profile. Click "Overview" tab. Create a Collaborator contact with address, PRO affiliations, and a bio. Expected: all sections render correctly. Crew contact should not show PRO section.

- [ ] **Step 3: Commit**

```bash
git add src/components/contacts/OverviewTab.tsx
git commit -m "feat: add OverviewTab with contact info, address, travel, PRO/publisher, bio"
```

---

## Task 11: Payment Tab

**Files:**
- Create: `src/components/contacts/PaymentTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/contacts/PaymentTab.tsx
import React, { useState, useEffect } from 'react';
import { getContactPaymentInfo, upsertContactPaymentInfo } from '../../lib/contacts';
import type { ContactPaymentInfo, ContactPaymentFormData } from '../../types/contacts';

const EMPTY_FORM: ContactPaymentFormData = {
  bankName: '', accountHolderName: '', routingNumber: '', accountNumber: '',
  accountType: undefined, swiftCode: '', iban: '', bankAddress: '',
  paypalEmail: '', venmoHandle: '', zelleContact: '',
  taxId: '', w9OnFile: false,
};

function mask(val: string | undefined, show = 4): string {
  if (!val) return '—';
  if (val.length <= show) return val;
  return '•'.repeat(val.length - show) + val.slice(-show);
}

export default function PaymentTab({ contactId }: { contactId: string }) {
  const [data, setData] = useState<ContactPaymentInfo | null>(null);
  const [form, setForm] = useState<ContactPaymentFormData>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, [contactId]);

  async function load() {
    try {
      setIsLoading(true);
      const result = await getContactPaymentInfo(contactId);
      setData(result);
      if (result) {
        setForm({
          bankName: result.bankName ?? '',
          accountHolderName: result.accountHolderName ?? '',
          routingNumber: result.routingNumber ?? '',
          accountNumber: result.accountNumber ?? '',
          accountType: result.accountType,
          swiftCode: result.swiftCode ?? '',
          iban: result.iban ?? '',
          bankAddress: result.bankAddress ?? '',
          paypalEmail: result.paypalEmail ?? '',
          venmoHandle: result.venmoHandle ?? '',
          zelleContact: result.zelleContact ?? '',
          taxId: result.taxId ?? '',
          w9OnFile: result.w9OnFile,
        });
      }
    } catch { setError('Failed to load payment info.'); }
    finally { setIsLoading(false); }
  }

  function set<K extends keyof ContactPaymentFormData>(key: K, val: ContactPaymentFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await upsertContactPaymentInfo(contactId, form);
      await load();
      setIsEditing(false);
    } catch { setError('Failed to save.'); }
    finally { setIsSaving(false); }
  }

  if (isLoading) return <p className="text-t3 text-sm">Loading...</p>;

  const hasAny = data && (
    data.bankName || data.routingNumber || data.accountNumber ||
    data.swiftCode || data.iban || data.paypalEmail ||
    data.venmoHandle || data.zelleContact || data.taxId || data.w9OnFile
  );

  // Edit form
  if (isEditing) {
    return (
      <div className="space-y-[28px]">
        {error && <p className="text-sm" style={{ color: 'var(--status-red)' }}>{error}</p>}

        {/* Bank / ACH */}
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Bank / ACH</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                ['bankName',          'Bank Name'],
                ['accountHolderName', 'Account Holder Name'],
                ['routingNumber',     'Routing Number'],
                ['accountNumber',     'Account Number'],
              ] as Array<[keyof ContactPaymentFormData, string]>).map(([key, label]) => (
                <div key={key} className="form-field">
                  <label>{label}</label>
                  <input
                    type="text"
                    value={(form[key] as string) ?? ''}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
              ))}
              <div className="form-field">
                <label>Account Type</label>
                <select
                  value={form.accountType ?? ''}
                  onChange={(e) =>
                    set('accountType', (e.target.value as 'checking' | 'savings') || undefined)
                  }
                >
                  <option value="">Select...</option>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Wire */}
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Wire / International</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                ['swiftCode',   'SWIFT / BIC Code'],
                ['iban',        'IBAN'],
                ['bankAddress', 'Bank Address'],
              ] as Array<[keyof ContactPaymentFormData, string]>).map(([key, label]) => (
                <div key={key} className="form-field">
                  <label>{label}</label>
                  <input
                    type="text"
                    value={(form[key] as string) ?? ''}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Digital */}
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Digital Payments</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                ['paypalEmail',  'PayPal (email)'],
                ['venmoHandle',  'Venmo (username)'],
                ['zelleContact', 'Zelle (email or phone)'],
              ] as Array<[keyof ContactPaymentFormData, string]>).map(([key, label]) => (
                <div key={key} className="form-field">
                  <label>{label}</label>
                  <input
                    type="text"
                    value={(form[key] as string) ?? ''}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tax */}
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Tax Information</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-field">
                <label>Tax ID (SSN or EIN)</label>
                <input
                  type="text"
                  value={form.taxId ?? ''}
                  onChange={(e) => set('taxId', e.target.value)}
                  placeholder="XXX-XX-XXXX"
                />
              </div>
              <div className="form-field">
                <label>W-9 Status</label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="w9OnFile"
                    checked={form.w9OnFile}
                    onChange={(e) => set('w9OnFile', e.target.checked)}
                  />
                  <label
                    htmlFor="w9OnFile"
                    className="text-t2 text-sm"
                    style={{ fontFamily: 'inherit', textTransform: 'none', letterSpacing: 'normal' }}
                  >
                    W-9 has been received
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost btn-md" onClick={() => setIsEditing(false)}>Cancel</button>
          <button className="btn btn-primary btn-md" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Payment Info'}
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!hasAny) {
    return (
      <div className="empty-state">
        <img src="/TM-File-negro.svg" className="pxi-xl icon-muted empty-state-icon" alt="" />
        <p className="empty-state-title">No payment information</p>
        <p className="empty-state-desc">
          Add bank details, wire info, digital payment handles, and tax information.
        </p>
        <button className="btn btn-primary btn-sm mt-4" onClick={() => setIsEditing(true)}>
          Add Payment Info
        </button>
      </div>
    );
  }

  // Read view (sensitive fields are masked)
  return (
    <div className="space-y-[28px]">
      <div className="flex justify-end">
        <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={() => setIsEditing(true)}>
          <img src="/TM-Pluma-negro.png" className="pxi-sm icon-white" alt="" />
          Edit
        </button>
      </div>

      {(data?.bankName || data?.routingNumber || data?.accountNumber) && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Bank / ACH</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {data?.bankName          && <div><p className="section-header mb-0.5">Bank</p><p className="text-t1 text-sm">{data.bankName}</p></div>}
              {data?.accountHolderName && <div><p className="section-header mb-0.5">Account Holder</p><p className="text-t1 text-sm">{data.accountHolderName}</p></div>}
              {data?.routingNumber     && <div><p className="section-header mb-0.5">Routing #</p><p className="text-t1 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{mask(data.routingNumber)}</p></div>}
              {data?.accountNumber     && <div><p className="section-header mb-0.5">Account #</p><p className="text-t1 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{mask(data.accountNumber)}</p></div>}
              {data?.accountType       && <div><p className="section-header mb-0.5">Type</p><p className="text-t1 text-sm capitalize">{data.accountType}</p></div>}
            </div>
          </div>
        </div>
      )}

      {(data?.swiftCode || data?.iban) && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Wire / International</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {data?.swiftCode && <div><p className="section-header mb-0.5">SWIFT/BIC</p><p className="text-t1 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{data.swiftCode}</p></div>}
              {data?.iban      && <div><p className="section-header mb-0.5">IBAN</p><p className="text-t1 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{data.iban}</p></div>}
            </div>
          </div>
        </div>
      )}

      {(data?.paypalEmail || data?.venmoHandle || data?.zelleContact) && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Digital Payments</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {data?.paypalEmail  && <div><p className="section-header mb-0.5">PayPal</p><p className="text-t1 text-sm">{data.paypalEmail}</p></div>}
              {data?.venmoHandle  && <div><p className="section-header mb-0.5">Venmo</p><p className="text-t1 text-sm">@{data.venmoHandle}</p></div>}
              {data?.zelleContact && <div><p className="section-header mb-0.5">Zelle</p><p className="text-t1 text-sm">{data.zelleContact}</p></div>}
            </div>
          </div>
        </div>
      )}

      {(data?.taxId || data?.w9OnFile) && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Tax</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {data?.taxId && (
                <div>
                  <p className="section-header mb-0.5">Tax ID</p>
                  <p className="text-t1 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                    {mask(data.taxId)}
                  </p>
                </div>
              )}
              <div>
                <p className="section-header mb-0.5">W-9</p>
                <span className={`status-badge ${data?.w9OnFile ? 'badge-green' : 'badge-neutral'}`}>
                  {data?.w9OnFile ? 'On file' : 'Not received'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Test in browser**

Open a contact profile → Payment tab. Expected: empty state with "Add Payment Info" button. Click it, fill in bank name and routing number, save. Expected: read view shows masked routing number (e.g., `•••••1234`).

- [ ] **Step 3: Commit**

```bash
git add src/components/contacts/PaymentTab.tsx
git commit -m "feat: add PaymentTab with masked read view and full edit form"
```

---

## Task 12: Documents Tab

**Files:**
- Create: `src/components/contacts/DocumentsTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/contacts/DocumentsTab.tsx
import React, { useState, useEffect, useRef } from 'react';
import { getContactFiles, uploadContactFile, deleteContactFile, getContactFileDownloadUrl } from '../../lib/contacts';
import type { ContactFile } from '../../types/contacts';

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DocumentsTab({ contactId }: { contactId: string }) {
  const [files, setFiles] = useState<ContactFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, [contactId]);

  async function load() {
    try {
      setIsLoading(true);
      setFiles(await getContactFiles(contactId));
    } catch { setError('Failed to load documents.'); }
    finally { setIsLoading(false); }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      await uploadContactFile(contactId, file, file.name.replace(/\.[^.]+$/, ''));
      await load();
    } catch { setError('Upload failed. Check file size (max 25 MB).'); }
    finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDownload(file: ContactFile) {
    try {
      const url = await getContactFileDownloadUrl(file.filePath);
      window.open(url, '_blank');
    } catch { setError('Failed to generate download link.'); }
  }

  async function handleDelete(file: ContactFile) {
    if (!window.confirm(`Delete "${file.fileName}"?`)) return;
    try {
      await deleteContactFile(file);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch { setError('Failed to delete file.'); }
  }

  if (isLoading) return <p className="text-t3 text-sm">Loading...</p>;

  return (
    <div className="space-y-[28px]">
      {error && (
        <p className="text-sm" style={{ color: 'var(--status-red)' }}>{error}</p>
      )}

      <div className="flex justify-end">
        <button
          className="btn btn-primary btn-sm flex items-center gap-1"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <img src="/TM-Upload-negro.svg" className="pxi-sm icon-white" alt="" />
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <img src="/TM-File-negro.svg" className="pxi-xl icon-muted empty-state-icon" alt="" />
          <p className="empty-state-title">No documents</p>
          <p className="empty-state-desc">
            Upload passports, W-9s, contracts, NDAs, or any other relevant files.
            Files are stored privately and only accessible by your team.
          </p>
        </div>
      ) : (
        <div className="tm-card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <img src="/TM-File-negro.svg" className="pxi-sm icon-muted flex-shrink-0" alt="" />
                        <span className="text-t1 text-sm">{file.fileName}</span>
                      </div>
                    </td>
                    <td className="text-t3 text-xs">{formatSize(file.fileSize)}</td>
                    <td className="text-t3 text-xs">
                      {new Date(file.uploadedAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Download"
                          onClick={() => handleDownload(file)}
                        >
                          <img src="/TM-Download-negro.svg" className="pxi-sm icon-muted" alt="Download" />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Delete"
                          onClick={() => handleDelete(file)}
                        >
                          <img src="/TM-Trash-negro.svg" className="pxi-sm icon-danger" alt="Delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Test in browser**

Open a profile → Documents tab. Click "Upload Document", upload a small PDF. Expected: file appears in the table with name, size, date. Click download button → signed URL opens in new tab. Click delete → confirm dialog → file disappears.

- [ ] **Step 3: Commit**

```bash
git add src/components/contacts/DocumentsTab.tsx
git commit -m "feat: add DocumentsTab with secure upload, download (signed URLs), and delete"
```

---

## Task 13: Notes Tab

**Files:**
- Create: `src/components/contacts/NotesTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/contacts/NotesTab.tsx
import React, { useState } from 'react';
import { updateContact } from '../../lib/contacts';
import type { Contact } from '../../types/contacts';

interface Props {
  contact: Contact;
  onUpdate: (notes: string) => void;
}

export default function NotesTab({ contact, onUpdate }: Props) {
  const [notes, setNotes] = useState(contact.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDirty = notes !== (contact.notes ?? '');

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await updateContact(contact.id, { notes });
      onUpdate(notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError('Failed to save notes.'); }
    finally { setIsSaving(false); }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {error && <p className="text-sm" style={{ color: 'var(--status-red)' }}>{error}</p>}
      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        placeholder="Add notes about this contact — previous quotes, context, relationship history..."
        rows={14}
        className="w-full text-sm leading-relaxed"
        style={{
          backgroundColor: 'var(--surface-2)',
          color: 'var(--t1)',
          border: '1px solid var(--border-2)',
          padding: '14px',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />
      <div className="flex items-center justify-between">
        <p className="text-t3 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
          {notes.length > 0 ? `${notes.length} characters` : ''}
        </p>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs" style={{ color: 'var(--status-green)' }}>Saved</span>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test in browser**

Open a profile → Notes tab. Type some text, click "Save Notes". Refresh the page and navigate back to the same contact. Expected: notes persist.

- [ ] **Step 3: Final smoke test — complete golden path**

1. Go to `/team` — grid view loads, empty state shows
2. Click "+ Add Contact" → fill category=Crew, role=FOH Engineer, first=Jane, last=Smith, email=jane@test.com, Instagram=janesmith, click submit
3. Expected: card appears with initials avatar (or unavatar.io photo if `janesmith` has an Instagram)
4. Click the card → navigates to `/team/:id`
5. ProfileHero shows name, role badge, email
6. Click "Documents" tab → upload a file → file appears in table
7. Click "Payment" tab → add PayPal email → shows in read view
8. Click "Notes" tab → add text → save → refresh → text persists
9. Click "Edit" → change role to "Monitor Engineer" → save → hero reflects change
10. Check browser console — no errors throughout

- [ ] **Step 4: Commit**

```bash
git add src/components/contacts/NotesTab.tsx
git commit -m "feat: add NotesTab with dirty-state detection and auto-save feedback"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Covered by |
|---|---|
| Basic info (name, email, phone, website) | ContactFormModal + OverviewTab |
| File uploads (passports, etc.) | DocumentsTab + `uploadContactFile` + `contact-files` bucket |
| Payment info (bank, wire, PayPal, Venmo, Tax ID) | PaymentTab + `contact_payment_info` table |
| Home airport + seating preference | ContactFormModal + OverviewTab (crew/collaborator) |
| Unified contact list (legal, PR, artists, crew, etc.) | `contacts` table with category + role |
| Profile per contact | `/team/:id` → ContactProfile page |
| Securely stored files | Private Supabase Storage bucket + signed URLs |
| Profile photos + social import | AvatarWithFallback + unavatar.io fallback |
| Grid view with photos | ContactCard + responsive grid in Team.tsx |
| PRO/publisher (existing data) | Preserved in `pro_affiliations` / `publisher_affiliations` JSONB |
| Notes per contact | NotesTab |
| Tags | ContactFormModal + tags[] in contacts table |
| Search + filter | ContactFilters (name/email/role/tag search + category tabs) |

**No placeholder gaps found.**

**Type consistency confirmed:** `ContactFormData`, `Contact`, `ContactPaymentInfo`, `ContactPaymentFormData`, and `ContactFile` are used consistently across all tasks.

---

