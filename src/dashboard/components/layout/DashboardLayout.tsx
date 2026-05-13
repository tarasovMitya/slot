import { useEffect, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuthStore } from "../../../store/authStore";
import { useDashboardStore } from "../../store/dashboardStore";
import { useSharedOrdersStore } from "../../../store/sharedOrdersStore";
import { dbSubscribeSharedOrderUpdates, dbGetSharedOrder } from "../../../lib/db";
import type { SharedOrder } from "../../../store/sharedOrdersStore";

export function DashboardLayout() {
  const { user } = useAuthStore();
  const { hydrateClient, isHydrated, orders, applyPerformerFromSharedOrder } = useDashboardStore();
  const { updateOrder: updateSharedOrder } = useSharedOrdersStore();

  useEffect(() => {
    if (user?.id && !isHydrated) {
      hydrateClient(user.id);
    }
  }, [user?.id]);

  // IDs of all orders still searching — re-derived each render but stable as a key string
  const searchingIds = useMemo(
    () => orders.filter((o) => o.status === "searching").map((o) => o.id),
    [orders]
  );
  const searchingKey = [...searchingIds].sort().join(",");

  // Subscribe to Realtime + poll for ALL searching orders simultaneously
  useEffect(() => {
    if (searchingIds.length === 0) return;

    const handleUpdate = (order: SharedOrder) => {
      updateSharedOrder(order);
      if (order.status === "performer_assigned") {
        applyPerformerFromSharedOrder(order);
      }
    };

    // Single Realtime channel receives all shared_orders updates; filter client-side
    const unsubscribe = dbSubscribeSharedOrderUpdates("__all__", (order) => {
      if (searchingIds.includes(order.id)) handleUpdate(order);
    });

    // Poll every 5 s as a reliable fallback for each searching order
    const interval = setInterval(async () => {
      for (const id of searchingIds) {
        const order = await dbGetSharedOrder(id);
        if (order) handleUpdate(order);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [searchingKey]);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}
