import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useDashboardStore } from "../store/dashboardStore";

const steps = [
  { label: "Заказ создан", done: true },
  { label: "Оплата подтверждена", done: true },
  { label: "Поиск исполнителя", done: false, active: true },
  { label: "Назначение мастера", done: false },
];

export function SearchingPerformerView() {
  const { activeSharedOrderId, cancelOrder } = useDashboardStore();

  const handleCancel = () => {
    if (activeSharedOrderId) cancelOrder(activeSharedOrderId);
  };

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center justify-center min-h-[60vh] px-4 text-center gap-10">
      {/* Animated spinner */}
      <div className="relative w-24 h-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-gray-100 border-t-[#006AFF]"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-3 rounded-full bg-gray-50 flex items-center justify-center"
        >
          <span className="text-2xl">🔍</span>
        </motion.div>
      </div>

      {/* Text */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Ищем исполнителя</h2>
        <p className="text-gray-500 mt-2 text-base max-w-xs">
          Подбираем свободного мастера для вашего заказа
        </p>
      </div>

      {/* Progress steps */}
      <div className="w-full flex flex-col gap-3">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                step.done
                  ? "bg-black"
                  : step.active
                  ? "border-2 border-[#006AFF] bg-white"
                  : "border-2 border-gray-200 bg-white"
              }`}
            >
              {step.done && <Check size={12} className="text-white" strokeWidth={3} />}
              {step.active && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-black"
                />
              )}
            </div>
            <span
              className={`text-sm font-medium ${
                step.done ? "text-gray-900" : step.active ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
            {step.done && (
              <span className="ml-auto text-xs text-gray-400">✓</span>
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-gray-400">Обычно это занимает 1–5 минут</p>
        <button
          onClick={handleCancel}
          className="text-sm text-red-500 hover:text-red-600 transition-colors font-medium"
        >
          Отменить заказ
        </button>
      </div>
    </div>
  );
}
