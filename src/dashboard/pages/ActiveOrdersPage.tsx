import { motion } from "framer-motion";
import { ClipboardList, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardStore } from "../store/dashboardStore";
import { ActiveOrderCard } from "../components/cards/ActiveOrderCard";
import { SearchingOrderCard } from "../components/cards/SearchingOrderCard";
import { EmptyState } from "../components/ui/EmptyState";

export function ActiveOrdersPage() {
  const { orders, cancelOrder } = useDashboardStore();
  const activeOrders = orders.filter((o) => !["completed", "cancelled"].includes(o.status));

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Активные заказы</h1>
          {activeOrders.length > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">{activeOrders.length} заказа</p>
          )}
        </div>
        <Link
          to="/calculator"
          className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all"
        >
          <Plus size={15} />
          Новый
        </Link>
      </div>

      {activeOrders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title="Нет активных заказов"
          description="Оформите услугу и мы найдём мастера в течение 15 минут"
          action={
            <Link
              to="/calculator"
              className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all"
            >
              Оформить заказ
            </Link>
          }
        />
      ) : (
        <motion.div className="flex flex-col gap-3">
          {activeOrders.map((order) =>
            order.status === "searching" ? (
              <SearchingOrderCard
                key={order.id}
                order={order}
                onCancel={() => cancelOrder(order.id)}
              />
            ) : (
              <ActiveOrderCard
                key={order.id}
                order={order}
                onCancel={() => cancelOrder(order.id)}
              />
            )
          )}
        </motion.div>
      )}
    </div>
  );
}
