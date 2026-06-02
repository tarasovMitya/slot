import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      // Session was established (either via magic link token exchange or OTP)
      // authStore.initialize() handles the token exchange via onAuthStateChange
      navigate(isAuthenticated ? "/dashboard" : "/auth", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-[#006AFF] animate-spin" />
      <p className="text-gray-400 text-sm">Входим в аккаунт...</p>
    </div>
  );
}
