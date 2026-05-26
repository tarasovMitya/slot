import type { PerformerOrderStatus } from "../../types";

const config: Record<string, { label: string; className: string }> = {
  available: { label: "Новый", className: "bg-amber-50 text-amber-700" },
  accepted: { label: "Принят", className: "bg-blue-50 text-blue-700" },
  on_the_way: { label: "Еду к клиенту", className: "bg-indigo-50 text-indigo-700" },
  in_progress: { label: "Выполняется", className: "bg-purple-50 text-purple-700" },
  waiting_client_confirmation: { label: "Ожидает подтверждения", className: "bg-orange-50 text-orange-700" },
  dispute_opened: { label: "Спор открыт", className: "bg-red-50 text-red-600" },
  completed: { label: "Завершён", className: "bg-green-50 text-green-700" },
  rejected: { label: "Отклонён", className: "bg-gray-100 text-gray-500" },
};

export function PerformerStatusBadge({ status }: { status: PerformerOrderStatus }) {
  const { label, className } = config[status] ?? { label: status, className: "bg-gray-100 text-gray-500" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}
