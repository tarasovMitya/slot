import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useOnboardingStore } from "./store/onboardingStore";
import { usePerformerStore } from "../store/performerStore";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { OnboardingLayout } from "./components/OnboardingLayout";
import { Step1Basic } from "./steps/Step1Basic";
import { Step2Skills } from "./steps/Step2Skills";
import { Step3Experience } from "./steps/Step3Experience";
import { Step4Location } from "./steps/Step4Location";
import { Step5Radius } from "./steps/Step5Radius";
import { Step6Documents } from "./steps/Step6Documents";
import { Step7Availability } from "./steps/Step7Availability";
import { Step8Summary } from "./steps/Step8Summary";

const slide = {
  enter: { x: 30, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -30, opacity: 0 },
};

export function PerformerOnboarding() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { step, name, phone, avatarUrl, skills, city, address, lat, lng, radius, complete, reset } =
    useOnboardingStore();
  const { updateProfile } = usePerformerStore();

  const [showAuth, setShowAuth] = useState(false);
  const [authStep, setAuthStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  // Already authenticated + onboarded → go to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.user_metadata?.performer_onboarded) {
      navigate("/performer", { replace: true });
    }
  }, [isAuthenticated, user]);

  const startCooldown = (seconds = 60) => {
    setCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const handleComplete = () => {
    setShowAuth(true);
  };

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
      setError(isRateLimit
        ? "Слишком много попыток. Подождите минуту и попробуйте снова."
        : "Не удалось отправить письмо. Проверьте адрес или попробуйте позже.");
    } else {
      setEmail(e);
      setAuthStep("otp");
      startCooldown(60);
    }
    setLoading(false);
  };

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

    updateProfile({
      name: name || "Новый исполнитель",
      phone,
      avatar: avatarUrl,
      address,
      city,
      lat,
      lng,
      workRadius: radius,
      specializations: skills,
    });
    await supabase.auth.updateUser({ data: { performer_role: true, performer_onboarded: true } });
    complete();
    reset();
    navigate("/performer", { replace: true });
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

  if (showAuth) {
    return (
      <OnboardingLayout step={8}>
        <AnimatePresence mode="wait">
          {authStep === "email" && (
            <motion.div
              key="email"
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Почти готово!</h1>
                <p className="text-gray-400 mt-1 text-sm">
                  Введите email — отправим код для входа в кабинет
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inputEmail) sendOtp(inputEmail);
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full px-4 py-3.5 rounded-2xl border-2 text-sm font-medium text-gray-900 bg-white outline-none transition-colors placeholder-gray-300 border-gray-100 focus:border-gray-400"
                  />
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button
                  onClick={() => inputEmail && sendOtp(inputEmail)}
                  disabled={loading || !inputEmail || cooldown > 0}
                  className="w-full py-3.5 rounded-2xl bg-black text-white font-semibold text-sm disabled:opacity-50 transition-all hover:bg-gray-800 active:scale-95"
                >
                  {loading ? "Отправляем..." : "Получить код"}
                </button>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Уже зарегистрированы?{" "}
                  <button
                    onClick={() => navigate("/performer/auth")}
                    className="font-semibold text-gray-800 hover:underline"
                  >
                    Войти в кабинет
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {authStep === "otp" && (
            <motion.div
              key="otp"
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Введите код</h1>
                <p className="text-gray-400 mt-1 text-sm">
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

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.join("").length < 6}
                className="w-full py-3.5 rounded-2xl bg-black text-white font-semibold text-sm disabled:opacity-50 transition-all hover:bg-gray-800 active:scale-95"
              >
                {loading ? "Проверяем..." : "Войти в кабинет"}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setAuthStep("email"); setOtp(["","","","","",""]); setError(""); }}
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
      </OnboardingLayout>
    );
  }

  const stepContent = {
    1: <Step1Basic />,
    2: <Step2Skills />,
    3: <Step3Experience />,
    4: <Step4Location />,
    5: <Step5Radius />,
    6: <Step6Documents />,
    7: <Step7Availability />,
    8: <Step8Summary onComplete={handleComplete} />,
  }[step];

  return (
    <OnboardingLayout step={step}>
      <AnimatePresence mode="wait">
        <div key={step}>
          {stepContent}
        </div>
      </AnimatePresence>
    </OnboardingLayout>
  );
}
