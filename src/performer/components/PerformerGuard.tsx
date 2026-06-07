import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { dbLoadPerformerProfile } from "../../lib/db";

interface PerformerGuardProps {
  requireOnboarded?: boolean;
}

export function PerformerGuard({ requireOnboarded = true }: PerformerGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [resolving, setResolving] = useState(false);
  const [dbOnboarded, setDbOnboarded] = useState<boolean | null>(null);

  const isPerformer = user?.user_metadata?.performer_role === true;
  const metaOnboarded = user?.user_metadata?.performer_onboarded === true;

  useEffect(() => {
    if (!requireOnboarded || isLoading || !isAuthenticated || !isPerformer || metaOnboarded) return;

    // performer_onboarded flag missing in JWT — check DB profile as fallback
    setResolving(true);
    dbLoadPerformerProfile(user!.id)
      .then((profile) => {
        // Row exists = performer went through registration (name may be null for authenticated path)
        const has = profile !== null;
        if (has) {
          supabase.auth.updateUser({ data: { performer_role: true, performer_onboarded: true } }).catch(() => {});
        }
        setDbOnboarded(has);
        setResolving(false);
      })
      .catch(() => {
        setDbOnboarded(false);
        setResolving(false);
      });
  }, [isLoading, isAuthenticated, isPerformer, metaOnboarded, user?.id]);

  const spinner = (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#006AFF] animate-spin" />
    </div>
  );

  if (isLoading || resolving) return spinner;

  if (!isAuthenticated || !isPerformer) {
    return <Navigate to="/performer/auth" replace />;
  }

  if (requireOnboarded) {
    if (metaOnboarded) return <Outlet />;
    if (dbOnboarded === true) return <Outlet />;
    if (dbOnboarded === false) return <Navigate to="/performer/onboarding" replace />;
    // dbOnboarded still null → useEffect pending
    return spinner;
  }

  return <Outlet />;
}
