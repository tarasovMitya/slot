import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { trackEvent } from "../lib/analytics";

type SubStep = "email" | "otp";
type Method = "otp" | "password";

const slide = {
  enter: { x: 30, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -30, opacity: 0 },
};

export function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  const [method, setMethod] = useState<Method>("otp");
  const [subStep, setSubStep] = useState<SubStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resentMessage, setResentMessage] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

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

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const sendOtp = async (e: string) => {
    setLoading(true);
    setError("");
    trackEvent("login_started", { method: "otp" });
    const { error: err } = await supabase.auth.signInWithOtp({
      email: e,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (err) {
      const isRateLimit = err.message.toLowerCase().includes("rate limit") ||
        err.message.toLowerCase().includes("security purposes") ||
        err.status === 429;
      trackEvent("login_failed", { reason: err.message });
      setError(isRateLimit
        ? "Слишком много попыток. Подождите минуту и попробуйте снова."
        : "Не удалось отправить письмо. Проверьте адрес или попробуйте позже.");
    } else {
      trackEvent("magic_link_sent");
      setEmail(e);
      setSubStep("otp");
      startCooldown(60);
    }
    setLoading(false);
  };

  const handleSendOtp = emailForm.handleSubmit(({ email: e }) => sendOtp(e));

  const handlePasswordLogin = async () => {
    if (!password) { setError("Введите пароль"); return; }
    setLoading(true);
    setError("");
    trackEvent("login_started", { method: "password" });
    const { error: err } = await supabase.auth.signInWithPassword({
      email: emailForm.getValues("email"),
      password,
    });
    if (err) {
      trackEvent("login_failed", { reason: err.message });
      setError(err.message.toLowerCase().includes("invalid login credentials")
        ? "Неверный email или пароль"
        : "Ошибка входа. Попробуйте снова.");
    } else {
      trackEvent("login_success", { method: "password" });
    }
    // On success onAuthStateChange fires → authStore updates → useEffect redirects
    setLoading(false);
  };

  const verifyOtp = async (code: string) => {
    if (code.length < 6) { setError("Введите 6-значный код"); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (err) {
      trackEvent("login_failed", { reason: "invalid_otp" }, { errorMessage: err.message });
      setError("Неверный код. Попробуй ещё раз");
      setLoading(false);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const isNew = user && (Date.now() - new Date(user.created_at).getTime()) < 60_000;
      trackEvent("login_success", { method: "otp" });
      if (isNew) trackEvent("registration_completed");
    }
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
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length) {
      setOtp([...digits, ...Array(6 - digits.length).fill("")]);
      otpRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  const switchMethod = (m: Method) => {
    setMethod(m);
    setError("");
    setPassword("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#006AFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <img src="/logo-full.svg" alt="SLOT" className="h-10 w-auto" />
          </div>
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
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Войти</h1>
                <p className="text-gray-500 mt-2">Выберите способ входа</p>
              </div>

              {/* Method tabs */}
              <div className="flex bg-gray-100 rounded-2xl p-1">
                <button
                  onClick={() => switchMethod("otp")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    method === "otp"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Код на почту
                </button>
                <button
                  onClick={() => switchMethod("password")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    method === "password"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Пароль
                </button>
              </div>

              <form
                onSubmit={method === "otp" ? handleSendOtp : (e) => { e.preventDefault(); handlePasswordLogin(); }}
                className="flex flex-col gap-3"
              >
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
                      : "border-gray-100 focus:border-[#006AFF]"
                  }`}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-red-500 text-sm ml-1">{emailForm.formState.errors.email.message}</p>
                )}

                {method === "password" && (
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Пароль"
                      autoComplete="current-password"
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-[#006AFF] text-lg outline-none transition-colors pr-14"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                )}

                {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || (method === "otp" && cooldown > 0)}
                  className="w-full py-4 rounded-2xl bg-[#006AFF] text-white font-semibold text-lg disabled:opacity-50 transition-all hover:bg-[#004CB8] active:scale-95"
                >
                  {loading
                    ? "Входим..."
                    : method === "otp"
                      ? cooldown > 0 ? `Повторить через ${cooldown} с` : "Получить код"
                      : "Войти"}
                </button>
              </form>

              <div className="flex flex-col gap-2 text-center">
                <p className="text-sm text-gray-400">
                  Нет аккаунта?{" "}
                  <button onClick={() => navigate("/calculator")} className="text-[#006AFF] font-medium hover:underline">
                    Зарегистрироваться
                  </button>
                </p>
                <p className="text-sm text-gray-400">
                  Вы мастер?{" "}
                  <button onClick={() => navigate("/performer/auth")} className="text-[#006AFF] font-medium hover:underline">
                    Войти как исполнитель
                  </button>
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
                      digit ? "border-[#006AFF] bg-gray-50" : "border-gray-100 focus:border-gray-400"
                    }`}
                  />
                ))}
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              {resentMessage && <p className="text-green-600 text-sm text-center">{resentMessage}</p>}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.join("").length < 6}
                className="w-full py-4 rounded-2xl bg-[#006AFF] text-white font-semibold text-lg disabled:opacity-50 transition-all hover:bg-[#004CB8] active:scale-95"
              >
                {loading ? "Проверяем..." : "Войти"}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setSubStep("email"); setOtp(["","","","","",""]); setError(""); setResentMessage(""); }}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Изменить email
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={handleResend}
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
