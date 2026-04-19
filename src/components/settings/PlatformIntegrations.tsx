import React, { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { getIntegrations, saveIntegration, toggleIntegration, type PlatformIntegration } from '../../lib/platformSync';
import { supabase } from '../../lib/supabase';

export default function PlatformIntegrations() {
  const [integrations, setIntegrations] = useState<PlatformIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlatform, setEditingPlatform] = useState<'bandsintown' | 'songkick' | null>(null);
  const [formData, setFormData] = useState({
    api_key: '',
    artist_name: '',
    platform_artist_id: '',
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const { data: artist } = await supabase
        .from('artists')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (artist) {
        const data = await getIntegrations(artist.id);
        setIntegrations(data);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (platform: 'bandsintown' | 'songkick') => {
    try {
      const { data: artist } = await supabase
        .from('artists')
        .select('id')
        .limit(1)
        .single();

      await saveIntegration({
        artist_id: artist.id,
        platform,
        enabled: true,
        ...formData,
      });

      setEditingPlatform(null);
      setFormData({ api_key: '', artist_name: '', platform_artist_id: '' });
      loadIntegrations();
    } catch (error) {
      console.error('Error saving integration:', error);
      alert('Failed to save integration');
    }
  };

  const handleToggle = async (integrationId: string, enabled: boolean) => {
    try {
      await toggleIntegration(integrationId, enabled);
      loadIntegrations();
    } catch (error) {
      console.error('Error toggling integration:', error);
    }
  };

  const platforms = [
    {
      id: 'bandsintown' as const,
      name: 'Bandsintown',
      description: 'Sync your shows to Bandsintown',
      color: 'bg-cyan-500',
    },
    {
      id: 'songkick' as const,
      name: 'Songkick',
      description: 'Sync your shows to Songkick',
      color: 'bg-pink-500',
    },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading integrations...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-title mb-2" style={{ color: 'var(--t1)' }}>PLATFORM INTEGRATIONS</h2>
        <p className="text-sm" style={{ color: 'var(--t2)' }}>
          Connect your account to automatically sync shows to other platforms
        </p>
      </div>

      <div className="space-y-4">
        {platforms.map((platform) => {
          const integration = integrations.find(i => i.platform === platform.id);
          const isConnected = !!integration;
          const isEnabled = integration?.enabled || false;

          return (
            <div key={platform.id} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center`}>
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--t1)' }}>{platform.name}</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>{platform.description}</p>
                    {integration?.last_sync && (
                      <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--t2)' }}>
                        <img src="/TM-Refresh-negro.svg" className="pxi-sm icon-muted" alt="" />
                        Last synced: {new Date(integration.last_sync).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isConnected && (
                    <button
                      onClick={() => handleToggle(integration.id, !isEnabled)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isEnabled
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isEnabled ? (
                        <>
                          <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-green inline mr-1" alt="" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <img src="/TM-Close-negro.svg" className="pxi-md icon-muted inline mr-1" alt="" />
                          Disabled
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setEditingPlatform(platform.id)}
                    className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
                  >
                    {isConnected ? 'Edit' : 'Connect'}
                  </button>
                </div>
              </div>

              {editingPlatform === platform.id && (
                <div style={{ borderColor: 'var(--border)' }} className="mt-6 pt-6 border-t">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--t1)' }}>
                        API Key
                      </label>
                      <input
                        type="password"
                        value={formData.api_key}
                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                        className="w-full px-3 py-2 rounded-md focus:ring-primary focus:border-primary" style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                        placeholder={`Your ${platform.name} API key`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--t1)' }}>
                        Artist Name
                      </label>
                      <input
                        type="text"
                        value={formData.artist_name}
                        onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-md focus:ring-primary focus:border-primary" style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                        placeholder={`Your artist name on ${platform.name}`}
                      />
                    </div>

                    {platform.id === 'songkick' && (
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--t1)' }}>
                          Artist ID
                        </label>
                        <input
                          type="text"
                          value={formData.platform_artist_id}
                          onChange={(e) => setFormData({ ...formData, platform_artist_id: e.target.value })}
                          className="w-full px-3 py-2 rounded-md focus:ring-primary focus:border-primary" style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                          placeholder="Your Songkick artist ID"
                        />
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleSave(platform.id)}
                        className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingPlatform(null);
                          setFormData({ api_key: '', artist_name: '', platform_artist_id: '' });
                        }}
                        className="px-4 py-2 rounded-md text-sm font-medium hover:opacity-80" style={{ background: 'var(--surface-2)', color: 'var(--t1)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
