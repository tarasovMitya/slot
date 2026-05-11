import { motion } from "framer-motion";
import { useOnboardingStore } from "../store/onboardingStore";
import { SliderControl } from "../components/SliderControl";
import { NavigationButtons } from "../components/NavigationButtons";

export function Step5Radius() {
  const { radius, city, setField, goNext, goBack } = useOnboardingStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Радиус работы</h1>
        <p className="text-gray-400 mt-1 text-sm">
          На какое расстояние готовы выезжать к клиенту?
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
        <SliderControl
          value={radius}
          min={1}
          max={30}
          onChange={(v) => setField("radius", v)}
          unit="км"
        />
      </div>

      {city && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Вы будете получать заказы в радиусе {radius} км от {city}
        </p>
      )}

      <NavigationButtons onBack={goBack} onNext={goNext} />
    </motion.div>
  );
}
