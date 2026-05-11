import { Check, Trash2 } from "lucide-react";
import type { BankCard } from "../../types";

const brandColor: Record<string, string> = {
  Visa: "bg-blue-600",
  Mastercard: "bg-red-600",
  МИР: "bg-green-700",
};

interface BankCardItemProps {
  card: BankCard;
  onSetDefault: () => void;
  onDelete: () => void;
}

export function BankCardItem({ card, onSetDefault, onDelete }: BankCardItemProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border border-gray-100 rounded-2xl">
      {/* Card brand */}
      <div className={`w-10 h-7 rounded-md flex items-center justify-center ${brandColor[card.brand] ?? "bg-gray-700"}`}>
        <span className="text-white text-[9px] font-bold tracking-wide">{card.brand}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">•••• {card.last4}</p>
        <p className="text-xs text-gray-400 mt-0.5">{card.expiry}</p>
      </div>

      {/* Default badge */}
      {card.isDefault && (
        <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
          <Check size={10} strokeWidth={3} />
          Основная
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 ml-1">
        {!card.isDefault && (
          <button
            onClick={onSetDefault}
            className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Основная
          </button>
        )}
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
