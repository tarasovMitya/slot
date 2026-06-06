import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { Check, LogOut, Pencil, X, MapPin, Plus, Trash2, Star, BellOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardStore } from "../store/dashboardStore";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { AddressSuggest } from "../../components/ui/AddressSuggest";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { dbGetNotificationPrefs, dbUpdateNotificationPrefs } from "../../lib/pushDb";
import { TelegramLoginButton } from "../../components/auth/TelegramLoginButton";
import type { UserProfile } from "../types";

type ProfileFormData = Pick<UserProfile, "name" | "phone" | "email" | "address">;

function applyPhoneMask(value: string): string {
  const raw = value.replace(/\D/g, "");
  let local = raw;
  while (local.length > 10 && (local.startsWith("7") || local.startsWith("8"))) {
    local = local.slice(1);
  }
  const d = local.slice(0, 10);
  if (d.length === 0) return "+7";
  if (d.length <= 3) return `+7 (${d}`;
  if (d.length <= 6) return `+7 (${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length <= 8) return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
}

export function ProfileSettingsPage() {
  const { profile, updateProfile } = useDashboardStore();
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [phone, setPhone] = useState("");

  const isPhoneValid = (p: string) => {
    const digits = p.replace(/\D/g, "");
    return digits.length === 0 || digits.length === 11;
  };

  const meta = user?.user_metadata as Record<string, string> | undefined;
  const displayName =
    (meta?.full_name ?? meta?.name ?? profile.name) || "Пользователь";
  const email = user?.email ?? profile.email ?? "";
  const initials = displayName.slice(0, 2).toUpperCase();

  const { register, handleSubmit, reset, setValue } = useForm<ProfileFormData>({
    defaultValues: {
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
    },
  });

  // Sync from Supabase user_metadata on mount
  useEffect(() => {
    if (user) {
      const m = user.user_metadata as Record<string, string>;
      const synced: ProfileFormData = {
        name: m?.full_name ?? m?.name ?? profile.name ?? "",
        phone: m?.phone ?? profile.phone ?? "",
        email: user.email ?? profile.email ?? "",
        address: m?.address ?? profile.address ?? "",
      };
      reset(synced);
      setPhone(synced.phone ? applyPhoneMask(synced.phone) : "");
      updateProfile(synced);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyPhoneMask(e.target.value);
    setPhone(masked);
    setValue("phone", masked);
  };

  const onSubmit = async (data: ProfileFormData) => {
    data.phone = phone;
    setSaving(true);
    updateProfile(data);

    await supabase.auth.updateUser({
      data: { full_name: data.name, phone: data.phone, address: data.address },
    });

    setSaving(false);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    reset({
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
    });
    setPhone(profile.phone);
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Профиль</h1>
      </div>

      {/* Save toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl"
          >
            <Check size={15} className="text-green-400" />
            Данные сохранены
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-semibold text-gray-600">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900">{displayName}</p>
          <p className="text-sm text-gray-400 truncate">{email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-all"
        >
          <LogOut size={15} />
          Выйти
        </button>
      </div>

      <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Personal data */}
        <div className="rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Личные данные
            </p>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#006AFF] transition-colors"
              >
                <Pencil size={13} />
                Редактировать
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={13} />
                Отмена
              </button>
            )}
          </div>

          <Field label="Имя">
            {isEditing ? (
              <input
                {...register("name")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#006AFF] transition-colors"
              />
            ) : (
              <p className="text-sm text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">
                {profile.name || <span className="text-gray-400">Не указано</span>}
              </p>
            )}
          </Field>

          <Field label="Телефон">
            {isEditing ? (
              <div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (999) 999-99-99"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors ${
                    phone && !isPhoneValid(phone) ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-[#006AFF]"
                  }`}
                />
                {phone && !isPhoneValid(phone) && (
                  <p className="text-xs text-red-500 mt-1">Введите полный номер: +7 (xxx) xxx-xx-xx</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">
                {profile.phone || <span className="text-gray-400">Не указано</span>}
              </p>
            )}
          </Field>

          <Field label="Эл. почта">
            <p className="text-sm text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">
              {email || <span className="text-gray-400">Не указано</span>}
            </p>
          </Field>

          <Field label="Адрес">
            {isEditing ? (
              <input
                {...register("address")}
                placeholder="Улица, дом, квартира"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#006AFF] transition-colors"
              />
            ) : (
              <p className="text-sm text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">
                {profile.address || <span className="text-gray-400">Не указано</span>}
              </p>
            )}
          </Field>
        </div>

        {/* Addresses */}
        <AddressesSection />

        {/* Telegram link */}
        <TelegramLinkSection user={user} />

        {/* Notifications */}
        <NotificationSettings userId={user?.id ?? null} />

      </form>

      {/* Sticky save bar */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 flex gap-2"
          >
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-all"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="profile-form"
              disabled={saving || !isPhoneValid(phone)}
              className="flex-1 py-3 rounded-xl bg-[#006AFF] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#004CB8] active:scale-95 disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Сохраняем...
                </>
              ) : (
                "Сохранить"
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TelegramLinkSection({ user }: { user: { user_metadata?: Record<string, unknown>; id?: string } | null }) {
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const linkedId = meta?.telegram_id as number | undefined;
  const linkedName = (meta?.telegram_name as string) ?? (meta?.first_name as string) ?? null;
  const linkedUsername = meta?.telegram_username as string | undefined;

  const [success, setSuccess] = useState(false);

  const handleLink = useCallback(async () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }, []);

  const handleUnlink = async () => {
    await supabase.auth.updateUser({
      data: { telegram_id: null, telegram_username: null, telegram_name: null },
    });
    await supabase.auth.refreshSession();
  };

  return (
    <div className="rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Аккаунты</p>

      {linkedId ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#229ED9]/10 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#229ED9">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {linkedName ?? `ID ${linkedId}`}
              </p>
              {linkedUsername && (
                <p className="text-xs text-gray-400">@{linkedUsername}</p>
              )}
            </div>
          </div>
          {success ? (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <Check size={13} /> Сохранено
            </span>
          ) : (
            <button
              onClick={handleUnlink}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
            >
              Отвязать
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">
            Привяжите Telegram, чтобы входить без email и видеть все заказы в одном месте.
          </p>
          <TelegramLoginButton onSuccess={handleLink} linkMode />
          {success && (
            <p className="text-xs text-green-600 text-center font-medium">Telegram привязан!</p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function AddressesSection() {
  const { addresses, addAddress, deleteAddress, setDefaultAddress } = useDashboardStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "", street: "", city: "Москва" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!form.street.trim()) return;
    addAddress({ label: form.label || "Адрес", street: form.street.trim(), city: form.city || "Москва", isDefault: addresses.length === 0 });
    setForm({ label: "", street: "", city: "Москва" });
    setShowForm(false);
  };

  return (
    <div className="rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Адреса</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#006AFF] transition-colors"
        >
          <Plus size={13} />
          Добавить
        </button>
      </div>

      {addresses.length === 0 && !showForm && (
        <p className="text-sm text-gray-400">Нет сохранённых адресов</p>
      )}

      <div className="flex flex-col gap-2">
        {addresses.map((a) => (
          <div key={a.id}>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                a.isDefault ? "border-[#006AFF] bg-gray-50" : "border-gray-100"
              }`}
            >
              <MapPin size={15} className="text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{a.street}</p>
                <p className="text-xs text-gray-400">{a.city}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!a.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefaultAddress(a.id)}
                    title="Сделать основным"
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Star size={13} />
                  </button>
                )}
                {a.isDefault && (
                  <span className="text-[10px] font-semibold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full mr-1">
                    Основной
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(a.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {deleteConfirmId === a.id && (
              <div className="mt-1 flex items-center justify-between gap-2 bg-red-50 rounded-xl px-4 py-2.5 text-sm">
                <span className="text-red-700 font-medium">Удалить этот адрес?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-3 py-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-gray-400 transition-colors"
                  >
                    Нет
                  </button>
                  <button
                    type="button"
                    onClick={() => { deleteAddress(a.id); setDeleteConfirmId(null); }}
                    className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="border border-dashed border-gray-200 rounded-xl p-4 flex flex-col gap-2">
          <input
            placeholder='Название (например "Дом")'
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-100 text-sm outline-none focus:border-gray-300 transition-colors"
          />
          <AddressSuggest
            value={form.street}
            onChange={(val) => {
              setForm((f) => ({ ...f, street: val }));
            }}
            placeholder="Улица, дом, квартира"
            inputClassName="w-full px-3 py-2.5 rounded-xl border border-gray-100 text-sm outline-none focus:border-gray-300 transition-colors pr-10"
          />
          <input
            placeholder="Город"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-100 text-sm outline-none focus:border-gray-300 transition-colors"
          />
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-100 text-sm font-medium text-gray-500 hover:border-gray-300 transition-all"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!form.street.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#006AFF] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#004CB8] transition-all"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer">
      <div>
        <p className="text-sm text-gray-800 font-medium">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="shrink-0 w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-black transition-colors relative after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5" />
    </label>
  );
}

function NotificationSettings({ userId }: { userId: string | null }) {
  const { isSupported, permission, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const [orderNotifs, setOrderNotifs] = useState(true);
  const [chatNotifs, setChatNotifs] = useState(true);

  useEffect(() => {
    if (!userId) return;
    dbGetNotificationPrefs(userId).then((p) => {
      setOrderNotifs(p.orderNotifications);
      setChatNotifs(p.chatNotifications);
    });
  }, [userId]);

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) await subscribe();
    else await unsubscribe();
  };

  const handleOrderToggle = async (v: boolean) => {
    setOrderNotifs(v);
    if (userId) await dbUpdateNotificationPrefs(userId, { orderNotifications: v });
  };

  const handleChatToggle = async (v: boolean) => {
    setChatNotifs(v);
    if (userId) await dbUpdateNotificationPrefs(userId, { chatNotifications: v });
  };

  return (
    <div className="rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Уведомления</p>

      {isSupported ? (
        <div className="flex flex-col gap-1">
          <ToggleRow
            label="Push-уведомления"
            description={
              permission === "denied"
                ? "Доступ запрещён в настройках браузера"
                : isSubscribed
                  ? "Уведомления включены"
                  : "Получайте уведомления даже когда приложение закрыто"
            }
            checked={isSubscribed}
            onChange={handlePushToggle}
          />
          {permission === "denied" && (
            <p className="text-xs text-red-500 mt-1">
              Доступ запрещён. Чтобы включить: в адресной строке браузера нажмите на иконку замка → Уведомления → Разрешить
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <BellOff size={15} />
          Push-уведомления не поддерживаются в этом браузере
        </div>
      )}

      <div className="border-t border-gray-50 pt-3 flex flex-col gap-3">
        <ToggleRow
          label="Статусы заказов"
          description="Исполнитель найден, в пути, работа начата"
          checked={orderNotifs}
          onChange={handleOrderToggle}
        />
        <ToggleRow
          label="Сообщения в чате"
          description="Новые сообщения от исполнителя"
          checked={chatNotifs}
          onChange={handleChatToggle}
        />
      </div>
    </div>
  );
}
