import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { useAnalyticsStore } from "../store/analyticsStore";
import { formatPrice } from "../../utils/priceCalculator";

interface KPITarget {
  label: string;
  description: string;
  value: number | null;
  unit: string;
  target: number;
  targetLabel: string;
  direction: "up" | "down"; // "up" = higher is better, "down" = lower is better
  format: (v: number) => string;
}

function status(value: number | null, target: number, direction: "up" | "down"): "hit" | "miss" | "unknown" {
  if (value === null) return "unknown";
  return direction === "up" ? (value >= target ? "hit" : "miss") : (value <= target ? "hit" : "miss");
}

function StatusBadge({ s }: { s: "hit" | "miss" | "unknown" }) {
  if (s === "unknown") return <span className="text-xs text-gray-400 flex items-center gap-1"><Minus size={11} /> нет данных</span>;
  if (s === "hit") return <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><TrendingUp size={11} /> цель достигнута</span>;
  return <span className="text-xs text-red-500 font-semibold flex items-center gap-1"><TrendingDown size={11} /> ниже цели</span>;
}

function KPICard({ kpi }: { kpi: KPITarget }) {
  const s = status(kpi.value, kpi.target, kpi.direction);
  const bgColor = s === "hit" ? "bg-emerald-50 border-emerald-100" : s === "miss" ? "bg-red-50 border-red-100" : "bg-white border-gray-200";
  const valColor = s === "hit" ? "text-emerald-700" : s === "miss" ? "text-red-600" : "text-gray-900";

  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${bgColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight">{kpi.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{kpi.description}</p>
        </div>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s === "hit" ? "bg-emerald-100" : s === "miss" ? "bg-red-100" : "bg-gray-100"}`}>
          <Target size={14} className={s === "hit" ? "text-emerald-600" : s === "miss" ? "text-red-500" : "text-gray-400"} />
        </div>
      </div>

      <div>
        <p className={`text-3xl font-bold ${valColor}`}>
          {kpi.value !== null ? kpi.format(kpi.value) : "—"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Цель: <span className="font-semibold text-gray-600">{kpi.targetLabel}</span>
        </p>
      </div>

      {kpi.value !== null && (
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>0</span>
            <span>{kpi.targetLabel}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${s === "hit" ? "bg-emerald-500" : "bg-red-400"}`}
              style={{
                width: `${Math.min(100, kpi.direction === "up"
                  ? Math.round((kpi.value / kpi.target) * 100)
                  : Math.round(((kpi.target * 2 - kpi.value) / (kpi.target * 2)) * 100)
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      <StatusBadge s={s} />
    </div>
  );
}

export function KPISection() {
  const { businessKPIs, quality, timeRange } = useAnalyticsStore();

  const rangeLabel = timeRange === "today" ? "сегодня" : timeRange === "7d" ? "за 7 дней" : timeRange === "30d" ? "за 30 дней" : "за 90 дней";

  const kpis: KPITarget[] = [
    {
      label: "Заявки в день",
      description: "Сколько клиентов заполнили форму",
      value: businessKPIs?.ordersPerDay ?? null,
      unit: "",
      target: 5,
      targetLabel: "5–10 в день",
      direction: "up",
      format: (v) => `${v}`,
    },
    {
      label: "Fill Rate",
      description: "% заявок, на которых нашёлся исполнитель",
      value: businessKPIs?.fillRate ?? null,
      unit: "%",
      target: 70,
      targetLabel: "> 70%",
      direction: "up",
      format: (v) => `${v}%`,
    },
    {
      label: "Cancel Rate",
      description: "% отмен до выполнения",
      value: businessKPIs?.cancelRate ?? quality?.cancellationRate ?? null,
      unit: "%",
      target: 20,
      targetLabel: "< 20%",
      direction: "down",
      format: (v) => `${v}%`,
    },
    {
      label: "Repeat Rate",
      description: "% клиентов, сделавших 2+ заказа",
      value: businessKPIs?.repeatRate ?? null,
      unit: "%",
      target: 30,
      targetLabel: "> 30%",
      direction: "up",
      format: (v) => `${v}%`,
    },
    {
      label: "Time-to-Assign",
      description: "От заявки до назначения исполнителя",
      value: businessKPIs?.timeToAssignHours ?? null,
      unit: "ч",
      target: 2,
      targetLabel: "< 2 часов",
      direction: "down",
      format: (v) => v < 1 ? `${Math.round(v * 60)} мин` : `${v} ч`,
    },
    {
      label: "Комиссия с заказа",
      description: "Сколько зарабатывает платформа с одного заказа",
      value: businessKPIs?.commissionPerOrder ?? null,
      unit: "₽",
      target: 100,
      targetLabel: "100–300 ₽",
      direction: "up",
      format: (v) => formatPrice(v),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Бизнес-метрики</p>
            <p className="text-xs text-gray-400 mt-0.5">Цели первого месяца · данные {rangeLabel}</p>
          </div>
          {businessKPIs && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Всего заказов</p>
              <p className="text-lg font-bold text-gray-900">{businessKPIs.totalOrders}</p>
            </div>
          )}
        </div>

        {/* Summary bar */}
        {businessKPIs && (() => {
          const vals = kpis.map((k) => status(k.value, k.target, k.direction));
          const hit = vals.filter((s) => s === "hit").length;
          const total = vals.filter((s) => s !== "unknown").length;
          const pct = total > 0 ? Math.round((hit / total) * 100) : 0;
          return (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Выполнено целей</span>
                <span className="font-semibold">{hit} из {total} ({pct}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => <KPICard key={kpi.label} kpi={kpi} />)}
      </div>

      {/* Targets reference table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Таблица целей</p>
        </div>
        <div>
          {kpis.map((kpi, i) => {
            const s = status(kpi.value, kpi.target, kpi.direction);
            return (
              <div key={kpi.label} className={`flex items-center justify-between px-5 py-3.5 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{kpi.label}</p>
                  <p className="text-xs text-gray-400">{kpi.description}</p>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Сейчас</p>
                    <p className={`text-sm font-bold ${s === "hit" ? "text-emerald-600" : s === "miss" ? "text-red-500" : "text-gray-400"}`}>
                      {kpi.value !== null ? kpi.format(kpi.value) : "—"}
                    </p>
                  </div>
                  <div className="text-right w-20">
                    <p className="text-xs text-gray-400">Цель</p>
                    <p className="text-sm font-semibold text-gray-600">{kpi.targetLabel}</p>
                  </div>
                  <div className="w-16 text-right">
                    <StatusBadge s={s} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
