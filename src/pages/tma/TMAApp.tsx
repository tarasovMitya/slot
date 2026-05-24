import { useEffect, useState } from "react";
import { useSignal, miniApp, backButton, initDataUser, restoreInitData } from "@telegram-apps/sdk-react";
import type { User } from "@telegram-apps/sdk-react";
import { TMAHome } from "./TMAHome";
import { TMACalculator } from "./TMACalculator";
import { TMAOrders } from "./TMAOrders";
import { TMAProfile } from "./TMAProfile";

export type TMAPage = "home" | "calculator" | "orders" | "profile";

export function TMAApp() {
  const [page, setPage] = useState<TMAPage>("home");
  const isMiniAppMounted = useSignal(miniApp.isMounted);
  const user = useSignal(initDataUser) as User | undefined;

  useEffect(() => {
    try { restoreInitData(); } catch { /* outside Telegram */ }
    if (!isMiniAppMounted) miniApp.mount();
    miniApp.setHeaderColor("#0f172a");
    miniApp.setBackgroundColor("#ffffff");
  }, [isMiniAppMounted]);

  // Back button support
  useEffect(() => {
    if (!backButton.isMounted()) return;
    if (page !== "home") {
      backButton.show();
      const off = backButton.onClick(() => setPage("home"));
      return off;
    } else {
      backButton.hide();
    }
  }, [page]);

  // Open specific service from bot deep link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const service = params.get("service");
    if (service) setPage("calculator");
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <main className="flex-1 overflow-y-auto pb-20">
        {page === "home" && <TMAHome user={user} onNavigate={setPage} />}
        {page === "calculator" && <TMACalculator user={user} onNavigate={setPage} />}
        {page === "orders" && <TMAOrders user={user} />}
        {page === "profile" && <TMAProfile user={user} onNavigate={setPage} />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50"
           style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {(["home", "calculator", "orders", "profile"] as TMAPage[]).map((p) => {
          const icons: Record<TMAPage, string> = {
            home: "🏠", calculator: "🧮", orders: "📋", profile: "👤"
          };
          const labels: Record<TMAPage, string> = {
            home: "Главная", calculator: "Заказать", orders: "Заявки", profile: "Профиль"
          };
          return (
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
          );
        })}
      </nav>
    </div>
  );
}
