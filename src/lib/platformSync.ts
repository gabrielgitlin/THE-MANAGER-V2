import { supabase } from './supabase';

export interface PlatformIntegration {
  id: string;
  artist_id: string;
  platform: 'bandsintown' | 'songkick';
  enabled: boolean;
  api_key?: string;
  artist_name?: string;
  platform_artist_id?: string;
  last_sync?: string;
}

export async function getIntegrations(artistId: string): Promise<PlatformIntegration[]> {
  const { data, error } = await supabase
    .from('platform_integrations')
    .select('*')
    .eq('artist_id', artistId);

  if (error) throw error;
  return data || [];
}

export async function saveIntegration(integration: Omit<PlatformIntegration, 'id' | 'last_sync'>) {
  const { data, error } = await supabase
    .from('platform_integrations')
    .upsert(integration, {
      onConflict: 'artist_id,platform',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleIntegration(integrationId: string, enabled: boolean) {
  const { error } = await supabase
    .from('platform_integrations')
    .update({ enabled })
    .eq('id', integrationId);

  if (error) throw error;
}

export async function syncShowToPlatforms(showData: any, artistId: string) {
  const integrations = await getIntegrations(artistId);
  const enabledIntegrations = integrations.filter(i => i.enabled);

  const results = await Promise.allSettled(
    enabledIntegrations.map(async (integration) => {
      const functionName = integration.platform === 'bandsintown'
        ? 'sync-bandsintown'
        : 'sync-songkick';

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ showData, artistId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to sync to ${integration.platform}`);
      }

      return await response.json();
    })
  );

  return results;
}
