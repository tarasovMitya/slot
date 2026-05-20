import { useEffect, useMemo, useRef } from "react";
import { Outlet } from "react-router-dom";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { PerformerSidebar } from "./PerformerSidebar";
import { MobilePerformerNav } from "./MobilePerformerNav";
import { useAuthStore } from "../../../store/authStore";
import { usePerformerStore } from "../../store/performerStore";
import { useSharedOrdersStore } from "../../../store/sharedOrdersStore";
import { dbSubscribeSharedOrderUpdates, dbGetSharedOrder, dbLoadSearchingOrders, dbSubscribeSharedOrders } from "../../../lib/db";

export function PerformerLayout() {
  usePageMeta({ robots: "noindex, nofollow" });
  const { user } = useAuthStore();
  const { hydratePerformer, isHydrated, activeOrders, onClientConfirmed, onClientCancelled, addNotification } = usePerformerStore();
  const { addOrder, updateOrder } = useSharedOrdersStore();

  useEffect(() => {
    if (user?.id && !isHydrated) {
      hydratePerformer(user.id);
    }
  }, [user?.id]);

  // Load available orders and keep them live via Realtime + polling fallback
  useEffect(() => {
    const load = () => dbLoadSearchingOrders().then((orders) => orders.forEach(addOrder));
    load();

    const unsubInsert = dbSubscribeSharedOrders((order) => {
      addOrder(order);
      addNotification({ type: "new_order", title: "Новый заказ", body: `${order.serviceName} · ${order.address}`, orderId: order.id });
    });
    const unsubUpdate = dbSubscribeSharedOrderUpdates("__all__", updateOrder);

    // Polling fallback: Realtime INSERT can miss events on unstable connections
    const poll = setInterval(load, 15_000);

    return () => { unsubInsert(); unsubUpdate(); clearInterval(poll); };
  }, []);

  const activeIds = useMemo(() => activeOrders.map((o) => o.id), [activeOrders]);
  const activeKey = [...activeIds].sort().join(",");

  // Ref so the subscription closure always reads the current waiting set without re-subscribing
  const waitingIdsRef = useRef<string[]>([]);
  waitingIdsRef.current = activeOrders
    .filter((o) => o.status === "waiting_client_confirmation")
    .map((o) => o.id);

  useEffect(() => {
    if (activeIds.length === 0) return;

    const confirmed = new Set<string>();
    const cancelled = new Set<string>();

    const confirm = (id: string) => {
      if (confirmed.has(id)) return;
      confirmed.add(id);
      onClientConfirmed(id);
    };
    const cancel = (id: string) => {
      if (cancelled.has(id)) return;
      cancelled.add(id);
      onClientCancelled(id);
    };

    const unsubscribe = dbSubscribeSharedOrderUpdates("__all__", (order) => {
      if (!activeIds.includes(order.id)) return;
      if (order.status === "completed" && waitingIdsRef.current.includes(order.id)) confirm(order.id);
      if (order.status === "cancelled") cancel(order.id);
    });

    const interval = setInterval(async () => {
      for (const id of activeIds) {
        const order = await dbGetSharedOrder(id);
        if (!order) continue;
        if (order.status === "completed" && waitingIdsRef.current.includes(id)) confirm(id);
        if (order.status === "cancelled") cancel(id);
      }
    }, 5000);

    return () => { unsubscribe(); clearInterval(interval); };
  }, [activeKey]);

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
