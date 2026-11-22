import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (userData) {
          const user: User = {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            full_name: userData.full_name || session.user.email?.split('@')[0] || 'User',
            avatar_url: userData.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces`
          };
          set({ user, loading: false });
        } else {
          set({ user: null, loading: false });
        }
      } else {
        set({ user: null, loading: false });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        (async () => {
          if (session?.user) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (userData) {
              const user: User = {
                id: userData.id,
                email: userData.email,
                role: userData.role,
                full_name: userData.full_name || session.user.email?.split('@')[0] || 'User',
                avatar_url: userData.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces`
              };
              set({ user, loading: false });
            } else {
              set({ user: null, loading: false });
            }
          } else {
            set({ user: null, loading: false });
          }
        })();
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ user: null, loading: false });
    }
  },
}));