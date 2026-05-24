import { useEffect, useRef, useState } from "react";
import { TMAHome } from "./TMAHome";
import { TMACalculator } from "./TMACalculator";
import { TMAOrders } from "./TMAOrders";
import { TMAProfile } from "./TMAProfile";
import { supabase } from "../../lib/supabase";

export type TMAPage = "home" | "calculator" | "orders" | "profile";

// Get raw initData for server-side verification
function getRawInitData(): string | undefined {
  try {
    return (window as any).Telegram?.WebApp?.initData || undefined;
  } catch {
    return undefined;
  }
}

export function TMAApp() {
  const [page, setPage] = useState<TMAPage>("home");
  const [tgUser, setTgUser] = useState<any>(undefined);
  const backHandlerRef = useRef<() => void>(() => {});

  useEffect(() => {
    // Initialize Telegram WebApp via native API (no SDK crashes)
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        tg.setHeaderColor("#0f172a");
        tg.setBackgroundColor("#ffffff");
        setTgUser(tg.initDataUnsafe?.user);
      } catch { /* ignore */ }
    }

    // Deep links: ?service= → calculator, ?tab= → specific tab
    const params = new URLSearchParams(window.location.search);
    const service = params.get("service");
    const tab = params.get("tab") as TMAPage | null;
    if (service) setPage("calculator");
    else if (tab && ["calculator", "orders", "profile"].includes(tab)) setPage(tab);
  }, []);

  // Back button via native WebApp API — use stable handler ref to avoid accumulation
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;
    try {
      // Remove previous handler before adding new one
      tg.BackButton.offClick(backHandlerRef.current);
      if (page !== "home") {
        backHandlerRef.current = () => setPage("home");
        tg.BackButton.show();
        tg.BackButton.onClick(backHandlerRef.current);
      } else {
        backHandlerRef.current = () => {};
        tg.BackButton.hide();
      }
    } catch { /* ignore */ }
  }, [page]);

  // Auto sign-in to Supabase using Telegram initData
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) return;

        const rawInitData = getRawInitData();
        if (!rawInitData) return;

        const res = await fetch(
          `${window.location.origin}/supabase-proxy/functions/v1/telegram-auth`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: rawInitData }),
          }
        );
        if (!res.ok) return;

        const { token_hash } = await res.json();
        if (!token_hash) return;

        await supabase.auth.verifyOtp({ token_hash, type: "magiclink" });
      } catch { /* silent */ }
    })();
  }, []);

  const icons: Record<TMAPage, string> = {
    home: "🏠", calculator: "🧮", orders: "📋", profile: "👤",
  };
  const labels: Record<TMAPage, string> = {
    home: "Главная", calculator: "Заказать", orders: "Заявки", profile: "Профиль",
  };

  return (
    <div className="flex flex-col min-h-screen bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <main className="flex-1 overflow-y-auto pb-20">
        {page === "home" && <TMAHome user={tgUser} onNavigate={setPage} />}
        {page === "calculator" && <TMACalculator user={tgUser} onNavigate={setPage} />}
        {page === "orders" && <TMAOrders user={tgUser} />}
        {page === "profile" && <TMAProfile user={tgUser} onNavigate={setPage} />}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {(["home", "calculator", "orders", "profile"] as TMAPage[]).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
              page === p ? "text-gray-900" : "text-gray-400"
            }`}
          >
            <span className="text-lg">{icons[p]}</span>
            <span>{labels[p]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
