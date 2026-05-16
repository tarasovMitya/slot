import { useState } from "react";
import { Save } from "lucide-react";
import { useAdminStore } from "../store/adminStore";
import { ROLE_LABELS } from "../types";

export function AdminSettingsPage() {
  const { role } = useAdminStore();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Настройки</h1>
        <p className="text-sm text-gray-500 mt-0.5">Конфигурация платформы</p>
      </div>

      {/* Role info */}
      <Section title="Ваши права">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium">
            {role ? ROLE_LABELS[role] : "—"}
          </span>
          <p className="text-sm text-gray-500">Роли назначаются через базу данных администратором</p>
        </div>
      </Section>

      {/* Commission settings */}
      <Section title="Комиссия платформы">
        <div className="space-y-3">
          <Field label="Базовая комиссия (%)" defaultValue="15" type="number" min={0} max={100} />
          <Field label="Комиссия за споры (%)" defaultValue="5" type="number" min={0} max={100} />
          <Field label="Минимальный заказ (₽)" defaultValue="500" type="number" min={0} />
        </div>
      </Section>

      {/* Order settings */}
      <Section title="Параметры заказов">
        <div className="space-y-3">
          <Field label="Время поиска исполнителя (мин)" defaultValue="30" type="number" min={1} />
          <Field label="Время подтверждения клиентом (мин)" defaultValue="60" type="number" min={1} />
          <Field label="Автозавершение заказа (ч)" defaultValue="24" type="number" min={1} />
        </div>
      </Section>

      {/* Payout settings */}
      <Section title="Выплаты">
        <div className="space-y-3">
          <Field label="Минимальная сумма выплаты (₽)" defaultValue="1000" type="number" min={0} />
          <Field label="Период холда (дней)" defaultValue="3" type="number" min={0} />
        </div>
      </Section>

      {/* Platform info */}
      <Section title="О платформе">
        <div className="space-y-3">
          <Field label="Название платформы" defaultValue="SLOT" type="text" />
          <Field label="Email поддержки" defaultValue="support@slot.app" type="email" />
          <Field label="Телефон поддержки" defaultValue="+7 (800) 000-00-00" type="text" />
        </div>
      </Section>

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Save size={15} />
          Сохранить изменения
        </button>
        {saved && <p className="text-sm text-green-600 font-medium">Сохранено</p>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <p className="text-sm font-semibold text-gray-900 mb-4">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, defaultValue, type, min, max }: { label: string; defaultValue: string; type: string; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm text-gray-600 w-52 shrink-0">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        min={min}
        max={max}
        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
    </div>
  );
}
