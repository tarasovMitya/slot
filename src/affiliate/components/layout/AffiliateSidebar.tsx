import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ClipboardList, AlertTriangle,
  MessageSquare, DollarSign, CheckSquare, Link2, LogOut,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";

const nav = [
  { to: "/affiliate",            label: "Обзор",        icon: LayoutDashboard, end: true },
  { to: "/affiliate/performers", label: "Исполнители",  icon: Users },
  { to: "/affiliate/orders",     label: "Заказы",       icon: ClipboardList },
  { to: "/affiliate/disputes",   label: "Споры",        icon: AlertTriangle },
  { to: "/affiliate/chats",      label: "Чаты",         icon: MessageSquare },
  { to: "/affiliate/finance",    label: "Финансы",      icon: DollarSign },
  { to: "/affiliate/tasks",      label: "Задачник",     icon: CheckSquare },
  { to: "/affiliate/referral",   label: "Реф. ссылка", icon: Link2 },
];

export function AffiliateSidebar() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "AF";

  return (
    <aside className="w-[220px] shrink-0 flex flex-col min-h-screen border-r border-white/[0.06]" style={{ background: "#0c0e1a" }}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0">
            <img src="/logo-square.svg" alt="SLOT" className="w-8 h-8" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold leading-tight truncate">SLOT</p>
            <p className="text-[#5a5f7a] text-[11px] leading-tight mt-0.5">Партнёрский кабинет</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "text-white"
                  : "text-[#6b7194] hover:text-[#c0c5e0] hover:bg-white/[0.04]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[#006AFF]" />
                )}
                <span className={`flex items-center justify-center w-5 h-5 rounded-md transition-colors ${isActive ? "text-[#006AFF]" : "text-current"}`}>
                  <Icon size={14} />
                </span>
                {label}
                {isActive && (
                  <span className="absolute inset-0 rounded-lg" style={{ background: "rgba(0,106,255,0.08)" }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-[#1e2238] flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-[#006AFF]">{initials}</span>
          </div>
          <p className="text-[11px] text-[#4a4f68] truncate flex-1">{user?.email}</p>
        </div>
        <button
          onClick={async () => { await signOut(); navigate("/auth", { replace: true }); }}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-[#5a5f7a] hover:text-[#c0c5e0] hover:bg-white/[0.04] transition-all"
        >
          <LogOut size={14} />
          Выйти
        </button>
      </div>
    </aside>
  );
}
