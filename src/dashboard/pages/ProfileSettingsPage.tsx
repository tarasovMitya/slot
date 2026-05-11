import { useState } from "react";
import { useForm } from "react-hook-form";
import { Check, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardStore } from "../store/dashboardStore";
import { useAuthStore } from "../../store/authStore";
import type { UserProfile } from "../types";

export function ProfileSettingsPage() {
  const { profile, updateProfile } = useDashboardStore();
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const displayName = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email?.split("@")[0]
    ?? profile.name
    ?? "Пользователь";
  const email = user?.email ?? profile.email ?? "";
  const initials = displayName.slice(0, 2).toUpperCase();

  const { register, handleSubmit } = useForm<UserProfile>({
    defaultValues: profile,
  });

  const onSubmit = (data: UserProfile) => {
    updateProfile(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-8">Профиль</h1>

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
        {/* Fields */}
        <div className="rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Личные данные
          </p>
          <Field label="Имя">
            <input
              {...register("name")}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm outline-none focus:border-black transition-colors"
            />
          </Field>
          <Field label="Телефон">
            <input
              {...register("phone")}
              type="tel"
              className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm outline-none focus:border-black transition-colors"
            />
          </Field>
          <Field label="Email">
            <input
              {...register("email")}
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm outline-none focus:border-black transition-colors"
            />
          </Field>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Уведомления
          </p>
          <Toggle label="Email-уведомления" field="notifyEmail" register={register} />
          <Toggle label="SMS-уведомления" field="notifySms" register={register} />
          <Toggle label="Push-уведомления" field="notifyPush" register={register} />
        </div>

        <button
          type="submit"
          className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            saved
              ? "bg-green-600 text-white"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          {saved ? (
            <>
              <Check size={16} />
              Сохранено
            </>
          ) : (
            "Сохранить изменения"
          )}
        </button>
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

function Toggle({
  label,
  field,
  register,
}: {
  label: string;
  field: "notifyEmail" | "notifySms" | "notifyPush";
  register: ReturnType<typeof useForm<UserProfile>>["register"];
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <input type="checkbox" {...register(field)} className="sr-only peer" />
      <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-black transition-colors relative after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5" />
    </label>
  );
}
