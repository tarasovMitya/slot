import { useEffect } from "react";
import { DollarSign, TrendingUp, Clock, Users } from "lucide-react";
import { useAdminStore } from "../store/adminStore";
import { formatPrice } from "../../utils/priceCalculator";

export function AdminFinancePage() {
  const { performers, stats, isLoadingPerformers, isLoadingStats, loadPerformers, loadStats, approvePayout } = useAdminStore();

  useEffect(() => {
    loadPerformers();
    loadStats();
  }, []);

  const pendingPayouts = performers.filter((p) => p.pendingBalance > 0);
  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.pendingBalance, 0);
  const totalBalance = performers.reduce((sum, p) => sum + p.balance, 0);

  async function handleApprove(performerId: string) {
    await approvePayout(performerId);
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Финансы</h1>
        <p className="text-sm text-gray-500 mt-0.5">Управление выплатами и балансами</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Выручка (всего)"
          value={formatPrice(stats?.revenueTotal ?? 0)}
          icon={<TrendingUp size={16} className="text-emerald-600" />}
          color="bg-emerald-50"
          loading={isLoadingStats}
        />
        <KpiCard
          label="К выплате"
          value={formatPrice(totalPending)}
          icon={<Clock size={16} className="text-orange-600" />}
          color="bg-orange-50"
          loading={isLoadingPerformers}
        />
        <KpiCard
          label="На балансах"
          value={formatPrice(totalBalance)}
          icon={<DollarSign size={16} className="text-blue-600" />}
          color="bg-blue-50"
          loading={isLoadingPerformers}
        />
        <KpiCard
          label="Ожидают выплаты"
          value={pendingPayouts.length}
          icon={<Users size={16} className="text-purple-600" />}
          color="bg-purple-50"
          loading={isLoadingPerformers}
        />
      </div>

      {/* Pending payouts table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Ожидающие выплаты</p>
          {pendingPayouts.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
              {pendingPayouts.length}
            </span>
          )}
        </div>
        {isLoadingPerformers ? (
          <div className="p-8 text-center text-sm text-gray-400">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Исполнитель</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Телефон</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Баланс</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">К выплате</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Заказов</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pendingPayouts.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-5 py-3 text-gray-600">{p.phone || "—"}</td>
                    <td className="px-5 py-3 text-gray-700">{formatPrice(p.balance)}</td>
                    <td className="px-5 py-3 font-semibold text-orange-600">{formatPrice(p.pendingBalance)}</td>
                    <td className="px-5 py-3 text-gray-700">{p.completedOrders}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleApprove(p.id)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                      >
                        Выплатить
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingPayouts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">
                      Нет ожидающих выплат
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All performers balances */}
      <div className="bg-white rounded-xl border border-gray-200 mt-4">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Балансы всех исполнителей</p>
        </div>
        {isLoadingPerformers ? (
          <div className="p-8 text-center text-sm text-gray-400">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Исполнитель</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Рейтинг</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Заказов</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Баланс</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Верификация</th>
                </tr>
              </thead>
              <tbody>
                {performers.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-5 py-3 text-amber-500 font-semibold">{p.rating.toFixed(1)}</td>
                    <td className="px-5 py-3 text-gray-700">{p.completedOrders}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{formatPrice(p.balance)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.verificationStatus === "approved" ? "bg-green-100 text-green-700" :
                        p.verificationStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {p.verificationStatus === "approved" ? "Одобрен" : p.verificationStatus === "pending" ? "Ожидание" : "Отклонён"}
                      </span>
                    </td>
                  </tr>
                ))}
                {performers.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">Нет данных</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color, loading }: { label: string; value: string | number; icon: React.ReactNode; color: string; loading?: boolean }) {
  if (loading) return <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-24" />;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
