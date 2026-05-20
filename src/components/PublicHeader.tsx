import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useAuthModalStore } from "../store/authModalStore";

const NAV_LINKS = [
  { label: "Услуги", href: "/moscow" },
  { label: "Электрик", href: "/moscow/electrician" },
  { label: "Сантехник", href: "/moscow/plumber" },
  { label: "Уборка", href: "/moscow/cleaning" },
  { label: "Блог", href: "/blog" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { open: openModal } = useAuthModalStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-[10px] font-black tracking-tight">SL</span>
          </div>
          <span className="font-black text-gray-900 tracking-tight">SLOT</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} to={l.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="hidden sm:block text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              Мои заказы
            </button>
          ) : (
            <button
              onClick={() => openModal("login")}
              className="hidden sm:block text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              Войти
            </button>
          )}
          <Link
            to="/calculator"
            className="text-sm font-bold px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all active:scale-95"
          >
            Заказать
          </Link>
          <button onClick={() => setOpen((v) => !v)} className="md:hidden p-1.5 text-gray-500">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => setOpen(false)}
              className="text-sm text-gray-700 py-2 hover:text-gray-900 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
