import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, Users, UserCircle, DollarSign,
  AlertTriangle, ShieldCheck, BarChart2, Settings, LogOut,
  Activity, MessageSquare, Search, ClipboardList,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { useAdminStore } from "../../store/adminStore";
import { ROLE_LABELS } from "../../types";

const nav = [
  { to: "/admin",              label: "Обзор",        icon: LayoutDashboard, end: true },
  { to: "/admin/orders",       label: "Заказы",       icon: ShoppingBag },
  { to: "/admin/clients",      label: "Клиенты",      icon: UserCircle },
  { to: "/admin/performers",   label: "Исполнители",  icon: Users },
  { to: "/admin/finance",      label: "Финансы",      icon: DollarSign },
  { to: "/admin/disputes",     label: "Споры",        icon: AlertTriangle },
  { to: "/admin/verification", label: "Верификация",  icon: ShieldCheck },
  { to: "/admin/chats",        label: "Чаты",         icon: MessageSquare },
  { to: "/admin/analytics",    label: "Аналитика",    icon: BarChart2 },
  { to: "/admin/affiliate-tasks", label: "Задачи аффилейтов", icon: ClipboardList },
  { to: "/admin/settings",     label: "Настройки",    icon: Settings },
  { to: "/admin/events",       label: "Логи",         icon: Activity },
];

export function AdminSidebar() {
  const { user, signOut } = useAuthStore();
  const { role } = useAdminStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? nav.filter((n) => n.label.toLowerCase().includes(search.toLowerCase()))
    : nav;

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "AD";

  return (
    <aside className="w-[220px] shrink-0 flex flex-col min-h-screen border-r border-white/[0.06]" style={{ background: "#0c0e1a" }}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#006AFF] flex items-center justify-center shrink-0">
            <img src="/logo-square.svg" alt="" className="w-4 h-4 brightness-0 invert" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold leading-tight truncate">SLOT Admin</p>
            <p className="text-[#5a5f7a] text-[11px] leading-tight truncate mt-0.5">
              {role ? ROLE_LABELS[role] : "Панель управления"}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-white/[0.04]">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a5f7a] pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full pl-7 pr-3 py-1.5 text-xs rounded-md outline-none text-[#a0a5c0] placeholder:text-[#4a4f68] transition-colors"
            style={{ background: "#171a28", border: "1px solid rgba(255,255,255,0.06)" }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5 overflow-y-auto">
        {filtered.map(({ to, label, icon: Icon, end }) => (
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
