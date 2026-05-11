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

export function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  const [subStep, setSubStep] = useState<SubStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const emailForm = useForm<{ email: string }>();

  // If already authenticated, go straight to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSendOtp = emailForm.handleSubmit(async ({ email: e }) => {
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: e,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (err) {
      setError(err.message);
    } else {
      setEmail(e);
      setSubStep("otp");
    }
    setLoading(false);
  });

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
    }
    // On success, onAuthStateChange fires → authStore updates → useEffect redirects
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
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
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
                <p className="text-gray-500 mt-2">Отправим код подтверждения на email</p>
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
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-lg disabled:opacity-50 transition-all hover:bg-gray-800 active:scale-95"
                >
                  {loading ? "Отправляем..." : "Получить код"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400">
                Нет аккаунта?{" "}
                <button
                  onClick={() => navigate("/calculator")}
                  className="text-black font-medium hover:underline"
                >
                  Оформить заказ
                </button>
              </p>
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

              <button
                onClick={() => { setSubStep("email"); setOtp(["","","","","",""]); setError(""); }}
                className="text-sm text-gray-400 hover:text-gray-600 text-center transition-colors"
              >
                Изменить email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
