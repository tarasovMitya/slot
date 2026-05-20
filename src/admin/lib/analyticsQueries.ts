import { supabase } from "../../lib/supabase";

export type TimeRange = "today" | "7d" | "30d" | "90d";

export function getStartDate(range: TimeRange): string {
  const now = new Date();
  switch (range) {
    case "today": { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString(); }
    case "7d":   return new Date(now.getTime() - 7  * 86400000).toISOString();
    case "30d":  return new Date(now.getTime() - 30 * 86400000).toISOString();
    case "90d":  return new Date(now.getTime() - 90 * 86400000).toISOString();
  }
}

function fmtDay(iso: string) { return iso.slice(5, 10).replace("-", "."); }

// ─── Active users (DAU / WAU / MAU) ─────────────────────────────────────────

export interface ActiveUsersData {
  dau: number; wau: number; mau: number;
  byDay: { date: string; users: number }[];
}

export async function queryActiveUsers(startDate: string): Promise<ActiveUsersData> {
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data } = await supabase
    .from("event_logs")
    .select("user_id, created_at")
    .gte("created_at", monthAgo)
    .not("user_id", "is", null);

  if (!data) return { dau: 0, wau: 0, mau: 0, byDay: [] };

  const now = Date.now();
  const dau = new Set(data.filter(r => new Date(r.created_at).getTime() >= now - 86400000).map(r => r.user_id)).size;
  const wau = new Set(data.filter(r => new Date(r.created_at).getTime() >= now - 7 * 86400000).map(r => r.user_id)).size;
  const mau = new Set(data.map(r => r.user_id)).size;

  const byDayMap: Record<string, Set<string>> = {};
  for (const r of data.filter(r => r.created_at >= startDate)) {
    const day = (r.created_at as string).slice(0, 10);
    if (!byDayMap[day]) byDayMap[day] = new Set();
    byDayMap[day].add(r.user_id as string);
  }
  const byDay = Object.entries(byDayMap)
    .map(([date, s]) => ({ date: fmtDay(date), users: s.size }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { dau, wau, mau, byDay };
}

// ─── Registrations ───────────────────────────────────────────────────────────

export interface RegistrationsData {
  clients: number; performers: number;
  byDay: { date: string; clients: number; performers: number }[];
}

export async function queryRegistrations(startDate: string): Promise<RegistrationsData> {
  const { data } = await supabase
    .from("profiles")
    .select("created_at, role")
    .gte("created_at", startDate)
    .order("created_at", { ascending: true });

  if (!data) return { clients: 0, performers: 0, byDay: [] };

  const clients   = data.filter(r => r.role === "client").length;
  const performers = data.filter(r => r.role === "performer").length;

  const byDayMap: Record<string, { clients: number; performers: number }> = {};
  for (const r of data) {
    const day = (r.created_at as string)?.slice(0, 10);
    if (!day) continue;
    if (!byDayMap[day]) byDayMap[day] = { clients: 0, performers: 0 };
    if (r.role === "client") byDayMap[day].clients++;
    if (r.role === "performer") byDayMap[day].performers++;
  }
  const byDay = Object.entries(byDayMap)
    .map(([date, v]) => ({ date: fmtDay(date), ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { clients, performers, byDay };
}

// ─── Revenue ─────────────────────────────────────────────────────────────────

export interface RevenueData {
  gmv: number; avgOrderValue: number; totalOrders: number; completedOrders: number;
  byDay: { date: string; revenue: number }[];
  byCategory: { name: string; revenue: number; orders: number; avgPrice: number }[];
}

export async function queryRevenue(startDate: string): Promise<RevenueData> {
  const { data } = await supabase
    .from("shared_orders")
    .select("price_total, created_at, status, category_name")
    .gte("created_at", startDate)
    .order("created_at", { ascending: true });

  if (!data) return { gmv: 0, avgOrderValue: 0, totalOrders: 0, completedOrders: 0, byDay: [], byCategory: [] };

  const PAID_STATUSES = ["completed", "in_progress", "waiting_client_confirmation", "accepted", "on_the_way"];
  const paid = data.filter(r => PAID_STATUSES.includes(r.status as string));
  const completed = data.filter(r => r.status === "completed");
  const gmv = paid.reduce((s, r) => s + ((r.price_total as number) ?? 0), 0);

  const byDayMap: Record<string, number> = {};
  for (const r of paid) {
    const day = (r.created_at as string)?.slice(0, 10);
    if (!day) continue;
    byDayMap[day] = (byDayMap[day] ?? 0) + ((r.price_total as number) ?? 0);
  }
  const byDay = Object.entries(byDayMap)
    .map(([date, revenue]) => ({ date: fmtDay(date), revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const catMap: Record<string, { revenue: number; orders: number }> = {};
  for (const r of paid) {
    const cat = (r.category_name as string) ?? "Другое";
    if (!catMap[cat]) catMap[cat] = { revenue: 0, orders: 0 };
    catMap[cat].revenue += (r.price_total as number) ?? 0;
    catMap[cat].orders++;
  }
  const byCategory = Object.entries(catMap)
    .map(([name, v]) => ({ name, ...v, avgPrice: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    gmv,
    avgOrderValue: paid.length > 0 ? Math.round(gmv / paid.length) : 0,
    totalOrders: data.length,
    completedOrders: completed.length,
    byDay,
    byCategory,
  };
}

// ─── Orders over time ────────────────────────────────────────────────────────

export interface OrdersTimePoint { date: string; total: number; completed: number; cancelled: number }

export async function queryOrdersOverTime(startDate: string): Promise<OrdersTimePoint[]> {
  const { data } = await supabase
    .from("shared_orders")
    .select("created_at, status")
    .gte("created_at", startDate)
    .order("created_at", { ascending: true });

  if (!data) return [];

  const m: Record<string, OrdersTimePoint> = {};
  for (const r of data) {
    const day = (r.created_at as string)?.slice(0, 10);
    if (!day) continue;
    if (!m[day]) m[day] = { date: fmtDay(day), total: 0, completed: 0, cancelled: 0 };
    m[day].total++;
    if (r.status === "completed") m[day].completed++;
    if (r.status === "cancelled") m[day].cancelled++;
  }
  return Object.values(m).sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Quality metrics ─────────────────────────────────────────────────────────

export interface QualityData {
  completionRate: number; cancellationRate: number; disputeRate: number;
  avgRating: number; ratedOrders: number; total: number;
}

export async function queryQuality(startDate: string): Promise<QualityData> {
  const { data } = await supabase
    .from("shared_orders")
    .select("status, client_rating")
    .gte("created_at", startDate);

  if (!data || data.length === 0) return { completionRate: 0, cancellationRate: 0, disputeRate: 0, avgRating: 0, ratedOrders: 0, total: 0 };

  const total = data.length;
  const completed = data.filter(r => r.status === "completed").length;
  const cancelled = data.filter(r => r.status === "cancelled").length;
  const disputes  = data.filter(r => r.status === "dispute_opened").length;
  const rated     = data.filter(r => (r.client_rating as number) > 0);

  return {
    total,
    completionRate:   Math.round((completed / total) * 100),
    cancellationRate: +((cancelled / total * 100).toFixed(1)),
    disputeRate:      +((disputes  / total * 100).toFixed(1)),
    avgRating: rated.length > 0 ? +(rated.reduce((s, r) => s + (r.client_rating as number), 0) / rated.length).toFixed(2) : 0,
    ratedOrders: rated.length,
  };
}

// ─── Funnel ──────────────────────────────────────────────────────────────────

export interface FunnelStep {
  event: string; label: string; count: number; convPct: number; dropPct: number;
}

const FUNNEL_DEF = [
  { event: "calculator_started",       label: "Открыли калькулятор" },
  { event: "cart_item_added",          label: "Добавили в корзину" },
  { event: "registration_started",     label: "Начали регистрацию" },
  { event: "login_success",            label: "Авторизовались" },
  { event: "order_created",            label: "Создали заказ" },
  { event: "performer_assigned",       label: "Назначен исполнитель" },
  { event: "client_confirmed_completion", label: "Завершили заказ" },
];

export async function queryFunnel(startDate: string): Promise<FunnelStep[]> {
  const { data } = await supabase
    .from("event_logs")
    .select("event_name")
    .in("event_name", FUNNEL_DEF.map(s => s.event))
    .gte("created_at", startDate);

  const counts: Record<string, number> = {};
  for (const r of data ?? []) counts[r.event_name] = (counts[r.event_name] ?? 0) + 1;

  const steps = FUNNEL_DEF.map(s => ({ ...s, count: counts[s.event] ?? 0 }));
  const top = steps[0]?.count || 1;

  return steps.map((s, i) => {
    const prev = i > 0 ? steps[i - 1].count : s.count;
    return {
      ...s,
      convPct: top > 0 ? Math.round((s.count / top) * 100) : 0,
      dropPct: prev > 0 && i > 0 ? Math.round(((prev - s.count) / prev) * 100) : 0,
    };
  });
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export interface ErrorLogRow { id: string; error_message: string; severity: string; page: string | null; component: string | null; created_at: string }
export interface ErrorsData {
  total: number;
  recent: ErrorLogRow[];
  byType: { name: string; count: number }[];
  bySeverity: Record<string, number>;
}

export async function queryErrors(startDate: string): Promise<ErrorsData> {
  const [{ data: logs }, { data: events }] = await Promise.all([
    supabase.from("error_logs")
      .select("id, error_message, severity, page, component, created_at")
      .gte("created_at", startDate).order("created_at", { ascending: false }).limit(50),
    supabase.from("event_logs")
      .select("event_name")
      .in("event_name", ["react_error", "api_error", "auth_error", "db_error", "network_error", "realtime_error"])
      .gte("created_at", startDate),
  ]);

  const byType: Record<string, number> = {};
  for (const r of events ?? []) byType[r.event_name] = (byType[r.event_name] ?? 0) + 1;

  const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const r of logs ?? []) bySeverity[(r.severity as string)] = (bySeverity[(r.severity as string)] ?? 0) + 1;

  return {
    total: (logs ?? []).length,
    recent: ((logs ?? []) as ErrorLogRow[]).slice(0, 8),
    byType: Object.entries(byType).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    bySeverity,
  };
}

// ─── Marketplace health ───────────────────────────────────────────────────────

export interface MarketplaceData {
  acceptanceRate: number; failedAssignments: number; searchingOrders: number;
  activePerformers: number; onlinePerformers: number; ordersPerPerformer: number; total: number;
}

export async function queryMarketplace(startDate: string): Promise<MarketplaceData> {
  const [{ data: orders }, { data: performers }] = await Promise.all([
    supabase.from("shared_orders").select("status, performer_id").gte("created_at", startDate),
    supabase.from("performer_profiles").select("is_online, verification_status"),
  ]);

  const all = orders ?? [];
  const total    = all.length;
  const assigned = all.filter(o => o.performer_id).length;
  const perf     = performers ?? [];

  return {
    total,
    acceptanceRate:    total > 0 ? Math.round((assigned / total) * 100) : 0,
    failedAssignments: all.filter(o => o.status === "cancelled" && !o.performer_id).length,
    searchingOrders:   all.filter(o => o.status === "searching_performer").length,
    activePerformers:  perf.filter(p => p.verification_status === "approved").length,
    onlinePerformers:  perf.filter(p => p.is_online).length,
    ordersPerPerformer: perf.filter(p => p.verification_status === "approved").length > 0
      ? +(assigned / perf.filter(p => p.verification_status === "approved").length).toFixed(1)
      : 0,
  };
}

// ─── Supply / Demand ──────────────────────────────────────────────────────────

export interface SupplyDemandData {
  activeOrders: number; searchingOrders: number; onlinePerformers: number;
  idlePerformers: number; unfulfilledDemand: number; balanceScore: number;
}

export async function querySupplyDemand(): Promise<SupplyDemandData> {
  const [{ data: active }, { data: performers }] = await Promise.all([
    supabase.from("shared_orders").select("status")
      .in("status", ["searching_performer", "accepted", "on_the_way", "in_progress"]),
    supabase.from("performer_profiles").select("is_online"),
  ]);

  const searching = (active ?? []).filter(o => o.status === "searching_performer").length;
  const online    = (performers ?? []).filter(p => p.is_online).length;

  return {
    activeOrders:      (active ?? []).length,
    searchingOrders:   searching,
    onlinePerformers:  online,
    idlePerformers:    Math.max(0, online - searching),
    unfulfilledDemand: Math.max(0, searching - online),
    balanceScore:      online > 0 ? Math.min(100, Math.round((online / Math.max(1, searching)) * 100)) : 0,
  };
}

// ─── Activity feed ────────────────────────────────────────────────────────────

export interface ActivityEvent {
  id: string; event_name: string; user_id: string | null;
  page: string | null; metadata: Record<string, unknown> | null;
  error_message: string | null; created_at: string;
}

export async function queryActivityFeed(): Promise<ActivityEvent[]> {
  const { data } = await supabase
    .from("event_logs")
    .select("id, event_name, user_id, page, metadata, error_message, created_at")
    .in("event_name", [
      "order_created", "login_success", "performer_assigned",
      "client_confirmed_completion", "dispute_opened", "order_cancelled",
      "react_error", "api_error", "payment_success", "registration_completed",
      "performer_registered", "performer_verified",
    ])
    .order("created_at", { ascending: false })
    .limit(40);
  return (data as ActivityEvent[]) ?? [];
}

// ─── Top services ─────────────────────────────────────────────────────────────

export interface TopServicesData {
  byCategory: { name: string; revenue: number; orders: number; avgPrice: number }[];
  byService:  { name: string; category: string; revenue: number; orders: number; avgPrice: number }[];
}

export async function queryTopServices(startDate: string): Promise<TopServicesData> {
  const { data } = await supabase
    .from("shared_orders")
    .select("category_name, service_name, price_total")
    .gte("created_at", startDate);

  if (!data) return { byCategory: [], byService: [] };

  const catMap: Record<string, { revenue: number; orders: number }> = {};
  const svcMap: Record<string, { revenue: number; orders: number; category: string }> = {};

  for (const r of data) {
    const cat = (r.category_name as string) ?? "Другое";
    const svc = (r.service_name  as string) ?? "Другое";
    const rev = (r.price_total   as number) ?? 0;

    if (!catMap[cat]) catMap[cat] = { revenue: 0, orders: 0 };
    catMap[cat].revenue += rev; catMap[cat].orders++;

    if (!svcMap[svc]) svcMap[svc] = { revenue: 0, orders: 0, category: cat };
    svcMap[svc].revenue += rev; svcMap[svc].orders++;
  }

  return {
    byCategory: Object.entries(catMap)
      .map(([name, v]) => ({ name, ...v, avgPrice: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0 }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 8),
    byService: Object.entries(svcMap)
      .map(([name, v]) => ({ name, category: v.category, revenue: v.revenue, orders: v.orders, avgPrice: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
  };
}

// ─── Retention ────────────────────────────────────────────────────────────────

export interface RetentionData {
  d1: number; d7: number; d30: number; repeatUsers: number; totalUsers: number;
}

export async function queryRetention(startDate: string): Promise<RetentionData> {
  const { data } = await supabase
    .from("event_logs")
    .select("user_id, created_at")
    .gte("created_at", startDate)
    .not("user_id", "is", null);

  if (!data || data.length === 0) return { d1: 0, d7: 0, d30: 0, repeatUsers: 0, totalUsers: 0 };

  const userDays: Record<string, Set<string>> = {};
  for (const r of data) {
    if (!userDays[r.user_id]) userDays[r.user_id] = new Set();
    userDays[r.user_id].add((r.created_at as string).slice(0, 10));
  }

  const users = Object.entries(userDays);
  let d1 = 0, d7 = 0, d30 = 0;
  for (const [, days] of users) {
    const first = new Date(Array.from(days).sort()[0]);
    const plus = (n: number) => { const d = new Date(first); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    if (days.has(plus(1)))  d1++;
    if (days.has(plus(7)))  d7++;
    if (days.has(plus(30))) d30++;
  }

  const total = users.length;
  return {
    d1:  total > 0 ? Math.round((d1  / total) * 100) : 0,
    d7:  total > 0 ? Math.round((d7  / total) * 100) : 0,
    d30: total > 0 ? Math.round((d30 / total) * 100) : 0,
    repeatUsers: users.filter(([, days]) => days.size > 1).length,
    totalUsers: total,
  };
}

// ─── LTV estimate ─────────────────────────────────────────────────────────────

export interface LTVData { ltv: number; avgOrdersPerUser: number; avgOrderValue: number }

export async function queryLTV(): Promise<LTVData> {
  const { data } = await supabase
    .from("shared_orders")
    .select("client_email, price_total")
    .eq("status", "completed");

  if (!data || data.length === 0) return { ltv: 0, avgOrdersPerUser: 0, avgOrderValue: 0 };

  const perUser: Record<string, { count: number; revenue: number }> = {};
  for (const r of data) {
    const email = (r.client_email as string) ?? "anon";
    if (!perUser[email]) perUser[email] = { count: 0, revenue: 0 };
    perUser[email].count++;
    perUser[email].revenue += (r.price_total as number) ?? 0;
  }

  const users = Object.values(perUser);
  const avgOrdersPerUser = users.length > 0 ? users.reduce((s, u) => s + u.count, 0) / users.length : 0;
  const avgOrderValue    = data.length > 0 ? data.reduce((s, r) => s + ((r.price_total as number) ?? 0), 0) / data.length : 0;

  return {
    ltv: Math.round(avgOrdersPerUser * avgOrderValue),
    avgOrdersPerUser: +avgOrdersPerUser.toFixed(1),
    avgOrderValue: Math.round(avgOrderValue),
  };
}

// ─── Business KPIs ────────────────────────────────────────────────────────────

export interface BusinessKPIsData {
  ordersPerDay: number;
  fillRate: number;
  cancelRate: number;
  repeatRate: number;
  timeToAssignHours: number | null;
  commissionPerOrder: number;
  totalOrders: number;
  daysInRange: number;
}

export async function queryBusinessKPIs(startDate: string, timeRange: TimeRange): Promise<BusinessKPIsData> {
  const daysInRange = timeRange === "today" ? 1
    : timeRange === "7d"  ? 7
    : timeRange === "30d" ? 30 : 90;

  const [{ data: orders }, { data: allCompletedOrders }, { data: assignEvents }, { data: createdEvents }] = await Promise.all([
    supabase.from("shared_orders")
      .select("id, status, performer_id, price_total, client_email")
      .gte("created_at", startDate),
    supabase.from("shared_orders")
      .select("client_email")
      .eq("status", "completed"),
    supabase.from("event_logs")
      .select("created_at, metadata")
      .eq("event_name", "performer_assigned")
      .gte("created_at", startDate)
      .limit(200),
    supabase.from("event_logs")
      .select("created_at, metadata")
      .eq("event_name", "order_created")
      .gte("created_at", startDate)
      .limit(200),
  ]);

  const all = orders ?? [];
  const total = all.length;
  const assigned = all.filter(o => o.performer_id).length;
  const cancelled = all.filter(o => o.status === "cancelled").length;

  const fillRate    = total > 0 ? Math.round((assigned / total) * 100) : 0;
  const cancelRate  = total > 0 ? Math.round((cancelled / total) * 100) : 0;
  const ordersPerDay = total > 0 ? +(total / daysInRange).toFixed(1) : 0;

  // Repeat rate: % of clients with 2+ completed orders
  const clientCounts: Record<string, number> = {};
  for (const r of allCompletedOrders ?? []) {
    const email = r.client_email as string;
    if (email) clientCounts[email] = (clientCounts[email] ?? 0) + 1;
  }
  const uniqueClients = Object.keys(clientCounts).length;
  const repeatClients = Object.values(clientCounts).filter((c) => c >= 2).length;
  const repeatRate = uniqueClients > 0 ? Math.round((repeatClients / uniqueClients) * 100) : 0;

  // Commission per order: 15% of avg paid order value
  const paid = all.filter((o) => !["cancelled", "searching_performer"].includes(o.status as string));
  const avgPrice = paid.length > 0 ? paid.reduce((s, o) => s + ((o.price_total as number) ?? 0), 0) / paid.length : 0;
  const commissionPerOrder = Math.round(avgPrice * 0.15);

  // Time-to-assign: match order_created ↔ performer_assigned via metadata.order_id
  let timeToAssignHours: number | null = null;
  try {
    const createdMap: Record<string, number> = {};
    for (const e of createdEvents ?? []) {
      const orderId = (e.metadata as Record<string, unknown> | null)?.order_id as string | undefined;
      if (orderId) createdMap[orderId] = new Date(e.created_at as string).getTime();
    }
    const deltas: number[] = [];
    for (const e of assignEvents ?? []) {
      const orderId = (e.metadata as Record<string, unknown> | null)?.order_id as string | undefined;
      if (orderId && createdMap[orderId]) {
        const delta = (new Date(e.created_at as string).getTime() - createdMap[orderId]) / 3600000;
        if (delta >= 0 && delta < 72) deltas.push(delta);
      }
    }
    if (deltas.length > 0) {
      timeToAssignHours = +(deltas.reduce((s, d) => s + d, 0) / deltas.length).toFixed(1);
    }
  } catch {
    timeToAssignHours = null;
  }

  return { ordersPerDay, fillRate, cancelRate, repeatRate, timeToAssignHours, commissionPerOrder, totalOrders: total, daysInRange };
}
