import { supabase } from "../../lib/supabase";
import type { AdminStats, AdminOrder, AdminPerformer, AdminDispute } from "../types";

export async function adminLoadStats(): Promise<AdminStats> {
  const today = new Date().toISOString().split("T")[0];

  const [ordersRes, performersRes, disputesRes, payoutsRes] = await Promise.all([
    supabase.from("shared_orders").select("id, status, price_total, created_at"),
    supabase.from("performer_profiles").select("id, pending_balance"),
    supabase.from("shared_orders").select("id").eq("status", "dispute_opened"),
    supabase.from("performer_profiles").select("id, pending_balance").gt("pending_balance", 0),
  ]);

  const orders = ordersRes.data ?? [];
  const performers = performersRes.data ?? [];

  const activeOrders = orders.filter((o) =>
    ["accepted", "on_the_way", "in_progress", "waiting_client_confirmation", "searching_performer"].includes(o.status)
  ).length;

  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const searchingOrders = orders.filter((o) => o.status === "searching_performer").length;
  const openDisputes = (disputesRes.data ?? []).length;
  const pendingPayouts = (payoutsRes.data ?? []).length;
  const revenueTotal = orders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + (o.price_total ?? 0), 0);
  const ordersToday = orders.filter((o) => o.created_at?.startsWith(today)).length;

  return {
    activeOrders,
    completedOrders,
    searchingOrders,
    performersTotal: performers.length,
    openDisputes,
    pendingPayouts,
    revenueTotal,
    ordersToday,
  };
}

export async function adminLoadOrders(statusFilter?: string): Promise<AdminOrder[]> {
  let query = supabase
    .from("shared_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data } = await query;
  if (!data) return [];

  return data.map((r) => ({
    id: r.id as string,
    clientName: (r.client_name as string) ?? "—",
    clientEmail: (r.client_email as string) ?? "—",
    clientPhone: (r.client_phone as string) ?? "—",
    performerName: (r.performer_name as string) ?? null,
    performerId: (r.performer_id as string) ?? null,
    categoryName: (r.category_name as string) ?? "—",
    serviceName: (r.service_name as string) ?? "—",
    address: (r.address as string) ?? "—",
    priceTotal: (r.price_total as number) ?? 0,
    status: (r.status as string) ?? "—",
    scheduledDate: (r.scheduled_date as string) ?? "—",
    scheduledTime: (r.scheduled_time as string) ?? "—",
    createdAt: (r.created_at as string) ?? "",
    completionComment: (r.completion_comment as string) ?? null,
    disputeComment: (r.dispute_comment as string) ?? null,
    clientRating: (r.client_rating as number) ?? null,
  }));
}

export async function adminLoadPerformers(): Promise<AdminPerformer[]> {
  const { data } = await supabase
    .from("performer_profiles")
    .select("*")
    .order("completed_orders", { ascending: false });

  if (!data) return [];

  return data.map((r) => ({
    id: r.user_id as string,
    name: (r.name as string) ?? "—",
    phone: (r.phone as string) ?? "—",
    telegram: (r.telegram as string) ?? "—",
    rating: (r.rating as number) ?? 0,
    completedOrders: (r.completed_orders as number) ?? 0,
    balance: (r.balance as number) ?? 0,
    pendingBalance: (r.pending_balance as number) ?? 0,
    address: (r.address as string) ?? "—",
    city: (r.city as string) ?? "—",
    workRadius: (r.work_radius as number) ?? 10,
    specializations: (r.specializations as string[]) ?? [],
    isOnline: (r.is_online as boolean) ?? false,
    verificationStatus: ((r.verification_status as string) ?? "pending") as "pending" | "approved" | "rejected",
    createdAt: (r.created_at as string) ?? undefined,
  }));
}

export async function adminLoadDisputes(): Promise<AdminDispute[]> {
  const { data } = await supabase
    .from("shared_orders")
    .select("*")
    .eq("status", "dispute_opened")
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((r) => ({
    id: r.id as string,
    orderId: r.id as string,
    clientName: (r.client_name as string) ?? "—",
    performerName: (r.performer_name as string) ?? "—",
    serviceName: (r.service_name as string) ?? "—",
    priceTotal: (r.price_total as number) ?? 0,
    disputeComment: (r.dispute_comment as string) ?? null,
    status: "open",
    createdAt: (r.created_at as string) ?? "",
  }));
}

export async function adminUpdateOrderStatus(orderId: string, status: string): Promise<void> {
  await supabase.from("shared_orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
}

export async function adminCancelOrder(orderId: string): Promise<void> {
  await supabase.from("shared_orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", orderId);
}

export async function adminGetUserRole(userId: string): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return (data?.role as string) ?? null;
}

export async function adminAdjustPerformerBalance(performerId: string, delta: number): Promise<void> {
  const { data } = await supabase.from("performer_profiles").select("balance").eq("user_id", performerId).single();
  const current = (data?.balance as number) ?? 0;
  await supabase.from("performer_profiles").update({ balance: current + delta }).eq("user_id", performerId);
}

export async function adminApprovePerformerPayout(performerId: string): Promise<void> {
  await supabase.from("performer_profiles").update({ pending_balance: 0 }).eq("user_id", performerId);
}
