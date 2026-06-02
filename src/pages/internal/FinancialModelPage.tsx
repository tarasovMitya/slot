import { Link } from "react-router-dom";
import { ChevronRight, TrendingUp, DollarSign, Users, Target } from "lucide-react";

type Row = { label: string; value: string; note?: string };

function Table({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      {rows.map((r, i) => (
        <div key={i} className={`flex items-start justify-between gap-4 px-4 py-3 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
          <div>
            <p className="text-sm text-gray-700">{r.label}</p>
            {r.note && <p className="text-xs text-gray-400 mt-0.5">{r.note}</p>}
          </div>
          <span className="text-sm font-semibold text-gray-900 shrink-0">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
          <Icon size={14} className="text-gray-600" />
        </div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function FinancialModelPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/admin" className="hover:text-gray-700 transition-colors">Админ</Link>
        <ChevronRight size={14} />
        <span>Финансовая модель</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Финансовая модель</h1>
      <p className="text-sm text-gray-400 mb-8">Unit-экономика и плановые показатели MVP · обновлено май 2026</p>

      <div className="flex flex-col gap-8">

        {/* Unit economics */}
        <Section title="Unit-экономика (один заказ)" icon={DollarSign}>
          <Table rows={[
            { label: "Средний чек (AOV)", value: "3 500 ₽", note: "Целевой при запуске" },
            { label: "Комиссия платформы", value: "15%", note: "525 ₽ с заказа" },
            { label: "Комиссия эквайринга", value: "~2%", note: "≈70 ₽ с заказа" },
            { label: "Поддержка и инфраструктура", value: "~50 ₽", note: "Пропорционально" },
            { label: "Gross Profit с заказа", value: "405 ₽", note: "Gross Margin: 11,6%" },
          ]} />
        </Section>

        {/* CAC & LTV */}
        <Section title="CAC и LTV" icon={Target}>
          <Table rows={[
            { label: "CAC (целевой)", value: "800 ₽", note: "Стоимость привлечения 1 клиента" },
            { label: "Среднее кол-во заказов/клиент/мес", value: "1,5", note: "При хорошем retention" },
            { label: "LTV (6 мес)", value: "3 645 ₽", note: "405 ₽ × 1,5 × 6" },
            { label: "LTV / CAC", value: "4,6×", note: "Цель: > 3×" },
            { label: "Payback period", value: "~2 мес", note: "800 ₽ ÷ 405 ₽/мес" },
          ]} />
        </Section>

        {/* Break-even */}
        <Section title="Точка безубыточности" icon={TrendingUp}>
          <Table rows={[
            { label: "Фикс. расходы в мес (MVP)", value: "150 000 ₽", note: "Хостинг + маркетинг + прочее" },
            { label: "Нужно заказов для Break-Even", value: "370 заказов/мес", note: "150 000 ÷ 405" },
            { label: "При AOV 3 500 ₽ — GMV", value: "1 295 000 ₽/мес" },
            { label: "Средний заказов в день (цель)", value: "13 заказов/день" },
          ]} />
        </Section>

        {/* Monthly plan */}
        <Section title="Плановые показатели по месяцам" icon={Users}>
          <Table rows={[
            { label: "Месяц 1: заказы", value: "50–100", note: "Первые реальные заказы вручную" },
            { label: "Месяц 1: GMV", value: "175–350 тыс. ₽" },
            { label: "Месяц 1: выручка платформы", value: "26–52 тыс. ₽" },
            { label: "Месяц 2: заказы", value: "200–400" },
            { label: "Месяц 2: GMV", value: "700 тыс. — 1,4 млн ₽" },
            { label: "Месяц 2: Break-Even", value: "370 заказов → достижим" },
            { label: "Исполнителей (цель к мес 2)", value: "50–80 верифицированных" },
            { label: "Клиентов (цель к мес 2)", value: "300–500 зарегистрированных" },
          ]} />
        </Section>

        {/* Scenarios */}
        <Section title="Сценарии роста" icon={TrendingUp}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Пессимистичный", orders: 150, gmv: "525 тыс.", revenue: "79 тыс.", color: "bg-red-50 border-red-100" },
              { label: "Базовый", orders: 370, gmv: "1,3 млн", revenue: "195 тыс.", color: "bg-amber-50 border-amber-100" },
              { label: "Оптимистичный", orders: 600, gmv: "2,1 млн", revenue: "315 тыс.", color: "bg-emerald-50 border-emerald-100" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-3 ${s.color}`}>
                <p className="text-xs font-semibold text-gray-600 mb-2">{s.label}</p>
                <p className="text-lg font-bold text-gray-900">{s.orders}</p>
                <p className="text-xs text-gray-500">заказов/мес</p>
                <div className="mt-2 pt-2 border-t border-white/60">
                  <p className="text-xs text-gray-600">GMV: {s.gmv}</p>
                  <p className="text-xs text-gray-600">Выручка: {s.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Key metrics */}
        <div className="rounded-2xl bg-[#003B8F] text-white p-5">
          <h3 className="font-bold text-base mb-3">Целевые KPI для инвестора</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "GMV к концу мес 2", value: "1+ млн ₽" },
              { label: "Retention Day-30", value: "> 25%" },
              { label: "NPS", value: "> 50" },
              { label: "LTV / CAC", value: "> 3×" },
            ].map((k) => (
              <div key={k.label} className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-gray-300">{k.label}</p>
                <p className="text-base font-bold">{k.value}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Модель основана на отраслевых бенчмарках сервисных маркетплейсов России (2024–2026).
          Актуализируется по мере накопления реальных данных.
        </p>
      </div>
    </div>
  );
}
