import { motion } from "framer-motion";
import { Clock, MapPin, MessageSquare, Check, X } from "lucide-react";
import { formatPrice } from "../../../utils/priceCalculator";
import { DistanceBadge } from "../ui/DistanceBadge";
import type { PerformerOrder } from "../../types";

interface AvailableOrderCardProps {
  order: PerformerOrder;
  onAccept: () => void;
  onReject: () => void;
  isAccepting?: boolean;
  isUnavailable?: boolean;
}

export function AvailableOrderCard({ order, onAccept, onReject, isAccepting, isUnavailable }: AvailableOrderCardProps) {
  const date = new Date(order.scheduledDate).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="border border-gray-100 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {order.categoryName}
              </span>
              {order.distance && (
                <DistanceBadge distance={order.distance} etaMinutes={order.etaMinutes} />
              )}
            </div>
            <p className="text-base font-semibold text-gray-900 line-clamp-1">{order.serviceName}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-gray-900">{formatPrice(order.priceTotal)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{order.duration}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={12} className="text-gray-400 shrink-0" />
            {date} · {order.scheduledTime}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={12} className="text-gray-400 shrink-0" />
            {order.address}
          </div>
          {order.comment && (
            <div className="flex items-start gap-2 text-xs text-gray-500 mt-1">
              <MessageSquare size={12} className="text-gray-400 shrink-0 mt-0.5" />
              <span className="italic">{order.comment}</span>
            </div>
          )}
        </div>

        {/* Price breakdown */}
        <div className="mt-4 bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5">
          {order.priceBreakdown.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-xs text-gray-500">{item.label}</span>
              <span className="text-xs font-medium text-gray-900">{formatPrice(item.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-3">
        <button
          onClick={onReject}
          disabled={isAccepting || isUnavailable}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all active:scale-95 disabled:opacity-40"
        >
          <X size={16} />
          Отклонить
        </button>
        {isUnavailable ? (
          <div className="flex-1 flex items-center justify-center py-3 rounded-xl bg-gray-100 text-sm font-semibold text-gray-400">
            Уже занят
          </div>
        ) : (
          <button
            onClick={onAccept}
            disabled={isAccepting}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-60"
          >
            {isAccepting ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {isAccepting ? "Принимаем..." : "Принять"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
