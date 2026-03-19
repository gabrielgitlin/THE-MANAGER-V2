import React, { useState, useEffect } from 'react';
import { Music, Check, X, RefreshCw } from 'lucide-react';
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
        <h2 className="text-xl font-bold text-charcoal font-title mb-2">PLATFORM INTEGRATIONS</h2>
        <p className="text-sm text-gray-600">
          Connect your account to automatically sync shows to other platforms
        </p>
      </div>

      <div className="space-y-4">
        {platforms.map((platform) => {
          const integration = integrations.find(i => i.platform === platform.id);
          const isConnected = !!integration;
          const isEnabled = integration?.enabled || false;

          return (
            <div key={platform.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center`}>
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{platform.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
                    {integration?.last_sync && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
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
                          <Check className="w-4 h-4 inline mr-1" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 inline mr-1" />
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
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={formData.api_key}
                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        placeholder={`Your ${platform.name} API key`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Artist Name
                      </label>
                      <input
                        type="text"
                        value={formData.artist_name}
                        onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        placeholder={`Your artist name on ${platform.name}`}
                      />
                    </div>

                    {platform.id === 'songkick' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Artist ID
                        </label>
                        <input
                          type="text"
                          value={formData.platform_artist_id}
                          onChange={(e) => setFormData({ ...formData, platform_artist_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
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
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
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
