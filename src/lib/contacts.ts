import { supabase } from './supabase';
import type {
  Contact, ContactFormData,
  ContactPaymentInfo, ContactPaymentFormData,
  ContactFile,
} from '../types/contacts';

// ─── Pure helpers (exported for tests) ────────────────────────────────────────

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
  if (formData.category !== undefined)              updates.category = formData.category;
  if (formData.role !== undefined)                  updates.role = formData.role || null;
  if (formData.firstName !== undefined)             updates.first_name = formData.firstName;
  if (formData.lastName !== undefined)              updates.last_name = formData.lastName;
  if (formData.profilePhotoUrl !== undefined)       updates.profile_photo_url = formData.profilePhotoUrl || null;
  if (formData.email !== undefined)                 updates.email = formData.email || null;
  if (formData.phone !== undefined)                 updates.phone = formData.phone || null;
  if (formData.website !== undefined)               updates.website = formData.website || null;
  if (formData.homeAirport !== undefined)           updates.home_airport = formData.homeAirport || null;
  if (formData.seatingPreference !== undefined)     updates.seating_preference = formData.seatingPreference || null;
  if (formData.address !== undefined)               updates.address = formData.address || null;
  if (formData.city !== undefined)                  updates.city = formData.city || null;
  if (formData.state !== undefined)                 updates.state = formData.state || null;
  if (formData.country !== undefined)               updates.country = formData.country || null;
  if (formData.postalCode !== undefined)            updates.postal_code = formData.postalCode || null;
  if (formData.socialLinks !== undefined)           updates.social_links = formData.socialLinks;
  if (formData.proAffiliations !== undefined)       updates.pro_affiliations = formData.proAffiliations;
  if (formData.publisherAffiliations !== undefined) updates.publisher_affiliations = formData.publisherAffiliations;
  if (formData.bio !== undefined)                   updates.bio = formData.bio || null;
  if (formData.notes !== undefined)                 updates.notes = formData.notes || null;
  if (formData.tags !== undefined)                  updates.tags = formData.tags;

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
    .insert({
      contact_id: contactId,
      file_name: file.name,
      file_type: file.type,
      file_path: filePath,
      file_size: file.size,
      description: description ?? null,
    })
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
