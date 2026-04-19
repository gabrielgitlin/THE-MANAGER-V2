import { supabase, isSupabaseReady, getConnectionError } from './supabase';
import type { PersonnelProfile, PersonnelPRO, PersonnelPublisher, PersonnelFormData } from '../types/personnel';

// Default mock data for when Supabase is not available
const DEFAULT_PROS = [
  { id: 'ascap', name: 'ASCAP', country: 'United States' },
  { id: 'bmi', name: 'BMI', country: 'United States' },
  { id: 'prs', name: 'PRS', country: 'United Kingdom' },
];

const DEFAULT_PUBLISHERS = [
  { id: 'warner', name: 'Warner Chappell Music' },
  { id: 'universal', name: 'Universal Music Publishing Group' },
  { id: 'sony', name: 'Sony Music Publishing' },
];

export async function getPersonnelProfiles() {
  if (!isSupabaseReady()) {
    console.warn('Supabase not ready:', getConnectionError());
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('_deprecated_personnel_profiles')
      .select(`
        *,
        personnel_pros(
          id,
          pro_id,
          ipi_number,
          is_primary,
          performance_rights_organizations(
            name,
            country
          )
        ),
        personnel_publishers(
          id,
          publisher_id,
          ipi_number,
          is_primary,
          publishers(
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching personnel profiles:', error);
    return [];
  }
}

export async function getPersonnelProfile(id: string) {
  if (!isSupabaseReady()) {
    console.warn('Supabase not ready:', getConnectionError());
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('_deprecated_personnel_profiles')
      .select(`
        *,
        personnel_pros(
          id,
          pro_id,
          ipi_number,
          is_primary,
          performance_rights_organizations(
            name,
            country
          )
        ),
        personnel_publishers(
          id,
          publisher_id,
          ipi_number,
          is_primary,
          publishers(
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching personnel profile:', error);
    return null;
  }
}

export async function createPersonnelProfile(data: PersonnelFormData) {
  if (!isSupabaseReady()) {
    throw new Error('Database connection not available. Please try again later.');
  }

  try {
    const { pros, publishers, ...profileData } = data;
    
    // Start a Supabase transaction
    const { data: profile, error: profileError } = await supabase
      .from('_deprecated_personnel_profiles')
      .insert([{
        type: profileData.type,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        date_of_birth: profileData.dateOfBirth,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        country: profileData.country,
        postal_code: profileData.postalCode,
        bio: profileData.bio,
        website: profileData.website,
        social_links: profileData.socialLinks,
      }])
      .select()
      .single();

    if (profileError) throw profileError;

    // Add PROs
    if (pros.length > 0) {
      const { error: prosError } = await supabase
        .from('_deprecated_personnel_pros')
        .insert(
          pros.map(pro => ({
            personnel_id: profile.id,
            pro_id: pro.proId,
            ipi_number: pro.ipiNumber,
            is_primary: pro.isPrimary,
          }))
        );

      if (prosError) throw prosError;
    }

    // Add Publishers
    if (publishers.length > 0) {
      const { error: publishersError } = await supabase
        .from('_deprecated_personnel_publishers')
        .insert(
          publishers.map(pub => ({
            personnel_id: profile.id,
            publisher_id: pub.publisherId,
            ipi_number: pub.ipiNumber,
            is_primary: pub.isPrimary,
          }))
        );

      if (publishersError) throw publishersError;
    }

    return profile;
  } catch (error) {
    console.error('Error creating personnel profile:', error);
    throw error;
  }
}

export async function updatePersonnelProfile(id: string, data: PersonnelFormData) {
  if (!isSupabaseReady()) {
    throw new Error('Database connection not available. Please try again later.');
  }

  try {
    const { pros, publishers, ...profileData } = data;

    // Update profile
    const { error: profileError } = await supabase
      .from('_deprecated_personnel_profiles')
      .update({
        type: profileData.type,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        date_of_birth: profileData.dateOfBirth,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        country: profileData.country,
        postal_code: profileData.postalCode,
        bio: profileData.bio,
        website: profileData.website,
        social_links: profileData.socialLinks,
      })
      .eq('id', id);

    if (profileError) throw profileError;

    // Delete existing PROs and Publishers
    await supabase.from('_deprecated_personnel_pros').delete().eq('personnel_id', id);
    await supabase.from('_deprecated_personnel_publishers').delete().eq('personnel_id', id);

    // Add new PROs
    if (pros.length > 0) {
      const { error: prosError } = await supabase
        .from('_deprecated_personnel_pros')
        .insert(
          pros.map(pro => ({
            personnel_id: id,
            pro_id: pro.proId,
            ipi_number: pro.ipiNumber,
            is_primary: pro.isPrimary,
          }))
        );

      if (prosError) throw prosError;
    }

    // Add new Publishers
    if (publishers.length > 0) {
      const { error: publishersError } = await supabase
        .from('_deprecated_personnel_publishers')
        .insert(
          publishers.map(pub => ({
            personnel_id: id,
            publisher_id: pub.publisherId,
            ipi_number: pub.ipiNumber,
            is_primary: pub.isPrimary,
          }))
        );

      if (publishersError) throw publishersError;
    }

    return getPersonnelProfile(id);
  } catch (error) {
    console.error('Error updating personnel profile:', error);
    throw error;
  }
}

export async function deletePersonnelProfile(id: string) {
  if (!isSupabaseReady()) {
    throw new Error('Database connection not available. Please try again later.');
  }

  try {
    const { error } = await supabase
      .from('_deprecated_personnel_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting personnel profile:', error);
    throw error;
  }
}

export async function getPROs() {
  if (!isSupabaseReady()) {
    console.warn('Supabase not ready:', getConnectionError());
    return DEFAULT_PROS;
  }

  try {
    const { data, error } = await supabase
      .from('_deprecated_performance_rights_organizations')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching PROs:', error);
      return DEFAULT_PROS;
    }
    
    return data || DEFAULT_PROS;
  } catch (error) {
    console.error('Error fetching PROs:', error);
    return DEFAULT_PROS;
  }
}

export async function getPublishers() {
  // First check if Supabase is ready
  if (!isSupabaseReady()) {
    console.warn('Supabase not ready:', getConnectionError());
    return DEFAULT_PUBLISHERS;
  }

  try {
    const { data, error } = await supabase
      .from('_deprecated_publishers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching publishers:', error);
      return DEFAULT_PUBLISHERS;
    }
    
    return data || DEFAULT_PUBLISHERS;
  } catch (error) {
    console.error('Error fetching publishers:', error);
    return DEFAULT_PUBLISHERS;
  }
}