import { Outlet } from "react-router-dom";
import { AffiliateSidebar } from "./AffiliateSidebar";

export function AffiliateLayout() {
  return (
    <div className="flex min-h-screen" style={{ background: "#080a14" }}>
      <AffiliateSidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
