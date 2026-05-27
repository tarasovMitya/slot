import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

interface Props {
  onSuccess: () => void;
  linkMode?: boolean; // true = attach Telegram to existing account instead of signing in
}

const BOT_NAME = "slot_home_bot";
const POLL_INTERVAL_MS = 2000;
const EXPIRY_MS = 5 * 60 * 1000;

function generateState(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function TelegramLoginButton({ onSuccess, linkMode }: Props) {
  const [phase, setPhase] = useState<"idle" | "waiting" | "authing" | "expired" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const stateRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  useEffect(() => () => stopPolling(), []);

  const startAuth = async () => {
    const state = generateState();
    stateRef.current = state;
    startedAtRef.current = Date.now();
    setPhase("waiting");
    setErrorMsg("");

    window.open(`https://t.me/${BOT_NAME}?start=LOGIN_${state}`, "_blank");

    stopPolling();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAtRef.current > EXPIRY_MS) {
        stopPolling();
        setPhase("expired");
        return;
      }
      try {
        if (linkMode) {
          // Poll for bot confirmation, then update current user's Telegram metadata
          const statusRes = await fetch(`/api/telegram-auth/status?state=${state}`);
          const statusData = await statusRes.json();
          if (statusData.status === "pending") return;

          stopPolling();
          setPhase("authing");
          const { data: { session } } = await supabase.auth.getSession();
          const linkRes = await fetch(`/api/telegram-auth/link?state=${state}`, {
            headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
          });
          if (!linkRes.ok) {
            const err = await linkRes.json().catch(() => ({}));
            setPhase("error");
            setErrorMsg(err.error ?? "Ошибка привязки Telegram");
          } else {
            await supabase.auth.refreshSession();
            onSuccess();
          }
        } else {
          // Poll for bot confirmation, then verify OTP to sign in
          const res = await fetch(`/api/telegram-auth/status?state=${state}`);
          const data = await res.json();
          if (data.status === "ready" && data.token_hash) {
            stopPolling();
            setPhase("authing");
            const { error } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: "magiclink" });
            if (error) {
              setPhase("error");
              setErrorMsg(`Ошибка входа: ${error.message}`);
            } else {
              onSuccess();
            }
          }
        }
      } catch {
        // network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS);
  };

  if (phase === "authing") {
    return (
      <div className="flex items-center justify-center gap-2 w-full py-3 text-sm text-gray-500">
        <Dots color="#229ED9" />
        {linkMode ? "Привязываем..." : "Входим..."}
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div className="flex flex-col items-center gap-2 w-full">
        <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
          <Dots color="#229ED9" />
          Откройте бот и нажмите «Старт»
        </div>
        <button onClick={startAuth} className="text-xs text-[#229ED9] hover:underline">
          Открыть бот ещё раз
        </button>
      </div>
    );
  }

  if (phase === "expired") {
    return (
      <button
        onClick={startAuth}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl border border-amber-300 text-amber-600 text-sm font-semibold hover:bg-amber-50 transition-colors"
      >
        Время вышло — попробовать снова
      </button>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col items-center gap-2 w-full">
        <p className="text-xs text-red-500 text-center">{errorMsg}</p>
        <button
          onClick={startAuth}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl border border-[#229ED9] text-[#229ED9] text-sm font-semibold hover:bg-[#229ED9]/5 transition-colors"
        >
          <TgIcon />
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startAuth}
      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl border border-[#229ED9] text-[#229ED9] text-sm font-semibold hover:bg-[#229ED9]/5 transition-colors"
    >
      <TgIcon />
      {linkMode ? "Привязать Telegram" : "Войти через Telegram"}
    </button>
  );
}

function Dots({ color }: { color: string }) {
  return (
    <span className="flex gap-1">
      <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0ms]" style={{ backgroundColor: color }} />
      <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:150ms]" style={{ backgroundColor: color }} />
      <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:300ms]" style={{ backgroundColor: color }} />
    </span>
  );
}

function TgIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
    </svg>
  );
}
