import { useState } from "react";
import type { User } from "@telegram-apps/sdk-react";
import type { TMAPage } from "./TMAApp";
import { SERVICES } from "../services/servicesData";
import { supabase } from "../../lib/supabase";

const SERVICE_ICONS: Record<string, string> = {
  electrician: "⚡",
  plumber: "🔧",
  cleaning: "🧹",
  "furniture-assembly": "🛋",
  handyman: "🔨",
  "dry-cleaning": "🧴",
};

type Step = "service" | "price" | "details" | "confirm" | "success";

interface Form {
  name: string;
  phone: string;
  address: string;
  comment: string;
  date: string;
  time: string;
}

const TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

interface Props {
  user: User | undefined;
  onNavigate: (page: TMAPage) => void;
}

export function TMACalculator({ user, onNavigate }: Props) {
  const [step, setStep] = useState<Step>("service");
  const [serviceSlug, setServiceSlug] = useState("");
  const [priceIdx, setPriceIdx] = useState(0);
  const [form, setForm] = useState<Form>({
    name: user ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}` : "",
    phone: "",
    address: "",
    comment: "",
    date: "",
    time: "10:00",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = SERVICES.find((s) => s.slug === serviceSlug);
  const priceItem = service?.prices[priceIdx];
  const totalPrice = priceItem?.from ?? 0;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const patch = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canSubmitDetails = form.name.trim() && form.phone.trim() && form.address.trim() && form.date;

  const handleSubmit = async () => {
    if (!service || !priceItem) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { error: dbErr } = await supabase.from("orders").insert({
        user_id: authUser?.id ?? null,
        email: authUser?.email ?? null,
        name: form.name,
        category_id: service.slug,
        category_name: service.nameRu,
        service_id: service.slug,
        service_name: priceItem.label,
        field_values: { phone: form.phone },
        price_total: totalPrice,
        price_breakdown: [{ label: priceItem.label, amount: totalPrice }],
        scheduled_date: form.date,
        scheduled_time: form.time,
        address: form.address,
        comment: form.comment || null,
      });
      if (dbErr) throw dbErr;
      setStep("success");
    } catch {
      setError("Ошибка при отправке. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <div className="px-4 pt-16 pb-4 flex flex-col items-center text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Заявка принята!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Мастер свяжется с вами в течение 30 минут.<br />
          Адрес: {form.address}
        </p>
        <button
          onClick={() => onNavigate("orders")}
          className="w-full bg-gray-950 text-white rounded-2xl py-4 font-bold text-base mb-3"
        >
          📋 Посмотреть заявки
        </button>
        <button
          onClick={() => { setStep("service"); setServiceSlug(""); setPriceIdx(0); }}
          className="w-full border border-gray-100 rounded-2xl py-3.5 text-sm font-medium text-gray-600"
        >
          Оформить ещё одну
        </button>
      </div>
    );
  }

  if (step === "service") {
    return (
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Выберите услугу</h1>
        <p className="text-sm text-gray-400 mb-5">Выезд в день заказа</p>
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.filter((s) => SERVICE_ICONS[s.slug]).map((s) => (
            <button
              key={s.slug}
              onClick={() => { setServiceSlug(s.slug); setStep("price"); }}
              className="bg-gray-50 rounded-2xl p-4 text-left active:bg-gray-100 transition-colors"
            >
              <div className="text-2xl mb-2">{SERVICE_ICONS[s.slug] ?? "🔧"}</div>
              <p className="font-semibold text-gray-900 text-sm">{s.nameRu}</p>
              <p className="text-xs text-gray-400 mt-0.5">от {s.prices[0]?.from?.toLocaleString("ru")} ₽</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "price" && service) {
    return (
      <div className="px-4 pt-6 pb-4">
        <button onClick={() => setStep("service")} className="text-sm text-gray-400 mb-4 flex items-center gap-1">
          ← Назад
        </button>
        <div className="text-3xl mb-1">{SERVICE_ICONS[service.slug] ?? "🔧"}</div>
        <h1 className="text-xl font-black text-gray-900 mb-4">{service.nameRu}</h1>
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Выберите работу</p>
        <div className="space-y-2">
          {service.prices.map((p, i) => (
            <button
              key={i}
              onClick={() => { setPriceIdx(i); setStep("details"); }}
              className="w-full bg-gray-50 rounded-2xl p-4 text-left active:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <span className="text-sm font-medium text-gray-900">{p.label}</span>
              <span className="text-sm font-bold text-gray-900 ml-2 whitespace-nowrap">от {p.from.toLocaleString("ru")} ₽</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="px-4 pt-6 pb-28">
        <button onClick={() => setStep("price")} className="text-sm text-gray-400 mb-4 flex items-center gap-1">
          ← Назад
        </button>
        <h1 className="text-xl font-black text-gray-900 mb-1">Детали заказа</h1>
        {priceItem && (
          <p className="text-sm text-gray-400 mb-5">{priceItem.label} · от {totalPrice.toLocaleString("ru")} ₽</p>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Ваше имя</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
              placeholder="Иван Иванов"
              className="w-full bg-gray-50 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Телефон</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => patch("phone", e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className="w-full bg-gray-50 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Адрес</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => patch("address", e.target.value)}
              placeholder="Москва, ул. Пушкина, д. 1, кв. 2"
              className="w-full bg-gray-50 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Дата</label>
              <input
                type="date"
                value={form.date}
                min={minDate}
                onChange={(e) => patch("date", e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-3 py-3.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Время</label>
              <select
                value={form.time}
                onChange={(e) => patch("time", e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-3 py-3.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              >
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Комментарий (необязательно)</label>
            <textarea
              value={form.comment}
              onChange={(e) => patch("comment", e.target.value)}
              placeholder="Уточните детали..."
              rows={3}
              className="w-full bg-gray-50 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)" }}>
          <button
            onClick={() => canSubmitDetails && setStep("confirm")}
            disabled={!canSubmitDetails}
            className="w-full bg-gray-950 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-40"
          >
            Продолжить
          </button>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    const dateFormatted = form.date
      ? new Date(form.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
      : "";

    return (
      <div className="px-4 pt-6 pb-28">
        <button onClick={() => setStep("details")} className="text-sm text-gray-400 mb-4 flex items-center gap-1">
          ← Назад
        </button>
        <h1 className="text-xl font-black text-gray-900 mb-5">Подтверждение</h1>

        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-4">
          <Row label="Услуга" value={service?.nameRu ?? ""} />
          <Row label="Работа" value={priceItem?.label ?? ""} />
          <Row label="Стоимость" value={`от ${totalPrice.toLocaleString("ru")} ₽`} bold />
          <div className="border-t border-gray-100" />
          <Row label="Имя" value={form.name} />
          <Row label="Телефон" value={form.phone} />
          <Row label="Адрес" value={form.address} />
          <Row label="Дата и время" value={`${dateFormatted}, ${form.time}`} />
          {form.comment && <Row label="Комментарий" value={form.comment} />}
        </div>

        {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)" }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gray-950 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-60"
          >
            {submitting ? "Отправляем..." : "Оформить заказ"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm text-right text-gray-900 ${bold ? "font-bold" : ""}`}>{value}</span>
    </div>
  );
}
