import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

let isConnected = false;
let connectionError: string | null = null;

export const isSupabaseReady = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

export const getConnectionError = () => connectionError;

if (!supabaseUrl || !supabaseAnonKey) {
  connectionError = 'Supabase URL or Anon Key is missing. Please check your .env file.';
  console.error(connectionError);
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

const checkConnection = async () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      connectionError = 'Supabase configuration missing. Please check your environment variables.';
      isConnected = false;
      return;
    }

    // Simple auth check to verify connection
    const { error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    connectionError = null;
    isConnected = true;
    console.log('Successfully connected to Supabase');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown connection error';
    
    if (errorMessage.includes('Failed to fetch')) {
      connectionError = 'Please check that you have clicked "Connect to Supabase" to set up your connection.';
    } else if (errorMessage.includes('404')) {
      connectionError = 'Invalid Supabase URL. Please verify your configuration.';
    } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
      connectionError = 'Invalid Supabase anon key. Please verify your configuration.';
    } else {
      connectionError = `Failed to connect to Supabase: ${errorMessage}`;
    }
    
    isConnected = false;
    console.error('Supabase connection error:', connectionError);
  }
};

// Initial connection check
checkConnection();

// Regular health checks
const connectionCheckInterval = setInterval(checkConnection, 30000);

if (typeof window !== 'undefined') {
  window.addEventListener('unload', () => {
    clearInterval(connectionCheckInterval);
  });
}

export const waitForConnection = async (timeout = 10000) => {
  const start = Date.now();
  while (!isConnected && Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100));
    await checkConnection();
  }
  return isConnected;
};