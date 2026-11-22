import { supabase } from './supabase';

export interface AnalyticsIntegration {
  id: string;
  artist_id: string;
  platform: 'youtube' | 'spotify' | 'instagram' | 'twitter' | 'facebook' | 'tiktok';
  enabled: boolean;
  platform_user_id?: string;
  platform_username?: string;
  channel_id?: string;
  last_sync?: string;
  sync_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface YouTubeChannelAnalytics {
  id: string;
  integration_id: string;
  date: string;
  subscribers: number;
  views: number;
  videos: number;
  average_view_duration?: string;
  watch_time_minutes: number;
  likes: number;
  comments: number;
  shares: number;
  estimated_revenue: number;
  created_at: string;
}

export interface YouTubeVideoAnalytics {
  id: string;
  integration_id: string;
  video_id: string;
  title: string;
  published_at: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watch_time_minutes: number;
  average_view_duration?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
].join(" ");

export async function getYouTubeIntegration(artistId: string): Promise<AnalyticsIntegration | null> {
  const { data, error } = await supabase
    .from('analytics_integrations')
    .select('*')
    .eq('artist_id', artistId)
    .eq('platform', 'youtube')
    .maybeSingle();

  if (error) {
    console.error('Error fetching YouTube integration:', error);
    return null;
  }

  return data;
}

export function initiateYouTubeOAuth(artistId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: YOUTUBE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: JSON.stringify({ artist_id: artistId, platform: 'youtube' }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleYouTubeOAuthCallback(
  code: string,
  redirectUri: string,
  artistId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-oauth-callback`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, redirect_uri: redirectUri, artist_id: artistId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to connect YouTube account');
    }

    return { success: true };
  } catch (error) {
    console.error('YouTube OAuth callback error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function fetchYouTubeAnalytics(
  integrationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-youtube-analytics`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ integration_id: integrationId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch YouTube analytics');
    }

    return { success: true };
  } catch (error) {
    console.error('Fetch YouTube analytics error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getYouTubeChannelAnalytics(
  integrationId: string,
  startDate?: string,
  endDate?: string
): Promise<YouTubeChannelAnalytics[]> {
  let query = supabase
    .from('youtube_channel_analytics')
    .select('*')
    .eq('integration_id', integrationId)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching channel analytics:', error);
    return [];
  }

  return data || [];
}

export async function getYouTubeVideoAnalytics(
  integrationId: string,
  limit: number = 10
): Promise<YouTubeVideoAnalytics[]> {
  const { data, error } = await supabase
    .from('youtube_video_analytics')
    .select('*')
    .eq('integration_id', integrationId)
    .order('views', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching video analytics:', error);
    return [];
  }

  return data || [];
}

export async function disconnectYouTube(integrationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('analytics_integrations')
    .delete()
    .eq('id', integrationId);

  if (error) {
    console.error('Error disconnecting YouTube:', error);
    return false;
  }

  return true;
}

export async function toggleYouTubeSync(integrationId: string, enabled: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('analytics_integrations')
    .update({ sync_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('id', integrationId);

  if (error) {
    console.error('Error toggling YouTube sync:', error);
    return false;
  }

  return true;
}
