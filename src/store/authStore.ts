import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { trackEvent } from "../lib/analytics";

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
      if (session) trackEvent("auth_session_restored", { userId: session.user.id });
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
    trackEvent("logout");
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false });
    // Reset hydration flags so next login reloads data from DB
    // Lazy imports to avoid circular deps
    const { useDashboardStore } = await import("../dashboard/store/dashboardStore");
    const { usePerformerStore } = await import("../performer/store/performerStore");
    useDashboardStore.setState({ isHydrated: false, orders: [], addresses: [], notifications: [], profile: { id: "", name: "", phone: "", email: "", address: "", notifyEmail: true, notifySms: true, notifyPush: false } });
    usePerformerStore.setState({ isHydrated: false });
  },
}));
