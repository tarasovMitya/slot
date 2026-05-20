import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";
import { trackEvent } from "../../hooks/useAnalytics";

interface CompletionConfirmBlockProps {
  comment: string | null | undefined;
  completionTime: string | null | undefined;
  onConfirm: () => Promise<void>;
  onDispute: () => void;
}

export function CompletionConfirmBlock({
  comment,
  completionTime,
  onConfirm,
  onDispute,
}: CompletionConfirmBlockProps) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
      trackEvent("order_confirmed");
      setConfirmed(true);
    } finally {
      setConfirming(false);
    }
  };

  const timeStr = completionTime
    ? new Date(completionTime).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="border border-green-100 bg-green-50 rounded-2xl p-5 flex flex-col items-center gap-2 text-center"
      >
        <CheckCircle size={28} className="text-green-600" />
        <p className="text-sm font-semibold text-green-800">Выполнение подтверждено</p>
        <p className="text-xs text-green-600">Спасибо! Оцените работу исполнителя</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-green-100 bg-green-50 rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle size={16} className="text-green-600 shrink-0" />
        <span className="text-sm font-semibold text-green-800">Исполнитель завершил работу</span>
        {timeStr && <span className="ml-auto text-xs text-green-600 shrink-0">{timeStr}</span>}
      </div>

      {comment && (
        <p className="text-sm text-gray-700 bg-white rounded-xl px-4 py-3 mb-4 border border-green-100">
          {comment}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-all active:scale-95 disabled:opacity-60"
        >
          {confirming ? "Подтверждение..." : "Подтвердить выполнение"}
        </button>
        <button
          onClick={onDispute}
          className="w-full py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-red-200 hover:text-red-600 transition-all flex items-center justify-center gap-1.5"
        >
          <AlertCircle size={14} />
          Есть проблема
        </button>
      </div>
    </motion.div>
  );
}
