import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";

interface RatingModalProps {
  performerName: string;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onSkip: () => void;
}

export function RatingModal({ performerName, onSubmit, onSkip }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(rating, comment.trim());
      setSubmitted(true);
      setTimeout(onSkip, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const labels = ["", "Плохо", "Ниже ожиданий", "Нормально", "Хорошо", "Отлично!"];
  const displayed = hovered || rating;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <div />
            <button
              onClick={onSkip}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <div className="px-6 pb-8 flex flex-col items-center gap-5">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-6 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-900">Спасибо за оценку!</p>
                <p className="text-sm text-gray-500">Ваш отзыв поможет другим выбрать исполнителя</p>
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Как прошла работа?</h2>
                  <p className="text-gray-500 mt-1.5 text-sm">
                    Оцените работу <span className="font-semibold text-gray-700">{performerName}</span>
                  </p>
                </div>

                <div className="flex gap-2" onMouseLeave={() => setHovered(0)}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      type="button"
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        size={40}
                        className={`transition-all duration-100 ${
                          star <= displayed
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-200 fill-gray-100"
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>

                <p className="text-sm font-semibold text-gray-600 h-5 transition-all">
                  {displayed > 0 ? labels[displayed] : ""}
                </p>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Расскажите подробнее (необязательно)"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#006AFF] text-sm outline-none transition-colors resize-none"
                />

                <div className="w-full flex flex-col gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={rating === 0 || submitting}
                    className="w-full py-4 rounded-2xl bg-[#006AFF] text-white font-semibold text-base hover:bg-[#004CB8] transition-all active:scale-95 disabled:opacity-40"
                  >
                    {submitting ? "Отправляем..." : "Отправить отзыв"}
                  </button>
                  <button
                    onClick={onSkip}
                    className="w-full py-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Позже
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
