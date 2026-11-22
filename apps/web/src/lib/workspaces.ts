import { supabase } from './supabase';

export async function ensurePersonalWorkspace(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('teams')
    .insert({ name: 'Personal Workspace', owner_id: user.id })
    .select('id')
    .single();

  if (error || !created) throw error ?? new Error('workspace create failed');

  const { error: memberError } = await supabase.from('team_members').insert({
    team_id: created.id,
    user_id: user.id,
    seat_role: 'owner',
  });
  if (memberError) throw memberError;

  return created.id;
}

export async function currentWorkspaceId(): Promise<string> {
  return ensurePersonalWorkspace();
}
