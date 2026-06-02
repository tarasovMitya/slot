import { formatPrice } from "../../utils/priceCalculator";

interface ToggleFieldProps {
  label: string;
  value: boolean;
  price?: number;
  onChange: (value: boolean) => void;
}

export function ToggleField({ label, value, price, onChange }: ToggleFieldProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-full px-6 py-5 rounded-2xl border-2 flex items-center justify-between transition-all ${
        value
          ? "border-[#006AFF] bg-gray-50"
          : "border-gray-100 bg-white hover:border-gray-300"
      }`}
    >
      <span className="text-lg font-medium text-gray-900 text-left">{label}</span>
      <div className="flex items-center gap-3 shrink-0">
        {price && price > 0 && (
          <span className="text-sm text-gray-500">+{formatPrice(price)}</span>
        )}
        <div
          className={`w-12 h-6 rounded-full transition-colors relative ${
            value ? "bg-black" : "bg-gray-200"
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
              value ? "left-7" : "left-1"
            }`}
          />
        </div>
      </div>
    </button>
  );
}
