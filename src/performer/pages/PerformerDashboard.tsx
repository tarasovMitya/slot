import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star, TrendingUp, CheckCircle, ClipboardList } from "lucide-react";
import { usePerformerStore } from "../store/performerStore";
import { useSharedOrdersStore } from "../../store/sharedOrdersStore";
import { VerificationGate } from "../verification/VerificationGate";
import { AvailabilityToggle } from "../components/ui/AvailabilityToggle";
import { PerformerActiveOrderCard } from "../components/cards/ActiveOrderCard";
import { formatPrice, pluralRu } from "../../utils/priceCalculator";

export function PerformerDashboard() {
  const { profile, isOnline, activeOrders, earnings } = usePerformerStore();
  const { orders: sharedOrders } = useSharedOrdersStore();
  const availableCount = useMemo(
    () => sharedOrders.filter((o) => o.status === "searching_performer").length,
    [sharedOrders]
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  const today = new Date().toISOString().split("T")[0];
  const todayEarnings = earnings
    .filter((e) => e.date === today)
    .reduce((sum, e) => sum + e.amount, 0);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const weekEarnings = earnings
    .filter((e) => e.date >= weekAgo)
    .reduce((sum, e) => sum + e.amount, 0);

  const todayCompleted = earnings.filter((e) => e.date === today).length;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-sm text-gray-400 font-medium">{greeting},</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">
          {profile.name}
        </h1>
        <div className="flex items-center gap-1.5 mt-1">
          <Star size={13} className="text-amber-400 fill-amber-400" />
          <span className="text-sm font-semibold text-gray-700">{profile.rating}</span>
          <span className="text-sm text-gray-400">· {profile.completedOrders} заказов</span>
        </div>
      </motion.div>

      {/* Stats always visible */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={13} className="text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">Доход сегодня</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatPrice(todayEarnings)}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={13} className="text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">Неделя</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatPrice(weekEarnings)}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle size={13} className="text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">Выполнено</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{todayCompleted}</p>
          <p className="text-xs text-gray-400 mt-0.5">за сегодня</p>
        </div>
      </motion.div>

      {/* Orders section — gated by verification */}
      <VerificationGate>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <AvailabilityToggle />
        </motion.div>

        {isOnline && availableCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className="mb-6">
            <Link
              to="/performer/available"
              className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
                  <ClipboardList size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    {availableCount} {pluralRu(availableCount, "новый заказ", "новых заказа", "новых заказов")} рядом
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">Нажмите, чтобы принять</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-amber-600" />
            </Link>
          </motion.div>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Активные заказы</h2>
            {activeOrders.length > 0 && (
              <Link to="/performer/active" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors">
                Все <ArrowRight size={14} />
              </Link>
            )}
          </div>
          {activeOrders.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <CheckCircle size={28} className="text-gray-200" />
              <p className="text-sm font-medium text-gray-400">Нет активных заказов</p>
              <Link to="/performer/available" className="text-xs text-[#006AFF] font-medium hover:underline">
                Перейти к новым заказам →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeOrders.slice(0, 2).map((order) => (
                <PerformerActiveOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>
      </VerificationGate>
    </div>
  );
}
