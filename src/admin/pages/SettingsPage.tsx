import { useState } from "react";
import { Save } from "lucide-react";
import { useAdminStore } from "../store/adminStore";
import { usePlatformSettingsStore } from "../../store/platformSettingsStore";
import { ROLE_LABELS } from "../types";

export function AdminSettingsPage() {
  const { role } = useAdminStore();
  const { settings, save } = usePlatformSettingsStore();
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    commission_base: String(settings.commission_base),
    min_order: String(settings.min_order),
    travel_base_cost: String(settings.travel_base_cost),
    travel_price_per_km: String(settings.travel_price_per_km),
    travel_base_radius: String(settings.travel_base_radius),
    travel_min_surcharge: String(settings.travel_min_surcharge),
    travel_max_surcharge: String(settings.travel_max_surcharge),
    payout_min: String(settings.payout_min),
    payout_hold_days: String(settings.payout_hold_days),
    performer_search_timeout: String(settings.performer_search_timeout),
    client_confirm_timeout: String(settings.client_confirm_timeout),
    auto_complete_hours: String(settings.auto_complete_hours),
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    await save({
      commission_base: parseFloat(form.commission_base) || 0,
      min_order: parseFloat(form.min_order) || 0,
      travel_base_cost: parseFloat(form.travel_base_cost) || 0,
      travel_price_per_km: parseFloat(form.travel_price_per_km) || 0,
      travel_base_radius: parseFloat(form.travel_base_radius) || 0,
      travel_min_surcharge: parseFloat(form.travel_min_surcharge) || 0,
      travel_max_surcharge: parseFloat(form.travel_max_surcharge) || 0,
      payout_min: parseFloat(form.payout_min) || 0,
      payout_hold_days: parseFloat(form.payout_hold_days) || 0,
      performer_search_timeout: parseFloat(form.performer_search_timeout) || 0,
      client_confirm_timeout: parseFloat(form.client_confirm_timeout) || 0,
      auto_complete_hours: parseFloat(form.auto_complete_hours) || 0,
    });
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Настройки</h1>
        <p className="text-sm text-gray-500 mt-0.5">Конфигурация платформы</p>
      </div>

      <Section title="Ваши права">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-[#003B8F] text-white rounded-lg text-sm font-medium">
            {role ? ROLE_LABELS[role] : "—"}
          </span>
          <p className="text-sm text-gray-500">Роли назначаются через базу данных администратором</p>
        </div>
      </Section>

      <Section title="Комиссия платформы">
        <div className="space-y-3">
          <Field label="Базовая комиссия (%)" value={form.commission_base} onChange={(v) => set("commission_base", v)} type="number" min={0} max={100} />
          <Field label="Минимальный заказ (₽)" value={form.min_order} onChange={(v) => set("min_order", v)} type="number" min={0} />
        </div>
      </Section>

      <Section title="Стоимость выезда исполнителя">
        <p className="text-xs text-gray-400 mb-3">Влияет на итоговую стоимость в калькуляторе</p>
        <div className="space-y-3">
          <Field label="Базовая стоимость выезда (₽)" value={form.travel_base_cost} onChange={(v) => set("travel_base_cost", v)} type="number" min={0} />
          <Field label="Цена за км сверх базового радиуса (₽)" value={form.travel_price_per_km} onChange={(v) => set("travel_price_per_km", v)} type="number" min={0} />
          <Field label="Базовый радиус без доплаты (км)" value={form.travel_base_radius} onChange={(v) => set("travel_base_radius", v)} type="number" min={0} />
          <Field label="Минимальная доплата за выезд (₽)" value={form.travel_min_surcharge} onChange={(v) => set("travel_min_surcharge", v)} type="number" min={0} />
          <Field label="Максимальная доплата за выезд (₽)" value={form.travel_max_surcharge} onChange={(v) => set("travel_max_surcharge", v)} type="number" min={0} />
        </div>
      </Section>

      <Section title="Параметры заказов">
        <div className="space-y-3">
          <Field label="Время поиска исполнителя (мин)" value={form.performer_search_timeout} onChange={(v) => set("performer_search_timeout", v)} type="number" min={1} />
          <Field label="Время подтверждения клиентом (мин)" value={form.client_confirm_timeout} onChange={(v) => set("client_confirm_timeout", v)} type="number" min={1} />
          <Field label="Автозавершение заказа (ч)" value={form.auto_complete_hours} onChange={(v) => set("auto_complete_hours", v)} type="number" min={1} />
        </div>
      </Section>

      <Section title="Выплаты">
        <div className="space-y-3">
          <Field label="Минимальная сумма выплаты (₽)" value={form.payout_min} onChange={(v) => set("payout_min", v)} type="number" min={0} />
          <Field label="Период холда (дней)" value={form.payout_hold_days} onChange={(v) => set("payout_hold_days", v)} type="number" min={0} />
        </div>
      </Section>

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-[#003B8F] text-white rounded-lg text-sm font-medium hover:bg-[#004CB8] transition-colors disabled:opacity-50"
        >
          <Save size={15} />
          {isSaving ? "Сохранение..." : "Сохранить изменения"}
        </button>
        {saved && <p className="text-sm text-green-600 font-medium">Сохранено ✓</p>}
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

function Field({ label, value, onChange, type, min, max }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm text-gray-600 w-52 shrink-0">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
    </div>
  );
}
