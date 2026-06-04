import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { usePageMeta } from "../../../hooks/usePageMeta";

export function AdminLayout() {
  usePageMeta({ robots: "noindex, nofollow" });
  return (
    <div className="flex min-h-screen" style={{ background: "#080a14" }}>
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-auto pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
