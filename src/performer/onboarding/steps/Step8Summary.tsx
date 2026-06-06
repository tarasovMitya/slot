import { motion } from "framer-motion";
import { Check, User, MapPin, Navigation, Clock, Phone, Briefcase } from "lucide-react";
import { useOnboardingStore } from "../store/onboardingStore";
import { NavigationButtons } from "../components/NavigationButtons";
import type { ExperienceLevel } from "../types";

const EXP_LABELS: Record<ExperienceLevel, string> = {
  "0–1": "Меньше года",
  "1–3": "1–3 года",
  "3–5": "3–5 лет",
  "5+": "5+ лет",
};

interface Step8SummaryProps {
  onComplete: () => void;
}

export function Step8Summary({ onComplete }: Step8SummaryProps) {
  const { name, phone, skills, city, radius, availability, experience, goBack, goToStep } = useOnboardingStore();

  const firstName = name.split(" ")[0] || name;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Hero */}
      <div className="flex flex-col items-center text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-black flex items-center justify-center mb-4"
        >
          <Check size={28} className="text-white" strokeWidth={2.5} />
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {firstName}, вы готовы!
        </h1>
        <p className="text-gray-400 mt-2 text-sm max-w-xs">
          Проверьте данные перед завершением. Нажмите «Изм.» для правки.
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ваш профиль</p>
        </div>

        <div className="divide-y divide-gray-50">
          <Row icon={<User size={14} />} label="Имя" value={name} onEdit={() => goToStep(1)} />
          <Row icon={<Phone size={14} />} label="Телефон" value={phone || "—"} onEdit={() => goToStep(1)} />
          <Row
            icon={<Check size={14} />}
            label="Навыки"
            value={
              <div className="flex flex-wrap gap-1 justify-end">
                {skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                    {s}
                  </span>
                ))}
              </div>
            }
            onEdit={() => goToStep(2)}
          />
          {experience && (
            <Row
              icon={<Briefcase size={14} />}
              label="Опыт"
              value={EXP_LABELS[experience as ExperienceLevel] ?? experience}
              onEdit={() => goToStep(3)}
            />
          )}
          <Row
            icon={<MapPin size={14} />}
            label="Город"
            value={city || "—"}
            onEdit={() => goToStep(4)}
          />
          <Row
            icon={<Navigation size={14} />}
            label="Радиус"
            value={`${radius} км`}
            onEdit={() => goToStep(5)}
          />
          <Row
            icon={<Clock size={14} />}
            label="График"
            value={availability.join(", ") || "—"}
            onEdit={() => goToStep(7)}
          />
        </div>
      </div>

      <NavigationButtons
        onBack={goBack}
        onNext={onComplete}
        nextLabel="Завершить регистрацию"
        isLast
      />
    </motion.div>
  );
}

function Row({
  icon,
  label,
  value,
  onEdit,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <span className="text-sm text-gray-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 text-sm font-semibold text-gray-900 text-right">{value}</div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="shrink-0 text-[11px] font-semibold text-[#006AFF] hover:text-blue-800 transition-colors ml-2"
        >
          Изм.
        </button>
      )}
    </div>
  );
}
