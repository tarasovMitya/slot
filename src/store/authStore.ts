import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        isLoading: false,
      });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        isLoading: false,
      });
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false });
  },
}));
