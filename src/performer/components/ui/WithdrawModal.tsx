import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, CreditCard, Plus, ChevronLeft } from "lucide-react";
import { usePerformerStore } from "../../store/performerStore";
import { formatPrice } from "../../../utils/priceCalculator";

interface WithdrawModalProps {
  onClose: () => void;
}

type Step = "form" | "add-card" | "processing" | "success";

function detectBrand(num: string): "Visa" | "Mastercard" | "МИР" {
  if (num.startsWith("4")) return "Visa";
  if (num.startsWith("5")) return "Mastercard";
  return "МИР";
}

function formatCardNumber(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

const QUICK_AMOUNTS = [1000, 3000, 5000, 10000];

export function WithdrawModal({ onClose }: WithdrawModalProps) {
  const { balance, bankCards, withdraw, addBankCard } = usePerformerStore();
  const defaultCard = bankCards.find((c) => c.isDefault) ?? bankCards[0];

  const [amount, setAmount] = useState("");
  const [selectedCardId, setSelectedCardId] = useState(defaultCard?.id ?? "");
  const [step, setStep] = useState<Step>("form");

  // Add card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardError, setCardError] = useState("");

  const numericAmount = Number(amount.replace(/\D/g, ""));
  const isValid = numericAmount >= 100 && numericAmount <= balance && selectedCardId;

  const handleSubmit = async () => {
    if (!isValid) return;
    setStep("processing");
    await new Promise((r) => setTimeout(r, 2200));
    withdraw(numericAmount, selectedCardId);
    setStep("success");
  };

  const handleAddCard = () => {
    const digits = cardNumber.replace(/\D/g, "");
    const expiryParts = cardExpiry.split("/");
    if (digits.length < 16) { setCardError("Введите 16 цифр карты"); return; }
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      setCardError("Введите срок в формате ММ/ГГ"); return;
    }
    const newCard = {
      last4: digits.slice(-4),
      brand: detectBrand(digits),
      expiry: cardExpiry,
      isDefault: bankCards.length === 0,
    };
    addBankCard(newCard);
    setCardNumber("");
    setCardExpiry("");
    setCardError("");
    setStep("form");
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={step === "success" ? onClose : undefined}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
      />

      {/* Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 z-50 lg:inset-0 lg:flex lg:items-center lg:justify-center p-4"
      >
        <div className="bg-white rounded-3xl w-full max-w-md mx-auto shadow-2xl overflow-hidden">
          <AnimatePresence mode="wait">

            {/* Add card */}
            {step === "add-card" && (
              <motion.div key="add-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-50">
                  <button onClick={() => { setStep("form"); setCardError(""); }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                    <ChevronLeft size={16} />
                    Назад
                  </button>
                  <h2 className="text-base font-bold text-gray-900">Новая карта</h2>
                  <div className="w-14" />
                </div>
                <div className="px-6 py-5 flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Номер карты</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => { setCardNumber(formatCardNumber(e.target.value)); setCardError(""); }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-black outline-none text-base font-medium tracking-widest transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Срок действия</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="ММ/ГГ"
                      value={cardExpiry}
                      onChange={(e) => { setCardExpiry(formatExpiry(e.target.value)); setCardError(""); }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-black outline-none text-base font-medium transition-colors"
                    />
                  </div>
                  {cardError && <p className="text-xs text-red-500">{cardError}</p>}
                  <button
                    onClick={handleAddCard}
                    className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-base hover:bg-gray-800 transition-all active:scale-95 mt-1"
                  >
                    Сохранить карту
                  </button>
                </div>
              </motion.div>
            )}

            {/* Processing */}
            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 px-6 gap-5"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 rounded-full border-2 border-gray-100 border-t-black"
                />
                <div className="text-center">
                  <p className="text-base font-semibold text-gray-900">Выводим средства...</p>
                  <p className="text-sm text-gray-400 mt-1">Это займёт несколько секунд</p>
                </div>
              </motion.div>
            )}

            {/* Success */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 px-6 gap-5 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
                >
                  <Check size={28} className="text-green-600" strokeWidth={2.5} />
                </motion.div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{formatPrice(numericAmount)} выведено</p>
                  <p className="text-sm text-gray-400 mt-1">
                    На карту •••• {bankCards.find((c) => c.id === selectedCardId)?.last4}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-black text-white font-semibold text-sm hover:bg-gray-800 transition-all"
                >
                  Готово
                </button>
              </motion.div>
            )}

            {/* Form */}
            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-50">
                  <h2 className="text-lg font-bold text-gray-900">Вывод средств</h2>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="px-6 py-5 flex flex-col gap-5">
                  {/* Balance */}
                  <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-gray-500">Доступно</span>
                    <span className="text-sm font-bold text-gray-900">{formatPrice(balance)}</span>
                  </div>

                  {/* Amount input */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                      Сумма
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-200 focus:border-black pb-2 outline-none transition-colors"
                      />
                      <span className="absolute right-0 bottom-2.5 text-xl font-bold text-gray-400">₽</span>
                    </div>
                    {numericAmount > balance && (
                      <p className="text-xs text-red-500 mt-1.5">Недостаточно средств</p>
                    )}

                    {/* Quick amounts */}
                    <div className="flex gap-2 mt-3">
                      {QUICK_AMOUNTS.filter((a) => a <= balance).map((a) => (
                        <button
                          key={a}
                          onClick={() => setAmount(String(a))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            numericAmount === a
                              ? "bg-black text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {a.toLocaleString()}
                        </button>
                      ))}
                      <button
                        onClick={() => setAmount(String(balance))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          numericAmount === balance
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Всё
                      </button>
                    </div>
                  </div>

                  {/* Card selector */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                      Карта
                    </label>
                    <div className="flex flex-col gap-2">
                      {bankCards.map((card) => (
                        <button
                          key={card.id}
                          onClick={() => setSelectedCardId(card.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                            selectedCardId === card.id
                              ? "border-black bg-black/[0.02]"
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <div className="w-8 h-5 bg-gray-900 rounded flex items-center justify-center">
                            <CreditCard size={10} className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {card.brand} •••• {card.last4}
                          </span>
                          <span className="ml-auto text-xs text-gray-400">{card.expiry}</span>
                          {selectedCardId === card.id && (
                            <Check size={14} className="text-black" strokeWidth={2.5} />
                          )}
                        </button>
                      ))}

                      {/* Inline add-card form when no cards, or button when cards exist */}
                      {bankCards.length === 0 ? (
                        <div className="flex flex-col gap-2 pt-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0000 0000 0000 0000"
                            value={cardNumber}
                            onChange={(e) => { setCardNumber(formatCardNumber(e.target.value)); setCardError(""); }}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-black outline-none text-base font-medium tracking-widest transition-colors"
                          />
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="ММ/ГГ"
                            value={cardExpiry}
                            onChange={(e) => { setCardExpiry(formatExpiry(e.target.value)); setCardError(""); }}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-black outline-none text-base font-medium transition-colors"
                          />
                          {cardError && <p className="text-xs text-red-500">{cardError}</p>}
                          <button
                            onClick={handleAddCard}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-black transition-all text-sm font-semibold text-gray-600 hover:text-black"
                          >
                            <Plus size={14} />
                            Сохранить карту
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setStep("add-card")}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 transition-all text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                          <Plus size={15} />
                          Добавить карту
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  <button
                    onClick={handleSubmit}
                    disabled={!isValid}
                    className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-base disabled:opacity-40 hover:bg-gray-800 transition-all active:scale-95"
                  >
                    {numericAmount >= 100
                      ? `Вывести ${formatPrice(numericAmount)}`
                      : "Вывести"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
