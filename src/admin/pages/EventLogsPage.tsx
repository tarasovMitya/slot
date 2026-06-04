import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Search, AlertTriangle, Activity, Filter, ShieldCheck } from "lucide-react";

interface EventLog {
  id: string;
  user_id: string | null;
  session_id: string | null;
  event_name: string;
  page: string | null;
  metadata: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
}

interface ErrorLog {
  id: string;
  user_id: string | null;
  page: string | null;
  component: string | null;
  error_message: string;
  stack_trace: string | null;
  severity: string;
  created_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-[#8b90a8]",
};

const ERROR_EVENT_NAMES = ["react_error", "api_error", "auth_error", "db_error", "network_error", "realtime_error"];

const FUNNEL_EVENTS = [
  { event: "calculator_started", label: "Открыли калькулятор" },
  { event: "category_selected", label: "Выбрали категорию" },
  { event: "service_selected", label: "Выбрали услугу" },
  { event: "cart_item_added", label: "Добавили в корзину" },
  { event: "registration_started", label: "Начали регистрацию" },
  { event: "login_success", label: "Авторизовались" },
  { event: "order_created", label: "Создали заказ" },
  { event: "client_confirmed_completion", label: "Подтвердили завершение" },
];

interface AuditLog {
  id: number;
  created_at: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
}

type Tab = "events" | "errors" | "funnel" | "audit";

export function AdminEventLogsPage() {
  const [tab, setTab] = useState<Tab>("events");
  const [events, setEvents] = useState<EventLog[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [funnelCounts, setFunnelCounts] = useState<Record<string, number>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "events") loadEvents();
    if (tab === "errors") loadErrors();
    if (tab === "funnel") loadFunnel();
    if (tab === "audit") loadAudit();
  }, [tab]);

  async function loadAudit() {
    setLoading(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    setAuditLogs((data as AuditLog[]) ?? []);
    setLoading(false);
  }

  async function loadEvents() {
    setLoading(true);
    const { data } = await supabase
      .from("event_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setEvents((data as EventLog[]) ?? []);
    setLoading(false);
  }

  async function loadErrors() {
    setLoading(true);
    const { data } = await supabase
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setErrors((data as ErrorLog[]) ?? []);
    setLoading(false);
  }

  async function loadFunnel() {
    setLoading(true);
    const names = FUNNEL_EVENTS.map((f) => f.event);
    const { data } = await supabase
      .from("event_logs")
      .select("event_name")
      .in("event_name", names);
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.event_name] = (counts[row.event_name] ?? 0) + 1;
    }
    setFunnelCounts(counts);
    setLoading(false);
  }

  const uniqueEventNames = ["all", ...Array.from(new Set(events.map((e) => e.event_name))).sort()];

  const filteredEvents = events.filter((e) => {
    const matchesFilter = eventFilter === "all" || e.event_name === eventFilter;
    const matchesSearch = !search.trim() || (
      e.event_name.includes(search) ||
      (e.user_id ?? "").includes(search) ||
      (e.page ?? "").includes(search) ||
      (e.error_message ?? "").includes(search)
    );
    return matchesFilter && matchesSearch;
  });

  const filteredErrors = errors.filter((e) =>
    !search.trim() || e.error_message.includes(search) || (e.page ?? "").includes(search) || (e.component ?? "").includes(search)
  );

  const errorEventCount = events.filter((e) => ERROR_EVENT_NAMES.includes(e.event_name)).length;
  const maxFunnel = Math.max(...FUNNEL_EVENTS.map((f) => funnelCounts[f.event] ?? 0), 1);

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Логи событий</h1>
        <p className="text-sm text-[#6b7194] mt-0.5">Действия пользователей, ошибки, воронка</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { id: "events", label: "События", icon: <Activity size={14} /> },
          { id: "errors", label: `Ошибки${errorEventCount > 0 ? ` (${errors.length})` : ""}`, icon: <AlertTriangle size={14} /> },
          { id: "funnel", label: "Воронка", icon: <Filter size={14} /> },
          { id: "audit", label: "Аудит", icon: <ShieldCheck size={14} /> },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? "bg-white text-white shadow-sm" : "text-[#6b7194] hover:text-[#a0a5c0]"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Search + filter */}
      {tab !== "funnel" && tab !== "audit" && (
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7194]" />
            <input
              type="text"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-white/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006AFF]/40"
            />
          </div>
          {tab === "events" && (
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006AFF]/40"
            >
              {uniqueEventNames.map((n) => (
                <option key={n} value={n}>{n === "all" ? "Все события" : n}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {loading ? (
        <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] p-8 text-center text-sm text-[#6b7194]">Загрузка...</div>
      ) : (
        <>
          {/* Events tab */}
          {tab === "events" && (
            <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Последние события</p>
                <span className="text-xs text-[#6b7194]">{filteredEvents.length} записей</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Событие</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Страница</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">User ID</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Время</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((e) => (
                      <>
                        <tr
                          key={e.id}
                          onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                          className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${ERROR_EVENT_NAMES.includes(e.event_name) ? "bg-red-50/40" : ""}`}
                        >
                          <td className="px-4 py-2.5">
                            <span className={`text-xs font-mono font-semibold ${ERROR_EVENT_NAMES.includes(e.event_name) ? "text-red-600" : "text-[#a0a5c0]"}`}>
                              {e.event_name}
                            </span>
                            {e.error_message && (
                              <p className="text-xs text-red-500 mt-0.5 truncate max-w-[200px]">{e.error_message}</p>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-[#6b7194]">{e.page ?? "—"}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-[#6b7194]">{e.user_id ? e.user_id.slice(0, 8) + "…" : "anon"}</td>
                          <td className="px-4 py-2.5 text-xs text-[#6b7194] whitespace-nowrap">
                            {new Date(e.created_at).toLocaleString("ru-RU")}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-[#6b7194]">{e.metadata ? "▼" : ""}</td>
                        </tr>
                        {expandedId === e.id && e.metadata && (
                          <tr key={e.id + "_meta"} className="bg-[#0c0e1a] border-b border-white/[0.05]">
                            <td colSpan={5} className="px-4 py-2.5">
                              <pre className="text-xs text-[#8b90a8] whitespace-pre-wrap font-mono bg-white/[0.04] rounded p-2">
                                {JSON.stringify(e.metadata, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {filteredEvents.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-[#6b7194] text-sm">Нет событий</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Errors tab */}
          {tab === "errors" && (
            <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Журнал ошибок</p>
                <span className="text-xs text-[#6b7194]">{filteredErrors.length} записей</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Ошибка</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Компонент</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Страница</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Severity</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Время</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredErrors.map((e) => (
                      <>
                        <tr
                          key={e.id}
                          onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                          className="border-b border-gray-50 hover:bg-red-50/30 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-2.5 max-w-[260px]">
                            <p className="text-xs font-semibold text-red-700 truncate">{e.error_message}</p>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-[#6b7194]">{e.component ?? "—"}</td>
                          <td className="px-4 py-2.5 text-xs text-[#6b7194]">{e.page ?? "—"}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_COLORS[e.severity] ?? "bg-gray-100 text-[#8b90a8]"}`}>
                              {e.severity}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-[#6b7194] whitespace-nowrap">
                            {new Date(e.created_at).toLocaleString("ru-RU")}
                          </td>
                        </tr>
                        {expandedId === e.id && e.stack_trace && (
                          <tr key={e.id + "_stack"} className="bg-red-50/20 border-b border-gray-100">
                            <td colSpan={5} className="px-4 py-2.5">
                              <pre className="text-xs text-[#8b90a8] whitespace-pre-wrap font-mono bg-white/[0.04] rounded p-2 max-h-40 overflow-auto">
                                {e.stack_trace}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {filteredErrors.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-[#6b7194] text-sm">Ошибок нет</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Funnel tab */}
          {tab === "funnel" && (
            <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] p-5">
              <p className="text-sm font-semibold text-white mb-5">Воронка конверсии</p>
              <div className="space-y-3">
                {FUNNEL_EVENTS.map((f, i) => {
                  const count = funnelCounts[f.event] ?? 0;
                  const pct = maxFunnel > 0 ? Math.round((count / maxFunnel) * 100) : 0;
                  const prevCount = i > 0 ? (funnelCounts[FUNNEL_EVENTS[i - 1].event] ?? 0) : count;
                  const dropPct = prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0;
                  return (
                    <div key={f.event}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#6b7194] w-4">{i + 1}</span>
                          <span className="text-sm text-[#a0a5c0]">{f.label}</span>
                          <span className="text-xs font-mono text-[#6b7194]">{f.event}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {i > 0 && dropPct > 0 && (
                            <span className="text-xs text-red-500">−{dropPct}%</span>
                          )}
                          <span className="text-sm font-bold text-white w-10 text-right">{count}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Audit tab */}
          {tab === "audit" && (
            <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Журнал безопасности</p>
                <span className="text-xs text-[#6b7194]">{auditLogs.length} записей</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Действие</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Ресурс</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">ID</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">User</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b7194] uppercase tracking-wider">Время</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <>
                        <tr
                          key={log.id}
                          onClick={() => setExpandedId(expandedId === String(log.id) ? null : String(log.id))}
                          className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-2.5">
                            <span className="text-xs font-mono font-semibold text-[#a0a5c0]">{log.action}</span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-[#6b7194]">{log.resource_type ?? "—"}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-[#6b7194]">
                            {log.resource_id ? log.resource_id.slice(0, 8) + "…" : "—"}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-[#6b7194]">
                            {log.user_id ? log.user_id.slice(0, 8) + "…" : "system"}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-[#6b7194] whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString("ru-RU")}
                          </td>
                        </tr>
                        {expandedId === String(log.id) && log.details && Object.keys(log.details).length > 0 && (
                          <tr key={log.id + "_detail"} className="bg-[#0c0e1a] border-b border-white/[0.05]">
                            <td colSpan={5} className="px-4 py-2.5">
                              <pre className="text-xs text-[#8b90a8] whitespace-pre-wrap font-mono bg-white/[0.04] rounded p-2">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-[#6b7194] text-sm">Нет записей</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
