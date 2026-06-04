import { useEffect, useState } from "react";
import { LayoutGrid, GitMerge, TrendingUp, RotateCcw, AlertTriangle, Activity, RefreshCw, Target } from "lucide-react";
import { useAnalyticsStore } from "../store/analyticsStore";
import type { TimeRange } from "../lib/analyticsQueries";
import { OverviewSection }   from "../analytics/OverviewSection";
import { FunnelSection }     from "../analytics/FunnelSection";
import { RevenueSection }    from "../analytics/RevenueSection";
import { RetentionSection }  from "../analytics/RetentionSection";
import { ErrorsSection }     from "../analytics/ErrorsSection";
import { ActivitySection }   from "../analytics/ActivitySection";
import { KPISection }        from "../analytics/KPISection";

type Tab = "overview" | "funnel" | "revenue" | "retention" | "errors" | "activity" | "kpi";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",  label: "Обзор",      icon: <LayoutGrid size={14} /> },
  { id: "funnel",    label: "Воронка",    icon: <GitMerge size={14} /> },
  { id: "revenue",   label: "Выручка",    icon: <TrendingUp size={14} /> },
  { id: "retention", label: "Retention",  icon: <RotateCcw size={14} /> },
  { id: "errors",    label: "Ошибки",     icon: <AlertTriangle size={14} /> },
  { id: "activity",  label: "Активность", icon: <Activity size={14} /> },
  { id: "kpi",       label: "KPI / Цели", icon: <Target size={14} /> },
];

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "today", label: "Сегодня" },
  { value: "7d",    label: "7 дней"  },
  { value: "30d",   label: "30 дней" },
  { value: "90d",   label: "90 дней" },
];

export function AdminAnalyticsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const { timeRange, isLoading, setTimeRange, loadAll } = useAnalyticsStore();

  useEffect(() => { loadAll(); }, []);

  return (
    <div className="p-4 md:p-6 text-gray-100">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Аналитика</h1>
          <p className="text-sm text-[#6b7194] mt-0.5">Здоровье продукта, воронка, выручка, retention</p>
        </div>
        <button
          onClick={() => loadAll()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8b90a8] bg-white border border-gray-200 rounded-lg hover:bg-white/[0.03] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
          Обновить
        </button>
      </div>

      {/* Time range + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex gap-1 bg-white/[0.04] p-1 rounded-xl shrink-0">
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setTimeRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                timeRange === r.value
                  ? "bg-[#006AFF] text-white shadow-sm"
                  : "text-[#6b7194] hover:text-[#a0a5c0]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-white/[0.04] p-1 rounded-xl overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "bg-[#006AFF] text-white shadow-sm"
                  : "text-[#6b7194] hover:text-[#a0a5c0]"
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <>
          {tab === "overview"  && <OverviewSection />}
          {tab === "funnel"    && <FunnelSection />}
          {tab === "revenue"   && <RevenueSection />}
          {tab === "retention" && <RetentionSection />}
          {tab === "errors"    && <ErrorsSection />}
          {tab === "activity"  && <ActivitySection />}
          {tab === "kpi"       && <KPISection />}
        </>
      )}
    </div>
  );
}
