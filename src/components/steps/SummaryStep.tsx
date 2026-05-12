import { motion } from "framer-motion";
import { useCalculatorStore } from "../../store/calculatorStore";
import { calculatePrice, formatPrice } from "../../utils/priceCalculator";
import { CheckCircle, Calendar, MapPin, MessageSquare, ArrowRight, User, CreditCard, Search, Star } from "lucide-react";

const HOW_IT_WORKS = [
  { icon: User,        label: "Регистрация" },
  { icon: CreditCard,  label: "Оплата заказа" },
  { icon: Search,      label: "Поиск исполнителя" },
  { icon: CheckCircle, label: "Исполнитель принимает" },
  { icon: Star,        label: "Выполнение и отзыв" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35 } }),
};

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function SummaryStep() {
  const {
    selectedCategory, selectedService, fieldValues,
    schedule, contacts, goNext, goBack,
  } = useCalculatorStore();

  const breakdown = calculatePrice(selectedService, fieldValues);

  const summaryRows = [
    selectedCategory && { label: "Категория", value: selectedCategory.name },
    selectedService && { label: "Услуга", value: selectedService.name },
    schedule.date && { label: "Дата", value: `${formatDate(schedule.date)}${schedule.time ? `, ${schedule.time}` : ""}`, icon: Calendar },
    contacts.address && { label: "Адрес", value: contacts.address, icon: MapPin },
    contacts.comment && { label: "Комментарий", value: contacts.comment, icon: MessageSquare },
  ].filter(Boolean) as { label: string; value: string; icon?: React.ElementType }[];

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <motion.div
        custom={0} variants={fadeUp} initial="hidden" animate="visible"
        className="text-center"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Ваш заказ готов</h2>
        <p className="text-gray-500 mt-2">Проверьте детали перед регистрацией</p>
      </motion.div>

      {/* Price card */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <div className="rounded-2xl bg-black text-white p-6 text-center">
          <p className="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">Предварительная стоимость</p>
          <p className="text-5xl font-black tracking-tight">{formatPrice(breakdown.total)}</p>
          {breakdown.items.length > 1 && (
            <div className="mt-4 flex flex-col gap-1">
              {breakdown.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm text-white/70">
                  <span>{item.label}</span>
                  <span className="font-medium text-white">{formatPrice(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Order summary */}
      {summaryRows.length > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Детали заказа</p>
          <div className="rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {summaryRows.map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3 px-4 py-3">
                <span className="text-sm text-gray-400 w-28 shrink-0">{label}</span>
                <span className="text-sm font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* How it works */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Что будет дальше</p>

        {/* Mobile: vertical */}
        <div className="flex flex-col gap-3 sm:hidden">
          {HOW_IT_WORKS.map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-gray-600" />
              </div>
              <span className="text-sm text-gray-700">{label}</span>
              {i < HOW_IT_WORKS.length - 1 && (
                <ArrowRight size={14} className="text-gray-300 ml-auto shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Desktop: horizontal */}
        <div className="hidden sm:flex items-center gap-1">
          {HOW_IT_WORKS.map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <Icon size={15} className="text-gray-600" />
                </div>
                <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
              </div>
              {i < HOW_IT_WORKS.length - 1 && (
                <ArrowRight size={13} className="text-gray-300 shrink-0 mb-4" />
              )}
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            После регистрации вы перейдёте в личный кабинет, где сможете оплатить заказ.
            После оплаты сервис начнёт поиск исполнителя, а статус заказа будет доступен в вашем кабинете.
          </p>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col gap-3">
        <button
          onClick={goNext}
          className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-base hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Продолжить
          <ArrowRight size={18} />
        </button>
        <button
          onClick={goBack}
          className="w-full py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm hover:border-gray-400 transition-all"
        >
          Изменить параметры
        </button>
      </motion.div>
    </div>
  );
}
