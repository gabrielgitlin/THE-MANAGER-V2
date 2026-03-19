import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, ExternalLink, RefreshCw, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { calendarIntegrationService, CalendarConnection } from '../../lib/calendarIntegration';

interface CalendarConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionsUpdated?: () => void;
}

export default function CalendarConnectionModal({
  isOpen,
  onClose,
  onConnectionsUpdated
}: CalendarConnectionModalProps) {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'ical' | 'outlook' | null>(null);
  const [icalUrl, setIcalUrl] = useState('');
  const [icalName, setIcalName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConnections();
    }
  }, [isOpen]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const data = await calendarIntegrationService.getConnections();
      setConnections(data);
    } catch (err) {
      console.error('Error loading connections:', err);
      setError('Failed to load calendar connections');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleConnect = () => {
    try {
      const authUrl = calendarIntegrationService.getGoogleOAuthUrl();

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'Google Calendar Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const checkPopup = setInterval(() => {
        try {
          if (popup && popup.closed) {
            clearInterval(checkPopup);
            loadConnections();
            onConnectionsUpdated?.();
          }
        } catch (err) {
          console.error('Error checking popup:', err);
        }
      }, 500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate Google OAuth');
    }
  };

  const handleICalConnect = async () => {
    if (!icalUrl || !icalName) {
      setError('Please provide both calendar name and iCal URL');
      return;
    }

    try {
      setLoading(true);
      await calendarIntegrationService.createConnection({
        provider: 'ical',
        account_name: icalName,
        ical_url: icalUrl,
        sync_enabled: true,
        two_way_sync: false,
        notifications_enabled: true,
        color: '#FF2D55',
      });

      setIcalUrl('');
      setIcalName('');
      setShowAddModal(false);
      setSelectedProvider(null);
      await loadConnections();
      onConnectionsUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add iCal calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (connectionId: string, provider: string) => {
    setSyncing(connectionId);
    setError(null);

    try {
      if (provider === 'google') {
        await calendarIntegrationService.syncGoogleCalendar(connectionId);
      } else if (provider === 'ical') {
        await calendarIntegrationService.syncICalFeed(connectionId);
      }
      await loadConnections();
      onConnectionsUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(null);
    }
  };

  const handleToggleSync = async (connectionId: string, currentValue: boolean) => {
    try {
      await calendarIntegrationService.updateConnection(connectionId, {
        sync_enabled: !currentValue,
      });
      await loadConnections();
      onConnectionsUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update connection');
    }
  };

  const handleDelete = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this calendar? All synced events will be removed.')) {
      return;
    }

    try {
      await calendarIntegrationService.deleteConnection(connectionId);
      await loadConnections();
      onConnectionsUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete connection');
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg';
      case 'ical':
        return 'https://upload.wikimedia.org/wikipedia/commons/5/5e/ICloud_logo.svg';
      case 'outlook':
        return 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg';
      default:
        return null;
    }
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Never';

    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Calendar Connections</h2>
              <p className="text-sm text-gray-500 mt-1">
                Connect external calendars to sync events automatically
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs text-red-600 hover:text-red-700 mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading && connections.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading connections...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      connection.sync_enabled
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: connection.color }}
                        >
                          <img
                            src={getProviderIcon(connection.provider) || ''}
                            alt={connection.provider}
                            className="w-6 h-6"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {connection.account_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {connection.sync_enabled ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-700">
                                <Check className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">Paused</span>
                            )}
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {formatLastSync(connection.last_synced_at)}
                            </span>
                          </div>
                          {connection.sync_error && (
                            <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {connection.sync_error}
                            </div>
                          )}
                          {connection.provider === 'ical' && connection.ical_url && (
                            <div className="mt-2 text-xs text-gray-500 truncate flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{connection.ical_url}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleSync(connection.id, connection.provider)}
                          disabled={syncing === connection.id || !connection.sync_enabled}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Sync now"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${syncing === connection.id ? 'animate-spin' : ''}`}
                          />
                        </button>
                        <button
                          onClick={() => handleDelete(connection.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Disconnect"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Connection Options */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={connection.sync_enabled}
                            onChange={() => handleToggleSync(connection.id, connection.sync_enabled)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Sync enabled</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={connection.notifications_enabled}
                            onChange={async () => {
                              await calendarIntegrationService.updateConnection(connection.id, {
                                notifications_enabled: !connection.notifications_enabled,
                              });
                              loadConnections();
                            }}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Notifications</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                {connections.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No calendars connected</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Connect your calendars to sync events automatically
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {!showAddModal ? (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-6 py-3 text-base font-bold text-white bg-black rounded-lg hover:bg-gray-800 shadow-lg border-2 border-black"
                >
                  <span className="text-lg text-white">+</span>
                  <span className="text-white">ADD CALENDAR</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-base font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Calendar Provider
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setSelectedProvider('google')}
                      className={`p-5 border-3 rounded-xl transition-all shadow-md hover:shadow-lg ${
                        selectedProvider === 'google'
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-400'
                          : 'border-gray-300 hover:border-blue-400 bg-white'
                      }`}
                    >
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
                        alt="Google Calendar"
                        className="w-12 h-12 mx-auto mb-3"
                      />
                      <span className="text-base font-bold text-gray-900 block">Google</span>
                      <span className="text-xs text-gray-600 block mt-1">Calendar</span>
                    </button>
                    <button
                      onClick={() => setSelectedProvider('ical')}
                      className={`p-5 border-3 rounded-xl transition-all shadow-md hover:shadow-lg ${
                        selectedProvider === 'ical'
                          ? 'border-green-600 bg-green-50 ring-2 ring-green-400'
                          : 'border-gray-300 hover:border-green-400 bg-white'
                      }`}
                    >
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/5/5e/ICloud_logo.svg"
                        alt="iCal"
                        className="w-12 h-12 mx-auto mb-3"
                      />
                      <span className="text-base font-bold text-gray-900 block">iCal</span>
                      <span className="text-xs text-gray-600 block mt-1">Any Calendar</span>
                    </button>
                    <button
                      onClick={() => setSelectedProvider('outlook')}
                      className="p-5 border-3 border-gray-200 rounded-xl transition-all bg-gray-50 cursor-not-allowed opacity-60"
                      disabled
                    >
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg"
                        alt="Outlook"
                        className="w-12 h-12 mx-auto mb-3 opacity-50"
                      />
                      <span className="text-base font-bold text-gray-500 block">Outlook</span>
                      <span className="text-xs text-gray-500 block mt-1">Coming soon</span>
                    </button>
                  </div>
                </div>

                {selectedProvider === 'ical' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm font-medium text-blue-900 mb-2">How to get your iCal URL:</p>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li><strong>Google Calendar:</strong> Settings → Your calendar → Secret address in iCal format</li>
                        <li><strong>Apple Calendar:</strong> Share calendar → Public Calendar</li>
                        <li><strong>Outlook:</strong> Calendar settings → Shared calendars → Publish</li>
                      </ul>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Calendar Name
                      </label>
                      <input
                        type="text"
                        value={icalName}
                        onChange={(e) => setIcalName(e.target.value)}
                        placeholder="e.g., My Work Calendar"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        A friendly name to identify this calendar
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        iCal Feed URL
                      </label>
                      <input
                        type="url"
                        value={icalUrl}
                        onChange={(e) => setIcalUrl(e.target.value)}
                        placeholder="webcal://calendar.google.com/calendar/ical/..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Paste the iCal or webcal URL from your calendar provider
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedProvider(null);
                      setIcalUrl('');
                      setIcalName('');
                    }}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {selectedProvider === 'google' && (
                    <button
                      onClick={handleGoogleConnect}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg border-2 border-blue-700"
                    >
                      CONNECT GOOGLE CALENDAR
                    </button>
                  )}
                  {selectedProvider === 'ical' && (
                    <button
                      onClick={handleICalConnect}
                      disabled={!icalUrl || !icalName}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-lg border-2 border-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ADD ICAL CALENDAR
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
