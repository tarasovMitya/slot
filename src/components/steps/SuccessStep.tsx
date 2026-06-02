import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCalculatorStore } from "../../store/calculatorStore";
import { useDashboardStore } from "../../dashboard/store/dashboardStore";
import { calculatePrice } from "../../utils/priceCalculator";

export function SuccessStep() {
  const navigate = useNavigate();
  const { reset, contacts, schedule, selectedService, selectedCategory, fieldValues } =
    useCalculatorStore();
  const { setPendingOrder } = useDashboardStore();

  useEffect(() => {
    // Store the completed order so dashboard can show payment modal
    if (selectedService) {
      const breakdown = calculatePrice(selectedService, fieldValues);
      setPendingOrder({
        serviceName: selectedService.name,
        categoryName: selectedCategory?.name ?? "",
        duration: selectedService.fields.length > 0 ? "~1–2 часа" : "~1 час",
        scheduledDate: schedule.date,
        scheduledTime: schedule.time,
        priceTotal: breakdown.total,
        priceBreakdown: breakdown.items,
        address: contacts.address,
      });
    }
  }, []);

  const handleGoToDashboard = () => {
    reset();
    navigate("/dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-black flex items-center justify-center"
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </motion.div>

      <div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          Заявка создана!
        </h2>
        <p className="text-gray-500 mt-3 text-lg max-w-sm">
          {contacts.name ? `${contacts.name}, о` : "О"}сталось оплатить заказ
        </p>
        {schedule.date && schedule.time && (
          <p className="text-gray-400 mt-1">
            {new Date(schedule.date).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
            })}{" "}
            в {schedule.time}
          </p>
        )}
      </div>

      <div className="w-full max-w-xs mt-4 flex flex-col gap-3">
        <button
          onClick={handleGoToDashboard}
          className="w-full py-4 rounded-2xl bg-[#006AFF] text-white text-base font-semibold hover:bg-[#004CB8] transition-all active:scale-95"
        >
          Перейти к оплате →
        </button>
        <button
          onClick={() => { reset(); navigate("/dashboard"); }}
          className="w-full py-3 rounded-2xl border-2 border-gray-100 text-sm font-medium text-gray-500 hover:border-gray-300 transition-all"
        >
          В личный кабинет
        </button>
      </div>
    </motion.div>
  );
}
