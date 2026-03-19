import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { isSupabaseReady, getConnectionError } from '../lib/supabase';

export default function SupabaseConnectionStatus() {
  const [isConnected, setIsConnected] = useState(isSupabaseReady());
  const [error, setError] = useState<string | null>(getConnectionError());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      setIsConnected(isSupabaseReady());
      setError(getConnectionError());
    };

    // Check status initially and then every 5 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Force a page reload to re-establish connection
      window.location.reload();
    } catch (err) {
      console.error('Error refreshing connection:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isConnected) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-md shadow-md">
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs font-medium">Database connected</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs bg-beige border-l-4 border-yellow-400 p-4 rounded shadow-md">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-black">Database Connection Issue</h3>
          <div className="mt-1 text-xs text-black">
            <p>{error || 'Unable to connect to the database'}</p>
            <p className="mt-1">
              Some features may be limited. Using mock data where possible.
            </p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mt-2 flex items-center gap-1 text-black hover:text-yellow-900"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh connection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}