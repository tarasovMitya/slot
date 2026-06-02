import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";

interface Props {
  onSuccess: () => void;
  linkMode?: boolean;
}

const BOT_NAME = "slot_home_bot";
const EXPIRY_MS = 5 * 60 * 1000;

function generateState(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function TelegramLoginButton({ onSuccess, linkMode }: Props) {
  const [phase, setPhase] = useState<"idle" | "waiting" | "verifying" | "expired" | "error">("idle");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState("");
  const stateRef = useRef<string | null>(null);
  const startedAtRef = useRef(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const openBot = () => {
    const state = generateState();
    stateRef.current = state;
    startedAtRef.current = Date.now();
    setPhase("waiting");
    setDigits(["", "", "", "", "", ""]);
    setErrorMsg("");
    window.open(`https://t.me/${BOT_NAME}?start=LOGIN_${state}`, "_blank");
    setTimeout(() => inputRefs.current[0]?.focus(), 400);
  };

  const handleDigitChange = (i: number, val: string) => {
    const d = val.replace(/\D/, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    const next = [...pasted, ...Array(6 - pasted.length).fill("")];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async () => {
    const code = digits.join("");
    if (code.length < 6) return;
    if (Date.now() - startedAtRef.current > EXPIRY_MS) { setPhase("expired"); return; }

    setPhase("verifying");
    const state = stateRef.current!;

    try {
      if (linkMode) {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/telegram-auth/link?state=${state}&code=${code}`, {
          headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
        });
        const data = await res.json();
        if (data.error === "invalid_code") { showError("Неверный код"); return; }
        if (data.status === "pending") { showError("Бот ещё не прислал код — подождите и попробуйте снова"); return; }
        if (!res.ok || data.error) { showError(data.error ?? "Ошибка привязки"); return; }
        await supabase.auth.refreshSession();
        onSuccess();
      } else {
        const res = await fetch(`/api/telegram-auth/status?state=${state}&code=${code}`);
        const data = await res.json();
        if (data.status === "pending") { showError("Бот ещё не прислал код — подождите и попробуйте снова"); return; }
        if (data.error === "invalid_code") { showError("Неверный код. Проверьте сообщение от бота."); return; }
        if (data.status === "ready" && data.token_hash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: "magiclink" });
          if (error) { showError(`Ошибка входа: ${error.message}`); return; }
          onSuccess();
          return;
        }
        showError("Что-то пошло не так. Попробуйте снова.");
      }
    } catch {
      showError("Ошибка сети. Попробуйте снова.");
    }
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setDigits(["", "", "", "", "", ""]);
    setPhase("error");
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  // ── Verifying ──────────────────────────────────────────────────────────────
  if (phase === "verifying") {
    return (
      <div className="flex items-center justify-center gap-2 w-full py-3 text-sm text-gray-500">
        <Dots />
        Проверяем код...
      </div>
    );
  }

  // ── Code input (waiting / error) ───────────────────────────────────────────
  if (phase === "waiting" || phase === "error") {
    const codeStr = digits.join("");
    return (
      <div className="flex flex-col gap-3 w-full">
        {phase === "error" && (
          <p className="text-xs text-red-500 text-center">{errorMsg}</p>
        )}
        <p className="text-sm text-gray-500 text-center">
          Введите 6-значный код из сообщения бота
        </p>

        {/* Code boxes */}
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-10 h-12 text-center text-xl font-bold rounded-xl border-2 outline-none transition-colors ${
                d ? "border-[#229ED9] bg-blue-50 text-gray-900" : "border-gray-100 focus:border-gray-300"
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={codeStr.length < 6}
          className="w-full py-3 rounded-2xl bg-[#006AFF] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#004CB8] transition-all active:scale-95"
        >
          {linkMode ? "Привязать" : "Войти"}
        </button>

        <button onClick={openBot} className="text-xs text-[#229ED9] hover:underline text-center">
          Открыть бот ещё раз
        </button>
      </div>
    );
  }

  // ── Expired ────────────────────────────────────────────────────────────────
  if (phase === "expired") {
    return (
      <button
        onClick={openBot}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl border border-amber-300 text-amber-600 text-sm font-semibold hover:bg-amber-50 transition-colors"
      >
        Время вышло — попробовать снова
      </button>
    );
  }

  // ── Idle ───────────────────────────────────────────────────────────────────
  return (
    <button
      onClick={openBot}
      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl border border-[#229ED9] text-[#229ED9] text-sm font-semibold hover:bg-[#229ED9]/5 transition-colors"
    >
      <TgIcon />
      {linkMode ? "Привязать Telegram" : "Войти через Telegram"}
    </button>
  );
}

function Dots() {
  return (
    <span className="flex gap-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1.5 h-1.5 rounded-full bg-[#229ED9] animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
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
