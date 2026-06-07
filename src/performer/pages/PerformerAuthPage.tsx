import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { dbLoadPerformerProfile } from "../../lib/db";

type SubStep = "email" | "otp";
type Method = "otp" | "password";

const slide = {
  enter: { x: 30, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -30, opacity: 0 },
};

export function PerformerAuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem("affiliate_ref_code", ref);
  }, []);

  const [method, setMethod] = useState<Method>("otp");
  const [subStep, setSubStep] = useState<SubStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user?.user_metadata?.performer_role === true) {
      if (user.user_metadata.performer_onboarded) {
        navigate("/performer", { replace: true });
      } else {
        dbLoadPerformerProfile(user.id).then((profile) => {
          if (profile !== null) {
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
      const isRateLimit = err.message.toLowerCase().includes("rate limit") ||
        err.message.toLowerCase().includes("security purposes") ||
        err.status === 429;
      setError(isRateLimit
        ? "Слишком много попыток. Подождите минуту и попробуйте снова."
        : "Не удалось отправить письмо. Проверьте адрес или попробуйте позже.");
    } else {
      setEmail(e);
      setSubStep("otp");
      startCooldown(60);
    }
    setLoading(false);
  };

  const handleSendOtp = emailForm.handleSubmit(({ email: e }) => sendOtp(e));

  const afterLogin = async () => {
    await supabase.auth.updateUser({ data: { performer_role: true } });
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser?.user_metadata?.performer_onboarded) {
      navigate("/performer", { replace: true });
    } else {
      const existingProfile = await dbLoadPerformerProfile(freshUser?.id ?? "");
      if (existingProfile !== null) {
        await supabase.auth.updateUser({ data: { performer_role: true, performer_onboarded: true } }).catch(() => {});
        navigate("/performer", { replace: true });
      } else {
        navigate("/performer/onboarding", { replace: true });
      }
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Введите 6-значный код"); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (err) {
      setError("Неверный код. Попробуй ещё раз");
      setLoading(false);
      return;
    }
    await afterLogin();
  };

  const handlePasswordLogin = async () => {
    if (!password) { setError("Введите пароль"); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({
      email: emailForm.getValues("email"),
      password,
    });
    if (err) {
      setError(err.message.toLowerCase().includes("invalid login credentials")
        ? "Неверный email или пароль"
        : "Ошибка входа. Попробуйте снова.");
      setLoading(false);
      return;
    }
    await afterLogin();
  };

  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
    else if (digit && i === 5 && next.every((d) => d !== "")) {
      handleVerifyOtp();
    }
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
                  Ещё не зарегистрированы?{" "}
                  <Link to="/performer/onboarding" className="text-[#006AFF] font-medium hover:underline">
                    Стать исполнителем
                  </Link>
                </p>
                <p className="text-sm text-gray-400">
                  Вы клиент?{" "}
                  <Link to="/auth" className="text-[#006AFF] font-medium hover:underline">
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
                      digit ? "border-[#006AFF] bg-gray-50" : "border-gray-100 focus:border-gray-400"
                    }`}
                  />
                ))}
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

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
