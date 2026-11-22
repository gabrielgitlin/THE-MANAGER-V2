import React, { useState, useEffect } from 'react';
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
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-md shadow-md" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--brand-1)' }}>
        <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-green" alt="" />
        <span className="text-xs font-medium">Database connected</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs border-l-4 p-4 rounded shadow-md" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--brand-1)' }}>
      <div className="flex items-start">
        <img src="/TM-Info-negro.svg" className="pxi-lg icon-muted mt-0.5" alt="" />
        <div className="ml-3">
          <h3 className="text-sm font-medium" style={{ color: 'var(--t1)' }}>Database Connection Issue</h3>
          <div className="mt-1 text-xs" style={{ color: 'var(--t2)' }}>
            <p>{error || 'Unable to connect to the database'}</p>
            <p className="mt-1">
              Some features may be limited. Using mock data where possible.
            </p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mt-2 flex items-center gap-1"
              style={{ color: 'var(--t1)' }}
            >
              <img src="/TM-Refresh-negro.svg" className={`pxi-sm icon-white ${isRefreshing ? 'animate-spin' : ''}`} alt="" />
              <span>Refresh connection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}