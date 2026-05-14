import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle } from "lucide-react";

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => Promise<void>;
}

export function CompletionModal({ isOpen, onClose, onSubmit }: CompletionModalProps) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(comment.trim());
    setSubmitting(false);
    setComment("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl p-6 pb-10"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Завершение работы</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Опишите выполненные работы. Клиент получит уведомление и сможет подтвердить завершение.
            </p>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Например: установил смеситель, проверил герметичность, убрал рабочее место"
              className="w-full h-28 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-black text-white font-semibold text-base hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-60"
            >
              <CheckCircle size={18} />
              {submitting ? "Отправка..." : "Подтвердить завершение"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
