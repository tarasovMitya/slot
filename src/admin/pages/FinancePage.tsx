import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Clock, Users, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { useAdminStore } from "../store/adminStore";
import { formatPrice } from "../../utils/priceCalculator";
import {
  dbGetAllPayoutRequests,
  dbApprovePayoutRequest,
  dbRejectPayoutRequest,
  type PayoutRequest,
} from "../../lib/payoutDb";

function statusLabel(status: PayoutRequest["status"]) {
  if (status === "pending") return { text: "Ожидает", cls: "bg-amber-100 text-amber-700" };
  if (status === "approved") return { text: "Одобрено", cls: "bg-green-100 text-green-700" };
  if (status === "rejected") return { text: "Отклонено", cls: "bg-red-100 text-red-700" };
  return { text: "Выполнено", cls: "bg-blue-100 text-blue-700" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function AdminFinancePage() {
  const { performers, stats, isLoadingPerformers, isLoadingStats, loadPerformers, loadStats } = useAdminStore();

  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  async function loadRequests() {
    setLoadingRequests(true);
    const data = await dbGetAllPayoutRequests();
    setRequests(data);
    setLoadingRequests(false);
  }

  useEffect(() => {
    loadPerformers();
    loadStats();
    loadRequests();
  }, []);

  const pending = requests.filter((r) => r.status === "pending");
  const history = requests.filter((r) => r.status !== "pending");

  const totalBalance = performers.reduce((sum, p) => sum + p.balance, 0);
  const totalPendingPayout = pending.reduce((sum, r) => sum + r.amount, 0);

  async function handleApprove(id: string) {
    setProcessingId(id);
    await dbApprovePayoutRequest(id);
    await loadRequests();
    setProcessingId(null);
  }

  async function handleReject(id: string) {
    setProcessingId(id);
    await dbRejectPayoutRequest(id, rejectNote.trim() || undefined);
    setRejectingId(null);
    setRejectNote("");
    await loadRequests();
    setProcessingId(null);
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
          label="Заявок к выплате"
          value={pending.length}
          icon={<Clock size={16} className="text-orange-600" />}
          color="bg-orange-50"
          loading={loadingRequests}
        />
        <KpiCard
          label="На балансах"
          value={formatPrice(totalBalance)}
          icon={<DollarSign size={16} className="text-blue-600" />}
          color="bg-blue-50"
          loading={isLoadingPerformers}
        />
        <KpiCard
          label="Сумма заявок"
          value={formatPrice(totalPendingPayout)}
          icon={<Users size={16} className="text-purple-600" />}
          color="bg-purple-50"
          loading={loadingRequests}
        />
      </div>

      {/* Pending payout requests */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Заявки на вывод</p>
          {pending.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
              {pending.length} ожидают
            </span>
          )}
        </div>
        {loadingRequests ? (
          <div className="p-8 text-center text-sm text-gray-400">Загрузка...</div>
        ) : pending.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">Нет новых заявок</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pending.map((req) => (
              <div key={req.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{req.performerName ?? "—"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{req.performerPhone ?? "—"} · карта •••• {req.cardLast4}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(req.requestedAt)}</p>
                    {req.balanceSnapshot != null && (
                      <p className="text-xs text-gray-400">Баланс на момент заявки: {formatPrice(req.balanceSnapshot)}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-gray-900">{formatPrice(req.amount)}</p>
                  </div>
                </div>

                {rejectingId === req.id ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <input
                      type="text"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Причина отказа (необязательно)"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={processingId === req.id}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {processingId === req.id ? "..." : "Подтвердить отказ"}
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectNote(""); }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={processingId === req.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <Check size={12} />
                      {processingId === req.id ? "..." : "Одобрить"}
                    </button>
                    <button
                      onClick={() => setRejectingId(req.id)}
                      disabled={processingId === req.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <X size={12} />
                      Отклонить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History (collapsible) */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-4">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full px-5 py-4 flex items-center justify-between text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors rounded-xl"
          >
            <span>История заявок ({history.length})</span>
            {showHistory ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {showHistory && (
            <div className="border-t border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Исполнитель</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Карта</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Сумма</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((req) => {
                    const s = statusLabel(req.status);
                    return (
                      <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{req.performerName ?? "—"}</td>
                        <td className="px-5 py-3 text-gray-600">•••• {req.cardLast4}</td>
                        <td className="px-5 py-3 font-semibold text-gray-900">{formatPrice(req.amount)}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.text}</span>
                          {req.adminNote && <p className="text-xs text-gray-400 mt-0.5">{req.adminNote}</p>}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(req.requestedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
