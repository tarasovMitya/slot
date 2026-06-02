import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, Check } from "lucide-react";
import { formatPrice } from "../../utils/priceCalculator";
import type { PerformerOrder } from "../types";

interface AcceptOrderModalProps {
  order: PerformerOrder | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function AcceptOrderModal({ order, onConfirm, onCancel }: AcceptOrderModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
      setAgreed(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setAgreed(false);
    onCancel();
  };

  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl z-50 p-6 pb-10 shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-base font-bold text-gray-900">Принять заказ?</p>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Order summary */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex flex-col gap-2">
              <p className="text-sm font-semibold text-gray-900">{order.serviceName}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {new Date(order.scheduledDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} · {order.scheduledTime}
                </span>
                <span className="font-bold text-gray-900">{formatPrice(Math.round(order.priceTotal * 0.85))}</span>
              </div>
              <p className="text-xs text-gray-400 truncate">{order.address}</p>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5">
              <ShieldAlert size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 leading-snug">
                <p className="font-semibold mb-0.5">Ответственность за качество</p>
                Принимая заказ, вы берёте на себя обязательство выполнить его в оговорённый срок и должном качестве.
                Отмена менее чем за 1 час — штраф 500 ₽.
              </div>
            </div>

            {/* Consent */}
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <button
                onClick={() => setAgreed(!agreed)}
                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  agreed ? "bg-[#006AFF] border-[#006AFF]" : "border-gray-300"
                }`}
              >
                {agreed && <Check size={11} className="text-white" strokeWidth={3} />}
              </button>
              <span className="text-sm text-gray-700 leading-snug">
                Подтверждаю условия принятия заказа и ответственность за его выполнение
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirm}
                disabled={!agreed || submitting}
                className="flex-1 py-3.5 rounded-2xl bg-[#006AFF] text-white text-sm font-semibold hover:bg-[#004CB8] transition-all active:scale-95 disabled:opacity-40"
              >
                {submitting ? "Принимаем..." : "Принять заказ"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
