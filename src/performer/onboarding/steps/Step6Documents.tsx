import { motion } from "framer-motion";
import { Upload, ShieldCheck } from "lucide-react";
import { useOnboardingStore } from "../store/onboardingStore";
import { NavigationButtons } from "../components/NavigationButtons";

export function Step6Documents() {
  const { hasPassport, setField, goNext, goBack } = useOnboardingStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Верификация</h1>
        <p className="text-gray-400 mt-1 text-sm">Проверка личности повышает доверие клиентов</p>
      </div>

      {/* Passport toggle */}
      <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white border border-gray-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ShieldCheck size={18} className="text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Паспорт проверен</p>
            <p className="text-xs text-gray-400 mt-0.5">Ваша личность подтверждена</p>
          </div>
        </div>
        <button
          onClick={() => setField("hasPassport", !hasPassport)}
          className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
            hasPassport ? "bg-black" : "bg-gray-300"
          }`}
        >
          <motion.div
            animate={{ x: hasPassport ? 24 : 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
          />
        </button>
      </div>

      {/* Upload button (UI only) */}
      <button className="flex items-center gap-3 w-full px-5 py-4 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all mb-3">
        <Upload size={16} className="text-gray-400" />
        Загрузить скан паспорта
        <span className="ml-auto text-xs text-gray-300">JPG, PDF</span>
      </button>

      <p className="text-xs text-gray-400 text-center mb-2">
        Документы проходят модерацию в течение 1 рабочего дня
      </p>

      <NavigationButtons onBack={goBack} onNext={goNext} nextLabel="Продолжить" />
    </motion.div>
  );
}
