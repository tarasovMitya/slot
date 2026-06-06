import { Info } from "lucide-react";

export function TestModeBanner() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
      <Info size={15} className="text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-gray-600">Пробный запуск</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Оплата производится напрямую исполнителю после выполнения работ.
        </p>
      </div>
    </div>
  );
}
