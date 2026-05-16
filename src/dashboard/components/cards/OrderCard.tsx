import { Link } from "react-router-dom";
import { ChevronRight, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { StatusBadge } from "../ui/StatusBadge";
import { formatPrice } from "../../../utils/priceCalculator";
import type { Order } from "../../types";

interface OrderCardProps {
  order: Order;
  onRepeat?: () => void;
}

export function OrderCard({ order, onRepeat }: OrderCardProps) {
  const date = new Date(order.scheduledDate).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 transition-all"
    >
      <Link to={`/dashboard/orders/${order.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{order.serviceName}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {date} · {order.scheduledTime} · {order.address}
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300 shrink-0 mt-0.5" />
        </div>

        <div className="flex items-center justify-between">
          <StatusBadge status={order.status} />
          <span className="text-sm font-semibold text-gray-900">
            {formatPrice(order.priceTotal)}
          </span>
        </div>
      </Link>

      {order.status === "completed" && onRepeat && (
        <div className="border-t border-gray-50 px-5 py-3">
          <button
            onClick={onRepeat}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <RotateCcw size={14} />
            Повторить заказ
          </button>
        </div>
      )}
    </motion.div>
  );
}
