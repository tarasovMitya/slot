import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Zap,
  Wallet,
  Calendar,
  Bell,
  User,
} from "lucide-react";
import { usePerformerStore } from "../../store/performerStore";

const nav = [
  { to: "/performer", label: "Главная", icon: LayoutDashboard, end: true },
  { to: "/performer/available", label: "Новые заказы", icon: ClipboardList },
  { to: "/performer/active", label: "Активные", icon: Zap },
  { to: "/performer/earnings", label: "Заработок", icon: Wallet },
  { to: "/performer/schedule", label: "Расписание", icon: Calendar },
  { to: "/performer/notifications", label: "Уведомления", icon: Bell },
  { to: "/performer/profile", label: "Профиль", icon: User },
];

export function PerformerSidebar() {
  const { profile, isOnline, availableOrders, notifications } = usePerformerStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen border-r border-gray-100 bg-white shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 tracking-tight">SLOT</span>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Про</span>
        </div>
      </div>

      {/* Performer info */}
      <div className="px-4 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
            {profile.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{profile.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="text-xs text-gray-400">{isOnline ? "Онлайн" : "Офлайн"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-3 border-b border-gray-50 flex flex-col gap-2">
        <Link
          to="/performer/onboarding"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-gray-800 transition-all"
        >
          + Новая регистрация
        </Link>
        <Link
          to="/dashboard"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-all"
        >
          ← Кабинет клиента
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
            {label === "Новые заказы" && availableOrders.length > 0 && (
              <span className="ml-auto text-xs font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                {availableOrders.length}
              </span>
            )}
            {label === "Уведомления" && unreadCount > 0 && (
              <span className="ml-auto w-2 h-2 rounded-full bg-red-500" />
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
