import { useEffect, useState } from "react";
import { useAdminStore } from "../store/adminStore";
import { formatPrice } from "../../utils/priceCalculator";
import { ORDER_STATUS_LABELS, type OrderStatusFilter } from "../types";
import { ChevronDown } from "lucide-react";

const STATUS_OPTIONS: { value: OrderStatusFilter; label: string }[] = [
  { value: "all", label: "Все статусы" },
  { value: "searching_performer", label: "Поиск исполнителя" },
  { value: "in_progress", label: "В процессе" },
  { value: "waiting_client_confirmation", label: "Ожидает подтверждения" },
  { value: "completed", label: "Завершён" },
  { value: "dispute_opened", label: "Спор" },
  { value: "cancelled", label: "Отменён" },
];

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  dispute_opened: "bg-orange-100 text-orange-700",
  in_progress: "bg-blue-100 text-blue-700",
  searching_performer: "bg-purple-100 text-purple-700",
  waiting_client_confirmation: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  on_the_way: "bg-blue-100 text-blue-700",
  pending_payment: "bg-gray-100 text-gray-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"}`}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const NEXT_STATUSES: Record<string, { value: string; label: string }[]> = {
  searching_performer: [{ value: "in_progress", label: "В процессе" }, { value: "cancelled", label: "Отменить" }],
  in_progress: [{ value: "waiting_client_confirmation", label: "Ожидает подтверждения" }, { value: "cancelled", label: "Отменить" }],
  waiting_client_confirmation: [{ value: "completed", label: "Завершить" }, { value: "dispute_opened", label: "Открыть спор" }],
  dispute_opened: [{ value: "completed", label: "Завершить" }, { value: "cancelled", label: "Отменить" }],
};

export function AdminOrdersPage() {
  const { orders, isLoadingOrders, loadOrders, updateOrderStatus, cancelOrder } = useAdminStore();
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadOrders(statusFilter === "all" ? undefined : statusFilter);
  }, [statusFilter]);

  const filtered = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.clientName.toLowerCase().includes(q) ||
      (o.performerName ?? "").toLowerCase().includes(q) ||
      o.serviceName.toLowerCase().includes(q)
    );
  });

  const selectedOrder = selectedId ? orders.find((o) => o.id === selectedId) : null;

  async function handleStatusChange(orderId: string, status: string) {
    setActionLoading(orderId + status);
    if (status === "cancelled") await cancelOrder(orderId);
    else await updateOrderStatus(orderId, status);
    setActionLoading(null);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Заказы</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} заказов</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatusFilter)}
            className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <input
          type="text"
          placeholder="Поиск по ID, клиенту, исполнителю..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoadingOrders ? (
            <div className="p-8 text-center text-sm text-gray-400">Загрузка...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Клиент</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Услуга</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Исполнитель</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Сумма</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Дата</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedId(order.id === selectedId ? null : order.id)}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${selectedId === order.id ? "bg-blue-50" : ""}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{order.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{order.clientName}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{order.serviceName}</td>
                      <td className="px-4 py-3 text-gray-600">{order.performerName ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatPrice(order.priceTotal)}</td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-4 py-3">
                        {NEXT_STATUSES[order.status] && (
                          <div className="flex gap-1">
                            {NEXT_STATUSES[order.status].map((s) => (
                              <button
                                key={s.value}
                                disabled={actionLoading === order.id + s.value}
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, s.value); }}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  s.value === "cancelled"
                                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                } disabled:opacity-50`}
                              >
                                {actionLoading === order.id + s.value ? "..." : s.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">Нет заказов</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedOrder && (
          <div className="w-72 shrink-0 bg-white rounded-xl border border-gray-200 p-4 self-start space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Детали заказа</p>
              <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="ID" value={selectedOrder.id.slice(0, 12) + "…"} mono />
              <Row label="Клиент" value={selectedOrder.clientName} />
              <Row label="Email" value={selectedOrder.clientEmail} />
              <Row label="Телефон" value={selectedOrder.clientPhone} />
              <Row label="Услуга" value={selectedOrder.serviceName} />
              <Row label="Категория" value={selectedOrder.categoryName} />
              <Row label="Адрес" value={selectedOrder.address} />
              <Row label="Дата" value={`${selectedOrder.scheduledDate} ${selectedOrder.scheduledTime}`} />
              <Row label="Сумма" value={formatPrice(selectedOrder.priceTotal)} />
              <Row label="Исполнитель" value={selectedOrder.performerName ?? "—"} />
              {selectedOrder.clientRating && <Row label="Рейтинг" value={`${selectedOrder.clientRating} / 5`} />}
              {selectedOrder.disputeComment && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Комментарий к спору</p>
                  <p className="text-gray-700 text-xs bg-orange-50 rounded p-2">{selectedOrder.disputeComment}</p>
                </div>
              )}
              {selectedOrder.completionComment && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Комментарий исполнителя</p>
                  <p className="text-gray-700 text-xs bg-gray-50 rounded p-2">{selectedOrder.completionComment}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Статус</p>
              <StatusBadge status={selectedOrder.status} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-gray-800 ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}
