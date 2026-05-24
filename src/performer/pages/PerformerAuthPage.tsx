import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { Wrench } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { dbLoadPerformerProfile } from "../../lib/db";
import { signInWithTelegram, type TelegramUser } from "../../hooks/useTelegramAuth";
import { TelegramLoginButton } from "../../components/auth/TelegramLoginButton";

type SubStep = "email" | "otp";

const slide = {
  enter: { x: 30, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -30, opacity: 0 },
};

export function PerformerAuthPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  const [subStep, setSubStep] = useState<SubStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [tgLoading, setTgLoading] = useState(false);
  const [tgError, setTgError] = useState("");

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const handleTelegramAuth = async (tgUser: TelegramUser) => {
    setTgLoading(true);
    setTgError("");
    try {
      await signInWithTelegram(tgUser);
      await supabase.auth.updateUser({ data: { performer_role: true } });
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      if (freshUser?.user_metadata?.performer_onboarded) {
        navigate("/performer", { replace: true }); return;
      }
      const existingProfile = await dbLoadPerformerProfile(freshUser?.id ?? "");
      if (existingProfile?.name) {
        await supabase.auth.updateUser({ data: { performer_role: true, performer_onboarded: true } });
        navigate("/performer", { replace: true }); return;
      }
      navigate("/performer/onboarding", { replace: true });
    } catch (e) {
      setTgError(e instanceof Error ? e.message : "Ошибка входа через Telegram");
      setTgLoading(false);
    }
  };

  // If already authenticated as performer, redirect
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user?.user_metadata?.performer_role === true) {
      if (user.user_metadata.performer_onboarded) {
        navigate("/performer", { replace: true });
      } else {
        // Fallback: check DB profile
        dbLoadPerformerProfile(user.id).then((profile) => {
          if (profile?.name) {
            supabase.auth.updateUser({ data: { performer_role: true, performer_onboarded: true } });
            navigate("/performer", { replace: true });
          } else {
            navigate("/performer/onboarding", { replace: true });
          }
        });
      }
    }
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
      options: { shouldCreateUser: true },
    });
    if (err) {
      const isRateLimit =
        err.message.toLowerCase().includes("rate limit") ||
        err.message.toLowerCase().includes("security purposes") ||
        err.status === 429;
      const isEmailError = err.message.toLowerCase().includes("sending confirmation") ||
        err.message.toLowerCase().includes("sending email") ||
        err.message.toLowerCase().includes("email");
      setError(isRateLimit
        ? "Слишком много попыток. Подождите минуту и попробуйте снова."
        : isEmailError
          ? "Не удалось отправить письмо. Проверьте адрес или попробуйте позже."
          : err.message);
    } else {
      setEmail(e);
      setSubStep("otp");
      startCooldown(60);
    }
    setLoading(false);
  };

  const handleSendOtp = emailForm.handleSubmit(({ email: e }) => sendOtp(e));

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Введите 6-значный код"); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (err) {
      setError("Неверный код. Попробуй ещё раз");
      setLoading(false);
      return;
    }
    // Mark as performer and check onboarding status
    await supabase.auth.updateUser({ data: { performer_role: true } });
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser?.user_metadata?.performer_onboarded) {
      navigate("/performer", { replace: true });
    } else {
      // Fallback: check if profile exists in DB (user may have onboarded before the flag was introduced)
      const existingProfile = await dbLoadPerformerProfile(freshUser?.id ?? "");
      if (existingProfile?.name) {
        await supabase.auth.updateUser({ data: { performer_role: true, performer_onboarded: true } });
        navigate("/performer", { replace: true });
      } else {
        navigate("/performer/onboarding", { replace: true });
      }
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-black animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mx-auto mb-4">
            <Wrench size={22} stroke="white" strokeWidth={2.5} />
          </div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Портал исполнителей</p>
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
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Вход в кабинет</h1>
                <p className="text-gray-500 mt-2">Выберите способ входа</p>
              </div>

              {/* Telegram widget */}
              <div className="flex flex-col items-center gap-2">
                <TelegramLoginButton onAuth={handleTelegramAuth} loading={tgLoading} />
                {tgError && <p className="text-red-500 text-sm text-center">{tgError}</p>}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 uppercase tracking-wider">или email</span>
                <div className="flex-1 h-px bg-gray-100" />
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
                  className={`w-full px-5 py-4 rounded-2xl border-2 text-lg outline-none transition-colors ${
                    emailForm.formState.errors.email
                      ? "border-red-400"
                      : "border-gray-100 focus:border-black"
                  }`}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-red-500 text-sm ml-1">{emailForm.formState.errors.email.message}</p>
                )}
                {error && <p className="text-red-500 text-sm ml-1">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || cooldown > 0}
                  className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-lg disabled:opacity-50 transition-all hover:bg-gray-800 active:scale-95"
                >
                  {loading ? "Отправляем..." : cooldown > 0 ? `Повторить через ${cooldown} с` : "Получить код"}
                </button>
              </form>

              <div className="flex flex-col gap-2 text-center">
                <p className="text-sm text-gray-400">
                  Ещё не зарегистрированы?{" "}
                  <Link to="/performer/onboarding" className="text-black font-medium hover:underline">
                    Стать исполнителем
                  </Link>
                </p>
                <p className="text-sm text-gray-400">
                  Вы клиент?{" "}
                  <Link to="/auth" className="text-black font-medium hover:underline">
                    Войти как клиент
                  </Link>
                </p>
              </div>
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
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Введите код</h1>
                <p className="text-gray-500 mt-2">
                  Отправили на <span className="font-medium text-gray-700">{email}</span>
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
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-colors ${
                      digit ? "border-black bg-gray-50" : "border-gray-100 focus:border-gray-400"
                    }`}
                  />
                ))}
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.join("").length < 6}
                className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-lg disabled:opacity-50 transition-all hover:bg-gray-800 active:scale-95"
              >
                {loading ? "Проверяем..." : "Войти"}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setSubStep("email"); setOtp(["","","","","",""]); setError(""); }}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Изменить email
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={() => sendOtp(email)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
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
