import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Phone, Edit3, Check, Plus, Camera, CreditCard, CheckCircle2,
  LogOut, Mail, Lock, Eye, EyeOff, X, Image, Zap, Droplets,
  Hammer, Package, Sparkles, Wrench, FileText,
} from "lucide-react";
import { usePerformerStore } from "../store/performerStore";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { pluralRu } from "../../utils/priceCalculator";
import { AddressSection } from "../components/ui/AddressSection";
import { BankCardItem } from "../components/ui/BankCardItem";

const ALL_SKILLS = ["Электрика", "Сантехника", "Мелкий ремонт", "Сборка мебели", "Уборка", "Муж на час"];
const SKILL_ICONS: Record<string, React.ReactNode> = {
  "Электрика": <Zap size={12} />,
  "Сантехника": <Droplets size={12} />,
  "Мелкий ремонт": <Hammer size={12} />,
  "Сборка мебели": <Package size={12} />,
  "Уборка": <Sparkles size={12} />,
  "Муж на час": <Wrench size={12} />,
};

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
      </div>
    </div>
  );
}

export function PerformerProfilePage() {
  const {
    profile, isHydrated, updateProfile,
    bankCards, removeBankCard, setDefaultCard,
    portfolioPhotos, addPortfolioPhoto, removePortfolioPhoto,
  } = usePerformerStore();
  const { signOut, user } = useAuthStore();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  // Contact editing
  const [editing, setEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm] = useState({ name: profile.name, phone: profile.phone });
  const fileRef = useRef<HTMLInputElement>(null);
  const portfolioRef = useRef<HTMLInputElement>(null);

  // About editing
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutDraft, setAboutDraft] = useState(profile.about || "");

  // Specializations editing
  const [editingSkills, setEditingSkills] = useState(false);
  const [skillsDraft, setSkillsDraft] = useState<string[]>(profile.specializations);

  // Email editing
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // Password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (isHydrated) return;
    const t = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, [isHydrated]);

  useEffect(() => {
    if (!editing) setForm({ name: profile.name, phone: profile.phone });
  }, [profile.name, profile.phone]);

  useEffect(() => {
    if (!editingAbout) setAboutDraft(profile.about || "");
  }, [profile.about]);

  useEffect(() => {
    if (!editingSkills) setSkillsDraft(profile.specializations);
  }, [profile.specializations]);

  if (!isHydrated && !timedOut) return <ProfileSkeleton />;

  const handleSave = () => {
    updateProfile(form);
    setEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateProfile({ avatar: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handlePortfolioAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => addPortfolioPhoto(reader.result as string);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleEmailChange = async () => {
    if (!newEmail || newEmail === user?.email) { setEditingEmail(false); return; }
    setEmailStatus("sending");
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setEmailStatus("error");
    } else {
      setEmailStatus("sent");
      setTimeout(() => { setEmailStatus("idle"); setEditingEmail(false); setNewEmail(""); }, 4000);
    }
  };

  const handlePasswordSave = async () => {
    setPasswordError("");
    if (newPassword.length < 8) { setPasswordError("Минимум 8 символов"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Пароли не совпадают"); return; }
    setPasswordStatus("saving");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordStatus("error");
      setPasswordError("Не удалось сохранить пароль");
    } else {
      setPasswordStatus("saved");
      setTimeout(() => {
        setPasswordStatus("idle");
        setShowPasswordForm(false);
        setNewPassword("");
        setConfirmPassword("");
      }, 2000);
    }
  };

  const handleSaveAbout = () => {
    updateProfile({ about: aboutDraft });
    setEditingAbout(false);
  };

  const handleSaveSkills = () => {
    updateProfile({ specializations: skillsDraft });
    setEditingSkills(false);
  };

  const toggleSkillDraft = (skill: string) => {
    setSkillsDraft((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
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
          <div className="relative w-20 h-20 shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden group cursor-pointer"
            >
              {isImage ? (
                <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-gray-600">
                  {profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("") || "?"}
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera size={18} className="text-white" />
              </div>
            </button>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center shadow-sm pointer-events-none">
              <Camera size={10} className="text-gray-600" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

          <div className="flex-1">
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
            {!isImage && (
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-2 text-xs font-semibold text-[#006AFF] hover:text-[#004CB8] transition-colors"
              >
                + Добавить фото
              </button>
            )}
          </div>
        </div>

        {/* Specialization tags (view) */}
        {!editingSkills && profile.specializations.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.specializations.map((s) => (
              <span key={s} className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                {SKILL_ICONS[s]}
                {s}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* About / Experience */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        className="border border-gray-100 rounded-2xl p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-gray-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">О себе</p>
          </div>
          {editingAbout ? (
            <div className="flex gap-3">
              <button onClick={() => setEditingAbout(false)} className="text-xs text-gray-400 hover:text-gray-600">Отмена</button>
              <button onClick={handleSaveAbout} className="text-xs font-semibold text-[#006AFF]">Сохранить</button>
            </div>
          ) : (
            <button
              onClick={() => setEditingAbout(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Edit3 size={13} />
              Изменить
            </button>
          )}
        </div>

        {editingAbout ? (
          <textarea
            value={aboutDraft}
            onChange={(e) => setAboutDraft(e.target.value)}
            placeholder="Расскажите о своём опыте, образовании, подходе к работе..."
            rows={4}
            className="w-full text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2.5 outline-none border border-gray-200 focus:border-gray-400 transition-colors resize-none"
          />
        ) : profile.about ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.about}</p>
        ) : (
          <button
            onClick={() => setEditingAbout(true)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors text-left"
          >
            Расскажите о своём опыте и подходе к работе — это помогает клиентам выбрать вас
          </button>
        )}
      </motion.div>

      {/* Specializations */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.09 }}
        className="border border-gray-100 rounded-2xl p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Специализации</p>
          {editingSkills ? (
            <div className="flex gap-3">
              <button onClick={() => setEditingSkills(false)} className="text-xs text-gray-400 hover:text-gray-600">Отмена</button>
              <button onClick={handleSaveSkills} className="flex items-center gap-1 text-xs font-semibold text-[#006AFF]">
                <Check size={12} /> Сохранить
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingSkills(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Edit3 size={13} />
              Изменить
            </button>
          )}
        </div>

        {editingSkills ? (
          <div className="flex flex-wrap gap-2">
            {ALL_SKILLS.map((skill) => {
              const active = skillsDraft.includes(skill);
              return (
                <button
                  key={skill}
                  onClick={() => toggleSkillDraft(skill)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {SKILL_ICONS[skill]}
                  {skill}
                </button>
              );
            })}
          </div>
        ) : profile.specializations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.specializations.map((s) => (
              <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                {SKILL_ICONS[s]}
                {s}
              </span>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setEditingSkills(true)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Plus size={14} />
            Добавить специализации
          </button>
        )}
      </motion.div>

      {/* Portfolio */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.11 }}
        className="border border-gray-100 rounded-2xl p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Image size={14} className="text-gray-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Портфолио</p>
          </div>
          <button
            onClick={() => portfolioRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Plus size={13} />
            Добавить
          </button>
        </div>
        <input
          ref={portfolioRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePortfolioAdd}
        />

        {portfolioPhotos.length === 0 ? (
          <button
            onClick={() => portfolioRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-gray-300 transition-colors"
          >
            <Image size={24} className="text-gray-300" />
            <p className="text-sm text-gray-400">Добавьте фото выполненных работ</p>
            <p className="text-xs text-gray-300">Клиенты видят их при выборе исполнителя</p>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {portfolioPhotos.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePortfolioPhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            {portfolioPhotos.length < 12 && (
              <button
                onClick={() => portfolioRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors"
              >
                <Plus size={20} className="text-gray-300" />
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Contacts */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
        className="border border-gray-100 rounded-2xl p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Контакты</p>
          {saveSuccess ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
              <CheckCircle2 size={14} />
              Сохранено
            </span>
          ) : (
            <button
              onClick={() => (editing ? handleSave() : setEditing(true))}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              {editing ? <Check size={14} /> : <Edit3 size={14} />}
              {editing ? "Сохранить" : "Изменить"}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <Field
            icon={<Phone size={14} className="text-gray-400" />}
            label="Телефон"
            value={form.phone}
            editing={editing}
            onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
          />
        </div>
      </motion.div>

      {/* Account */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="border border-gray-100 rounded-2xl p-5 mb-4"
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Аккаунт</p>
        <div className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail size={14} className="text-gray-400 mt-1 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Email</p>
              {editingEmail ? (
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={user?.email || ""}
                  className="w-full text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-2 py-1 mt-0.5 outline-none border border-gray-200 focus:border-gray-400 transition-colors"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{user?.email || "—"}</p>
              )}
              {emailStatus === "sent" && <p className="text-xs text-green-600 mt-1">Подтвердите смену на {newEmail}</p>}
              {emailStatus === "error" && <p className="text-xs text-red-500 mt-1">Не удалось изменить email</p>}
            </div>
            {!editingEmail ? (
              <button
                onClick={() => { setEditingEmail(true); setNewEmail(user?.email || ""); setEmailStatus("idle"); }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mt-0.5 shrink-0"
              >
                Изменить
              </button>
            ) : (
              <div className="flex gap-2 mt-0.5 shrink-0">
                <button onClick={() => { setEditingEmail(false); setEmailStatus("idle"); }} className="text-xs text-gray-400 hover:text-gray-600">Отмена</button>
                <button onClick={handleEmailChange} disabled={emailStatus === "sending"} className="text-xs font-semibold text-[#006AFF] disabled:opacity-50">
                  {emailStatus === "sending" ? "..." : "Сохранить"}
                </button>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="flex items-start gap-3">
            <Lock size={14} className="text-gray-400 mt-1 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-400">Пароль</p>
              {!showPasswordForm ? (
                <button onClick={() => setShowPasswordForm(true)} className="text-sm font-medium text-[#006AFF] mt-0.5 hover:text-[#004CB8] transition-colors">
                  Установить пароль
                </button>
              ) : (
                <div className="flex flex-col gap-2 mt-1.5">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Новый пароль"
                      className="w-full text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-2 py-1.5 outline-none border border-gray-200 focus:border-gray-400 transition-colors pr-8"
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторить пароль"
                    className="w-full text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-2 py-1.5 outline-none border border-gray-200 focus:border-gray-400 transition-colors"
                  />
                  {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                  {passwordStatus === "saved" && <p className="text-xs text-green-600">Пароль сохранён</p>}
                  <div className="flex gap-3 mt-0.5">
                    <button onClick={() => { setShowPasswordForm(false); setNewPassword(""); setConfirmPassword(""); setPasswordError(""); setPasswordStatus("idle"); }} className="text-xs text-gray-400 hover:text-gray-600">Отмена</button>
                    <button onClick={handlePasswordSave} disabled={passwordStatus === "saving"} className="text-xs font-semibold text-[#006AFF] disabled:opacity-50">
                      {passwordStatus === "saving" ? "Сохраняем..." : "Сохранить"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Address */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }} className="mb-4">
        <AddressSection />
      </motion.div>

      {/* Bank cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }} className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Карты для выплат</p>
          <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <Plus size={13} />
            Добавить
          </button>
        </div>
        {bankCards.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50">
            <CreditCard size={18} className="text-gray-300 shrink-0" />
            <p className="text-sm text-gray-400">Добавьте карту для получения выплат</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {bankCards.map((card) => (
              <BankCardItem key={card.id} card={card} onSetDefault={() => setDefaultCard(card.id)} onDelete={() => removeBankCard(card.id)} />
            ))}
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }} className="grid grid-cols-3 gap-3">
        <StatCard label="Рейтинг" value={profile.completedOrders > 0 ? String(profile.rating) : "—"} />
        <StatCard label="Заказов" value={String(profile.completedOrders)} />
        <StatCard label="Специализаций" value={String(profile.specializations.length)} />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.23 }}
        onClick={async () => { await signOut(); navigate("/performer/auth", { replace: true }); }}
        className="lg:hidden mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-100 text-sm font-semibold text-gray-500 hover:border-red-200 hover:text-red-500 transition-all"
      >
        <LogOut size={16} />
        Выйти из аккаунта
      </motion.button>
    </div>
  );
}

function Field({ icon, label, value, editing, onChange }: {
  icon: React.ReactNode; label: string; value: string;
  editing: boolean; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className="flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        {editing ? (
          <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-2 py-1 mt-0.5 outline-none border border-gray-200 focus:border-gray-400 transition-colors" />
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
