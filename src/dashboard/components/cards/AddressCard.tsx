import { MapPin, Star, Pencil, Trash2 } from "lucide-react";
import type { Address } from "../../types";

interface AddressCardProps {
  address: Address;
  onSetDefault: () => void;
  onDelete: () => void;
}

export function AddressCard({ address, onSetDefault, onDelete }: AddressCardProps) {
  return (
    <div
      className={`border-2 rounded-2xl p-5 transition-all ${
        address.isDefault ? "border-[#006AFF]" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
            <MapPin size={16} className="text-gray-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">{address.label}</p>
              {address.isDefault && (
                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  По умолчанию
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{address.street}</p>
            <p className="text-xs text-gray-400">{address.city}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {!address.isDefault && (
          <button
            onClick={onSetDefault}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Star size={13} />
            Сделать основным
          </button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors">
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
