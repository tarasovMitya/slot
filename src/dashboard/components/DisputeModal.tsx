import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle, Check } from "lucide-react";
import { DropZone } from "../../components/ui/DropZone";
import { WarningCard } from "../../components/ui/WarningCard";
import type { PhotoFile } from "../../components/ui/DropZone";

const REASONS = [
  "Работа выполнена некачественно",
  "Исполнитель не явился",
  "Повреждено имущество",
  "Оплата вне платформы",
  "Исполнитель грубил / вёл себя неподобающе",
  "Другое",
];

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string, reason: string, photos: File[]) => Promise<void>;
}

export function DisputeModal({ isOpen, onClose, onSubmit }: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const isDirty = reason.length > 0 || comment.trim().length > 0 || photos.length > 0;
  const canSubmit = reason.length > 0 && comment.trim().length > 10 && agreed && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit(comment.trim(), reason, photos.map((p) => p.file));
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setReason("");
      setComment("");
      setPhotos([]);
      setAgreed(false);
      setSubmitted(false);
      setShowDiscardConfirm(false);
    }, 300);
  };

  const handleClose = () => {
    if (submitted) { resetAndClose(); return; }
    if (isDirty) { setShowDiscardConfirm(true); return; }
    resetAndClose();
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
            className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl z-50 p-6 pb-10 shadow-xl max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500" />
                <span className="font-bold text-gray-900 text-base">Открыть спор</span>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {showDiscardConfirm ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-4"
              >
                <p className="font-semibold text-gray-900 text-center">Отменить обращение?</p>
                <p className="text-sm text-gray-500 text-center">Введённые данные будут потеряны</p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setShowDiscardConfirm(false)}
                    className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700"
                  >
                    Продолжить
                  </button>
                  <button
                    onClick={resetAndClose}
                    className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-semibold"
                  >
                    Отменить
                  </button>
                </div>
              </motion.div>
            ) : submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-4"
              >
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <CheckCircle size={24} className="text-orange-500" />
                </div>
                <p className="font-bold text-gray-900 text-base">Спор открыт</p>
                <p className="text-sm text-gray-500 text-center">
                  Рассматриваем 1–3 рабочих дня. Средства заморожены до решения.
                  Мы свяжемся с вами в чате поддержки.
                </p>
                <button
                  onClick={resetAndClose}
                  className="mt-2 w-full py-3.5 rounded-2xl bg-[#003B8F] text-white text-sm font-semibold"
                >
                  Закрыть
                </button>
              </motion.div>
            ) : (
              <>
                {/* Reason selector */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Причина обращения <span className="text-red-400">*</span>
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {REASONS.map((r) => (
                      <label key={r} className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-gray-100 cursor-pointer hover:border-gray-300 transition-colors">
                        <div
                          onClick={() => setReason(r)}
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            reason === r ? "border-[#006AFF]" : "border-gray-300"
                          }`}
                        >
                          {reason === r && <div className="w-2 h-2 rounded-full bg-black" />}
                        </div>
                        <span className="text-sm text-gray-700">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Описание ситуации <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Опишите, что произошло..."
                    rows={3}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{comment.length} симв.</p>
                </div>

                {/* Photos */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                    Доказательства (фото / видео)
                  </label>
                  <DropZone
                    label="Добавить фото"
                    hint="До 5 файлов · JPG, PNG до 10 МБ"
                    maxFiles={5}
                    files={photos}
                    onChange={setPhotos}
                  />
                </div>

                {/* Info */}
                <WarningCard variant="info" className="mb-4">
                  Спор рассматривается 1–3 рабочих дня. Средства заморожены до вынесения решения.
                </WarningCard>

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
                    Подтверждаю, что приведённые сведения достоверны
                  </span>
                </label>

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full py-4 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all active:scale-95 disabled:opacity-40"
                >
                  {submitting ? "Отправка..." : "Открыть спор"}
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
