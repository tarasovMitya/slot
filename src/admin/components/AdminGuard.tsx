import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAdminStore } from "../store/adminStore";
import { ADMIN_ROLES } from "../types";

export function AdminGuard() {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const { role, isLoadingRole, loadRole } = useAdminStore();

  useEffect(() => {
    if (user?.id) loadRole(user.id);
  }, [user?.id]);

  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return <Navigate to="/auth" replace />;
  if (!role || !ADMIN_ROLES.includes(role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <p className="text-lg font-semibold text-gray-900">Доступ запрещён</p>
        <p className="text-sm text-gray-400">У вашего аккаунта нет прав администратора</p>
        <a href="/" className="text-sm text-gray-600 underline">На главную</a>
      </div>
    );
  }

  return <Outlet />;
}
