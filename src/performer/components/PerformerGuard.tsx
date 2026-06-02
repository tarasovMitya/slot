import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

interface PerformerGuardProps {
  requireOnboarded?: boolean;
}

export function PerformerGuard({ requireOnboarded = true }: PerformerGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#006AFF] animate-spin" />
      </div>
    );
  }

  const isPerformer = user?.user_metadata?.performer_role === true;

  if (!isAuthenticated || !isPerformer) {
    return <Navigate to="/performer/auth" replace />;
  }

  if (requireOnboarded && !user?.user_metadata?.performer_onboarded) {
    return <Navigate to="/performer/onboarding" replace />;
  }

  return <Outlet />;
}
