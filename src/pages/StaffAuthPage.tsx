import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

type SubStep = "email" | "otp";

const slide = {
  enter: { x: 30, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -30, opacity: 0 },
};

export function StaffAuthPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  const [subStep, setSubStep] = useState<SubStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resentMessage, setResentMessage] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  // Redirect based on role after login
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        const role = data?.role;
        if (role === "admin" || role === "super_admin") {
          navigate("/admin", { replace: true });
        } else if (role === "affiliate_manager") {
          navigate("/affiliate", { replace: true });
        } else {
          setError("У вас нет доступа к панели управления.");
        }
      });
  }, [isAuthenticated, isLoading, user]);

  const startCooldown = (seconds = 60) => {
    setCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const emailForm = useForm<{ email: string }>();

  const sendOtp = async (e: string) => {
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: e,
      options: {
        shouldCreateUser: false, // staff only — no new accounts
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (err) {
      setError(
        err.message.toLowerCase().includes("rate limit") || err.status === 429
          ? "Слишком много попыток. Подождите минуту."
          : err.message.toLowerCase().includes("user not found") || err.message.toLowerCase().includes("invalid")
          ? "Этот email не зарегистрирован в системе."
          : err.message
      );
    } else {
      setEmail(e);
      setSubStep("otp");
      startCooldown(60);
    }
    setLoading(false);
  };

  const handleSendOtp = emailForm.handleSubmit(({ email: e }) => sendOtp(e));

  const verifyOtp = async (code: string) => {
    if (code.length < 6) { setError("Введите 6-значный код"); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (err) {
      setError("Неверный код. Попробуйте ещё раз.");
      setLoading(false);
    }
    // On success → useEffect above handles redirect
  };

  const handleVerifyOtp = () => verifyOtp(otp.join(""));

  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) {
      otpRefs.current[i + 1]?.focus();
    } else if (digit && i === 5 && next.every((d) => d !== "")) {
      verifyOtp(next.join(""));
    }
  };

  const handleResend = async () => {
    await sendOtp(email);
    setResentMessage("Код отправлен повторно");
    setTimeout(() => setResentMessage(""), 3000);
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length) {
      setOtp([...digits, ...Array(6 - digits.length).fill("")]);
      otpRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080a14" }}>
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#006AFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#080a14" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <img src="/logo-full.svg" alt="SLOT" className="h-10 w-auto brightness-0 invert" />
          </div>
          <p className="text-xs text-[#6b7194] uppercase tracking-widest font-semibold mt-2">Панель управления</p>
        </div>

        <AnimatePresence mode="wait">
          {subStep === "email" && (
            <motion.div
              key="email"
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white tracking-tight">Войти</h1>
                <p className="text-[#6b7194] mt-2 text-sm">Доступ только для сотрудников</p>
              </div>

              <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                <input
                  {...emailForm.register("email", {
                    required: "Введите email",
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Некорректный email" },
                  })}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full px-5 py-4 rounded-2xl border text-base outline-none transition-colors bg-[#0f1120] text-white placeholder-[#6b7194] ${
                    emailForm.formState.errors.email
                      ? "border-red-500/50"
                      : "border-white/[0.08] focus:border-[#006AFF]"
                  }`}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-red-400 text-sm ml-1">{emailForm.formState.errors.email.message}</p>
                )}
                {error && <p className="text-red-400 text-sm ml-1">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || cooldown > 0}
                  className="w-full py-4 rounded-2xl bg-[#006AFF] text-white font-semibold text-base disabled:opacity-50 transition-all hover:bg-[#004CB8] active:scale-95"
                >
                  {loading ? "Отправляем..." : cooldown > 0 ? `Повторить через ${cooldown} с` : "Получить код"}
                </button>
              </form>
            </motion.div>
          )}

          {subStep === "otp" && (
            <motion.div
              key="otp"
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white tracking-tight">Введите код</h1>
                <p className="text-[#6b7194] mt-2 text-sm">
                  Отправили на <span className="font-medium text-[#a0a5c0]">{email}</span>
                </p>
              </div>

              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border outline-none transition-colors bg-[#0f1120] text-white ${
                      digit ? "border-[#006AFF]" : "border-white/[0.08] focus:border-white/30"
                    }`}
                  />
                ))}
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              {resentMessage && <p className="text-emerald-400 text-sm text-center">{resentMessage}</p>}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.join("").length < 6}
                className="w-full py-4 rounded-2xl bg-[#006AFF] text-white font-semibold text-base disabled:opacity-50 transition-all hover:bg-[#004CB8] active:scale-95"
              >
                {loading ? "Проверяем..." : "Войти"}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setSubStep("email"); setOtp(["","","","","",""]); setError(""); setResentMessage(""); }}
                  className="text-sm text-[#6b7194] hover:text-[#a0a5c0] transition-colors"
                >
                  Изменить email
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={handleResend}
                  className="text-sm text-[#6b7194] hover:text-[#a0a5c0] transition-colors disabled:opacity-40"
                >
                  {cooldown > 0 ? `Отправить снова (${cooldown}с)` : "Отправить снова"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
