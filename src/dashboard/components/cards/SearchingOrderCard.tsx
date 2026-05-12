import { motion } from "framer-motion";
import { Check, Clock, MapPin, X } from "lucide-react";
import type { Order } from "../../types";

const progressSteps = [
  { id: "t1", label: "Заказ создан" },
  { id: "t2", label: "Оплата подтверждена" },
  { id: "t3", label: "Поиск исполнителя" },
  { id: "t4", label: "Исполнитель назначен" },
];

interface SearchingOrderCardProps {
  order: Order;
  onCancel?: () => void;
}

export function SearchingOrderCard({ order, onCancel }: SearchingOrderCardProps) {
  const date = new Date(order.scheduledDate).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-100 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"
            />
            Ищем исполнителя
          </span>
        </div>

        <p className="text-base font-semibold text-gray-900">{order.serviceName}</p>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={12} />
            {date} · {order.scheduledTime}
          </span>
          {order.address && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin size={12} />
              {order.address}
            </span>
          )}
        </div>
      </div>

      {/* Cancel button */}
      {onCancel && (
        <div className="px-5 pb-0">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            <X size={13} />
            Отменить заказ
          </button>
        </div>
      )}

      {/* Progress steps */}
      <div className="px-5 pb-5 pt-4 flex flex-col gap-2.5">
        {progressSteps.map((step, i) => {
          const event = order.timeline.find((t) => t.id === step.id);
          const isDone = event?.completed ?? false;
          const isActive = !isDone && order.timeline[i - 1]?.completed;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isDone
                    ? "bg-black"
                    : isActive
                    ? "border-2 border-black bg-white"
                    : "border-2 border-gray-200 bg-white"
                }`}
              >
                {isDone && <Check size={10} className="text-white" strokeWidth={3} />}
                {isActive && (
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-black"
                  />
                )}
              </div>

              <span
                className={`text-sm font-medium ${
                  isDone ? "text-gray-900" : isActive ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>

              {event?.time && isDone && (
                <span className="ml-auto text-xs text-gray-400">{event.time}</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
