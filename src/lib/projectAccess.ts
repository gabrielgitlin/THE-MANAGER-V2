import { supabase } from './supabase';
import { currentWorkspaceId } from './workspaces';

export async function addProjectMember(
  projectId: string,
  userId: string,
  access: 'view' | 'edit' = 'edit'
): Promise<void> {
  const wsId = await currentWorkspaceId();
  const { error } = await supabase.from('project_members').insert({
    project_id: projectId,
    user_id: userId,
    access,
    workspace_id: wsId,
  });
  if (error) throw error;
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function getProjectMembers(projectId: string) {
  const { data, error } = await supabase.from('project_members')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return data ?? [];
}
