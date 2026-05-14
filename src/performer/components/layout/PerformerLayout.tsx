import { useEffect, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { PerformerSidebar } from "./PerformerSidebar";
import { MobilePerformerNav } from "./MobilePerformerNav";
import { useAuthStore } from "../../../store/authStore";
import { usePerformerStore } from "../../store/performerStore";
import { dbSubscribeSharedOrderUpdates, dbGetSharedOrder } from "../../../lib/db";

export function PerformerLayout() {
  const { user } = useAuthStore();
  const { hydratePerformer, isHydrated, activeOrders, onClientConfirmed } = usePerformerStore();

  useEffect(() => {
    if (user?.id && !isHydrated) {
      hydratePerformer(user.id);
    }
  }, [user?.id]);

  // Watch waiting orders for client confirmation
  const waitingIds = useMemo(
    () => activeOrders.filter((o) => o.status === "waiting_client_confirmation").map((o) => o.id),
    [activeOrders]
  );
  const waitingKey = [...waitingIds].sort().join(",");

  useEffect(() => {
    if (waitingIds.length === 0) return;

    const confirmed = new Set<string>();
    const confirm = (id: string) => {
      if (confirmed.has(id)) return;
      confirmed.add(id);
      onClientConfirmed(id);
    };

    const unsubscribe = dbSubscribeSharedOrderUpdates("__all__", (order) => {
      if (waitingIds.includes(order.id) && order.status === "completed") confirm(order.id);
    });

    const interval = setInterval(async () => {
      for (const id of waitingIds) {
        const order = await dbGetSharedOrder(id);
        if (order?.status === "completed") confirm(order.id);
      }
    }, 5000);

    return () => { unsubscribe(); clearInterval(interval); };
  }, [waitingKey]);

  return (
    <div className="flex min-h-screen bg-white">
      <PerformerSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <Outlet />
      </main>
      <MobilePerformerNav />
    </div>
  );
}
