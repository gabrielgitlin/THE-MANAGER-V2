import { supabase } from './supabase';
import { currentWorkspaceId } from './workspaces';
import type { Organization, OrganizationFormData } from '../types/organizations';

const FROM_DB = (r: Record<string, unknown>): Organization => ({
  id: r.id as string,
  workspaceId: r.workspace_id as string,
  createdBy: r.created_by as string,
  name: r.name as string,
  type: r.type as Organization['type'],
  parentOrgId: (r.parent_org_id as string | null) ?? undefined,
  website: (r.website as string | null) ?? undefined,
  email: (r.email as string | null) ?? undefined,
  phone: (r.phone as string | null) ?? undefined,
  address: (r.address as string | null) ?? undefined,
  city: (r.city as string | null) ?? undefined,
  state: (r.state as string | null) ?? undefined,
  country: (r.country as string | null) ?? undefined,
  postalCode: (r.postal_code as string | null) ?? undefined,
  logoUrl: (r.logo_url as string | null) ?? undefined,
  bio: (r.bio as string | null) ?? undefined,
  notes: (r.notes as string | null) ?? undefined,
  tags: (r.tags as string[]) ?? [],
  socialLinks: (r.social_links as Record<string, string>) ?? {},
  visibility: r.visibility as 'workspace' | 'private',
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

export async function getOrganizations(): Promise<Organization[]> {
  const wsId = await currentWorkspaceId();
  const { data, error } = await supabase.from('organizations')
    .select('*').eq('workspace_id', wsId).order('name');
  if (error) throw error;
  return (data ?? []).map(r => FROM_DB(r as Record<string, unknown>));
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const wsId = await currentWorkspaceId();
  const { data, error } = await supabase.from('organizations')
    .select('*').eq('id', id).eq('workspace_id', wsId).maybeSingle();
  if (error) throw error;
  return data ? FROM_DB(data as Record<string, unknown>) : null;
}

export async function createOrganization(form: OrganizationFormData): Promise<Organization> {
  const wsId = await currentWorkspaceId();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('organizations').insert({
    workspace_id: wsId, created_by: user.id,
    name: form.name, type: form.type, parent_org_id: form.parentOrgId ?? null,
    website: form.website ?? null, email: form.email ?? null, phone: form.phone ?? null,
    address: form.address ?? null, city: form.city ?? null, state: form.state ?? null,
    country: form.country ?? null, postal_code: form.postalCode ?? null,
    logo_url: form.logoUrl ?? null, bio: form.bio ?? null, notes: form.notes ?? null,
    tags: form.tags ?? [], social_links: form.socialLinks ?? {},
    visibility: form.visibility ?? 'workspace',
  }).select('*').single();
  if (error || !data) throw error ?? new Error('insert failed');
  return FROM_DB(data as Record<string, unknown>);
}

export async function updateOrganization(id: string, form: Partial<OrganizationFormData>): Promise<Organization> {
  const patch: Record<string, unknown> = {};
  if (form.name !== undefined) patch.name = form.name;
  if (form.type !== undefined) patch.type = form.type;
  if (form.parentOrgId !== undefined) patch.parent_org_id = form.parentOrgId;
  if (form.website !== undefined) patch.website = form.website;
  if (form.email !== undefined) patch.email = form.email;
  if (form.phone !== undefined) patch.phone = form.phone;
  if (form.address !== undefined) patch.address = form.address;
  if (form.city !== undefined) patch.city = form.city;
  if (form.state !== undefined) patch.state = form.state;
  if (form.country !== undefined) patch.country = form.country;
  if (form.postalCode !== undefined) patch.postal_code = form.postalCode;
  if (form.logoUrl !== undefined) patch.logo_url = form.logoUrl;
  if (form.bio !== undefined) patch.bio = form.bio;
  if (form.notes !== undefined) patch.notes = form.notes;
  if (form.tags !== undefined) patch.tags = form.tags;
  if (form.socialLinks !== undefined) patch.social_links = form.socialLinks;
  if (form.visibility !== undefined) patch.visibility = form.visibility;

  const wsId = await currentWorkspaceId();
  const { data, error } = await supabase.from('organizations')
    .update(patch).eq('id', id).eq('workspace_id', wsId).select('*').single();
  if (error || !data) throw error ?? new Error('update failed');
  return FROM_DB(data as Record<string, unknown>);
}

export async function deleteOrganization(id: string): Promise<void> {
  const wsId = await currentWorkspaceId();
  const { error } = await supabase.from('organizations').delete().eq('id', id).eq('workspace_id', wsId);
  if (error) throw error;
}

export async function findOrganizationByName(name: string): Promise<Organization | null> {
  const wsId = await currentWorkspaceId();
  const { data, error } = await supabase.from('organizations')
    .select('*').eq('workspace_id', wsId).ilike('name', name).limit(1).maybeSingle();
  if (error) throw error;
  return data ? FROM_DB(data as Record<string, unknown>) : null;
}
