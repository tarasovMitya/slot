import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { supabase } from "../../lib/supabase";
import { useCalculatorStore } from "../../store/calculatorStore";
import { useAuthStore } from "../../store/authStore";

type SubStep = "email" | "otp" | "profile";

export function AuthStep() {
  const [subStep, setSubStep] = useState<SubStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { setContacts, goNext } = useCalculatorStore();
  const { user, isAuthenticated } = useAuthStore();

  // Already has a session — skip OTP, pre-fill email and jump to profile sub-step
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
      setSubStep("profile");
    }
  }, [isAuthenticated, user]);

  const emailForm = useForm<{ email: string }>();
  const profileForm = useForm<{ name: string; address: string; comment?: string }>();

  // Step 1 — отправить OTP на email
  const handleSendOtp = emailForm.handleSubmit(async ({ email: e }) => {
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: e,
      options: { shouldCreateUser: true },
    });
    if (err) {
      setError(err.message);
    } else {
      setEmail(e);
      setSubStep("otp");
    }
    setLoading(false);
  });

  // Step 2 — верифицировать код
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
    } else {
      setSubStep("profile");
    }
    setLoading(false);
  };

  // Step 3 — save name and address, then proceed to checkout
  const handleProfile = profileForm.handleSubmit(async ({ name, address, comment }) => {
    setContacts({ name, email: email || user?.email || "", address, comment: comment ?? "" });
    goNext();
  });

  // OTP input helpers
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

  const slideVariants = {
    enter: { x: 30, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -30, opacity: 0 },
  };

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        {/* EMAIL */}
        {subStep === "email" && (
          <motion.div
            key="email"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Ваш email
              </h2>
              <p className="text-gray-500 mt-2 text-lg">
                Отправим код подтверждения
              </p>
            </div>
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
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
                <p className="text-red-500 text-sm -mt-2 ml-1">
                  {emailForm.formState.errors.email.message}
                </p>
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
          </motion.div>
        )}

        {/* OTP */}
        {subStep === "otp" && (
          <motion.div
            key="otp"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Введите код
              </h2>
              <p className="text-gray-500 mt-2 text-lg">
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
              {loading ? "Проверяем..." : "Подтвердить"}
            </button>

            <button
              onClick={() => { setSubStep("email"); setOtp(["","","","","",""]); setError(""); }}
              className="text-sm text-gray-400 hover:text-gray-600 text-center transition-colors"
            >
              Изменить email
            </button>
          </motion.div>
        )}

        {/* PROFILE */}
        {subStep === "profile" && (
          <motion.div
            key="profile"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Почти готово
              </h2>
              <p className="text-gray-500 mt-2 text-lg">Осталось заполнить контакты</p>
            </div>

            <form id="profile-form" onSubmit={handleProfile} className="flex flex-col gap-4">
              <div>
                <input
                  {...profileForm.register("name", { required: "Введите имя" })}
                  placeholder="Ваше имя"
                  className={`w-full px-5 py-4 rounded-2xl border-2 text-lg outline-none transition-colors ${
                    profileForm.formState.errors.name
                      ? "border-red-400"
                      : "border-gray-100 focus:border-black"
                  }`}
                />
                {profileForm.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1 ml-1">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <input
                  {...profileForm.register("address", { required: "Введите адрес" })}
                  placeholder="Адрес (улица, дом, квартира)"
                  className={`w-full px-5 py-4 rounded-2xl border-2 text-lg outline-none transition-colors ${
                    profileForm.formState.errors.address
                      ? "border-red-400"
                      : "border-gray-100 focus:border-black"
                  }`}
                />
                {profileForm.formState.errors.address && (
                  <p className="text-red-500 text-sm mt-1 ml-1">
                    {profileForm.formState.errors.address.message}
                  </p>
                )}
              </div>
              <textarea
                {...profileForm.register("comment")}
                placeholder="Комментарий (необязательно)"
                rows={3}
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-black text-lg outline-none transition-colors resize-none"
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
