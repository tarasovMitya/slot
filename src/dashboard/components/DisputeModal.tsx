import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle } from "lucide-react";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => Promise<void>;
}

export function DisputeModal({ isOpen, onClose, onSubmit }: DisputeModalProps) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    await onSubmit(comment.trim());
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setComment("");
      setSubmitted(false);
    }, 300);
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
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl z-50 p-6 pb-10 shadow-xl"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500" />
                <span className="font-semibold text-gray-900">Открыть спор</span>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <p className="font-semibold text-gray-900">Спор открыт</p>
                <p className="text-sm text-gray-500 text-center">С вами свяжется поддержка</p>
                <button
                  onClick={handleClose}
                  className="mt-2 px-6 py-2.5 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all"
                >
                  Закрыть
                </button>
              </motion.div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                    Описание проблемы
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Опишите, что пошло не так..."
                    rows={4}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !comment.trim()}
                  className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Отправка..." : "Отправить жалобу"}
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
