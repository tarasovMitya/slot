import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAffiliateStore } from "../store/affiliateStore";
import { formatPrice } from "../../utils/priceCalculator";
import { ORDER_STATUS_LABELS } from "../../admin/types";

const STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "searching_performer", label: "Поиск исполнителя" },
  { value: "in_progress", label: "В процессе" },
  { value: "waiting_client_confirmation", label: "Ожидает подтверждения" },
  { value: "completed", label: "Завершён" },
  { value: "dispute_opened", label: "Спор" },
  { value: "cancelled", label: "Отменён" },
];

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-900/40 text-green-400",
  cancelled: "bg-red-900/40 text-red-400",
  dispute_opened: "bg-orange-900/40 text-orange-400",
  in_progress: "bg-blue-900/40 text-blue-400",
  searching_performer: "bg-purple-900/40 text-purple-400",
  waiting_client_confirmation: "bg-yellow-900/40 text-yellow-400",
  performer_assigned: "bg-[#001a4d] text-[#6699ff]",
};

export function AffiliateOrdersPage() {
  const { orders, isLoadingOrders, loadOrders } = useAffiliateStore();
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadOrders(statusFilter === "all" ? undefined : statusFilter);
  }, [statusFilter]);

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Заказы</h1>
        <p className="text-sm text-[#6b7194] mt-0.5">Заказы ваших исполнителей</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === opt.value
                ? "bg-[#006AFF] text-white"
                : "border border-white/[0.08] text-[#6b7194] hover:text-white hover:border-white/20" 
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoadingOrders ? (
        <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-[#006AFF]" /></div>
      ) : orders.length === 0 ? (
        <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] p-10 text-center">
          <p className="text-[#6b7194] text-sm">Заказов не найдено</p>
        </div>
      ) : (
        <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-[#0c0e1a] border-b border-white/[0.05]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Исполнитель</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Услуга</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Адрес</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Сумма</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Дата</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{o.performerName}</td>
                  <td className="px-4 py-3 text-[#8b90a8]">{o.serviceName ?? o.categoryName}</td>
                  <td className="px-4 py-3 text-[#6b7194] max-w-[200px] truncate">{o.address}</td>
                  <td className="px-4 py-3 text-[#a0a5c0] font-medium">{formatPrice(o.priceTotal)}</td>
                  <td className="px-4 py-3 text-[#6b7194]">
                    {o.scheduledDate
                      ? new Date(o.scheduledDate).toLocaleDateString("ru-RU")
                      : new Date(o.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[o.status] ?? "bg-white/[0.06] text-[#8b90a8]"}`}>
                      {ORDER_STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
