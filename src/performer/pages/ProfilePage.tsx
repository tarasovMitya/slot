import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, MessageCircle, Edit3, Check, Plus, Camera, CreditCard } from "lucide-react";
import { usePerformerStore } from "../store/performerStore";
import { pluralRu } from "../../utils/priceCalculator";
import { AddressSection } from "../components/ui/AddressSection";
import { BankCardItem } from "../components/ui/BankCardItem";

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-10 animate-pulse">
      <div className="h-8 w-28 bg-gray-100 rounded-xl mb-6" />
      <div className="border border-gray-100 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gray-100 shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-40 bg-gray-100 rounded-lg" />
            <div className="h-4 w-28 bg-gray-100 rounded-lg" />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <div className="h-6 w-20 bg-gray-100 rounded-full" />
          <div className="h-6 w-24 bg-gray-100 rounded-full" />
          <div className="h-6 w-16 bg-gray-100 rounded-full" />
        </div>
      </div>
      <div className="border border-gray-100 rounded-2xl p-5 mb-4 flex flex-col gap-5">
        <div className="h-4 w-20 bg-gray-100 rounded-lg" />
        <div className="h-4 w-36 bg-gray-100 rounded-lg" />
        <div className="h-4 w-32 bg-gray-100 rounded-lg" />
      </div>
      <div className="border border-gray-100 rounded-2xl p-5 mb-4 flex flex-col gap-4">
        <div className="h-4 w-32 bg-gray-100 rounded-lg" />
        <div className="h-4 w-44 bg-gray-100 rounded-lg" />
        <div className="h-4 w-24 bg-gray-100 rounded-lg" />
        <div className="flex gap-2 mt-1">
          {[5, 10, 15, 20, 30].map((r) => (
            <div key={r} className="h-8 w-14 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center gap-2">
            <div className="h-6 w-8 bg-gray-100 rounded-lg" />
            <div className="h-3 w-16 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PerformerProfilePage() {
  const { profile, isHydrated, updateProfile, bankCards, removeBankCard, setDefaultCard } = usePerformerStore();

  if (!isHydrated) return <ProfileSkeleton />;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile.name,
    phone: profile.phone,
    telegram: profile.telegram,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setForm({ name: profile.name, phone: profile.phone, telegram: profile.telegram });
    }
  }, [profile.name, profile.phone, profile.telegram]);

  const handleSave = () => {
    updateProfile(form);
    setEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateProfile({ avatar: reader.result as string });
    reader.readAsDataURL(file);
  };

  const isImage = profile.avatar.startsWith("data:") || profile.avatar.startsWith("http");

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Профиль</h1>
      </motion.div>

      {/* Avatar + stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="border border-gray-100 rounded-2xl p-6 mb-4"
      >
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden group shrink-0 cursor-pointer"
          >
            {isImage ? (
              <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-gray-600">
                {profile.avatar || profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("") || "?"}
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={18} className="text-white" />
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.name || "Новый исполнитель"}</h2>
            {profile.completedOrders > 0 ? (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-amber-400">★</span>
                <span className="text-sm font-semibold text-gray-800">{profile.rating}</span>
                <span className="text-sm text-gray-400">· {profile.completedOrders} {pluralRu(profile.completedOrders, "заказ", "заказа", "заказов")}</span>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Пока нет выполненных заказов</p>
            )}
          </div>
        </div>

        {profile.specializations.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.specializations.map((s) => (
              <span
                key={s}
                className="px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-700"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Contact info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="border border-gray-100 rounded-2xl p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Контакты</p>
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            {editing ? <Check size={14} /> : <Edit3 size={14} />}
            {editing ? "Сохранить" : "Изменить"}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Field
            icon={<Phone size={14} className="text-gray-400" />}
            label="Телефон"
            value={form.phone}
            editing={editing}
            onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
          />
          <Field
            icon={<MessageCircle size={14} className="text-gray-400" />}
            label="Telegram"
            value={form.telegram}
            editing={editing}
            onChange={(v) => setForm((p) => ({ ...p, telegram: v }))}
          />
        </div>
      </motion.div>

      {/* Address + work radius */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.11 }}
        className="mb-4"
      >
        <AddressSection />
      </motion.div>

      {/* Bank cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Карты для выплат</p>
          {bankCards.length > 0 && (
            <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              <Plus size={13} />
              Добавить
            </button>
          )}
        </div>
        {bankCards.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50">
            <CreditCard size={18} className="text-gray-300 shrink-0" />
            <p className="text-sm text-gray-400">Карты появятся после выполнения первого заказа</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {bankCards.map((card) => (
              <BankCardItem
                key={card.id}
                card={card}
                onSetDefault={() => setDefaultCard(card.id)}
                onDelete={() => removeBankCard(card.id)}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Stats block */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.17 }}
        className="grid grid-cols-3 gap-3"
      >
        <StatCard label="Рейтинг" value={profile.completedOrders > 0 ? String(profile.rating) : "—"} />
        <StatCard label="Заказов" value={String(profile.completedOrders)} />
        <StatCard label="Специализаций" value={String(profile.specializations.length)} />
      </motion.div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  editing,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className="flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        {editing ? (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-2 py-1 mt-0.5 outline-none border border-gray-200 focus:border-gray-400 transition-colors"
          />
        ) : (
          <p className="text-sm font-medium text-gray-900 mt-0.5">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 text-center">
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
