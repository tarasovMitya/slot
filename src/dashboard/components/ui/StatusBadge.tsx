import type { OrderStatus } from "../../types";

const config: Record<OrderStatus, { label: string; className: string }> = {
  pending_payment: { label: "Ожидает оплаты", className: "bg-yellow-50 text-yellow-700" },
  searching: { label: "Ищем исполнителя", className: "bg-amber-50 text-amber-700" },
  assigned: { label: "Исполнитель найден", className: "bg-blue-50 text-blue-700" },
  on_the_way: { label: "Едет к вам", className: "bg-indigo-50 text-indigo-700" },
  in_progress: { label: "Работает", className: "bg-green-50 text-green-700" },
  completed: { label: "Завершён", className: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Отменён", className: "bg-red-50 text-red-600" },
};

interface StatusBadgeProps {
  status: OrderStatus;
  showDot?: boolean;
}

export function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const { label, className } = config[status];
  const isActive = !["completed", "cancelled"].includes(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full bg-current ${
            isActive ? "animate-pulse" : ""
          }`}
        />
      )}
      {label}
    </span>
  );
}
