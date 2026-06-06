import { motion } from "framer-motion";
import { Sun, Cloud, Moon, CalendarDays } from "lucide-react";
import { Check } from "lucide-react";
import { useOnboardingStore } from "../store/onboardingStore";
import { NavigationButtons } from "../components/NavigationButtons";
import type { AvailabilitySlot } from "../types";

const SLOTS: { value: AvailabilitySlot; label: string; sub: string; icon: React.ReactNode }[] = [
  { value: "Утро", label: "Утро", sub: "06:00 – 12:00", icon: <Sun size={18} /> },
  { value: "День", label: "День", sub: "12:00 – 18:00", icon: <Cloud size={18} /> },
  { value: "Вечер", label: "Вечер", sub: "18:00 – 22:00", icon: <Moon size={18} /> },
  { value: "Выходные", label: "Выходные", sub: "Сб – Вс", icon: <CalendarDays size={18} /> },
];

export function Step7Availability() {
  const { availability, toggleAvailability, goNext, goBack } = useOnboardingStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ваш график</h1>
        <p className="text-gray-400 mt-1 text-sm">Когда вы готовы принимать заказы?</p>
      </div>

      <div className="flex flex-col gap-2 mb-2">
        {SLOTS.map(({ value, label, sub, icon }) => {
          const active = availability.includes(value);
          return (
            <motion.button
              key={value}
              onClick={() => toggleAvailability(value)}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all ${
                active ? "border-[#006AFF] bg-black/[0.02]" : "border-gray-100 bg-white hover:border-gray-300"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-[#006AFF] text-white" : "bg-gray-100 text-gray-500"}`}>
                {icon}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${active ? "text-gray-900" : "text-gray-700"}`}>
                  {label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
              <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center shrink-0 transition-colors ${active ? "border-[#006AFF] bg-black" : "border-gray-300"}`}>
                {active && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
            </motion.button>
          );
        })}
      </div>

      <NavigationButtons
        onBack={goBack}
        onNext={goNext}
        nextDisabled={availability.length === 0}
      />

      {availability.length === 0 && (
        <p className="text-xs text-gray-400 text-center mt-3">Выберите хотя бы один вариант</p>
      )}
    </motion.div>
  );
}
