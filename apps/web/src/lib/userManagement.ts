import { supabase } from './supabase';
import { Role, AccessLevel, ModulePermissions } from './permissions';

export interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  avatar_url: string | null;
  created_at: string;
}

export interface UserPermission {
  user_id: string;
  module: keyof ModulePermissions;
  access_level: AccessLevel;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: Role;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  const { data, error } = await supabase.rpc('get_team_members');

  if (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }

  return data || [];
};

export const getUserPermissions = async (userId: string): Promise<UserPermission[]> => {
  const { data, error } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user permissions:', error);
    throw error;
  }

  return data || [];
};

export const updateUserPermission = async (
  userId: string,
  module: keyof ModulePermissions,
  accessLevel: AccessLevel
): Promise<void> => {
  const { error } = await supabase
    .from('user_permissions')
    .upsert({
      user_id: userId,
      module,
      access_level: accessLevel,
    });

  if (error) {
    console.error('Error updating user permission:', error);
    throw error;
  }
};

export const deleteUserPermission = async (
  userId: string,
  module: keyof ModulePermissions
): Promise<void> => {
  const { error } = await supabase
    .from('user_permissions')
    .delete()
    .eq('user_id', userId)
    .eq('module', module);

  if (error) {
    console.error('Error deleting user permission:', error);
    throw error;
  }
};

export const updateUserRole = async (userId: string, role: Role): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const inviteUser = async (email: string, role: Role): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const randomPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

  const { data: newUser, error: signUpError } = await supabase.auth.signUp({
    email,
    password: randomPassword,
    options: {
      data: {
        role,
        name: email.split('@')[0],
      },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });

  if (signUpError) {
    console.error('Error inviting user:', signUpError);
    throw signUpError;
  }

  if (!newUser.user) {
    throw new Error('Failed to create user');
  }

  const { error: inviteError } = await supabase
    .from('team_invitations')
    .insert({
      email,
      role,
      invited_by: user.id,
    });

  if (inviteError) {
    console.error('Error creating invitation record:', inviteError);
    throw inviteError;
  }
};

export const getTeamInvitations = async (): Promise<TeamInvitation[]> => {
  const { data, error } = await supabase
    .from('team_invitations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invitations:', error);
    throw error;
  }

  return data || [];
};

export const deleteTeamMember = async (userId: string): Promise<void> => {
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
