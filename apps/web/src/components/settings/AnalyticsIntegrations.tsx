import React, { useState, useEffect } from 'react';
import { Youtube, Music as Spotify, Instagram, Twitter, Facebook, Music as TikTok, Loader2 } from 'lucide-react';
import {
  getYouTubeIntegration,
  initiateYouTubeOAuth,
  handleYouTubeOAuthCallback,
  fetchYouTubeAnalytics,
  disconnectYouTube,
  toggleYouTubeSync,
  type AnalyticsIntegration
} from '../../lib/youtubeAnalytics';
import { supabase } from '../../lib/supabase';

export default function AnalyticsIntegrations() {
  const [youtubeIntegration, setYoutubeIntegration] = useState<AnalyticsIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
    handleOAuthCallback();
  }, []);

  const loadIntegrations = async () => {
    try {
      const { data: artist } = await supabase
        .from('artists')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (artist) {
        const youtube = await getYouTubeIntegration(artist.id);
        setYoutubeIntegration(youtube);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
      setError('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      try {
        const stateData = JSON.parse(state);
        if (stateData.platform === 'youtube') {
          const redirectUri = `${window.location.origin}${window.location.pathname}`;
          const result = await handleYouTubeOAuthCallback(code, redirectUri, stateData.artist_id);

          if (result.success) {
            window.history.replaceState({}, document.title, window.location.pathname);
            loadIntegrations();
          } else {
            setError(result.error || 'Failed to connect YouTube');
          }
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError('Failed to process OAuth callback');
      }
    }
  };

  const handleYouTubeConnect = async () => {
    try {
      const { data: artist } = await supabase
        .from('artists')
        .select('id')
        .limit(1)
        .single();

      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const authUrl = initiateYouTubeOAuth(artist.id, redirectUri);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating YouTube OAuth:', error);
      setError('Failed to initiate YouTube connection');
    }
  };

  const handleYouTubeDisconnect = async () => {
    if (!youtubeIntegration || !confirm('Are you sure you want to disconnect YouTube? This will delete all stored analytics data.')) {
      return;
    }

    try {
      const success = await disconnectYouTube(youtubeIntegration.id);
      if (success) {
        setYoutubeIntegration(null);
      } else {
        setError('Failed to disconnect YouTube');
      }
    } catch (error) {
      console.error('Error disconnecting YouTube:', error);
      setError('Failed to disconnect YouTube');
    }
  };

  const handleYouTubeSync = async () => {
    if (!youtubeIntegration) return;

    setSyncing(true);
    setError(null);

    try {
      const result = await fetchYouTubeAnalytics(youtubeIntegration.id);
      if (result.success) {
        loadIntegrations();
      } else {
        setError(result.error || 'Failed to sync YouTube analytics');
      }
    } catch (error) {
      console.error('Error syncing YouTube:', error);
      setError('Failed to sync YouTube analytics');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    if (!youtubeIntegration) return;

    try {
      const success = await toggleYouTubeSync(youtubeIntegration.id, enabled);
      if (success) {
        loadIntegrations();
      } else {
        setError('Failed to toggle auto-sync');
      }
    } catch (error) {
      console.error('Error toggling sync:', error);
      setError('Failed to toggle auto-sync');
    }
  };

  const platforms = [
    {
      id: 'youtube' as const,
      name: 'YouTube',
      description: 'Track video views, subscribers, and engagement metrics',
      icon: Youtube,
      color: 'bg-red-500',
      integration: youtubeIntegration,
      onConnect: handleYouTubeConnect,
      onDisconnect: handleYouTubeDisconnect,
      onSync: handleYouTubeSync,
      available: true,
    },
    {
      id: 'spotify' as const,
      name: 'Spotify for Artists',
      description: 'Monitor streams, listeners, and playlist placements',
      icon: Spotify,
      color: 'bg-green-500',
      integration: null,
      available: false,
    },
    {
      id: 'instagram' as const,
      name: 'Instagram',
      description: 'Track followers, reach, and post engagement',
      icon: Instagram,
      color: 'bg-pink-500',
      integration: null,
      available: false,
    },
    {
      id: 'twitter' as const,
      name: 'Twitter',
      description: 'Monitor tweets, impressions, and follower growth',
      icon: Twitter,
      color: 'bg-blue-400',
      integration: null,
      available: false,
    },
    {
      id: 'facebook' as const,
      name: 'Facebook',
      description: 'Track page insights and post performance',
      icon: Facebook,
      color: 'bg-blue-600',
      integration: null,
      available: false,
    },
    {
      id: 'tiktok' as const,
      name: 'TikTok',
      description: 'Monitor video views, followers, and engagement',
      icon: TikTok,
      color: 'bg-black',
      integration: null,
      available: false,
    },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading analytics integrations...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-title mb-2" style={{ color: 'var(--t1)' }}>ANALYTICS INTEGRATIONS</h2>
        <p className="text-sm" style={{ color: 'var(--t2)' }}>
          Connect your social media and streaming accounts to track real-time analytics
        </p>
      </div>

      {error && (
        <div style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--t1)' }} className="border px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isConnected = !!platform.integration;
          const isEnabled = platform.integration?.enabled || false;
          const isSyncEnabled = platform.integration?.sync_enabled || false;

          return (
            <div key={platform.id} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--t1)' }}>{platform.name}</h3>
                      {!platform.available && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>{platform.description}</p>

                    {isConnected && platform.integration && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--t2)' }}>
                          <span className="font-medium">Channel:</span>
                          <span>{platform.integration.platform_username}</span>
                        </div>

                        {platform.integration.last_sync && (
                          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--t2)' }}>
                            <img src="/TM-Refresh-negro.svg" className="pxi-sm icon-muted" alt="" />
                            Last synced: {new Date(platform.integration.last_sync).toLocaleString()}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={isSyncEnabled}
                              onChange={(e) => handleToggleSync(e.target.checked)}
                              className="rounded text-primary focus:ring-primary" style={{ borderColor: 'var(--border)' }}
                            />
                            <span style={{ color: 'var(--t1)' }}>Auto-sync daily</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {isConnected && platform.onSync && (
                    <button
                      onClick={platform.onSync}
                      disabled={syncing}
                      className="px-4 py-2 rounded-md text-sm font-medium hover:opacity-80 disabled:opacity-50 flex items-center gap-2" style={{ background: 'var(--surface-2)', color: 'var(--t1)' }}
                    >
                      {syncing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <img src="/TM-Refresh-negro.svg" className="pxi-md icon-white" alt="" />
                          Sync Now
                        </>
                      )}
                    </button>
                  )}

                  {platform.available ? (
                    isConnected ? (
                      <button
                        onClick={platform.onDisconnect}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={platform.onConnect}
                        className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
                      >
                        <img src="/TM-ExternalLink-negro.svg" className="pxi-md icon-white" alt="" />
                        Connect
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-100 text-gray-400 rounded-md text-sm font-medium cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }} className="border-l-4 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium" style={{ color: 'var(--t1)' }}>About Analytics Integrations</h3>
            <div className="mt-2 text-sm" style={{ color: 'var(--t2)' }}>
              <ul className="list-disc list-inside space-y-1">
                <li>Connect your accounts to automatically track performance metrics</li>
                <li>Data is synced daily and displayed in the Marketing Analytics dashboard</li>
                <li>You can manually sync at any time to get the latest numbers</li>
                <li>All data is stored securely and only accessible to your team</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
