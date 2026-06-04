import { useEffect } from "react";
import { ShoppingBag, CheckCircle, Search, Users, AlertTriangle, Clock, TrendingUp, Calendar } from "lucide-react";
import { useAdminStore } from "../store/adminStore";
import { formatPrice } from "../../utils/priceCalculator";
import { ORDER_STATUS_LABELS } from "../types";

function KpiCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] p-5" style={{background:"#0f1120"}}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[#6b7194] uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    dispute_opened: "bg-orange-100 text-orange-700",
    in_progress: "bg-blue-100 text-blue-700",
    searching_performer: "bg-purple-100 text-purple-700",
    waiting_client_confirmation: "bg-yellow-100 text-yellow-700",
    accepted: "bg-blue-100 text-blue-700",
    on_the_way: "bg-blue-100 text-blue-700",
    pending_payment: "bg-gray-100 text-[#a0a5c0]",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] ?? "bg-gray-100 text-[#8b90a8]"}`}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function AdminOverviewPage() {
  const { stats, orders, loadStats, loadOrders, isLoadingStats } = useAdminStore();

  useEffect(() => {
    loadStats();
    loadOrders();
  }, []);

  const recentOrders = orders.slice(0, 10);

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Обзор</h1>
        <p className="text-sm text-[#6b7194] mt-0.5">Marketplace operations dashboard</p>
      </div>

      {/* KPI Grid */}
      {isLoadingStats ? (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] p-5 animate-pulse h-24" style={{background:"#0f1120"}} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Активные заказы" value={stats?.activeOrders ?? 0} icon={<ShoppingBag size={16} className="text-blue-600" />} color="bg-blue-50" />
          <KpiCard label="Завершённые" value={stats?.completedOrders ?? 0} icon={<CheckCircle size={16} className="text-green-600" />} color="bg-green-50" />
          <KpiCard label="Поиск исполнителя" value={stats?.searchingOrders ?? 0} icon={<Search size={16} className="text-purple-600" />} color="bg-purple-50" />
          <KpiCard label="Исполнителей" value={stats?.performersTotal ?? 0} icon={<Users size={16} className="text-[#8b90a8]" />} color="bg-gray-100" />
          <KpiCard label="Открытых споров" value={stats?.openDisputes ?? 0} icon={<AlertTriangle size={16} className="text-orange-600" />} color="bg-orange-50" />
          <KpiCard label="Выплат в ожидании" value={stats?.pendingPayouts ?? 0} icon={<Clock size={16} className="text-yellow-600" />} color="bg-yellow-50" />
          <KpiCard label="Выручка (всего)" value={formatPrice(stats?.revenueTotal ?? 0)} icon={<TrendingUp size={16} className="text-emerald-600" />} color="bg-emerald-50" />
          <KpiCard label="Заказов сегодня" value={stats?.ordersToday ?? 0} icon={<Calendar size={16} className="text-indigo-600" />} color="bg-indigo-50" />
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-white/[0.08]">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <p className="text-sm font-semibold text-white">Последние заказы</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Клиент</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Услуга</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Исполнитель</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Сумма</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Статус</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Дата</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-[#6b7194]">{order.id.slice(0, 8)}…</td>
                  <td className="px-5 py-3 font-medium text-white">{order.clientName}</td>
                  <td className="px-5 py-3 text-[#8b90a8]">{order.serviceName}</td>
                  <td className="px-5 py-3 text-[#8b90a8]">{order.performerName ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3 font-semibold text-white">{formatPrice(order.priceTotal)}</td>
                  <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-5 py-3 text-[#6b7194] text-xs">{new Date(order.createdAt).toLocaleDateString("ru-RU")}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-[#6b7194] text-sm">Нет данных</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
