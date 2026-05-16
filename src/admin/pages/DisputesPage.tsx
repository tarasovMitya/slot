import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useAdminStore } from "../store/adminStore";
import { formatPrice } from "../../utils/priceCalculator";

export function AdminDisputesPage() {
  const { disputes, isLoadingDisputes, loadDisputes, updateOrderStatus } = useAdminStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { loadDisputes(); }, []);

  const selectedDispute = selected ? disputes.find((d) => d.id === selected) : null;

  async function resolve(orderId: string, status: "completed" | "cancelled") {
    setActionLoading(orderId + status);
    await updateOrderStatus(orderId, status);
    await loadDisputes();
    setActionLoading(null);
    setSelected(null);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Споры</h1>
          <p className="text-sm text-gray-500 mt-0.5">{disputes.length} открытых споров</p>
        </div>
        {disputes.length > 0 && (
          <span className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <AlertTriangle size={12} />
            {disputes.length}
          </span>
        )}
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoadingDisputes ? (
            <div className="p-8 text-center text-sm text-gray-400">Загрузка...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID заказа</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Клиент</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Исполнитель</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Услуга</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Сумма</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Дата</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelected(d.id === selected ? null : d.id)}
                      className={`border-b border-gray-50 hover:bg-orange-50/50 transition-colors cursor-pointer ${selected === d.id ? "bg-orange-50" : ""}`}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-gray-400">{d.orderId.slice(0, 8)}…</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{d.clientName}</td>
                      <td className="px-5 py-3 text-gray-600">{d.performerName}</td>
                      <td className="px-5 py-3 text-gray-600 max-w-[160px] truncate">{d.serviceName}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900">{formatPrice(d.priceTotal)}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{new Date(d.createdAt).toLocaleDateString("ru-RU")}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          <button
                            disabled={actionLoading === d.orderId + "completed"}
                            onClick={(e) => { e.stopPropagation(); resolve(d.orderId, "completed"); }}
                            className="px-2.5 py-1 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === d.orderId + "completed" ? "..." : "Завершить"}
                          </button>
                          <button
                            disabled={actionLoading === d.orderId + "cancelled"}
                            onClick={(e) => { e.stopPropagation(); resolve(d.orderId, "cancelled"); }}
                            className="px-2.5 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === d.orderId + "cancelled" ? "..." : "Отменить"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {disputes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                        <AlertTriangle size={24} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Открытых споров нет</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedDispute && (
          <div className="w-72 shrink-0 bg-white rounded-xl border border-orange-200 p-4 self-start space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-orange-500" />
                <p className="text-sm font-semibold text-gray-900">Детали спора</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-400">ID заказа</p>
                <p className="font-mono text-xs text-gray-700">{selectedDispute.orderId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Клиент</p>
                <p className="text-gray-800">{selectedDispute.clientName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Исполнитель</p>
                <p className="text-gray-800">{selectedDispute.performerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Услуга</p>
                <p className="text-gray-800">{selectedDispute.serviceName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Сумма</p>
                <p className="font-semibold text-gray-900">{formatPrice(selectedDispute.priceTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Дата открытия</p>
                <p className="text-gray-700">{new Date(selectedDispute.createdAt).toLocaleString("ru-RU")}</p>
              </div>
            </div>

            {selectedDispute.disputeComment && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Причина спора</p>
                <p className="text-sm text-gray-700 bg-orange-50 border border-orange-100 rounded-lg p-3">
                  {selectedDispute.disputeComment}
                </p>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                disabled={!!actionLoading}
                onClick={() => resolve(selectedDispute.orderId, "completed")}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Завершить в пользу клиента
              </button>
              <button
                disabled={!!actionLoading}
                onClick={() => resolve(selectedDispute.orderId, "cancelled")}
                className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50"
              >
                Отменить заказ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
