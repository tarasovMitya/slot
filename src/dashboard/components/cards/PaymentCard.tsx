import { CreditCard, Banknote, Check, Trash2 } from "lucide-react";
import type { PaymentMethod } from "../../types";

interface PaymentCardProps {
  payment: PaymentMethod;
  onSetDefault: () => void;
  onDelete: () => void;
}

const brandColor: Record<string, string> = {
  Visa: "text-blue-600",
  Mastercard: "text-red-500",
};

export function PaymentCard({ payment, onSetDefault, onDelete }: PaymentCardProps) {
  const isCash = payment.type === "cash";

  return (
    <div
      className={`border-2 rounded-2xl p-5 transition-all ${
        payment.isDefault ? "border-[#006AFF]" : "border-gray-100"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
          {isCash ? (
            <Banknote size={18} className="text-gray-500" />
          ) : (
            <CreditCard size={18} className={brandColor[payment.brand ?? ""] ?? "text-gray-500"} />
          )}
        </div>

        <div className="flex-1">
          {isCash ? (
            <p className="text-sm font-semibold text-gray-900">Наличные</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-900">
                {payment.brand} ···· {payment.last4}
              </p>
              <p className="text-xs text-gray-400">до {payment.expiry}</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {payment.isDefault ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
              <Check size={12} />
              Основная
            </span>
          ) : (
            <button
              onClick={onSetDefault}
              className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors"
            >
              Выбрать
            </button>
          )}
          {!payment.isDefault && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
