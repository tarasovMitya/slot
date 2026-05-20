import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { usePageMeta } from "../../../hooks/usePageMeta";

export function AdminLayout() {
  usePageMeta({ robots: "noindex, nofollow" });
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
