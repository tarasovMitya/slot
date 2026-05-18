import { NavLink } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Users, UserCircle, DollarSign, AlertTriangle, ShieldCheck, BarChart2, Settings, LogOut, Activity, MessageSquare } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { useAdminStore } from "../../store/adminStore";
import { ROLE_LABELS } from "../../types";

const nav = [
  { to: "/admin", label: "Обзор", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "Заказы", icon: ShoppingBag },
  { to: "/admin/clients", label: "Клиенты", icon: UserCircle },
  { to: "/admin/performers", label: "Исполнители", icon: Users },
  { to: "/admin/finance", label: "Финансы", icon: DollarSign },
  { to: "/admin/disputes", label: "Споры", icon: AlertTriangle },
  { to: "/admin/verification", label: "Верификация", icon: ShieldCheck },
  { to: "/admin/chats", label: "Чаты", icon: MessageSquare },
  { to: "/admin/analytics", label: "Аналитика", icon: BarChart2 },
  { to: "/admin/settings", label: "Настройки", icon: Settings },
  { to: "/admin/events", label: "Логи", icon: Activity },
];

export function AdminSidebar() {
  const { user, signOut } = useAuthStore();
  const { role } = useAdminStore();

  return (
    <aside className="w-56 shrink-0 bg-gray-900 min-h-screen flex flex-col">
      <div className="px-4 py-5 border-b border-gray-800">
        <p className="text-white font-bold text-sm tracking-tight">SLOT Admin</p>
        <p className="text-gray-500 text-xs mt-0.5">{role ? ROLE_LABELS[role] : ""}</p>
      </div>

      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pb-4 border-t border-gray-800 pt-3">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={15} />
          Выйти
        </button>
      </div>
    </aside>
  );
}
