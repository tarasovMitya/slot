import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, ShoppingBag, ArrowRight } from "lucide-react";
import { useCalculatorStore } from "../../store/calculatorStore";
import { formatPrice, pluralService } from "../../utils/priceCalculator";

export function AddMoreStep() {
  const { cart, removeFromCart, startEditCartItem, setStep, clearCurrentService, goNext } =
    useCalculatorStore();

  const cartTotal = cart.reduce((sum, item) => sum + item.priceTotal, 0);

  const handleAddAnother = () => {
    clearCurrentService();
    setStep("category");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center mb-2">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={24} className="text-gray-700" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          Состав заказа
        </h2>
        <p className="text-gray-500 mt-2 text-lg">
          {cart.length === 1
            ? "Добавьте ещё услуги или переходите к оформлению"
            : `${cart.length} ${pluralService(cart.length)} в заказе`}
        </p>
      </div>

      {/* Cart items */}
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {cart.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="border border-gray-100 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 items-start min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-gray-500">{idx + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-400">{item.categoryName}</p>
                    <p className="text-base font-semibold text-gray-900">{item.serviceName}</p>
                    {/* Breakdown preview */}
                    <div className="mt-2 flex flex-col gap-0.5">
                      {item.priceBreakdown.map((b, i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-400 truncate">{b.label}</span>
                          <span className="text-xs font-medium text-gray-600 shrink-0">{formatPrice(b.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-base font-bold text-gray-900">{formatPrice(item.priceTotal)}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditCartItem(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Total */}
      <motion.div
        key={cartTotal}
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gray-50"
      >
        <span className="text-sm font-semibold text-gray-500">Итого</span>
        <span className="text-2xl font-bold text-gray-900">{formatPrice(cartTotal)}</span>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={goNext}
          className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-base hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Продолжить оформление
          <ArrowRight size={16} />
        </button>
        <button
          onClick={handleAddAnother}
          className="w-full py-3.5 rounded-2xl border-2 border-gray-100 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={15} />
          Добавить ещё услугу
        </button>
      </div>
    </div>
  );
}
