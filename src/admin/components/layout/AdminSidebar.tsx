import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, Users, UserCircle, DollarSign,
  AlertTriangle, ShieldCheck, BarChart2, Settings, LogOut,
  Activity, MessageSquare, Search, ClipboardList, Menu, X,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { useAdminStore } from "../../store/adminStore";
import { ROLE_LABELS } from "../../types";

const nav = [
  { to: "/admin",                  label: "Обзор",           icon: LayoutDashboard, end: true },
  { to: "/admin/orders",           label: "Заказы",          icon: ShoppingBag },
  { to: "/admin/clients",          label: "Клиенты",         icon: UserCircle },
  { to: "/admin/performers",       label: "Исполнители",     icon: Users },
  { to: "/admin/finance",          label: "Финансы",         icon: DollarSign },
  { to: "/admin/disputes",         label: "Споры",           icon: AlertTriangle },
  { to: "/admin/verification",     label: "Верификация",     icon: ShieldCheck },
  { to: "/admin/chats",            label: "Чаты",            icon: MessageSquare },
  { to: "/admin/analytics",        label: "Аналитика",       icon: BarChart2 },
  { to: "/admin/affiliate-tasks",  label: "Задачи аффилейтов", icon: ClipboardList },
  { to: "/admin/settings",         label: "Настройки",       icon: Settings },
  { to: "/admin/events",           label: "Логи",            icon: Activity },
];

// Key items for mobile bottom tab bar
const tabBarItems = [
  nav[0], // Обзор
  nav[1], // Заказы
  nav[3], // Исполнители
  nav[7], // Чаты
];

export function AdminSidebar() {
  const { user, signOut } = useAuthStore();
  const { role } = useAdminStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = search.trim()
    ? nav.filter((n) => n.label.toLowerCase().includes(search.toLowerCase()))
    : nav;

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "AD";

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-[220px] shrink-0 flex-col min-h-screen border-r border-white/[0.06]" style={{ background: "#0c0e1a" }}>
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <img src="/logo-square.svg" alt="SLOT" className="w-8 h-8 shrink-0" />
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold leading-tight truncate">SLOT Admin</p>
              <p className="text-[#5a5f7a] text-[11px] leading-tight truncate mt-0.5">
                {role ? ROLE_LABELS[role] : "Панель управления"}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop search */}
        <div className="px-3 py-2.5 border-b border-white/[0.04]">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a5f7a] pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..."
              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-md outline-none text-[#a0a5c0] placeholder:text-[#4a4f68] transition-colors"
              style={{ background: "#171a28", border: "1px solid rgba(255,255,255,0.06)" }} />
          </div>
        </div>

        <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5 overflow-y-auto">
          {filtered.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive ? "text-white" : "text-[#6b7194] hover:text-[#c0c5e0] hover:bg-white/[0.04]"
                }`
              }>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[#006AFF]" />}
                  <span className={`flex items-center justify-center w-5 h-5 rounded-md transition-colors ${isActive ? "text-[#006AFF]" : "text-current"}`}>
                    <Icon size={14} />
                  </span>
                  {label}
                  {isActive && <span className="absolute inset-0 rounded-lg" style={{ background: "rgba(0,106,255,0.08)" }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-[#1e2238] flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#006AFF]">{initials}</span>
            </div>
            <p className="text-[11px] text-[#4a4f68] truncate flex-1">{user?.email}</p>
          </div>
          <button onClick={async () => { await signOut(); navigate("/auth", { replace: true }); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-[#5a5f7a] hover:text-[#c0c5e0] hover:bg-white/[0.04] transition-all">
            <LogOut size={14} /> Выйти
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center border-t border-white/[0.08]"
        style={{ background: "#0c0e1a", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {tabBarItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="flex-1">
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-0.5 py-2 transition-colors ${isActive ? "text-[#006AFF]" : "text-[#5a5f7a]"}`}>
                <Icon size={22} />
                <span className="text-[10px] font-medium">{label}</span>
              </div>
            )}
          </NavLink>
        ))}
        <button onClick={() => setDrawerOpen(true)} className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[#5a5f7a]">
          <Menu size={22} />
          <span className="text-[10px] font-medium">Ещё</span>
        </button>
      </nav>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative ml-auto w-72 flex flex-col min-h-screen border-l border-white/[0.08]" style={{ background: "#0c0e1a" }}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <img src="/logo-square.svg" alt="SLOT" className="w-7 h-7" />
                <div>
                  <p className="text-white text-sm font-semibold">SLOT Admin</p>
                  <p className="text-[#5a5f7a] text-[10px]">{role ? ROLE_LABELS[role] : "Панель управления"}</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-[#6b7194] hover:text-white p-1"><X size={20} /></button>
            </div>
            {/* Drawer search */}
            <div className="px-3 py-2.5 border-b border-white/[0.04]">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a5f7a] pointer-events-none" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..."
                  className="w-full pl-7 pr-3 py-1.5 text-xs rounded-md outline-none text-[#a0a5c0] placeholder:text-[#4a4f68]"
                  style={{ background: "#171a28", border: "1px solid rgba(255,255,255,0.06)" }} />
              </div>
            </div>
            <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5 overflow-y-auto">
              {filtered.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive ? "text-white bg-[#006AFF]/10" : "text-[#6b7194] hover:text-white hover:bg-white/[0.04]"
                    }`
                  }>
                  {({ isActive }) => (
                    <>
                      <Icon size={16} className={isActive ? "text-[#006AFF]" : ""} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-[#1e2238] flex items-center justify-center">
                  <span className="text-xs font-bold text-[#006AFF]">{initials}</span>
                </div>
                <p className="text-xs text-[#4a4f68] truncate">{user?.email}</p>
              </div>
              <button onClick={async () => { await signOut(); navigate("/auth", { replace: true }); setDrawerOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-[#5a5f7a] hover:text-white hover:bg-white/[0.04] transition-all">
                <LogOut size={16} /> Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
