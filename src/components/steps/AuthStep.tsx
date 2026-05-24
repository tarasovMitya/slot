import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { MapPin, Plus, Navigation, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCalculatorStore } from "../../store/calculatorStore";
import { useAuthStore } from "../../store/authStore";
import { useDashboardStore } from "../../dashboard/store/dashboardStore";
import { AddressSuggest } from "../ui/AddressSuggest";
import { signInWithTelegram, loadTelegramWidget, type TelegramUser } from "../../hooks/useTelegramAuth";

type SubStep = "email" | "otp" | "profile";

function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, "");
  const local =
    digits.startsWith("7") || digits.startsWith("8")
      ? digits.slice(1)
      : digits;
  const d = local.slice(0, 10);
  if (d.length === 0) return "+7";
  if (d.length <= 3) return `+7 (${d}`;
  if (d.length <= 6) return `+7 (${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length <= 8)
    return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
}

export function AuthStep() {
  const [subStep, setSubStep] = useState<SubStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [phone, setPhone] = useState("+7");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [tgLoading, setTgLoading] = useState(false);
  const [tgError, setTgError] = useState("");
  const tgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  // Load Telegram widget on email substep
  useEffect(() => {
    if (subStep !== "email" || !tgContainerRef.current) return;
    const script = loadTelegramWidget("slot_home_bot", async (tgUser: TelegramUser) => {
      setTgLoading(true);
      setTgError("");
      try {
        await signInWithTelegram(tgUser);
        // isAuthenticated effect will detect the session and transition to profile
      } catch (e) {
        setTgError(e instanceof Error ? e.message : "Ошибка входа через Telegram");
        setTgLoading(false);
      }
    });
    tgContainerRef.current.appendChild(script);
  }, [subStep]);

  const startCooldown = (seconds = 60) => {
    setCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const { setContacts, goNext } = useCalculatorStore();
  const { user, isAuthenticated } = useAuthStore();
  const { updateProfile, addresses, addAddress } = useDashboardStore();

  // Address selection: saved address id | "new" | null
  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new" | null>(
    defaultAddr ? defaultAddr.id : addresses.length === 0 ? "new" : null
  );
  const [newAddressValue, setNewAddressValue] = useState("");
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [locating, setLocating] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru`,
            { headers: { "Accept-Language": "ru" } }
          );
          const data = await res.json();
          const addr = data.address ?? {};
          const city = addr.city || addr.town || addr.village || "";
          const street = addr.road || "";
          const house = addr.house_number || "";
          const streetPart = house ? `${street}, ${house}` : street;
          setNewAddressValue(city ? `${streetPart}, ${city}` : streetPart);
          setAddressError("");
        } catch {
          // leave field as-is if reverse geocode fails
        }
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
      const meta = user.user_metadata as Record<string, string> | undefined;
      if (meta?.phone) setPhone(meta.phone);
      setSubStep("profile");
    }
  }, [isAuthenticated, user]);

  const emailForm = useForm<{ email: string }>();
  const profileForm = useForm<{ name: string; comment?: string }>();

  useEffect(() => {
    if (subStep === "profile" && user?.user_metadata) {
      const meta = user.user_metadata as Record<string, string>;
      profileForm.reset({
        name: meta.full_name ?? meta.name ?? "",
        comment: "",
      });
      if (meta.phone) setPhone(meta.phone);
      if (meta.address) setNewAddressValue(meta.address);
    }
  }, [subStep, user, profileForm]);

  const sendOtp = async (e: string) => {
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: e,
      options: { shouldCreateUser: true },
    });
    if (err) {
      console.error("[auth] OTP error:", err.status, err.message);
      const msg = err.message.toLowerCase();
      const isRateLimit = err.status === 429 || msg.includes("rate limit") ||
        msg.includes("security purposes") || msg.includes("email rate") ||
        msg.includes("over_email") || msg.includes("too many");
      setError(isRateLimit
        ? "Слишком много попыток. Подождите 1 час и повторите."
        : err.status === 422
        ? "Неверный формат email."
        : `Ошибка: ${err.message}`);
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
    } else {
      setSubStep("profile");
    }
    setLoading(false);
  };

  const handleProfile = profileForm.handleSubmit(async ({ name, comment }) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 11) {
      setPhoneError("Введите корректный номер телефона");
      return;
    }

    const resolvedAddress =
      selectedAddressId === "new"
        ? newAddressValue.trim()
        : addresses.find((a) => a.id === selectedAddressId)
            ? `${addresses.find((a) => a.id === selectedAddressId)!.street}, ${addresses.find((a) => a.id === selectedAddressId)!.city}`
            : "";

    if (!resolvedAddress) {
      setAddressError("Введите или выберите адрес");
      return;
    }


    setLoading(true);

    if (selectedAddressId === "new" && saveNewAddress && newAddressValue.trim()) {
      addAddress({ label: "Новый адрес", street: newAddressValue.trim(), city: "Москва", isDefault: addresses.length === 0 });
    }

    const resolvedEmail = email || user?.email || "";
    setContacts({ name, email: resolvedEmail, phone, address: resolvedAddress, comment: comment ?? "" });

    updateProfile({ name, email: resolvedEmail, phone, address: resolvedAddress });

    await supabase.auth.updateUser({
      data: { full_name: name, phone, address: resolvedAddress },
    });

    setLoading(false);
    goNext();
  });

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(applyPhoneMask(e.target.value));
    setPhoneError("");
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
                Войти
              </h2>
              <p className="text-gray-500 mt-2 text-lg">
                Выберите способ входа
              </p>
            </div>

            {/* Telegram widget */}
            <div className="flex flex-col items-center gap-2">
              <div ref={tgContainerRef} className="flex justify-center" />
              {tgLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                  Входим через Telegram...
                </div>
              )}
              {tgError && <p className="text-red-500 text-sm text-center">{tgError}</p>}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">или email</span>
              <div className="flex-1 h-px bg-gray-100" />
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
                disabled={loading || cooldown > 0}
                className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-lg disabled:opacity-50 transition-all hover:bg-gray-800 active:scale-95"
              >
                {loading ? "Отправляем..." : cooldown > 0 ? `Повторить через ${cooldown} с` : "Получить код"}
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

            <form onSubmit={handleProfile} className="flex flex-col gap-4">
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
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (999) 999-99-99"
                  inputMode="numeric"
                  className={`w-full px-5 py-4 rounded-2xl border-2 text-lg outline-none transition-colors ${
                    phoneError ? "border-red-400" : "border-gray-100 focus:border-black"
                  }`}
                />
                {phoneError && (
                  <p className="text-red-500 text-sm mt-1 ml-1">{phoneError}</p>
                )}
              </div>

              {/* Address selector */}
              <div className="flex flex-col gap-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => { setSelectedAddressId(a.id); setAddressError(""); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-colors ${
                      selectedAddressId === a.id ? "border-black bg-gray-50" : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <MapPin size={16} className={selectedAddressId === a.id ? "text-black" : "text-gray-400"} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.street}</p>
                      <p className="text-xs text-gray-400">{a.city}</p>
                    </div>
                    {a.isDefault && (
                      <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                        Основной
                      </span>
                    )}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => { setSelectedAddressId("new"); setAddressError(""); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-colors ${
                    selectedAddressId === "new" ? "border-black bg-gray-50" : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <Plus size={16} className={selectedAddressId === "new" ? "text-black" : "text-gray-400"} />
                  <span className={`text-sm font-medium ${selectedAddressId === "new" ? "text-gray-900" : "text-gray-500"}`}>
                    Новый адрес
                  </span>
                </button>

                {selectedAddressId === "new" && (
                  <div className="flex flex-col gap-2 pl-1">
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={locating}
                      className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50 transition-all"
                    >
                      {locating ? (
                        <Loader2 size={15} className="text-gray-400 animate-spin" />
                      ) : (
                        <Navigation size={15} className="text-gray-400" />
                      )}
                      {locating ? "Определяем местоположение..." : "Использовать текущую геопозицию"}
                    </button>
                    <AddressSuggest
                      value={newAddressValue}
                      onChange={(val) => {
                        setNewAddressValue(val);
                        if (val) setAddressError("");
                      }}
                      error={!!addressError}
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer px-1">
                      <input
                        type="checkbox"
                        checked={saveNewAddress}
                        onChange={(e) => setSaveNewAddress(e.target.checked)}
                        className="w-4 h-4 rounded accent-black"
                      />
                      Сохранить в профиль
                    </label>
                  </div>
                )}

                {addressError && <p className="text-red-500 text-sm ml-1">{addressError}</p>}
              </div>

              <textarea
                {...profileForm.register("comment")}
                placeholder="Комментарий (необязательно)"
                rows={3}
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-black text-lg outline-none transition-colors resize-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-lg disabled:opacity-50 hover:bg-gray-800 active:scale-95 transition-all"
              >
                {loading ? "Сохраняем..." : "Далее"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
