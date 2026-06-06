import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "../store/dashboardStore";
import { OrderCard } from "../components/cards/OrderCard";
import { EmptyState } from "../components/ui/EmptyState";

type Filter = "all" | "completed" | "cancelled";

export function OrderHistoryPage() {
  const navigate = useNavigate();
  const { orders } = useDashboardStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const historical = orders.filter((o) => ["completed", "cancelled"].includes(o.status));

  const filtered = historical.filter((o) => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch =
      !search ||
      o.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      o.categoryName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Все" },
    { key: "completed", label: "Выполненные" },
    { key: "cancelled", label: "Отменённые" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">История заказов</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по заказам"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 text-sm outline-none focus:border-gray-300 transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === key
                ? "bg-[#006AFF] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Clock size={28} />}
            title={historical.length === 0 ? "История пуста" : "Заказов не найдено"}
            description={
              historical.length === 0
                ? "Здесь появятся завершённые и отменённые заказы"
                : "Попробуйте изменить фильтр или поисковый запрос"
            }
          />
        ) : (
          <motion.div
            key={filter + search}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3"
          >
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onRepeat={order.status === "completed" ? () => navigate("/calculator") : undefined}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
