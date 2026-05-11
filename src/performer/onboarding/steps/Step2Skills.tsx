import { motion } from "framer-motion";
import { Zap, Droplets, Hammer, Package, Sparkles, Wrench } from "lucide-react";
import { useOnboardingStore } from "../store/onboardingStore";
import { MultiSelectCards } from "../components/MultiSelectCards";
import { NavigationButtons } from "../components/NavigationButtons";
import type { OnboardingSkill } from "../types";

const SKILLS: { label: OnboardingSkill; icon: React.ReactNode }[] = [
  { label: "Электрика", icon: <Zap size={18} /> },
  { label: "Сантехника", icon: <Droplets size={18} /> },
  { label: "Мелкий ремонт", icon: <Hammer size={18} /> },
  { label: "Сборка мебели", icon: <Package size={18} /> },
  { label: "Уборка", icon: <Sparkles size={18} /> },
  { label: "Муж на час", icon: <Wrench size={18} /> },
];

export function Step2Skills() {
  const { skills, toggleSkill, goNext, goBack } = useOnboardingStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ваши навыки</h1>
        <p className="text-gray-400 mt-1 text-sm">Выберите услуги, которые вы выполняете</p>
      </div>

      <MultiSelectCards
        options={SKILLS}
        selected={skills}
        onToggle={(label) => toggleSkill(label as OnboardingSkill)}
      />

      <NavigationButtons
        onBack={goBack}
        onNext={goNext}
        nextDisabled={skills.length === 0}
      />

      {skills.length === 0 && (
        <p className="text-xs text-gray-400 text-center mt-3">Выберите хотя бы одну услугу</p>
      )}
    </motion.div>
  );
}
