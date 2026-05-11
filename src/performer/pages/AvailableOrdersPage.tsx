import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { usePerformerStore } from "../store/performerStore";
import { AvailableOrderCard } from "../components/cards/AvailableOrderCard";
import type { PerformerOrder } from "../types";

type SortKey = "nearest" | "price" | "newest";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "nearest", label: "Ближайшие" },
  { key: "price", label: "Дороже" },
  { key: "newest", label: "Новые" },
];

function sortOrders(orders: PerformerOrder[], by: SortKey): PerformerOrder[] {
  return [...orders].sort((a, b) => {
    if (by === "nearest") {
      const da = parseFloat(a.distance ?? "999");
      const db = parseFloat(b.distance ?? "999");
      return da - db;
    }
    if (by === "price") return b.priceTotal - a.priceTotal;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function AvailableOrdersPage() {
  const { availableOrders, acceptOrder, rejectOrder, isOnline } = usePerformerStore();
  const [sortBy, setSortBy] = useState<SortKey>("nearest");

  const sorted = sortOrders(availableOrders, sortBy);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Новые заказы</h1>
        <p className="text-sm text-gray-400 mt-1">
          {isOnline
            ? availableOrders.length > 0
              ? `${availableOrders.length} заказа ждут вас`
              : "Новых заказов пока нет"
            : "Вы офлайн — заказы не поступают"}
        </p>
      </motion.div>

      {/* Sort tabs */}
      {availableOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 mb-5"
        >
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                sortBy === key
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </motion.div>
      )}

      {sorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 flex flex-col items-center gap-3 text-center"
        >
          <ClipboardList size={36} className="text-gray-200" />
          <p className="text-base font-medium text-gray-400">
            {isOnline ? "Новых заказов пока нет" : "Включите онлайн, чтобы получать заказы"}
          </p>
          <p className="text-sm text-gray-300">Мы уведомим вас, когда появится заказ рядом</p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="flex flex-col gap-4">
            {sorted.map((order) => (
              <AvailableOrderCard
                key={order.id}
                order={order}
                onAccept={() => acceptOrder(order.id)}
                onReject={() => rejectOrder(order.id)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
