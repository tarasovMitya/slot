import { motion } from "framer-motion";
import { useOnboardingStore } from "../store/onboardingStore";
import { NavigationButtons } from "../components/NavigationButtons";
import type { ExperienceLevel } from "../types";

const LEVELS: { value: ExperienceLevel; label: string; sub: string }[] = [
  { value: "0–1", label: "Меньше года", sub: "Только начинаю" },
  { value: "1–3", label: "1–3 года", sub: "Небольшой опыт" },
  { value: "3–5", label: "3–5 лет", sub: "Уверенный специалист" },
  { value: "5+", label: "5+ лет", sub: "Профессионал" },
];

export function Step3Experience() {
  const { experience, hasCertification, setField, goNext, goBack } = useOnboardingStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Опыт работы</h1>
        <p className="text-gray-400 mt-1 text-sm">Расскажите о вашем профессиональном опыте</p>
      </div>

      {/* Experience levels */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Сколько лет опыта?
        </p>
        <div className="flex flex-col gap-2">
          {LEVELS.map(({ value, label, sub }) => (
            <button
              key={value}
              onClick={() => setField("experience", value)}
              className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 text-left transition-all ${
                experience === value
                  ? "border-black bg-black/[0.02]"
                  : "border-gray-100 bg-white hover:border-gray-300"
              }`}
            >
              <div>
                <p className={`text-sm font-semibold ${experience === value ? "text-gray-900" : "text-gray-700"}`}>
                  {label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  experience === value ? "border-black" : "border-gray-300"
                }`}
              >
                {experience === value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-black" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Certification toggle */}
      <div className="flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-50">
        <div>
          <p className="text-sm font-semibold text-gray-900">Профессиональное обучение</p>
          <p className="text-xs text-gray-400 mt-0.5">Сертификат, диплом или курсы</p>
        </div>
        <button
          onClick={() => setField("hasCertification", !hasCertification)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            hasCertification ? "bg-black" : "bg-gray-300"
          }`}
        >
          <motion.div
            animate={{ x: hasCertification ? 24 : 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
          />
        </button>
      </div>

      <NavigationButtons
        onBack={goBack}
        onNext={goNext}
        nextDisabled={!experience}
      />
    </motion.div>
  );
}
