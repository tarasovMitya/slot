import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, MapPin, ChevronRight, Phone } from "lucide-react";
import { PerformerStatusBadge } from "../ui/StatusBadge";
import { formatPrice } from "../../../utils/priceCalculator";
import type { PerformerOrder } from "../../types";

const statusProgress: Record<string, number> = {
  accepted: 25,
  on_the_way: 50,
  in_progress: 75,
  completed: 100,
};

interface ActiveOrderCardProps {
  order: PerformerOrder;
}

export function PerformerActiveOrderCard({ order }: ActiveOrderCardProps) {
  const date = new Date(order.scheduledDate).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  const progress = statusProgress[order.status] ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-100 rounded-2xl overflow-hidden"
    >
      <Link to={`/performer/orders/${order.id}`}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-1 gap-2">
            <div className="min-w-0 flex-1">
              <PerformerStatusBadge status={order.status} />
              <p className="text-base font-semibold text-gray-900 mt-2 line-clamp-1">{order.serviceName}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  {date} · {order.scheduledTime}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={12} />
                  {order.address}
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-black rounded-full"
              />
            </div>
          </div>
        </div>
      </Link>

      {/* Client + price */}
      <div className="px-5 py-3.5 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
            {order.client.name[0]}
          </div>
          <span className="text-sm font-medium text-gray-700">{order.client.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">{formatPrice(order.priceTotal)}</span>
          <a
            href={`tel:${order.client.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <Phone size={14} className="text-gray-600" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
