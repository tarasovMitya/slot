import { motion } from "framer-motion";
import { Wallet, TrendingUp, Clock } from "lucide-react";
import { formatPrice } from "../../../utils/priceCalculator";

interface BalanceCardProps {
  balance: number;
  pendingBalance: number;
  todayEarnings: number;
  weekEarnings: number;
  onWithdraw: () => void;
}

export function BalanceCard({
  balance,
  pendingBalance,
  todayEarnings,
  weekEarnings,
  onWithdraw,
}: BalanceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#003B8F] rounded-3xl p-6 text-white"
    >
      {/* Balance */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-400">Доступный баланс</span>
          </div>
          <motion.p
            key={balance}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight"
          >
            {formatPrice(balance)}
          </motion.p>
          {pendingBalance > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Clock size={12} className="text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">
                {formatPrice(pendingBalance)} ожидает
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/10 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={11} className="text-gray-400" />
            <span className="text-[11px] text-gray-400">Сегодня</span>
          </div>
          <p className="text-base font-bold">{formatPrice(todayEarnings)}</p>
        </div>
        <div className="bg-white/10 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={11} className="text-gray-400" />
            <span className="text-[11px] text-gray-400">Неделя</span>
          </div>
          <p className="text-base font-bold">{formatPrice(weekEarnings)}</p>
        </div>
      </div>

      {/* Withdraw CTA */}
      <button
        onClick={onWithdraw}
        disabled={balance === 0}
        className="w-full py-3.5 rounded-2xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        Вывести средства
      </button>
    </motion.div>
  );
}
