import { useEffect, useState } from "react";
import { Star, CheckCircle, Wifi, WifiOff } from "lucide-react";
import { useAdminStore } from "../store/adminStore";
import { formatPrice } from "../../utils/priceCalculator";
import type { AdminPerformer } from "../types";

const VERIFICATION_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
};
const VERIFICATION_LABELS: Record<string, string> = {
  approved: "Одобрен",
  pending: "На проверке",
  rejected: "Отклонён",
};

export function AdminPerformersPage() {
  const { performers, isLoadingPerformers, loadPerformers, adjustBalance, approvePayout } = useAdminStore();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminPerformer | null>(null);
  const [balanceDelta, setBalanceDelta] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadPerformers(); }, []);

  const filtered = performers.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.city.toLowerCase().includes(q);
  });

  async function handleAdjust() {
    if (!selected || !balanceDelta.trim()) return;
    const delta = parseFloat(balanceDelta);
    if (isNaN(delta)) return;
    setActionLoading(true);
    await adjustBalance(selected.id, delta);
    setBalanceDelta("");
    setActionLoading(false);
    await loadPerformers();
    setSelected((p) => performers.find((x) => x.id === p?.id) ?? null);
  }

  async function handleApprovePayout() {
    if (!selected) return;
    setActionLoading(true);
    await approvePayout(selected.id);
    setActionLoading(false);
    await loadPerformers();
    setSelected((p) => performers.find((x) => x.id === p?.id) ?? null);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Исполнители</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} исполнителей</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Поиск по имени, телефону, городу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoadingPerformers ? (
            <div className="p-8 text-center text-sm text-gray-400">Загрузка...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Имя</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Город</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Рейтинг</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Заказов</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Баланс</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">К выплате</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Онлайн</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(p.id === selected?.id ? null : p)}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${selected?.id === p.id ? "bg-blue-50" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.city || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                          <Star size={13} fill="currentColor" />
                          {p.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{p.completedOrders}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatPrice(p.balance)}</td>
                      <td className="px-4 py-3 text-orange-600 font-semibold">{p.pendingBalance > 0 ? formatPrice(p.pendingBalance) : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${VERIFICATION_COLORS[p.verificationStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {VERIFICATION_LABELS[p.verificationStatus] ?? p.verificationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.isOnline
                          ? <Wifi size={15} className="text-green-500" />
                          : <WifiOff size={15} className="text-gray-300" />}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">Нет исполнителей</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0 bg-white rounded-xl border border-gray-200 p-4 self-start space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Профиль</p>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>

            <div className="space-y-2 text-sm">
              <Row label="Имя" value={selected.name} />
              <Row label="Телефон" value={selected.phone || "—"} />
              <Row label="Telegram" value={selected.telegram || "—"} />
              <Row label="Город" value={selected.city || "—"} />
              <Row label="Адрес" value={selected.address || "—"} />
              <Row label="Радиус работы" value={`${selected.workRadius} км`} />
              <Row label="Рейтинг" value={`${selected.rating.toFixed(1)} / 5`} />
              <Row label="Завершено заказов" value={String(selected.completedOrders)} />
              <Row label="Специализации" value={selected.specializations.join(", ") || "—"} />
            </div>

            {/* Verification status */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Верификация</p>
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${VERIFICATION_COLORS[selected.verificationStatus]}`}>
                  {VERIFICATION_LABELS[selected.verificationStatus]}
                </span>
              </div>
            </div>

            {/* Balance section */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Финансы</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Баланс</span>
                  <span className="font-semibold text-gray-900">{formatPrice(selected.balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">К выплате</span>
                  <span className="font-semibold text-orange-600">{formatPrice(selected.pendingBalance)}</span>
                </div>
              </div>
            </div>

            {/* Adjust balance */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Корректировка баланса</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Сумма (±)"
                  value={balanceDelta}
                  onChange={(e) => setBalanceDelta(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <button
                  disabled={actionLoading || !balanceDelta.trim()}
                  onClick={handleAdjust}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "..." : "Применить"}
                </button>
              </div>
            </div>

            {/* Payout */}
            {selected.pendingBalance > 0 && (
              <button
                disabled={actionLoading}
                onClick={handleApprovePayout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle size={15} />
                {actionLoading ? "Обработка..." : `Выплатить ${formatPrice(selected.pendingBalance)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-800">{value}</p>
    </div>
  );
}
