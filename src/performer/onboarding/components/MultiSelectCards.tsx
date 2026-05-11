import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface Option {
  label: string;
  icon: ReactNode;
}

interface MultiSelectCardsProps {
  options: Option[];
  selected: string[];
  onToggle: (label: string) => void;
}

export function MultiSelectCards({ options, selected, onToggle }: MultiSelectCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map(({ label, icon }) => {
        const active = selected.includes(label);
        return (
          <motion.button
            key={label}
            onClick={() => onToggle(label)}
            whileTap={{ scale: 0.96 }}
            className={`relative flex flex-col items-start gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${
              active
                ? "border-black bg-black/[0.03]"
                : "border-gray-100 bg-white hover:border-gray-300"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                active ? "bg-black text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {icon}
            </div>
            <span
              className={`text-sm font-semibold leading-tight ${
                active ? "text-gray-900" : "text-gray-700"
              }`}
            >
              {label}
            </span>
            {active && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-5 h-5 rounded-full bg-black flex items-center justify-center"
              >
                <Check size={11} className="text-white" strokeWidth={3} />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
