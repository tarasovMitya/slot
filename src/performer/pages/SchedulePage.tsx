import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Zap } from "lucide-react";
import { usePerformerStore } from "../store/performerStore";
import { AvailabilityToggle } from "../components/ui/AvailabilityToggle";
import { trackEvent } from "../../lib/analytics";
import type { PerformerOrder } from "../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 56; // px per hour slot
const START_HOUR = 8;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const DAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

// Mirrors PerformerStatusBadge config exactly
const STATUS_CFG = {
  available:                  { bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-400",   text: "text-amber-700",   label: "Новый"               },
  accepted:                   { bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500",    text: "text-blue-700",    label: "Принят"              },
  on_the_way:                 { bg: "bg-indigo-50",  border: "border-indigo-200", dot: "bg-indigo-500",  text: "text-indigo-700",  label: "Еду к клиенту"      },
  in_progress:                { bg: "bg-purple-50",  border: "border-purple-200", dot: "bg-purple-500",  text: "text-purple-700",  label: "Выполняется"         },
  waiting_client_confirmation:{ bg: "bg-orange-50",  border: "border-orange-200", dot: "bg-orange-400",  text: "text-orange-700",  label: "Ожидает подтверждения"},
  dispute_opened:             { bg: "bg-red-50",     border: "border-red-200",    dot: "bg-red-500",     text: "text-red-600",     label: "Спор открыт"         },
  completed:                  { bg: "bg-green-50",   border: "border-green-200",  dot: "bg-green-500",   text: "text-green-700",   label: "Завершён"            },
  rejected:                   { bg: "bg-gray-100",   border: "border-gray-200",   dot: "bg-gray-400",    text: "text-gray-500",    label: "Отклонён"            },
  cancelled:                  { bg: "bg-gray-100",   border: "border-gray-200",   dot: "bg-gray-400",    text: "text-gray-500",    label: "Отменён"             },
} as const;

type StatusKey = keyof typeof STATUS_CFG;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDurationMins(dur: string): number {
  const minM = dur.match(/(\d+)\s*мин/);
  if (minM) return +minM[1];
  const rangeM = dur.match(/(\d+)[–\-—](\d+)\s*час/);
  if (rangeM) return ((+rangeM[1] + +rangeM[2]) / 2) * 60;
  const hourM = dur.match(/([\d,.]+)\s*час/);
  if (hourM) return parseFloat(hourM[1].replace(",", ".")) * 60;
  return 60;
}

function startMins(time: string): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function orderDateKey(scheduledDate: string): string {
  return scheduledDate.split("T")[0];
}

function weekMonday(offset: number): Date {
  const now = new Date();
  const dow = now.getDay();
  const toMon = dow === 0 ? -6 : 1 - dow;
  const d = new Date(now);
  d.setDate(now.getDate() + toMon + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
    </div>
  );
}

interface OrderBlockProps {
  order: PerformerOrder;
  top: number;
  height: number;
  onClick: () => void;
}

function OrderBlock({ order, top, height, onClick }: OrderBlockProps) {
  const cfg = STATUS_CFG[(order.status as StatusKey)] ?? STATUS_CFG.accepted;
  return (
    <button
      onClick={onClick}
      className={`absolute left-0.5 right-0.5 rounded-lg border text-left overflow-hidden transition-opacity hover:opacity-75 active:scale-[0.98] ${cfg.bg} ${cfg.border}`}
      style={{ top, height, zIndex: 10 }}
    >
      <div className="px-1.5 py-1 h-full flex flex-col justify-start">
        <div className="flex items-center gap-1 min-w-0">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
          <p className={`text-[10px] font-semibold leading-tight truncate ${cfg.text}`}>
            {order.serviceName}
          </p>
        </div>
        {height >= 40 && (
          <p className="text-[10px] text-gray-400 leading-tight mt-0.5 truncate pl-2.5">
            {order.scheduledTime}
          </p>
        )}
        {height >= 56 && (
          <p className="text-[10px] leading-tight mt-0.5 truncate pl-2.5 opacity-70 text-gray-500">
            {order.client.name}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Filter = "all" | "active" | "completed";

export function SchedulePage() {
  const navigate = useNavigate();
  const { activeOrders, completedOrders } = usePerformerStore();

  const [weekOffset, setWeekOffset] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [tick, setTick] = useState(() => new Date());

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackEvent("schedule_opened", {});
  }, []);

  // Update current time indicator every minute
  useEffect(() => {
    const id = setInterval(() => setTick(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Scroll to current time on first render
  useEffect(() => {
    if (!scrollRef.current) return;
    const offsetPx = Math.max(0, (tick.getHours() - START_HOUR - 1)) * HOUR_HEIGHT;
    scrollRef.current.scrollTop = offsetPx;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Week days
  const monday = useMemo(() => weekMonday(weekOffset), [weekOffset]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; }),
    [monday]
  );

  const todayKey = toIso(new Date());
  const isCurrentWeek = weekDays.some(d => toIso(d) === todayKey);
  const nowMins = tick.getHours() * 60 + tick.getMinutes();
  const nowTop = (nowMins / 60 - START_HOUR) * HOUR_HEIGHT;

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const all = [...activeOrders, ...completedOrders];
    if (filter === "active") return all.filter(o =>
      ["accepted", "on_the_way", "in_progress", "waiting_client_confirmation", "dispute_opened"].includes(o.status)
    );
    if (filter === "completed") return all.filter(o => o.status === "completed");
    return all;
  }, [activeOrders, completedOrders, filter]);

  // Group by date key
  const byDate = useMemo(() => {
    const map: Record<string, PerformerOrder[]> = {};
    for (const o of filteredOrders) {
      const k = orderDateKey(o.scheduledDate);
      if (!map[k]) map[k] = [];
      map[k].push(o);
    }
    return map;
  }, [filteredOrders]);

  // Week summary stats
  const stats = useMemo(() => {
    const now = new Date();
    let count = 0, totalMins = 0;
    let next: PerformerOrder | null = null;

    for (const day of weekDays) {
      const orders = byDate[toIso(day)] ?? [];
      count += orders.length;
      for (const o of orders) {
        totalMins += parseDurationMins(o.duration);
        if (["accepted", "on_the_way", "in_progress"].includes(o.status)) {
          const t = new Date(`${orderDateKey(o.scheduledDate)}T${o.scheduledTime}`);
          if (t > now && (!next || t < new Date(`${orderDateKey(next.scheduledDate)}T${next.scheduledTime}`))) {
            next = o;
          }
        }
      }
    }

    return {
      count,
      hours: (totalMins / 60).toFixed(1).replace(".0", ""),
      nextTime: next ? next.scheduledTime : "—",
    };
  }, [weekDays, byDate]);

  // Week label
  const weekLabel = useMemo(() => {
    const a = weekDays[0], b = weekDays[6];
    if (a.getMonth() === b.getMonth()) {
      return `${a.getDate()}–${b.getDate()} ${MONTHS_SHORT[a.getMonth()]} ${a.getFullYear()}`;
    }
    return `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTHS_SHORT[b.getMonth()]} ${b.getFullYear()}`;
  }, [weekDays]);

  const hasOrders = weekDays.some(d => (byDate[toIso(d)] ?? []).length > 0);
  const totalHeight = HOURS.length * HOUR_HEIGHT;

  return (
    <div className="px-4 pt-8 pb-10 max-w-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Расписание</h1>
        <p className="text-sm text-gray-400 mt-0.5">Заказы из активных и завершённых</p>
      </motion.div>

      {/* Online toggle */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mb-5">
        <AvailabilityToggle />
      </motion.div>

      {/* Week navigation */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset(o => o - 1)}
          className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-500" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">{weekLabel}</p>
          {isCurrentWeek && (
            <p className="text-[11px] text-blue-500 font-medium mt-0.5">текущая неделя</p>
          )}
        </div>
        <button
          onClick={() => setWeekOffset(o => o + 1)}
          className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronRight size={16} className="text-gray-500" />
        </button>
      </motion.div>

      {/* Filter tabs */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2 mb-4">
        {(["all", "active", "completed"] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "Все" : f === "active" ? "Активные" : "Завершённые"}
          </button>
        ))}
      </motion.div>

      {/* Summary strip */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className="flex gap-2 mb-5">
        <SummaryCard icon={<CalendarDays size={12} />} label="Заказов" value={String(stats.count)} />
        <SummaryCard icon={<Clock size={12} />} label="Часов" value={stats.hours} />
        <SummaryCard icon={<Zap size={12} />} label="Ближайший" value={stats.nextTime} />
      </motion.div>

      {/* ── Timeline grid ── */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <div className="border border-gray-100 rounded-2xl overflow-hidden">

          {/* Sticky day header row */}
          <div className="flex border-b border-gray-100 bg-white sticky top-0 z-30">
            <div className="w-[52px] shrink-0 border-r border-gray-100" />
            {weekDays.map((day, i) => {
              const isToday = toIso(day) === todayKey;
              return (
                <div
                  key={i}
                  className={`flex-1 min-w-[72px] py-2.5 text-center border-l border-gray-100 ${isToday ? "bg-blue-50" : ""}`}
                >
                  <p className={`text-[11px] font-semibold ${isToday ? "text-blue-600" : "text-gray-400"}`}>
                    {DAY_SHORT[i]}
                  </p>
                  <p className={`text-sm font-bold mt-0.5 ${isToday ? "text-blue-700" : "text-gray-800"}`}>
                    {day.getDate()}
                  </p>
                  {isToday && <div className="w-1 h-1 rounded-full bg-blue-500 mx-auto mt-0.5" />}
                </div>
              );
            })}
          </div>

          {/* Scrollable body */}
          <div
            ref={scrollRef}
            className="overflow-auto"
            style={{ maxHeight: "calc(100vh - 420px)", minHeight: 300 }}
          >
            {!hasOrders ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <CalendarDays size={36} className="text-gray-200 mb-3" />
                <p className="text-sm font-semibold text-gray-400">Нет запланированных заказов</p>
                <p className="text-xs text-gray-300 mt-1">
                  Принятые заказы появятся здесь автоматически
                </p>
              </div>
            ) : (
              <div className="flex" style={{ minWidth: "max-content" }}>
                {/* Time column */}
                <div className="w-[52px] shrink-0 border-r border-gray-100 bg-white">
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="border-b border-gray-50 flex items-start justify-end pr-2 pt-1"
                      style={{ height: HOUR_HEIGHT }}
                    >
                      <span className="text-[10px] text-gray-400 tabular-nums leading-none">{h}:00</span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day, di) => {
                  const key = toIso(day);
                  const isToday = key === todayKey;
                  const orders = byDate[key] ?? [];

                  return (
                    <div
                      key={di}
                      className={`flex-1 min-w-[72px] relative border-l border-gray-100 ${isToday ? "bg-blue-50/20" : ""}`}
                      style={{ height: totalHeight }}
                    >
                      {/* Hour grid lines */}
                      {HOURS.map(h => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 border-b border-gray-50"
                          style={{ top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                        />
                      ))}

                      {/* Current time indicator */}
                      {isToday && nowTop >= 0 && nowTop <= totalHeight && (
                        <div
                          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                          style={{ top: nowTop - 1 }}
                        >
                          <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                          <div className="h-px flex-1 bg-red-400" />
                        </div>
                      )}

                      {/* Order blocks */}
                      {orders.map(order => {
                        const sm = startMins(order.scheduledTime);
                        const dm = parseDurationMins(order.duration);
                        const top = (sm / 60 - START_HOUR) * HOUR_HEIGHT;
                        const height = Math.max((dm / 60) * HOUR_HEIGHT, 26);

                        return (
                          <OrderBlock
                            key={order.id}
                            order={order}
                            top={top}
                            height={height}
                            onClick={() => {
                              trackEvent("timeline_order_clicked", { orderId: order.id, status: order.status });
                              navigate(`/performer/orders/${order.id}`);
                            }}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
