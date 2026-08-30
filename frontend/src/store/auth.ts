import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { User } from '@/types';
import api from '@/lib/axios';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  authChecked: boolean;
  hydrated: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
  checkAuth: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      authChecked: false,
      hydrated: false,

      setAuth: (user) => {
        set({ user, isAuthenticated: true, authChecked: true });
      },

      clearAuth: () => {
        set({ user: null, isAuthenticated: false, authChecked: true });
      },

      setHydrated: (hydrated) => {
        set({ hydrated });
      },

    logout: async () => {
      try {
        const { user } = useAuthStore.getState();
        if (user) {
          await api.post('/audit-logs/event', {
            action: 'LOGOUT',
            module: 'AUTH',
            description: `User ${user.name} (${user.email}) logged out.`,
          }).catch(() => {});
        }

        const { supabase } = await import('@/lib/supabase');
        await supabase.auth.signOut();
      } catch (_) {
        console.error('Logout failed', _);
      } finally {
        set({ user: null, isAuthenticated: false, authChecked: true });
      }
    },

    checkAuth: async () => {
      try {
        const { data } = await api.get('/me');
        const prevUser = useAuthStore.getState().user;
        
        set({ user: data, isAuthenticated: true, authChecked: true });

        // If this is a fresh login (no prevUser but now we have data)
        if (!prevUser && data) {
           api.post('/audit-logs/event', {
             action: 'LOGIN_SUCCESS',
             module: 'AUTH',
             description: `User ${data.name} (${data.email}) authenticated.`,
           }).catch(() => {});
        }

        return data;
      } catch {
        set({ user: null, isAuthenticated: false, authChecked: true });
        return null;
      }
    },
    }),
    {
      name: 'opscore-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        authChecked: state.authChecked,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
