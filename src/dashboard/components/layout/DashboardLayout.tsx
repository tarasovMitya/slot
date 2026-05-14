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
  const { hydrateClient, isHydrated, orders, applyPerformerFromSharedOrder, applyCompletionRequest } = useDashboardStore();
  const { updateOrder: updateSharedOrder } = useSharedOrdersStore();

  useEffect(() => {
    if (user?.id && !isHydrated) {
      hydrateClient(user.id);
    }
  }, [user?.id]);

  // IDs of orders that need live updates: searching + assigned + in_progress
  const activeSyncIds = useMemo(
    () =>
      orders
        .filter((o) => ["searching", "assigned", "in_progress"].includes(o.status))
        .map((o) => o.id),
    [orders]
  );
  const activeSyncKey = [...activeSyncIds].sort().join(",");

  // Subscribe to Realtime + poll for all active orders
  useEffect(() => {
    if (activeSyncIds.length === 0) return;

    const handleUpdate = (order: SharedOrder) => {
      updateSharedOrder(order);
      if (order.status === "performer_assigned") {
        applyPerformerFromSharedOrder(order);
      } else if (order.status === "waiting_client_confirmation") {
        applyCompletionRequest(order);
      }
    };

    // Single Realtime channel receives all shared_orders updates; filter client-side
    const unsubscribe = dbSubscribeSharedOrderUpdates("__all__", (order) => {
      if (activeSyncIds.includes(order.id)) handleUpdate(order);
    });

    // Poll every 5 s as a reliable fallback
    const interval = setInterval(async () => {
      for (const id of activeSyncIds) {
        const order = await dbGetSharedOrder(id);
        if (order) handleUpdate(order);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [activeSyncKey]);

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
