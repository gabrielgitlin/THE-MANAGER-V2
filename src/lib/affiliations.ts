import { supabase } from './supabase';
import { currentWorkspaceId } from './workspaces';
import type { ContactAffiliation, AffiliationFormData } from '../types/affiliations';

const FROM_DB = (r: Record<string, unknown>): ContactAffiliation => ({
  id: r.id as string,
  workspaceId: r.workspace_id as string,
  contactId: r.contact_id as string,
  organizationId: r.organization_id as string,
  role: r.role as string,
  roleCustom: (r.role_custom as string | null) ?? undefined,
  title: (r.title as string | null) ?? undefined,
  startDate: (r.start_date as string | null) ?? undefined,
  endDate: (r.end_date as string | null) ?? undefined,
  isPrimary: r.is_primary as boolean,
  notes: (r.notes as string | null) ?? undefined,
  createdAt: r.created_at as string,
});

export async function getAffiliationsForContact(contactId: string): Promise<ContactAffiliation[]> {
  const wsId = await currentWorkspaceId();
  const { data, error } = await supabase.from('contact_affiliations')
    .select('*')
    .eq('workspace_id', wsId)
    .eq('contact_id', contactId)
    .order('is_primary', { ascending: false })
    .order('start_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(r => FROM_DB(r as Record<string, unknown>));
}

export async function getAffiliationsForOrganization(orgId: string): Promise<ContactAffiliation[]> {
  const wsId = await currentWorkspaceId();
  const { data, error } = await supabase.from('contact_affiliations')
    .select('*')
    .eq('workspace_id', wsId)
    .eq('organization_id', orgId)
    .order('is_primary', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(r => FROM_DB(r as Record<string, unknown>));
}

export async function createAffiliation(form: AffiliationFormData): Promise<ContactAffiliation> {
  const wsId = await currentWorkspaceId();
  const { data, error } = await supabase.from('contact_affiliations').insert({
    workspace_id: wsId,
    contact_id: form.contactId,
    organization_id: form.organizationId,
    role: form.role,
    role_custom: form.roleCustom ?? null,
    title: form.title ?? null,
    start_date: form.startDate ?? null,
    end_date: form.endDate ?? null,
    is_primary: form.isPrimary,
    notes: form.notes ?? null,
  }).select('*').single();
  if (error || !data) throw error ?? new Error('insert failed');
  return FROM_DB(data as Record<string, unknown>);
}

export async function updateAffiliation(id: string, form: Partial<AffiliationFormData>): Promise<ContactAffiliation> {
  const wsId = await currentWorkspaceId();
  const patch: Record<string, unknown> = {};
  if (form.role !== undefined) patch.role = form.role;
  if (form.roleCustom !== undefined) patch.role_custom = form.roleCustom;
  if (form.title !== undefined) patch.title = form.title;
  if (form.startDate !== undefined) patch.start_date = form.startDate;
  if (form.endDate !== undefined) patch.end_date = form.endDate;
  if (form.isPrimary !== undefined) patch.is_primary = form.isPrimary;
  if (form.notes !== undefined) patch.notes = form.notes;
  const { data, error } = await supabase.from('contact_affiliations')
    .update(patch).eq('id', id).eq('workspace_id', wsId).select('*').single();
  if (error || !data) throw error ?? new Error('update failed');
  return FROM_DB(data as Record<string, unknown>);
}

export async function deleteAffiliation(id: string): Promise<void> {
  const wsId = await currentWorkspaceId();
  const { error } = await supabase.from('contact_affiliations')
    .delete().eq('id', id).eq('workspace_id', wsId);
  if (error) throw error;
}
