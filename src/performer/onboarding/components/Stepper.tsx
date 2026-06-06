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
  onStepClick?: (step: number) => void;
}

export function Stepper({ current, onStepClick }: StepperProps) {
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

      {/* Dots — each wrapped in a 20×20 button for reliable touch target */}
      <div className="flex justify-between mt-3">
        {LABELS.map((_, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          const clickable = done && !!onStepClick;

          return (
            <button
              key={n}
              type="button"
              onClick={() => clickable && onStepClick!(n)}
              disabled={!clickable}
              title={clickable ? `Вернуться: ${LABELS[i]}` : undefined}
              className={`w-5 h-5 flex items-center justify-center bg-transparent border-none p-0 ${clickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <motion.div
                animate={{
                  scale: active ? 1.2 : 1,
                  backgroundColor: done ? "#000" : active ? "#000" : "#e5e7eb",
                }}
                transition={{ duration: 0.2 }}
                className="w-1.5 h-1.5 rounded-full"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
