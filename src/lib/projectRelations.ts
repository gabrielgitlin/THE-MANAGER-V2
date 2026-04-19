import { supabase } from './supabase';
import { currentWorkspaceId } from './workspaces';
import type { ProjectRelation, ProjectRelationFormData } from '../types/projectRelations';

const FROM_DB = (r: Record<string, unknown>): ProjectRelation => ({
  id: r.id as string,
  workspaceId: r.workspace_id as string,
  projectId: r.project_id as string,
  contactId: (r.contact_id as string | null) ?? undefined,
  organizationId: (r.organization_id as string | null) ?? undefined,
  role: r.role as string,
  roleCustom: (r.role_custom as string | null) ?? undefined,
  isPrimary: r.is_primary as boolean,
  notes: (r.notes as string | null) ?? undefined,
  createdAt: r.created_at as string,
});

export async function getRelationsForProject(projectId: string): Promise<ProjectRelation[]> {
  const wsId = await currentWorkspaceId();
  const { data, error } = await supabase.from('project_relations')
    .select('*')
    .eq('workspace_id', wsId)
    .eq('project_id', projectId)
    .order('is_primary', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(r => FROM_DB(r as Record<string, unknown>));
}

export async function getProjectsForContact(contactId: string): Promise<ProjectRelation[]> {
  const wsId = await currentWorkspaceId();
  const { data, error } = await supabase.from('project_relations')
    .select('*')
    .eq('workspace_id', wsId)
    .eq('contact_id', contactId);
  if (error) throw error;
  return (data ?? []).map(r => FROM_DB(r as Record<string, unknown>));
}

export async function getProjectsForOrganization(orgId: string): Promise<ProjectRelation[]> {
  const wsId = await currentWorkspaceId();
  const { data, error } = await supabase.from('project_relations')
    .select('*')
    .eq('workspace_id', wsId)
    .eq('organization_id', orgId);
  if (error) throw error;
  return (data ?? []).map(r => FROM_DB(r as Record<string, unknown>));
}

export async function createRelation(input: ProjectRelationFormData): Promise<ProjectRelation> {
  const wsId = await currentWorkspaceId();
  const { data, error } = await supabase.from('project_relations').insert({
    workspace_id: wsId,
    project_id: input.projectId,
    contact_id: input.contactId ?? null,
    organization_id: input.organizationId ?? null,
    role: input.role,
    role_custom: input.roleCustom ?? null,
    is_primary: input.isPrimary,
    notes: input.notes ?? null,
  }).select('*').single();
  if (error || !data) throw error ?? new Error('insert failed');
  return FROM_DB(data as Record<string, unknown>);
}

export async function updateRelation(id: string, patch: Partial<ProjectRelationFormData>): Promise<ProjectRelation> {
  const wsId = await currentWorkspaceId();
  const update: Record<string, unknown> = {};
  if (patch.role !== undefined) update.role = patch.role;
  if (patch.roleCustom !== undefined) update.role_custom = patch.roleCustom;
  if (patch.isPrimary !== undefined) update.is_primary = patch.isPrimary;
  if (patch.notes !== undefined) update.notes = patch.notes;
  const { data, error } = await supabase.from('project_relations')
    .update(update).eq('id', id).eq('workspace_id', wsId).select('*').single();
  if (error || !data) throw error ?? new Error('update failed');
  return FROM_DB(data as Record<string, unknown>);
}

export async function deleteRelation(id: string): Promise<void> {
  const wsId = await currentWorkspaceId();
  const { error } = await supabase.from('project_relations')
    .delete().eq('id', id).eq('workspace_id', wsId);
  if (error) throw error;
}
