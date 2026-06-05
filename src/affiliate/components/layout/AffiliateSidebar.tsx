import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ClipboardList, AlertTriangle,
  MessageSquare, DollarSign, CheckSquare, Link2, LogOut, Menu, X, Settings,
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
  { to: "/affiliate/settings",   label: "Настройки",   icon: Settings },
];

// Key items shown in bottom tab bar on mobile
const tabBarItems = [
  nav[0], // Обзор
  nav[1], // Исполнители
  nav[4], // Чаты
  nav[6], // Задачник
];

export function AffiliateSidebar() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "AF";

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-[220px] shrink-0 flex-col min-h-screen border-r border-white/[0.06]" style={{ background: "#0c0e1a" }}>
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <img src="/logo-square.svg" alt="SLOT" className="w-8 h-8 shrink-0" />
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold leading-tight truncate">SLOT</p>
              <p className="text-[#5a5f7a] text-[11px] leading-tight mt-0.5">Партнёрский кабинет</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
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
        {/* Burger button */}
        <button onClick={() => setDrawerOpen(true)} className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[#5a5f7a]">
          <Menu size={22} />
          <span className="text-[10px] font-medium">Ещё</span>
        </button>
      </nav>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative ml-auto w-72 flex flex-col min-h-screen border-l border-white/[0.08]"
            style={{ background: "#0c0e1a" }}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <img src="/logo-square.svg" alt="SLOT" className="w-7 h-7" />
                <div>
                  <p className="text-white text-sm font-semibold">SLOT</p>
                  <p className="text-[#5a5f7a] text-[10px]">Партнёрский кабинет</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-[#6b7194] hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5 overflow-y-auto">
              {nav.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
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
