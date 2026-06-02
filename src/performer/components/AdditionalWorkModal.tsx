import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Check, AlertTriangle, SendHorizonal } from "lucide-react";

interface AdditionalWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { description: string; price: number; materials: number; duration: number }) => Promise<void>;
}

export function AdditionalWorkModal({ isOpen, onClose, onSubmit }: AdditionalWorkModalProps) {
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [materials, setMaterials] = useState("");
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const total = (parseFloat(price) || 0) + (parseFloat(materials) || 0);
  const canSubmit = description.trim().length > 0 && parseFloat(price) > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        description: description.trim(),
        price: parseFloat(price),
        materials: parseFloat(materials) || 0,
        duration: parseInt(duration) || 0,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
    setTimeout(() => {
      setDescription("");
      setPrice("");
      setMaterials("");
      setDuration("");
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
            onClick={!submitting ? handleClose : undefined}
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
                <Plus size={18} className="text-gray-700" />
                <p className="text-base font-bold text-gray-900">Дополнительные работы</p>
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
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <SendHorizonal size={20} className="text-blue-600" />
                </div>
                <p className="font-semibold text-gray-900">Запрос отправлен клиенту</p>
                <p className="text-sm text-gray-500 text-center">
                  Ожидайте подтверждения. Не начинайте работу до получения согласия.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-2 w-full py-3.5 rounded-2xl bg-[#003B8F] text-white text-sm font-semibold hover:bg-[#004CB8] transition-all"
                >
                  Закрыть
                </button>
              </motion.div>
            ) : (
              <>
                {/* Description */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Описание работ <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Например: обнаружил засор в канализационной трубе, требуется прочистка"
                    rows={3}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                  />
                </div>

                {/* Price fields */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                      Работа, ₽ <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                      Материалы, ₽
                    </label>
                    <input
                      type="number"
                      value={materials}
                      onChange={(e) => setMaterials(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-all"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Примерное время, мин
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30"
                    min="0"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-all"
                  />
                </div>

                {/* Total */}
                {total > 0 && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-4">
                    <span className="text-sm text-gray-500">Итого доплата</span>
                    <span className="text-base font-bold text-gray-900">{total.toLocaleString("ru-RU")} ₽</span>
                  </div>
                )}

                {/* Warning */}
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 leading-snug">
                    Не начинайте дополнительные работы до подтверждения клиентом. Неподтверждённые работы не оплачиваются.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#006AFF] text-white text-sm font-semibold hover:bg-[#004CB8] transition-all active:scale-95 disabled:opacity-40"
                  >
                    <Check size={15} />
                    Отправить запрос
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
