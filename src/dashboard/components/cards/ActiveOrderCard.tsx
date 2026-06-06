import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, ChevronRight, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "../ui/StatusBadge";
import { PerformerCard } from "../ui/PerformerCard";
import { formatPrice } from "../../../utils/priceCalculator";
import type { Order } from "../../types";

const statusProgress: Record<string, number> = {
  searching: 10,
  assigned: 30,
  on_the_way: 55,
  in_progress: 80,
  waiting_client_confirmation: 90,
  dispute_opened: 90,
  completed: 100,
};

const statusLabel: Record<string, string> = {
  searching: "Ищем исполнителя",
  assigned: "Исполнитель назначен",
  on_the_way: "Исполнитель в пути",
  in_progress: "Работа в процессе",
  waiting_client_confirmation: "Ожидает подтверждения",
  dispute_opened: "Рассматривается спор",
};

const CANCELLABLE = new Set(["searching", "assigned", "on_the_way", "in_progress", "waiting_client_confirmation"]);

interface ActiveOrderCardProps {
  order: Order;
  onCancel?: () => void;
}

export function ActiveOrderCard({ order, onCancel }: ActiveOrderCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const progress = statusProgress[order.status] ?? 0;
  const label = statusLabel[order.status] ?? "";
  const dateObj = order.scheduledDate ? new Date(order.scheduledDate) : null;
  const date = dateObj && !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
    : "";

  const canCancel = CANCELLABLE.has(order.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-100 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <Link to={`/dashboard/orders/${order.id}`}>
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0 flex-1">
              <StatusBadge status={order.status} />
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

          {/* Progress bar + label */}
          <div className="mt-4">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-black rounded-full"
              />
            </div>
            {label && (
              <p className="text-[11px] text-gray-400">{label}</p>
            )}
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

      {/* Confirm banner */}
      {order.status === "waiting_client_confirmation" && (
        <Link to={`/dashboard/orders/${order.id}`} className="block px-5 py-4 border-t border-green-100 bg-green-50 hover:bg-green-100 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-sm font-semibold text-green-800">Работа завершена</span>
            </div>
            <span className="text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-xl">
              Подтвердить →
            </span>
          </div>
        </Link>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400">Стоимость</span>
        <div className="flex items-center gap-3 ml-auto">
          {canCancel && onCancel && !showConfirm && (
            <button
              onClick={(e) => { e.preventDefault(); setShowConfirm(true); }}
              className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              <X size={13} />
              Отменить
            </button>
          )}
          <span className="text-sm font-semibold text-gray-900">{formatPrice(order.priceTotal)}</span>
        </div>
      </div>

      {/* Inline cancel confirmation */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 border-t border-red-100 bg-red-50 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                <p className="text-sm font-semibold text-red-800">Отменить заказ?</p>
              </div>
              <p className="text-xs text-red-600">Это действие нельзя отменить</p>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.preventDefault(); setShowConfirm(false); }}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 bg-white transition-all"
                >
                  Нет
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); onCancel?.(); }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all active:scale-95"
                >
                  Да, отменить
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
