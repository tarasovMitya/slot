import type { SelectOption } from "../../types/calculator";
import { formatPrice } from "../../utils/priceCalculator";

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-2xl md:text-3xl font-semibold text-gray-900 text-center leading-tight">
        {label}
      </p>
      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full px-6 py-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
              value === option.value
                ? "border-[#006AFF] bg-gray-50"
                : "border-gray-100 bg-white hover:border-gray-300"
            }`}
          >
            <span className="text-lg font-medium text-gray-900">{option.label}</span>
            {option.price > 0 && (
              <span className="text-sm text-gray-500">+{formatPrice(option.price)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
