import { useEffect } from "react";
import { TrendingUp, ShoppingBag, CheckCircle, AlertTriangle, Users, Star } from "lucide-react";
import { useAdminStore } from "../store/adminStore";
import { formatPrice } from "../../utils/priceCalculator";

export function AdminAnalyticsPage() {
  const { stats, orders, performers, isLoadingStats, isLoadingOrders, isLoadingPerformers, loadStats, loadOrders, loadPerformers } = useAdminStore();

  useEffect(() => {
    loadStats();
    loadOrders();
    loadPerformers();
  }, []);

  const loading = isLoadingStats || isLoadingOrders || isLoadingPerformers;

  // Compute derived metrics
  const totalOrders = orders.length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  const disputes = orders.filter((o) => o.status === "dispute_opened").length;
  const completionRate = totalOrders > 0 ? Math.round((completed / totalOrders) * 100) : 0;
  const disputeRate = totalOrders > 0 ? ((disputes / totalOrders) * 100).toFixed(1) : "0";
  const cancellationRate = totalOrders > 0 ? ((cancelled / totalOrders) * 100).toFixed(1) : "0";
  const avgOrderValue = completed > 0
    ? orders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.priceTotal, 0) / completed
    : 0;
  const ratedOrders = orders.filter((o) => o.clientRating != null && o.clientRating > 0);
  const avgRating = ratedOrders.length > 0
    ? ratedOrders.reduce((sum, o) => sum + (o.clientRating ?? 0), 0) / ratedOrders.length
    : 0;
  const verifiedPerformers = performers.filter((p) => p.verificationStatus === "approved").length;
  const onlinePerformers = performers.filter((p) => p.isOnline).length;

  // Status distribution
  const statusDist: Record<string, number> = {};
  for (const o of orders) {
    statusDist[o.status] = (statusDist[o.status] ?? 0) + 1;
  }

  // Top performers by completedOrders
  const topPerformers = [...performers]
    .sort((a, b) => b.completedOrders - a.completedOrders)
    .slice(0, 5);

  // Service distribution
  const serviceDist: Record<string, number> = {};
  for (const o of orders) {
    const key = o.categoryName || o.serviceName;
    serviceDist[key] = (serviceDist[key] ?? 0) + 1;
  }
  const topServices = Object.entries(serviceDist)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Аналитика</h1>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Аналитика</h1>
        <p className="text-sm text-gray-500 mt-0.5">Метрики платформы</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="GMV (выручка)" value={formatPrice(stats?.revenueTotal ?? 0)} sub="всего" icon={<TrendingUp size={16} className="text-emerald-600" />} color="bg-emerald-50" />
        <MetricCard label="Всего заказов" value={totalOrders} sub={`сегодня: ${stats?.ordersToday ?? 0}`} icon={<ShoppingBag size={16} className="text-blue-600" />} color="bg-blue-50" />
        <MetricCard label="Выполнение" value={`${completionRate}%`} sub={`${completed} из ${totalOrders}`} icon={<CheckCircle size={16} className="text-green-600" />} color="bg-green-50" />
        <MetricCard label="Средний чек" value={formatPrice(avgOrderValue)} sub="завершённые заказы" icon={<TrendingUp size={16} className="text-indigo-600" />} color="bg-indigo-50" />
        <MetricCard label="Споры" value={`${disputeRate}%`} sub={`${disputes} заказов`} icon={<AlertTriangle size={16} className="text-orange-600" />} color="bg-orange-50" />
        <MetricCard label="Отмены" value={`${cancellationRate}%`} sub={`${cancelled} заказов`} icon={<ShoppingBag size={16} className="text-red-500" />} color="bg-red-50" />
        <MetricCard label="Исполнители" value={performers.length} sub={`верифицировано: ${verifiedPerformers}`} icon={<Users size={16} className="text-purple-600" />} color="bg-purple-50" />
        <MetricCard label="Средний рейтинг" value={avgRating.toFixed(1)} sub={`${ratedOrders.length} оценок`} icon={<Star size={16} className="text-amber-500" />} color="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Распределение статусов</p>
          <div className="space-y-2">
            {Object.entries(statusDist).sort(([, a], [, b]) => b - a).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-gray-600 truncate">{STATUS_LABELS[status] ?? status}</span>
                    <span className="text-xs font-semibold text-gray-900 ml-2">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${STATUS_BAR_COLORS[status] ?? "bg-gray-400"}`}
                      style={{ width: `${Math.round((count / totalOrders) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(statusDist).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Нет данных</p>
            )}
          </div>
        </div>

        {/* Top performers */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Топ исполнителей</p>
          <div className="space-y-3">
            {topPerformers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-5 text-xs text-gray-400 text-center font-semibold">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.completedOrders} заказов · ★ {p.rating.toFixed(1)}</p>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${p.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
              </div>
            ))}
            {topPerformers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Нет данных</p>}
          </div>
        </div>

        {/* Top services */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Популярные категории</p>
          <div className="space-y-2">
            {topServices.map(([service, count]) => (
              <div key={service} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-gray-600 truncate">{service}</span>
                    <span className="text-xs font-semibold text-gray-900 ml-2">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${Math.round((count / totalOrders) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {topServices.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Нет данных</p>}
          </div>
        </div>
      </div>

      {/* Online performers */}
      <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-900 mb-1">Исполнители онлайн</p>
        <p className="text-xs text-gray-400 mb-4">Сейчас активно {onlinePerformers} из {performers.length}</p>
        <div className="flex flex-wrap gap-2">
          {performers.filter((p) => p.isOnline).map((p) => (
            <span key={p.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {p.name}
            </span>
          ))}
          {onlinePerformers === 0 && <p className="text-sm text-gray-400">Нет исполнителей онлайн</p>}
        </div>
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  completed: "Завершён",
  cancelled: "Отменён",
  dispute_opened: "Спор",
  in_progress: "В процессе",
  searching_performer: "Поиск",
  waiting_client_confirmation: "Ожидает подтверждения",
  accepted: "Принят",
  on_the_way: "Едет",
  pending_payment: "Ожидает оплаты",
};

const STATUS_BAR_COLORS: Record<string, string> = {
  completed: "bg-green-500",
  cancelled: "bg-red-400",
  dispute_opened: "bg-orange-500",
  in_progress: "bg-blue-500",
  searching_performer: "bg-purple-500",
  waiting_client_confirmation: "bg-yellow-500",
  accepted: "bg-blue-400",
  on_the_way: "bg-cyan-500",
  pending_payment: "bg-gray-400",
};

function MetricCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
