import { useEffect, useRef, useState } from "react";
import { loadTelegramWidget, type TelegramUser } from "../../hooks/useTelegramAuth";

interface Props {
  onAuth: (user: TelegramUser) => void;
  loading?: boolean;
}

const BOT_NAME = "slot_home_bot";
const BOT_URL = "https://t.me/slot_home_bot";

export function TelegramLoginButton({ onAuth, loading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetStatus, setWidgetStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!containerRef.current) return;

    const script = loadTelegramWidget(BOT_NAME, onAuth);

    const timeout = setTimeout(() => {
      // If no iframe appeared after 5s → widget failed (domain not set)
      const iframe = containerRef.current?.querySelector("iframe");
      if (!iframe) setWidgetStatus("error");
    }, 5000);

    script.onload = () => {
      // Script loaded — check if iframe was actually inserted
      setTimeout(() => {
        const iframe = containerRef.current?.querySelector("iframe");
        setWidgetStatus(iframe ? "ready" : "error");
        clearTimeout(timeout);
      }, 800);
    };

    script.onerror = () => {
      setWidgetStatus("error");
      clearTimeout(timeout);
    };

    containerRef.current.appendChild(script);

    return () => {
      clearTimeout(timeout);
      script.remove();
      window.onTelegramAuth = undefined;
    };
  }, [onAuth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 w-full py-3 text-sm text-gray-500">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#229ED9] animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#229ED9] animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#229ED9] animate-bounce [animation-delay:300ms]" />
        </span>
        Входим через Telegram...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* Widget container — iframe inserts here when domain is registered */}
      <div ref={containerRef} className="flex justify-center min-h-[40px] w-full" />

      {/* Fallback: show open-bot link when widget fails */}
      {widgetStatus === "error" && (
        <a
          href={BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl border border-[#229ED9] text-[#229ED9] text-sm font-semibold hover:bg-[#229ED9]/5 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
          </svg>
          Войти через Telegram
        </a>
      )}

      {/* Loading placeholder while checking */}
      {widgetStatus === "loading" && (
        <div className="flex items-center justify-center gap-1.5 py-1">
          <span className="w-1 h-1 rounded-full bg-gray-300 animate-bounce [animation-delay:0ms]" />
          <span className="w-1 h-1 rounded-full bg-gray-300 animate-bounce [animation-delay:150ms]" />
          <span className="w-1 h-1 rounded-full bg-gray-300 animate-bounce [animation-delay:300ms]" />
        </div>
      )}
    </div>
  );
}
