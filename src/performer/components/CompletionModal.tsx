import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Check, Camera } from "lucide-react";
import { DropZone } from "../../components/ui/DropZone";
import { WarningCard } from "../../components/ui/WarningCard";
import type { PhotoFile } from "../../components/ui/DropZone";

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string, photos: File[]) => Promise<void>;
}

export function CompletionModal({ isOpen, onClose, onSubmit }: CompletionModalProps) {
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const isDirty = comment.trim().length > 0 || photos.length > 0;
  const canSubmit = photos.length >= 1 && agreed && !submitting;

  const handleClose = () => {
    if (submitting) return;
    if (isDirty) {
      setConfirmDiscard(true);
    } else {
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setComment("");
    setPhotos([]);
    setAgreed(false);
    setError(null);
    setConfirmDiscard(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(comment.trim(), photos.map((p) => p.file));
      setComment("");
      setPhotos([]);
      setAgreed(false);
    } catch {
      setError("Не удалось отправить отчёт. Попробуйте снова.");
    } finally {
      setSubmitting(false);
    }
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
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl p-6 pb-10 max-h-[92vh] overflow-y-auto"
          >
            {confirmDiscard ? (
              <div className="flex flex-col gap-4">
                <p className="text-base font-semibold text-gray-900 text-center">Отменить завершение?</p>
                <p className="text-sm text-gray-500 text-center">Загруженные фото и отчёт будут потеряны</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDiscard(false)}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600"
                  >
                    Продолжить
                  </button>
                  <button
                    onClick={resetAndClose}
                    className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold"
                  >
                    Отменить
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900">Завершение работы</h2>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <X size={16} className="text-gray-600" />
                  </button>
                </div>

                {/* Photos AFTER */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Camera size={13} className="text-gray-500" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Фото результата <span className="text-red-400">*</span>
                    </label>
                  </div>
                  <DropZone
                    label="Добавить фото ПОСЛЕ"
                    hint="Минимум 1 фото · JPG, PNG до 10 МБ"
                    maxFiles={6}
                    files={photos}
                    onChange={setPhotos}
                    required
                  />
                  {photos.length === 0 && (
                    <p className="text-xs text-red-400 mt-1.5">Необходимо загрузить хотя бы одно фото</p>
                  )}
                </div>

                {/* Comment */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Комментарий к работе
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Например: установил смеситель, проверил герметичность, убрал рабочее место"
                    className="w-full h-24 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  />
                </div>

                {/* Info */}
                <WarningCard variant="info" className="mb-4">
                  После завершения клиент получит уведомление и должен подтвердить в течение 24 часов.
                  Если не подтвердит — заказ закроется автоматически и выплата поступит.
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
                    Подтверждаю, что работа выполнена в полном объёме согласно заказу
                  </span>
                </label>

                {error && (
                  <div className="flex items-center gap-2 mb-3 text-red-600">
                    <AlertCircle size={14} className="shrink-0" />
                    <p className="text-xs">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#006AFF] text-white font-semibold text-base hover:bg-[#004CB8] transition-all active:scale-95 disabled:opacity-40"
                >
                  <CheckCircle size={18} />
                  {submitting ? "Отправка..." : "Завершить заказ"}
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
