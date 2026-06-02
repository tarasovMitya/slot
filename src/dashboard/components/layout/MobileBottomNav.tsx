import { NavLink } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Clock, Bell, User } from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";

const navItems = [
  { to: "/dashboard", label: "Главная", icon: LayoutDashboard, end: true },
  { to: "/dashboard/orders", label: "Заказы", icon: ClipboardList },
  { to: "/dashboard/history", label: "История", icon: Clock },
  { to: "/dashboard/notifications", label: "Уведомления", icon: Bell },
  { to: "/dashboard/profile", label: "Профиль", icon: User },
];

export function MobileBottomNav() {
  const notifications = useDashboardStore((s) => s.notifications);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100">
      <div className="flex">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors relative ${
                isActive ? "text-gray-900" : "text-gray-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  {label === "Уведомления" && unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#006AFF] text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
