import { motion } from "framer-motion";

const TOTAL = 8;

const LABELS = [
  "Данные",
  "Навыки",
  "Опыт",
  "Локация",
  "Радиус",
  "Документы",
  "График",
  "Итог",
];

interface StepperProps {
  current: number;
}

export function Stepper({ current }: StepperProps) {
  const pct = ((current - 1) / (TOTAL - 1)) * 100;

  return (
    <div className="w-full mb-8">
      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Шаг {current} из {TOTAL}
        </span>
        <span className="text-xs font-medium text-gray-500">{LABELS[current - 1]}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full bg-black rounded-full"
        />
      </div>

      {/* Dots */}
      <div className="flex justify-between mt-3">
        {LABELS.map((_, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <motion.div
              key={n}
              animate={{
                scale: active ? 1.2 : 1,
                backgroundColor: done ? "#000" : active ? "#000" : "#e5e7eb",
              }}
              transition={{ duration: 0.2 }}
              className="w-1.5 h-1.5 rounded-full"
            />
          );
        })}
      </div>
    </div>
  );
}
