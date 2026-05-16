import { motion, AnimatePresence } from "framer-motion";
import { useCalculatorStore } from "../store/calculatorStore";
import { calculatePrice, formatPrice, pluralService } from "../utils/priceCalculator";

interface PriceSummaryProps {
  variant: "sidebar" | "bottom";
  onSubmit?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function PriceSummary({ variant, onSubmit, submitLabel = "Продолжить", isSubmitting }: PriceSummaryProps) {
  const { selectedService, fieldValues, selectedCategory, step, cart } = useCalculatorStore();

  // Current service being configured (parameters step)
  const currentBreakdown = calculatePrice(selectedService, fieldValues);
  const hasCurrentService = !!selectedService;

  // Cart totals
  const cartTotal = cart.reduce((sum, item) => sum + item.priceTotal, 0);
  const grandTotal = cartTotal + (hasCurrentService ? currentBreakdown.total : 0);

  const showPrice = hasCurrentService || cart.length > 0;
  const showSubmit = !!onSubmit && step !== "category" && step !== "service" && step !== "add-more";

  if (variant === "bottom") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-4 max-w-xl mx-auto">
          <div>
            {showPrice ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={grandTotal}
                  initial={{ y: 4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -4, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(grandTotal)}</p>
                  <p className="text-xs text-gray-400">
                    {cart.length > 0
                      ? `${cart.length + (hasCurrentService ? 1 : 0)} ${pluralService(cart.length + (hasCurrentService ? 1 : 0))}`
                      : (selectedService?.name ?? "")}
                  </p>
                </motion.div>
              </AnimatePresence>
            ) : (
              <p className="text-sm text-gray-400">Выберите услугу</p>
            )}
          </div>
          {showSubmit && (
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="shrink-0 px-6 py-3 rounded-xl bg-black text-white font-semibold text-sm disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? "..." : submitLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Sidebar variant
  return (
    <div className="hidden lg:block w-80 shrink-0">
      <div className="sticky top-8 rounded-2xl border border-gray-100 bg-white p-6 flex flex-col gap-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Ваш заказ
        </p>

        {/* Cart items (already added) */}
        {cart.length > 0 && (
          <div className="flex flex-col gap-3">
            {cart.map((item, idx) => (
              <div key={item.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400 font-medium">
                    {idx + 1}. {item.serviceName}
                  </span>
                  <span className="text-xs font-semibold text-gray-700 shrink-0">
                    {formatPrice(item.priceTotal)}
                  </span>
                </div>
              </div>
            ))}

            {/* Separator if currently configuring another service */}
            {hasCurrentService && (
              <div className="border-t border-dashed border-gray-200 pt-3 mt-1">
                <p className="text-xs text-gray-400 mb-2 font-medium">Добавляем:</p>
              </div>
            )}
          </div>
        )}

        {/* Current service being configured */}
        {hasCurrentService && (
          <div className="flex flex-col gap-2">
            {selectedCategory && !cart.length && (
              <p className="text-sm text-gray-500">{selectedCategory.name}</p>
            )}
            {selectedService && (
              <p className="text-base font-semibold text-gray-900">{selectedService.name}</p>
            )}
            {currentBreakdown.items.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                {currentBreakdown.items.map((item, i) => (
                  <motion.div
                    key={i}
                    layout
                    className="flex items-start justify-between gap-2"
                  >
                    <span className="text-sm text-gray-500">{item.label}</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={item.amount}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm font-medium text-gray-900 shrink-0"
                      >
                        {formatPrice(item.amount)}
                      </motion.span>
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!showPrice && (
          <p className="text-sm text-gray-300">Услуга не выбрана</p>
        )}

        {/* Grand total */}
        {showPrice && (
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">Итого</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={grandTotal}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-xl font-bold text-gray-900"
              >
                {formatPrice(grandTotal)}
              </motion.span>
            </AnimatePresence>
          </div>
        )}

        {showSubmit && (
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-black text-white font-semibold disabled:opacity-50 transition-all hover:bg-gray-800 active:scale-95"
          >
            {isSubmitting ? "Загрузка..." : submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
