import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  MapPin,
  CreditCard,
  User,
  HelpCircle,
  Bell,
  LogOut,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";
import { useAuthStore } from "../../../store/authStore";

const navItems = [
  { to: "/dashboard", label: "Главная", icon: LayoutDashboard, end: true },
  { to: "/dashboard/orders", label: "Активные заказы", icon: ClipboardList },
  { to: "/dashboard/history", label: "История", icon: Clock },
  { to: "/dashboard/addresses", label: "Адреса", icon: MapPin },
  { to: "/dashboard/payments", label: "Оплата", icon: CreditCard },
  { to: "/dashboard/disputes", label: "Споры", icon: ShieldAlert },
  { to: "/dashboard/security", label: "Безопасность", icon: Shield },
  { to: "/dashboard/profile", label: "Профиль", icon: User },
  { to: "/dashboard/support", label: "Поддержка", icon: HelpCircle },
  { to: "/dashboard/notifications", label: "Уведомления", icon: Bell },
];

export function Sidebar() {
  const notifications = useDashboardStore((s) => s.notifications);
  const unread = notifications.filter((n) => !n.read).length;
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const displayName = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email?.split("@")[0]
    ?? "Пользователь";
  const email = user?.email ?? "";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-gray-100 h-screen overflow-y-auto sticky top-0 pt-8 pb-6 px-4">
      <div className="flex items-center px-2 mb-10">
        <img src="/logo-full.svg" alt="SLOT" className="h-7 w-auto" />
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
            {label === "Уведомления" && unread > 0 && (
              <span className="ml-auto bg-black text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 px-2 flex flex-col gap-3">
        <div className="flex items-center gap-3 py-1">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Выйти"
            className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
