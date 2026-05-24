import type { User } from "@telegram-apps/sdk-react";
import type { TMAPage } from "./TMAApp";

interface Props {
  user: User | undefined;
  onNavigate: (page: TMAPage) => void;
}

export function TMAProfile({ user, onNavigate }: Props) {
  const initials = user
    ? `${user.first_name[0]}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  const fullName = user
    ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}`
    : "Гость";

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Профиль</h1>

      <div className="flex flex-col items-center mb-8">
        {user?.photo_url ? (
          <img
            src={user.photo_url}
            alt={fullName}
            className="w-20 h-20 rounded-full object-cover mb-3"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-900 text-white flex items-center justify-center text-2xl font-black mb-3">
            {initials}
          </div>
        )}
        <p className="text-xl font-bold text-gray-900">{fullName}</p>
        {user?.username && (
          <p className="text-sm text-gray-400 mt-0.5">@{user.username}</p>
        )}
        {user?.language_code && (
          <p className="text-xs text-gray-300 mt-0.5">Язык: {user.language_code.toUpperCase()}</p>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={() => onNavigate("orders")}
          className="w-full bg-gray-50 rounded-2xl p-4 flex items-center gap-3 text-left active:bg-gray-100 transition-colors"
        >
          <span className="text-xl">📋</span>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Мои заявки</p>
            <p className="text-xs text-gray-400">История и статусы заказов</p>
          </div>
          <span className="ml-auto text-gray-300">›</span>
        </button>

        <button
          onClick={() => onNavigate("calculator")}
          className="w-full bg-gray-50 rounded-2xl p-4 flex items-center gap-3 text-left active:bg-gray-100 transition-colors"
        >
          <span className="text-xl">🧮</span>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Новый заказ</p>
            <p className="text-xs text-gray-400">Рассчитать и оформить</p>
          </div>
          <span className="ml-auto text-gray-300">›</span>
        </button>
      </div>

      <div className="mt-6 bg-gray-50 rounded-2xl p-4">
        <p className="text-xs text-gray-400 leading-relaxed">
          Вы вошли через Telegram. Ваши данные используются только для идентификации при оформлении заказов.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { icon: "✅", label: "Проверенные мастера" },
          { icon: "⏱", label: "Выезд в день заказа" },
          { icon: "🔒", label: "Безопасная оплата" },
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
