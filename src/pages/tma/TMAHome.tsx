interface User { first_name: string; last_name?: string; username?: string; photo_url?: string; id?: number; }
import type { TMAPage } from "./TMAApp";
import { SERVICES } from "../services/servicesData";

const SERVICE_ICONS: Record<string, string> = {
  electrician: "⚡",
  plumber: "🔧",
  cleaning: "🧹",
  furniture: "🛋",
  handyman: "🔨",
  "dry-cleaning": "🧴",
};

interface Props {
  user: User | undefined;
  onNavigate: (page: TMAPage) => void;
}

export function TMAHome({ user, onNavigate }: Props) {
  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-400">
          {user ? `Привет, ${user.first_name}!` : "Привет!"}
        </p>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Мастера на дом
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Выезд в день заказа · Фиксированные цены
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={() => onNavigate("calculator")}
        className="w-full bg-gray-950 text-white rounded-2xl py-4 font-bold text-base mb-6 active:scale-95 transition-transform"
      >
        🧮 Рассчитать стоимость
      </button>

      {/* Services grid */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Услуги</h2>
      <div className="grid grid-cols-2 gap-3">
        {SERVICES.map((s) => (
          <button
            key={s.slug}
            onClick={() => onNavigate("calculator")}
            className="bg-gray-50 rounded-2xl p-4 text-left active:bg-gray-100 transition-colors"
          >
            <div className="text-2xl mb-2">{SERVICE_ICONS[s.slug] ?? "🔧"}</div>
            <p className="font-semibold text-gray-900 text-sm">{s.nameRu}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              от {s.prices[0]?.from?.toLocaleString("ru")} ₽
            </p>
          </button>
        ))}
      </div>

      {/* My orders shortcut */}
      <button
        onClick={() => onNavigate("orders")}
        className="mt-4 w-full border border-gray-100 rounded-2xl py-3.5 text-sm font-medium text-gray-600 flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
      >
        📋 Мои заявки
      </button>

      {/* Trust badges */}
      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        {[
          { icon: "✅", label: "Верификация мастеров" },
          { icon: "⏱", label: "Выезд в день заказа" },
          { icon: "🔒", label: "Оплата онлайн" },
        ].map((b) => (
          <div key={b.label} className="bg-gray-50 rounded-xl p-3">
            <div className="text-xl mb-1">{b.icon}</div>
            <p className="text-[10px] text-gray-500 leading-tight">{b.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
