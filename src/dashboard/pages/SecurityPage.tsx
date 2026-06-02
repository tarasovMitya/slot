import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Smartphone, Mail, Key, Laptop, Trash2, X, ChevronRight, LogOut, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

const MOCK_SESSIONS = [
  { id: "current", device: "Текущее устройство", location: "Москва, Россия", lastSeen: "Сейчас", isCurrent: true },
  { id: "s2", device: "MacBook Pro", location: "Москва, Россия", lastSeen: "2 часа назад", isCurrent: false },
  { id: "s3", device: "iPhone 14", location: "Москва, Россия", lastSeen: "Вчера, 20:14", isCurrent: false },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-50 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  label,
  value,
  onClick,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors text-left ${danger ? "text-red-500" : ""}`}
    >
      <Icon size={17} className={danger ? "text-red-400 shrink-0" : "text-gray-400 shrink-0"} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? "text-red-600" : "text-gray-900"}`}>{label}</p>
        {value && <p className="text-xs text-gray-400 mt-0.5">{value}</p>}
      </div>
      <ChevronRight size={16} className="text-gray-300 shrink-0" />
    </button>
  );
}

function ChangeModal({
  title,
  onClose,
  children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl p-6 pb-10"
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-base font-bold text-gray-900">{title}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        {children}
      </motion.div>
    </>
  );
}

export function SecurityPage() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const [modal, setModal] = useState<"phone" | "email" | "password" | "2fa" | "delete" | null>(null);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);

  const email = user?.email ?? "—";
  const phone = (user?.user_metadata?.phone as string | undefined) ?? "Не указан";

  const removeSession = (id: string) => setSessions((prev) => prev.filter((s) => s.id !== id));

  const handleDeleteAccount = async () => {
    if (deleteInput !== "УДАЛИТЬ" || deleting) return;
    setDeleting(true);
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto px-4 pt-6 pb-16"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Shield size={20} className="text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Безопасность</h1>
          <p className="text-xs text-gray-400 mt-0.5">Управление доступом и защита аккаунта</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Account */}
        <Section title="Аккаунт">
          <SettingRow icon={Smartphone} label="Телефон" value={phone} onClick={() => setModal("phone")} />
          <SettingRow icon={Mail} label="Email" value={email} onClick={() => setModal("email")} />
          <SettingRow icon={Key} label="Пароль" value="••••••••" onClick={() => setModal("password")} />
        </Section>

        {/* 2FA */}
        <Section title="Двухфакторная аутентификация">
          <div className="px-5 py-4">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck size={17} className={twoFaEnabled ? "text-emerald-500" : "text-gray-400"} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">2FA по SMS</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {twoFaEnabled ? "Включена — аккаунт защищён" : "Отключена"}
                </p>
              </div>
              <button
                onClick={() => setTwoFaEnabled(!twoFaEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${twoFaEnabled ? "bg-emerald-500" : "bg-gray-200"}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${twoFaEnabled ? "translate-x-5" : ""}`} />
              </button>
            </div>
            {!twoFaEnabled && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-3">
                <ShieldCheck size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Рекомендуем включить 2FA для дополнительной защиты аккаунта</p>
              </div>
            )}
          </div>
        </Section>

        {/* Sessions */}
        <Section title={`Сессии (${sessions.length})`}>
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Laptop size={16} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.device}</p>
                  {s.isCurrent && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">сейчас</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{s.location} · {s.lastSeen}</p>
              </div>
              {!s.isCurrent && (
                <button
                  onClick={() => removeSession(s.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          ))}
          {sessions.filter((s) => !s.isCurrent).length > 0 && (
            <div className="px-5 py-3">
              <button
                onClick={() => setSessions((prev) => prev.filter((s) => s.isCurrent))}
                className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
              >
                Завершить все другие сессии
              </button>
            </div>
          )}
        </Section>

        {/* Danger zone */}
        <Section title="Опасная зона">
          <SettingRow
            icon={Trash2}
            label="Удалить аккаунт"
            value="Необратимое действие"
            onClick={() => setModal("delete")}
            danger
          />
        </Section>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === "phone" && (
          <ChangeModal title="Изменить телефон" onClose={() => setModal(null)}>
            <div className="flex flex-col gap-3">
              <input
                type="tel"
                placeholder="+7 (___) ___-__-__"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
              />
              <p className="text-xs text-gray-400">На новый номер будет отправлен код подтверждения</p>
              <button className="w-full py-3.5 rounded-2xl bg-[#006AFF] text-white text-sm font-semibold">
                Получить код
              </button>
            </div>
          </ChangeModal>
        )}

        {modal === "email" && (
          <ChangeModal title="Изменить email" onClose={() => setModal(null)}>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="новый@email.ru"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
              />
              <p className="text-xs text-gray-400">На новый адрес будет отправлена ссылка для подтверждения</p>
              <button className="w-full py-3.5 rounded-2xl bg-[#006AFF] text-white text-sm font-semibold">
                Сохранить
              </button>
            </div>
          </ChangeModal>
        )}

        {modal === "password" && (
          <ChangeModal title="Изменить пароль" onClose={() => setModal(null)}>
            <div className="flex flex-col gap-3">
              <input type="password" placeholder="Текущий пароль" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
              <input type="password" placeholder="Новый пароль (мин. 8 символов)" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
              <input type="password" placeholder="Повторите новый пароль" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
              <button className="w-full py-3.5 rounded-2xl bg-[#006AFF] text-white text-sm font-semibold">
                Изменить пароль
              </button>
            </div>
          </ChangeModal>
        )}

        {modal === "delete" && (
          <ChangeModal title="Удалить аккаунт" onClose={() => { setModal(null); setDeleteInput(""); }}>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
                <Trash2 size={14} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 leading-snug">
                  <span className="font-semibold">Это необратимо.</span> Все ваши данные, история заказов и информация профиля будут удалены без возможности восстановления.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Введите «УДАЛИТЬ» для подтверждения
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="УДАЛИТЬ"
                  className="w-full rounded-2xl border-2 border-red-200 px-4 py-3 text-sm text-red-700 placeholder-red-200 focus:outline-none focus:border-red-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setModal(null); setDeleteInput(""); }}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "УДАЛИТЬ" || deleting}
                  className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white text-sm font-semibold disabled:opacity-40 transition-all"
                >
                  {deleting ? "Удаление..." : "Удалить"}
                </button>
              </div>
            </div>
          </ChangeModal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
