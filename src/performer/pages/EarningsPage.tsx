import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, CheckCircle, BarChart3, ArrowDownLeft } from "lucide-react";
import { usePerformerStore } from "../store/performerStore";
import { formatPrice } from "../../utils/priceCalculator";
import { BalanceCard } from "../components/ui/BalanceCard";
import { WithdrawModal } from "../components/ui/WithdrawModal";

export function EarningsPage() {
  const { earnings, profile, balance, pendingBalance, withdrawHistory } = usePerformerStore();
  const [showWithdraw, setShowWithdraw] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const todayTotal = earnings.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);
  const weekTotal = earnings.filter((e) => e.date >= weekAgo).reduce((s, e) => s + e.amount, 0);
  const monthTotal = earnings.filter((e) => e.date >= monthAgo).reduce((s, e) => s + e.amount, 0);
  const avgCheck = earnings.length > 0 ? Math.round(monthTotal / earnings.length) : 0;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    const amount = earnings.filter((e) => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
    const label = d.toLocaleDateString("ru-RU", { weekday: "short" });
    return { label, amount, dateStr };
  });

  const maxDay = Math.max(...days.map((d) => d.amount), 1);

  const grouped = earnings.reduce<Record<string, typeof earnings>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});

  return (
    <>
      <AnimatePresence>
        {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} />}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Заработок</h1>
        </motion.div>

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="mb-6"
        >
          <BalanceCard
            balance={balance}
            pendingBalance={pendingBalance}
            todayEarnings={todayTotal}
            weekEarnings={weekTotal}
            onWithdraw={() => setShowWithdraw(true)}
          />
        </motion.div>

        {/* Summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <Card icon={<TrendingUp size={14} className="text-gray-400" />} label="Месяц" value={formatPrice(monthTotal)} />
          <Card icon={<CheckCircle size={14} className="text-gray-400" />} label="Средний чек" value={formatPrice(avgCheck)} sub={`${profile.completedOrders} заказов`} />
        </motion.div>

        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="border border-gray-100 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={15} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">Заработок за 7 дней</p>
          </div>
          <div className="flex items-end gap-2 h-24">
            {days.map((d) => (
              <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.amount / maxDay) * 80}px` }}
                  transition={{ delay: 0.18, duration: 0.5, ease: "easeOut" }}
                  className={`w-full rounded-t-lg ${d.dateStr === today ? "bg-black" : "bg-gray-200"}`}
                />
                <span className="text-[10px] text-gray-400">{d.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Withdraw history */}
        {withdrawHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mb-6"
          >
            <h2 className="text-base font-semibold text-gray-900 mb-3">Выводы средств</h2>
            <div className="flex flex-col gap-2">
              {withdrawHistory.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <ArrowDownLeft size={14} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Вывод на •••• {w.cardLast4}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(w.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} · {w.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">−{formatPrice(w.amount)}</p>
                    <span className={`text-[10px] font-semibold ${w.status === "completed" ? "text-green-600" : "text-amber-500"}`}>
                      {w.status === "completed" ? "Выполнено" : "В обработке"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Transaction history */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-base font-semibold text-gray-900 mb-3">История заказов</h2>
          <div className="flex flex-col gap-1">
            {Object.entries(grouped)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, records]) => {
                const label = new Date(date).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                });
                return (
                  <div key={date}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 py-2">
                      {label}
                    </p>
                    {records.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.serviceName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{r.time}</p>
                        </div>
                        <p className="text-sm font-bold text-green-600">+{formatPrice(r.amount)}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
          </div>
        </motion.div>
      </div>
    </>
  );
}

function Card({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-xs text-gray-400 font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
