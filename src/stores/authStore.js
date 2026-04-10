import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAIL } from '../lib/constants';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      isAdmin: false,

      initialize: async () => {
        set({ loading: true });
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const userEmail = session.user.email;
          const isUserAdmin = userEmail === ADMIN_EMAIL;
          set({ session, user: session.user, isAdmin: isUserAdmin, loading: false });
        } else {
          set({ session: null, user: null, isAdmin: false, loading: false });
        }

        // Listen for changes
        supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            const isUserAdmin = session.user.email === ADMIN_EMAIL;
            set({ session, user: session.user, isAdmin: isUserAdmin });
          } else {
            set({ session: null, user: null, isAdmin: false });
          }
        });
      },

      login: async (email, password) => {
        set({ loading: true });
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          set({ loading: false });
          throw error;
        }

        const isUserAdmin = data.user.email === ADMIN_EMAIL;
        
        if (!isUserAdmin) {
          await supabase.auth.signOut();
          set({ loading: false, isAdmin: false });
          throw new Error('Access denied. Only the administrator can log in here.');
        }

        set({ session: data.session, user: data.user, isAdmin: true, loading: false });
        return data;
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, isAdmin: false });
      },
    }),
    {
      name: 'zein-auth-storage',
      partialize: (state) => ({ user: state.user, isAdmin: state.isAdmin }),
    }
  )
);

export default useAuthStore;
