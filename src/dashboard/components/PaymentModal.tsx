import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Calendar, Clock, MapPin, X, CreditCard, ShieldCheck } from "lucide-react";
import { useDashboardStore } from "../store/dashboardStore";
import { formatPrice } from "../../utils/priceCalculator";

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function detectCardBrand(num: string): "visa" | "mc" | "mir" | null {
  const d = num.replace(/\s/g, "");
  if (/^4/.test(d)) return "visa";
  if (/^5[1-5]|^2[2-7]/.test(d)) return "mc";
  if (/^2/.test(d)) return "mir";
  return null;
}

function CardBadge({ brand }: { brand: "visa" | "mc" | "mir" | null }) {
  if (brand === "visa") return (
    <div className="w-10 h-6 bg-blue-600 rounded-md flex items-center justify-center shrink-0">
      <span className="text-white text-[9px] font-black tracking-tight">VISA</span>
    </div>
  );
  if (brand === "mc") return (
    <div className="w-10 h-6 bg-gray-800 rounded-md flex items-center justify-center shrink-0 gap-0.5">
      <div className="w-3.5 h-3.5 rounded-full bg-red-500 opacity-90" />
      <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 opacity-90 -ml-1.5" />
    </div>
  );
  if (brand === "mir") return (
    <div className="w-10 h-6 bg-green-600 rounded-md flex items-center justify-center shrink-0">
      <span className="text-white text-[8px] font-black tracking-tight">МИР</span>
    </div>
  );
  return (
    <div className="w-10 h-6 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
      <CreditCard size={14} className="text-gray-400" />
    </div>
  );
}

export function PaymentModal() {
  const { pendingOrder, paymentStatus, startPayment, completePayment, dismissPayment } = useDashboardStore();

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  if (!pendingOrder || paymentStatus === "paid") return null;

  const isProcessing = paymentStatus === "processing";
  const brand = detectCardBrand(cardNumber);

  const validate = () => {
    const e: Record<string, string> = {};
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 16) e.cardNumber = "Введите 16 цифр";
    const [mm, yy] = expiry.split("/");
    const month = parseInt(mm ?? "0");
    const year = parseInt("20" + (yy ?? "0"));
    const now = new Date();
    if (!mm || !yy || expiry.length < 5 || month < 1 || month > 12 || year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
      e.expiry = "Неверная дата";
    }
    if (cvv.length < 3) e.cvv = "3 цифры";
    if (name.trim().length < 3) e.name = "Введите имя";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    startPayment();
    await new Promise((r) => setTimeout(r, 2200));
    completePayment();
  };

  const date = pendingOrder.scheduledDate
    ? new Date(pendingOrder.scheduledDate).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        weekday: "short",
      })
    : "—";

  const inputBase = "w-full px-4 py-3 rounded-xl border text-sm font-medium text-gray-900 placeholder-gray-300 outline-none transition-all";
  const inputNormal = `${inputBase} border-gray-200 focus:border-gray-900`;
  const inputError = `${inputBase} border-red-300 bg-red-50 focus:border-red-500`;

  return (
    <AnimatePresence>
      {(paymentStatus === "pending" || paymentStatus === "processing") && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={!isProcessing ? dismissPayment : undefined}
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 lg:inset-0 lg:flex lg:items-center lg:justify-center p-4"
          >
            <div className="bg-white rounded-3xl w-full max-w-md mx-auto shadow-2xl overflow-hidden relative">

              {/* Processing overlay */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center gap-4 rounded-3xl"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-10 h-10 rounded-full border-2 border-gray-100 border-t-[#006AFF]"
                    />
                    <p className="text-base font-semibold text-gray-900">Подтверждаем оплату...</p>
                    <p className="text-sm text-gray-400">Деньги будут заморожены до завершения заказа</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Lock size={13} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-400">Безопасная оплата · SSL</span>
                  </div>
                  <button onClick={dismissPayment} className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1">
                    <X size={18} />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Оплата заказа</h2>
              </div>

              <div className="px-6 py-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                {/* Order details */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Услуга</p>
                  <p className="text-base font-semibold text-gray-900">{pendingOrder.serviceName}</p>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={13} className="text-gray-400 shrink-0" />
                      {date} · {pendingOrder.scheduledTime}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={13} className="text-gray-400 shrink-0" />
                      {pendingOrder.duration}
                    </div>
                    {pendingOrder.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin size={13} className="text-gray-400 shrink-0" />
                        {pendingOrder.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-2">
                  {pendingOrder.priceBreakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900">{formatPrice(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-1">
                    <span className="text-sm font-bold text-gray-900">К оплате</span>
                    <span className="text-lg font-bold text-gray-900">{formatPrice(pendingOrder.priceTotal)}</span>
                  </div>
                </div>

                {/* Card form */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Данные карты</p>

                  {/* Card number */}
                  <div>
                    <div className={`flex items-center gap-3 ${errors.cardNumber ? inputError : inputNormal}`}>
                      <CardBadge brand={brand} />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          setCardNumber(formatted);
                          setErrors((prev) => ({ ...prev, cardNumber: "" }));
                          if (formatted.replace(/\s/g, "").length === 16) expiryRef.current?.focus();
                        }}
                        className="flex-1 outline-none bg-transparent text-sm font-medium text-gray-900 placeholder-gray-300"
                      />
                    </div>
                    {errors.cardNumber && <p className="text-xs text-red-500 mt-1 ml-1">{errors.cardNumber}</p>}
                  </div>

                  {/* Expiry + CVV */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        ref={expiryRef}
                        type="text"
                        inputMode="numeric"
                        placeholder="ММ/ГГ"
                        value={expiry}
                        onChange={(e) => {
                          const formatted = formatExpiry(e.target.value);
                          setExpiry(formatted);
                          setErrors((prev) => ({ ...prev, expiry: "" }));
                          if (formatted.length === 5) cvvRef.current?.focus();
                        }}
                        className={errors.expiry ? inputError : inputNormal}
                      />
                      {errors.expiry && <p className="text-xs text-red-500 mt-1 ml-1">{errors.expiry}</p>}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={cvvRef}
                        type="text"
                        inputMode="numeric"
                        placeholder="CVV"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => {
                          setCvv(e.target.value.replace(/\D/g, "").slice(0, 4));
                          setErrors((prev) => ({ ...prev, cvv: "" }));
                          if (e.target.value.replace(/\D/g, "").length >= 3) nameRef.current?.focus();
                        }}
                        className={errors.cvv ? inputError : inputNormal}
                      />
                      {errors.cvv && <p className="text-xs text-red-500 mt-1 ml-1">{errors.cvv}</p>}
                    </div>
                  </div>

                  {/* Cardholder name */}
                  <div>
                    <input
                      ref={nameRef}
                      type="text"
                      placeholder="ИМЯ ФАМИЛИЯ (как на карте)"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value.toUpperCase());
                        setErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      className={`${errors.name ? inputError : inputNormal} uppercase`}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name}</p>}
                  </div>
                </div>

                {/* Safety note */}
                <div className="flex items-start gap-2 bg-emerald-50 rounded-xl px-3 py-2.5">
                  <ShieldCheck size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Средства будут заморожены до завершения заказа. Если мастер не выполнит работу — вы получите полный возврат.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="px-6 pb-6 pt-2">
                <button
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-2xl bg-[#006AFF] text-white font-semibold text-base disabled:opacity-60 hover:bg-[#004CB8] transition-all active:scale-95"
                >
                  Оплатить {formatPrice(pendingOrder.priceTotal)}
                </button>
                <p className="text-xs text-gray-400 text-center mt-2.5">
                  Нажимая кнопку, вы соглашаетесь с{" "}
                  <a href="/terms" target="_blank" className="underline">условиями</a> и{" "}
                  <a href="/rules" target="_blank" className="underline">правилами</a> платформы
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
