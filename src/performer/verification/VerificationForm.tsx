import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, Upload, X, Camera, FileText, Briefcase, CreditCard, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { usePerformerStore } from "../store/performerStore";
import { trackEvent } from "../../lib/analytics";
import { sanitizeField, sanitizeText } from "../../lib/sanitize";

const SPECIALIZATIONS = [
  "Уборка квартир", "Уборка офисов", "Химчистка мебели",
  "Мытьё окон", "Уборка после ремонта", "Уборка загородных домов",
];

interface FormState {
  firstName: string; lastName: string; birthDate: string;
  phone: string; telegram: string; city: string;
  passportFile: File | null; selfieFile: File | null;
  specializations: string[]; experienceYears: string;
  experienceDescription: string; hasTools: boolean; worksWithTeam: boolean;
  paymentName: string; paymentCard: string; paymentBank: string;
  agreeRules: boolean; agreeData: boolean; agreeAccuracy: boolean;
}

const EMPTY: FormState = {
  firstName: "", lastName: "", birthDate: "", phone: "", telegram: "", city: "",
  passportFile: null, selfieFile: null,
  specializations: [], experienceYears: "", experienceDescription: "",
  hasTools: false, worksWithTeam: false,
  paymentName: "", paymentCard: "", paymentBank: "",
  agreeRules: false, agreeData: false, agreeAccuracy: false,
};

const STEPS = [
  { label: "Личные данные",    icon: FileText },
  { label: "Документы",        icon: Camera },
  { label: "Опыт работы",      icon: Briefcase },
  { label: "Платёжные данные", icon: CreditCard },
  { label: "Соглашения",       icon: ShieldCheck },
];

async function uploadFile(userId: string, bucket: string, name: string, file: File): Promise<string | null> {
  try {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${name}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch { return null; }
}

function FileDropZone({ label, file, onChange, accept = "image/*" }: {
  label: string; file: File | null; onChange: (f: File | null) => void; accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => ref.current?.click()}
      className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
    >
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => onChange(e.target.files?.[0] ?? null)} />
      {file ? (
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={e => { e.stopPropagation(); onChange(null); }} className="text-gray-400 hover:text-red-500">
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <Upload size={20} className="text-gray-400" />
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xs text-gray-400">Нажмите для выбора файла</p>
        </>
      )}
    </div>
  );
}

export function VerificationForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { setVerificationStatus } = usePerformerStore();
  const navigate = useNavigate();

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.firstName.trim()) return "Введите имя";
      if (!form.lastName.trim())  return "Введите фамилию";
      if (!form.city.trim())      return "Введите город";
    }
    if (step === 1) {
      if (!form.passportFile) return "Загрузите фото паспорта";
      if (!form.selfieFile)   return "Загрузите селфи с документом";
    }
    if (step === 2) {
      if (form.specializations.length === 0) return "Выберите хотя бы одну специализацию";
    }
    if (step === 3) {
      if (!form.paymentName.trim()) return "Введите ФИО получателя";
      if (!form.paymentCard.trim()) return "Введите номер карты";
    }
    if (step === 4) {
      if (!form.agreeRules)    return "Необходимо согласие с правилами";
      if (!form.agreeData)     return "Необходимо согласие на обработку данных";
      if (!form.agreeAccuracy) return "Подтвердите достоверность данных";
    }
    return null;
  }

  function goNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    if (step < STEPS.length - 1) setStep(s => s + 1);
  }

  async function submit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    if (!user) return;
    setSubmitting(true);
    trackEvent("verification_started");

    const userId = user.id;

    const passportUrl = form.passportFile
      ? await uploadFile(userId, "verification-documents", "passport", form.passportFile)
      : null;
    const selfieUrl = form.selfieFile
      ? await uploadFile(userId, "verification-documents", "selfie", form.selfieFile)
      : null;

    await supabase.from("verification_requests").upsert({
      performer_id: userId,
      first_name: sanitizeField(form.firstName),
      last_name: sanitizeField(form.lastName),
      birth_date: form.birthDate,
      phone: sanitizeField(form.phone),
      telegram: sanitizeField(form.telegram),
      city: sanitizeField(form.city),
      passport_url: passportUrl,
      selfie_url: selfieUrl,
      specializations: form.specializations,
      experience_years: form.experienceYears ? parseInt(form.experienceYears) : null,
      experience_description: sanitizeText(form.experienceDescription, 1000),
      has_tools: form.hasTools,
      works_with_team: form.worksWithTeam,
      work_photo_urls: [],
      payment_name: sanitizeField(form.paymentName),
      payment_card: sanitizeField(form.paymentCard),
      payment_bank: sanitizeField(form.paymentBank),
      submitted_at: new Date().toISOString(),
    }, { onConflict: "performer_id" });

    await supabase.from("performer_profiles").update({
      verification_status: "pending",
      verification_submitted_at: new Date().toISOString(),
    }).eq("user_id", userId);

    setVerificationStatus("pending");
    trackEvent("verification_submitted");
    setSubmitting(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-16 pb-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Анкета отправлена!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Ваши документы переданы на проверку администратору.<br />
            Среднее время проверки — 24 часа.
          </p>
          <button onClick={() => navigate("/performer")} className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Вернуться в дашборд
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-16">
      <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6">
        <ChevronLeft size={16} /> Назад
      </button>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{STEPS[step].label}</p>
          <p className="text-xs text-gray-400">Шаг {step + 1} из {STEPS.length}</p>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-blue-600" : "bg-gray-200"}`} />
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Имя *" value={form.firstName} onChange={v => set("firstName", v)} />
              <Field label="Фамилия *" value={form.lastName} onChange={v => set("lastName", v)} />
            </div>
            <Field label="Дата рождения" value={form.birthDate} onChange={v => set("birthDate", v)} type="date" />
            <Field label="Телефон" value={form.phone} onChange={v => set("phone", v)} placeholder="+7 (___) ___-__-__" />
            <Field label="Telegram" value={form.telegram} onChange={v => set("telegram", v)} placeholder="@username" />
            <Field label="Город *" value={form.city} onChange={v => set("city", v)} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">Загрузите чёткие фотографии. Документы должны быть читаемы.</p>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Паспорт / ID *</p>
              <FileDropZone label="Выберите фото паспорта" file={form.passportFile} onChange={f => set("passportFile", f)} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Селфи с документом *</p>
              <FileDropZone label="Выберите фото с документом" file={form.selfieFile} onChange={f => set("selfieFile", f)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Специализации *</p>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map(s => {
                  const active = form.specializations.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => set("specializations", active
                        ? form.specializations.filter(x => x !== s)
                        : [...form.specializations, s]
                      )}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        active ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:border-blue-400"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Опыт работы (лет)" value={form.experienceYears} onChange={v => set("experienceYears", v)} type="number" />
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Описание опыта</p>
              <textarea
                value={form.experienceDescription}
                onChange={e => set("experienceDescription", e.target.value)}
                rows={3}
                placeholder="Расскажите о вашем опыте работы..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <Checkbox label="Есть собственные инструменты/оборудование" checked={form.hasTools} onChange={v => set("hasTools", v)} />
              <Checkbox label="Работаю с командой" checked={form.worksWithTeam} onChange={v => set("worksWithTeam", v)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Данные для получения выплат</p>
            <Field label="ФИО получателя *" value={form.paymentName} onChange={v => set("paymentName", v)} />
            <Field label="Номер карты *" value={form.paymentCard} onChange={v => set("paymentCard", v)} placeholder="0000 0000 0000 0000" />
            <Field label="Банк" value={form.paymentBank} onChange={v => set("paymentBank", v)} placeholder="Сбербанк" />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">Для завершения верификации необходимо подтвердить соглашения</p>
            <Checkbox
              label="Я ознакомился и согласен с Правилами платформы SLOT"
              checked={form.agreeRules} onChange={v => set("agreeRules", v)}
            />
            <Checkbox
              label="Я согласен на обработку моих персональных данных"
              checked={form.agreeData} onChange={v => set("agreeData", v)}
            />
            <Checkbox
              label="Подтверждаю, что все предоставленные данные и документы достоверны"
              checked={form.agreeAccuracy} onChange={v => set("agreeAccuracy", v)}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-3 px-1">{error}</p>
      )}

      <button
        onClick={step < STEPS.length - 1 ? goNext : submit}
        disabled={submitting}
        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? "Отправляем..." : step < STEPS.length - 1 ? (
          <><span>Продолжить</span><ChevronRight size={16} /></>
        ) : (
          <><Check size={16} /><span>Отправить на проверку</span></>
        )}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300 group-hover:border-blue-400"}`}
        onClick={() => onChange(!checked)}
      >
        {checked && <Check size={11} className="text-white" />}
      </div>
      <span className="text-sm text-gray-700 leading-snug">{label}</span>
    </label>
  );
}
