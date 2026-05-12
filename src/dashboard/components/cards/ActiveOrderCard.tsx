import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, ChevronRight, X } from "lucide-react";
import { motion } from "framer-motion";
import { StatusBadge } from "../ui/StatusBadge";
import { PerformerCard } from "../ui/PerformerCard";
import { formatPrice } from "../../../utils/priceCalculator";
import type { Order } from "../../types";

const statusProgress: Record<string, number> = {
  searching: 10,
  assigned: 30,
  on_the_way: 55,
  in_progress: 80,
  completed: 100,
};

const CANCEL_WINDOW_MS = 15 * 60 * 1000;

function useRemainingMs(assignedAt: string | undefined): number | null {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!assignedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [assignedAt]);

  if (!assignedAt) return null;
  return Math.max(0, CANCEL_WINDOW_MS - (now - new Date(assignedAt).getTime()));
}

function formatTimer(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

interface ActiveOrderCardProps {
  order: Order;
  onCancel?: () => void;
}

export function ActiveOrderCard({ order, onCancel }: ActiveOrderCardProps) {
  const progress = statusProgress[order.status] ?? 0;
  const dateObj = order.scheduledDate ? new Date(order.scheduledDate) : null;
  const date = dateObj && !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
    : "";

  const remainingMs = useRemainingMs(order.assignedAt);

  // searching: always cancellable; assigned: cancellable within 15 min window
  const canCancel =
    order.status === "searching" ||
    (order.status === "assigned" && remainingMs !== null && remainingMs > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-100 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <Link to={`/dashboard/orders/${order.id}`}>
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <StatusBadge status={order.status} />
              <p className="text-base font-semibold text-gray-900 mt-2">{order.serviceName}</p>
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
          <div className="mt-4 mb-1">
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

      {/* Performer + ETA */}
      {order.performer && (
        <div className="px-5 py-4 border-t border-gray-50">
          <PerformerCard performer={order.performer} showPhone />
          {order.eta && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
              <Clock size={12} className="text-gray-400" />
              Прибудет <span className="font-semibold text-gray-900">{order.eta}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400">Стоимость</span>
        <div className="flex items-center gap-3 ml-auto">
          {canCancel && onCancel && (
            <button
              onClick={(e) => { e.preventDefault(); onCancel(); }}
              className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              <X size={13} />
              Отменить
              {order.status === "assigned" && remainingMs !== null && (
                <span className="text-red-400 font-mono">{formatTimer(remainingMs)}</span>
              )}
            </button>
          )}
          <span className="text-sm font-semibold text-gray-900">{formatPrice(order.priceTotal)}</span>
        </div>
      </div>
    </motion.div>
  );
}
