import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Check, LogOut, Pencil, X, MapPin, Plus, Trash2, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardStore } from "../store/dashboardStore";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import type { UserProfile } from "../types";

type ProfileFormData = Pick<UserProfile, "name" | "phone" | "email" | "address">;

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

export function ProfileSettingsPage() {
  const { profile, updateProfile } = useDashboardStore();
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [phone, setPhone] = useState("");

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
      setPhone(synced.phone);
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
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <Check size={15} />
            Сохранено
          </span>
        )}
      </div>

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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-black transition-colors"
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-black transition-colors"
              />
            ) : (
              <p className="text-sm text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">
                {profile.name || <span className="text-gray-400">Не указано</span>}
              </p>
            )}
          </Field>

          <Field label="Телефон">
            {isEditing ? (
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+7 (999) 999-99-99"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-black transition-colors"
              />
            ) : (
              <p className="text-sm text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">
                {profile.phone || <span className="text-gray-400">Не указано</span>}
              </p>
            )}
          </Field>

          <Field label="Email">
            <p className="text-sm text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">
              {email || <span className="text-gray-400">Не указано</span>}
            </p>
          </Field>

          <Field label="Адрес">
            {isEditing ? (
              <input
                {...register("address")}
                placeholder="Улица, дом, квартира"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-black transition-colors"
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

        {/* Notifications */}
        <div className="rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Уведомления
          </p>
          <Toggle label="Email-уведомления" field="notifyEmail" />
          <Toggle label="SMS-уведомления" field="notifySms" />
          <Toggle label="Push-уведомления" field="notifyPush" />
        </div>

        {isEditing && (
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Сохраняем...
              </>
            ) : (
              "Сохранить изменения"
            )}
          </button>
        )}
      </form>
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
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-black transition-colors"
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
          <div
            key={a.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
              a.isDefault ? "border-black bg-gray-50" : "border-gray-100"
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
                onClick={() => deleteAddress(a.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
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
          <input
            placeholder="Улица, дом, квартира"
            value={form.street}
            onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-100 text-sm outline-none focus:border-gray-300 transition-colors"
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
              className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-semibold disabled:opacity-40 hover:bg-gray-800 transition-all"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, field }: { label: string; field: "notifyEmail" | "notifySms" | "notifyPush" }) {
  const { profile, updateProfile } = useDashboardStore();
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        type="checkbox"
        checked={profile[field]}
        onChange={(e) => updateProfile({ [field]: e.target.checked })}
        className="sr-only peer"
      />
      <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-black transition-colors relative after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5" />
    </label>
  );
}
