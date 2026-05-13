import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { X, User, Wrench, ArrowLeft, LayoutDashboard } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthModalStore } from "../../store/authModalStore";
import { useAuthStore } from "../../store/authStore";
import { dbSaveProfile, dbLoadPerformerProfile } from "../../lib/db";

const stepAnim = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -18 },
  transition: { duration: 0.18 },
} as const;

export function AuthModal() {
  const {
    isOpen, mode, role, step,
    pendingName, pendingPhone,
    close, setRole, setStep, setPending, reset, open,
  } = useAuthModalStore();
  const { isAuthenticated, user } = useAuthStore();
  const isPerformer = user?.user_metadata?.performer_role === true;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const emailForm = useForm<{ email: string }>();
  const registerForm = useForm<{ name: string; phone: string; email: string }>();

  // Reset local state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setOtp(["", "", "", "", "", ""]);
      setLoading(false);
      setError("");
      setCooldown(0);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      emailForm.reset();
      registerForm.reset();
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [close]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const startCooldown = (secs = 60) => {
    setCooldown(secs);
    cooldownRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const doSendOtp = async (emailVal: string, shouldCreateUser: boolean): Promise<boolean> => {
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: emailVal,
      options: { shouldCreateUser },
    });
    setLoading(false);
    if (err) {
      const msg = err.message.toLowerCase();
      setError(
        msg.includes("rate limit") || msg.includes("security purposes") || err.status === 429
          ? "Слишком много попыток. Подождите и повторите."
          : "Ошибка отправки кода. Проверьте email."
      );
      return false;
    }
    setEmail(emailVal);
    startCooldown(60);
    return true;
  };

  const advance = (nextStep: typeof step) => {
    setStep(nextStep);
  };

  const goBack = () => {
    setError("");
    if (step === "email" || step === "register_form") setStep("role");
    if (step === "otp") setStep(mode === "register" && role === "client" ? "register_form" : "email");
  };

  const handleRoleSelect = (selectedRole: "client" | "performer") => {
    setRole(selectedRole);
    if (mode === "register" && selectedRole === "performer") {
      reset();
      navigate("/performer/onboarding");
      return;
    }
    if (mode === "register" && selectedRole === "client") {
      advance("register_form");
      return;
    }
    advance("email");
  };

  const handleSendLoginOtp = emailForm.handleSubmit(async ({ email: e }) => {
    const ok = await doSendOtp(e, false);
    if (ok) advance("otp");
  });

  const handleSendRegisterOtp = registerForm.handleSubmit(async ({ name, phone, email: e }) => {
    setPending({ name, phone, email: e });
    const ok = await doSendOtp(e, true);
    if (ok) advance("otp");
  });

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Введите 6-значный код"); return; }
    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (err) {
      setError("Неверный код. Попробуйте ещё раз.");
      setLoading(false);
      return;
    }

    if (role === "performer") {
      await supabase.auth.updateUser({ data: { performer_role: true } });
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      if (freshUser?.user_metadata?.performer_onboarded) {
        reset(); navigate("/performer"); return;
      }
      const existing = await dbLoadPerformerProfile(freshUser?.id ?? "");
      if (existing?.name) {
        await supabase.auth.updateUser({ data: { performer_role: true, performer_onboarded: true } });
        reset(); navigate("/performer"); return;
      }
      reset(); navigate("/performer/onboarding"); return;
    }

    // Client
    if (mode === "register" && pendingName) {
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      if (freshUser) {
        await dbSaveProfile(freshUser.id, {
          name: pendingName,
          phone: pendingPhone,
          email: email,
        });
      }
    }

    reset();
    navigate("/dashboard");
  };

  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
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

  const inputCls = (hasError: boolean) =>
    `w-full px-4 py-3.5 rounded-2xl border-2 text-sm outline-none transition-colors ${
      hasError ? "border-red-400" : "border-gray-100 focus:border-gray-900"
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={close}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center px-4 pointer-events-none">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                {step !== "role" ? (
                  <button
                    onClick={goBack}
                    className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
                  >
                    <ArrowLeft size={18} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                      <span className="text-white text-[10px] font-black tracking-tight">SL</span>
                    </div>
                    <span className="font-black text-gray-900 tracking-tight">SLOT</span>
                  </div>
                )}
                <button
                  onClick={close}
                  className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-8 pt-2 overflow-hidden">
                <AnimatePresence mode="wait">
                  {/* ── Cabinet: role entry point (Мой кабинет) ── */}
                  {mode === "cabinet" && (
                    <motion.div key="cabinet" {...stepAnim}>
                      <h2 className="text-2xl font-black text-gray-900 mb-1">Войти в аккаунт</h2>
                      <p className="text-sm text-gray-400 mb-6">Выберите тип аккаунта</p>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {/* Client */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            reset();
                            if (isAuthenticated && !isPerformer) {
                              navigate("/dashboard");
                            } else {
                              navigate("/auth");
                            }
                          }}
                          className="flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-gray-100 hover:border-gray-900 hover:bg-gray-50 transition-all group text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors">
                            <LayoutDashboard size={20} className="text-gray-600 group-hover:text-white transition-colors" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">Я клиент</p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">Управление заказами и статусами</p>
                          </div>
                          <span className="text-xs font-semibold text-gray-900 group-hover:underline">
                            Войти как клиент →
                          </span>
                        </motion.button>

                        {/* Performer */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            reset();
                            if (isAuthenticated && isPerformer) {
                              navigate("/performer");
                            } else {
                              navigate("/performer/auth");
                            }
                          }}
                          className="flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-gray-100 hover:border-gray-900 hover:bg-gray-50 transition-all group text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors">
                            <Wrench size={20} className="text-gray-600 group-hover:text-white transition-colors" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">Я исполнитель</p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">Доступ к заказам и балансу</p>
                          </div>
                          <span className="text-xs font-semibold text-gray-900 group-hover:underline">
                            Войти как исполнитель →
                          </span>
                        </motion.button>
                      </div>

                      <p className="text-center text-sm text-gray-400">
                        Нет аккаунта?{" "}
                        <button
                          onClick={() => open("register")}
                          className="text-gray-900 font-semibold hover:underline"
                        >
                          Зарегистрироваться
                        </button>
                      </p>
                    </motion.div>
                  )}

                  {/* ── Role selection (login / register) ── */}
                  {mode !== "cabinet" && step === "role" && (
                    <motion.div key="role" {...stepAnim}>
                      <h2 className="text-2xl font-black text-gray-900 mb-1">
                        {mode === "login" ? "Войти как" : "Зарегистрироваться как"}
                      </h2>
                      <p className="text-sm text-gray-400 mb-6">Выберите тип аккаунта</p>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {(["client", "performer"] as const).map((r) => (
                          <motion.button
                            key={r}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleRoleSelect(r)}
                            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-100 hover:border-gray-900 hover:bg-gray-50 transition-all group"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors">
                              {r === "client"
                                ? <User size={22} className="text-gray-600 group-hover:text-white transition-colors" />
                                : <Wrench size={22} className="text-gray-600 group-hover:text-white transition-colors" />}
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-gray-900 text-sm">
                                {r === "client" ? "Клиент" : "Исполнитель"}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {r === "client" ? "Заказать услугу" : "Выполнять заказы"}
                              </p>
                            </div>
                          </motion.button>
                        ))}
                      </div>

                      <p className="text-center text-sm text-gray-400">
                        {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
                        <button
                          onClick={() => open(mode === "login" ? "register" : "login")}
                          className="text-gray-900 font-semibold hover:underline"
                        >
                          {mode === "login" ? "Зарегистрироваться" : "Войти"}
                        </button>
                      </p>
                    </motion.div>
                  )}

                  {/* ── Email (login) ── */}
                  {mode !== "cabinet" && step === "email" && (
                    <motion.div key="email" {...stepAnim}>
                      <h2 className="text-2xl font-black text-gray-900 mb-1">
                        {role === "performer" ? "Войти как исполнитель" : "Войти как клиент"}
                      </h2>
                      <p className="text-sm text-gray-400 mb-6">
                        Отправим код подтверждения на ваш email
                      </p>

                      <form onSubmit={handleSendLoginOtp} className="flex flex-col gap-3">
                        <input
                          {...emailForm.register("email", {
                            required: "Введите email",
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Некорректный email" },
                          })}
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          autoFocus
                          className={inputCls(!!emailForm.formState.errors.email)}
                        />
                        {emailForm.formState.errors.email && (
                          <p className="text-red-500 text-xs">{emailForm.formState.errors.email.message}</p>
                        )}
                        {error && <p className="text-red-500 text-xs">{error}</p>}
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3.5 rounded-2xl bg-black text-white font-semibold text-sm disabled:opacity-50 hover:bg-gray-800 transition-all active:scale-95"
                        >
                          {loading ? "Отправляем..." : "Получить код"}
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {/* ── Registration form (client) ── */}
                  {mode !== "cabinet" && step === "register_form" && (
                    <motion.div key="register_form" {...stepAnim}>
                      <h2 className="text-2xl font-black text-gray-900 mb-1">Создать аккаунт</h2>
                      <p className="text-sm text-gray-400 mb-6">Введите данные для регистрации</p>

                      <form onSubmit={handleSendRegisterOtp} className="flex flex-col gap-3">
                        <input
                          {...registerForm.register("name", { required: "Введите имя" })}
                          type="text"
                          placeholder="Имя"
                          autoFocus
                          className={inputCls(!!registerForm.formState.errors.name)}
                        />
                        {registerForm.formState.errors.name && (
                          <p className="text-red-500 text-xs">{registerForm.formState.errors.name.message}</p>
                        )}
                        <input
                          {...registerForm.register("phone", { required: "Введите телефон" })}
                          type="tel"
                          placeholder="Телефон"
                          className={inputCls(!!registerForm.formState.errors.phone)}
                        />
                        {registerForm.formState.errors.phone && (
                          <p className="text-red-500 text-xs">{registerForm.formState.errors.phone.message}</p>
                        )}
                        <input
                          {...registerForm.register("email", {
                            required: "Введите email",
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Некорректный email" },
                          })}
                          type="email"
                          placeholder="Email"
                          className={inputCls(!!registerForm.formState.errors.email)}
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-red-500 text-xs">{registerForm.formState.errors.email.message}</p>
                        )}
                        {error && <p className="text-red-500 text-xs">{error}</p>}
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3.5 rounded-2xl bg-black text-white font-semibold text-sm disabled:opacity-50 hover:bg-gray-800 transition-all active:scale-95"
                        >
                          {loading ? "Отправляем..." : "Продолжить"}
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {/* ── OTP ── */}
                  {mode !== "cabinet" && step === "otp" && (
                    <motion.div key="otp" {...stepAnim}>
                      <h2 className="text-2xl font-black text-gray-900 mb-1">Введите код</h2>
                      <p className="text-sm text-gray-400 mb-6">
                        Отправили на{" "}
                        <span className="font-medium text-gray-700">{email}</span>
                      </p>

                      <div className="flex gap-2 justify-between mb-4" onPaste={handleOtpPaste}>
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
                              digit ? "border-gray-900 bg-gray-50" : "border-gray-100 focus:border-gray-400"
                            }`}
                          />
                        ))}
                      </div>

                      {error && <p className="text-red-500 text-xs mb-3 text-center">{error}</p>}

                      <button
                        onClick={handleVerifyOtp}
                        disabled={loading || otp.join("").length < 6}
                        className="w-full py-3.5 rounded-2xl bg-black text-white font-semibold text-sm disabled:opacity-50 hover:bg-gray-800 transition-all active:scale-95 mb-4"
                      >
                        {loading ? "Проверяем..." : "Войти"}
                      </button>

                      <div className="flex justify-between text-xs text-gray-400">
                        <button
                          onClick={() => { setOtp(["", "", "", "", "", ""]); setError(""); goBack(); }}
                          className="hover:text-gray-600 transition-colors"
                        >
                          Изменить email
                        </button>
                        <button
                          disabled={cooldown > 0}
                          onClick={() => doSendOtp(email, mode === "register")}
                          className="hover:text-gray-600 transition-colors disabled:opacity-40"
                        >
                          {cooldown > 0 ? `Снова через ${cooldown}с` : "Отправить снова"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
