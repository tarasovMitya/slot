import { useState } from "react";
import { Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

const border = "1px solid rgba(255,255,255,0.08)";

export function AffiliateSettingsPage() {
  const { user } = useAuthStore();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (newPw.length < 6) {
      setErrorMsg("Пароль должен быть не менее 6 символов");
      return;
    }
    if (newPw !== confirmPw) {
      setErrorMsg("Пароли не совпадают");
      return;
    }

    setStatus("loading");

    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? "",
      password: currentPw,
    });

    if (signInError) {
      setStatus("error");
      setErrorMsg("Неверный текущий пароль");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPw });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("ok");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Настройки аккаунта</h1>
        <p className="text-sm text-[#6b7194] mt-0.5">Управление данными и безопасностью</p>
      </div>

      {/* Account info */}
      <div className="rounded-xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.03)", border }}>
        <p className="text-xs font-semibold text-[#6b7194] uppercase tracking-wider mb-3">Аккаунт</p>
        <div>
          <p className="text-xs text-[#6b7194] mb-1">Email</p>
          <p className="text-sm text-white font-medium">{user?.email}</p>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border }}>
        <div className="flex items-center gap-2.5 mb-4">
          <KeyRound size={16} className="text-[#006AFF]" />
          <p className="text-sm font-semibold text-white">Смена пароля</p>
        </div>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          {/* Current password */}
          <div>
            <label className="block text-xs text-[#6b7194] mb-1.5">Текущий пароль</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 pr-9 py-2 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#006AFF]/50 transition-colors placeholder:text-[#3a3f58]"
                style={{ background: "rgba(255,255,255,0.06)", border }}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7194] hover:text-[#c0c5e0]">
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs text-[#6b7194] mb-1.5">Новый пароль</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                placeholder="Минимум 6 символов"
                className="w-full px-3 pr-9 py-2 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#006AFF]/50 transition-colors placeholder:text-[#3a3f58]"
                style={{ background: "rgba(255,255,255,0.06)", border }}
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7194] hover:text-[#c0c5e0]">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs text-[#6b7194] mb-1.5">Подтвердите пароль</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                placeholder="Повторите новый пароль"
                className="w-full px-3 pr-9 py-2 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#006AFF]/50 transition-colors placeholder:text-[#3a3f58]"
                style={{ background: "rgba(255,255,255,0.06)", border }}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7194] hover:text-[#c0c5e0]">
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {status === "error" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{errorMsg}</p>
            </div>
          )}

          {/* Success */}
          {status === "ok" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 size={14} className="text-green-400 shrink-0" />
              <p className="text-xs text-green-400">Пароль успешно изменён</p>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "#006AFF" }}
          >
            {status === "loading" ? (
              <><Loader2 size={14} className="animate-spin" /> Сохранение...</>
            ) : "Изменить пароль"}
          </button>
        </form>
      </div>
    </div>
  );
}
