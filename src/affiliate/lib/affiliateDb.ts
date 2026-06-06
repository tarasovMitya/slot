import { supabase } from "../../lib/supabase";
import type { AffiliatePerformer, AffiliateOrder, AffiliateEarning, AffiliateTask, AffiliateStats, ChecklistItem, TaskCategory, TaskWorkflowStatus } from "../types";

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function affiliateLoadStats(userId: string): Promise<AffiliateStats> {
  const [performersRes, ordersRes, earningsRes] = await Promise.all([
    supabase.from("performer_profiles").select("user_id").eq("affiliate_manager_id", userId),
    supabase.from("order_history").select("id, status, performer_id"),
    supabase.from("affiliate_earnings_log").select("affiliate_fee").eq("affiliate_id", userId),
  ]);

  const performers = performersRes.data ?? [];
  const performerIds = performers.map((p) => p.user_id as string);
  const orders = (ordersRes.data ?? []).filter((o) => performerIds.includes(o.performer_id as string));

  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const openDisputes = orders.filter((o) => o.status === "dispute_opened").length;
  const totalEarned = (earningsRes.data ?? []).reduce((s, r) => s + (r.affiliate_fee as number), 0);

  return {
    performersCount: performers.length,
    completedOrders,
    totalEarned,
    openDisputes,
  };
}

// ─── Performers ───────────────────────────────────────────────────────────────

export async function affiliateLoadPerformers(userId: string): Promise<AffiliatePerformer[]> {
  const { data } = await supabase
    .from("performer_profiles")
    .select("*")
    .eq("affiliate_manager_id", userId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((r) => ({
    id: r.user_id as string,
    name: (r.name as string) ?? "—",
    phone: (r.phone as string) ?? "—",
    telegram: (r.telegram as string) ?? "—",
    avatar: (r.avatar as string) ?? "",
    rating: (r.rating as number) ?? 0,
    completedOrders: (r.completed_orders as number) ?? 0,
    balance: (r.balance as number) ?? 0,
    isOnline: (r.is_online as boolean) ?? false,
    verificationStatus: ((r.verification_status as string) ?? "pending") as "pending" | "approved" | "rejected",
    specializations: (r.specializations as string[]) ?? [],
    createdAt: (r.created_at as string) ?? undefined,
  }));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function affiliateLoadOrders(userId: string, statusFilter?: string): Promise<AffiliateOrder[]> {
  // First get performer IDs
  const { data: performers } = await supabase
    .from("performer_profiles")
    .select("user_id, name")
    .eq("affiliate_manager_id", userId);

  if (!performers || performers.length === 0) return [];

  const performerIds = performers.map((p) => p.user_id as string);

  let query = supabase
    .from("order_history")
    .select("*")
    .in("performer_id", performerIds)
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data } = await query;
  if (!data) return [];

  return data.map((r) => ({
    id: r.id as string,
    performerName: (r.performer_name as string) ?? null,
    performerId: (r.performer_id as string) ?? null,
    clientName: (r.client_name as string) ?? "—",
    categoryName: (r.category_name as string) ?? "—",
    serviceName: (r.service_name as string) ?? "—",
    address: (r.address as string) ?? "—",
    priceTotal: (r.price_total as number) ?? 0,
    status: (r.status as string) ?? "—",
    scheduledDate: (r.scheduled_date as string) ?? "—",
    scheduledTime: (r.scheduled_time as string) ?? "—",
    createdAt: (r.created_at as string) ?? "",
    disputeComment: (r.dispute_comment as string) ?? null,
  }));
}

// ─── Earnings ─────────────────────────────────────────────────────────────────

export async function affiliateLoadEarnings(userId: string): Promise<AffiliateEarning[]> {
  const { data } = await supabase
    .from("affiliate_earnings_log")
    .select("*")
    .eq("affiliate_id", userId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  // Fetch performer names in one query
  const performerIds = [...new Set(data.map((r) => r.performer_id as string))];
  const { data: performers } = performerIds.length
    ? await supabase.from("performer_profiles").select("user_id, name").in("user_id", performerIds)
    : { data: [] };

  const nameMap = Object.fromEntries((performers ?? []).map((p) => [p.user_id, p.name]));

  return data.map((r) => ({
    id: r.id as string,
    orderId: r.order_id as string,
    performerId: r.performer_id as string,
    performerName: (nameMap[r.performer_id as string] as string) ?? "—",
    orderAmount: (r.order_amount as number) ?? 0,
    platformFee: (r.platform_fee as number) ?? 0,
    affiliateFee: (r.affiliate_fee as number) ?? 0,
    createdAt: (r.created_at as string) ?? "",
  }));
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function affiliateLoadTasks(userId: string): Promise<AffiliateTask[]> {
  const { data: tasks } = await supabase
    .from("affiliate_tasks")
    .select("*")
    .or(`target.eq.all,target.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (!tasks) return [];

  // Load completions for this user
  const taskIds = tasks.map((t) => t.id as string);
  const { data: completions } = taskIds.length
    ? await supabase
        .from("affiliate_task_completions")
        .select("task_id, completed_at")
        .eq("affiliate_id", userId)
        .in("task_id", taskIds)
    : { data: [] };

  const completionMap = Object.fromEntries(
    (completions ?? []).map((c) => [c.task_id, c.completed_at])
  );

  return tasks.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) ?? "",
    priority: ((r.priority as string) ?? "normal") as "low" | "normal" | "high",
    target: (r.target as string) ?? "all",
    dueDate: (r.due_date as string) ?? null,
    createdAt: (r.created_at as string) ?? "",
    completedAt: completionMap[r.id as string] ?? null,
    category: ((r.category as string) ?? "task") as TaskCategory,
    workflowStatus: ((r.workflow_status as string) ?? "todo") as TaskWorkflowStatus,
    checklist: (r.checklist as ChecklistItem[]) ?? [],
  }));
}

export async function affiliateUpdateChecklist(taskId: string, checklist: ChecklistItem[]): Promise<void> {
  await supabase.from("affiliate_tasks").update({ checklist }).eq("id", taskId);
}

export async function affiliateMarkTaskDone(taskId: string, affiliateId: string): Promise<void> {
  await supabase.from("affiliate_task_completions").upsert(
    { task_id: taskId, affiliate_id: affiliateId },
    { onConflict: "task_id,affiliate_id" }
  );
}

export async function affiliateUnmarkTask(taskId: string, affiliateId: string): Promise<void> {
  await supabase
    .from("affiliate_task_completions")
    .delete()
    .eq("task_id", taskId)
    .eq("affiliate_id", affiliateId);
}

// ─── Referral code ────────────────────────────────────────────────────────────

export async function affiliateGetOrCreateCode(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("affiliate_code")
    .eq("user_id", userId)
    .single();

  if (data?.affiliate_code) return data.affiliate_code as string;

  // Generate a new unique code
  const code = `aff_${userId.slice(0, 8)}_${Math.random().toString(36).slice(2, 7)}`;
  await supabase.from("profiles").update({ affiliate_code: code }).eq("user_id", userId);
  return code;
}

export async function affiliateGetReferralStats(userId: string): Promise<{ total: number; thisMonth: number }> {
  const { data } = await supabase
    .from("performer_profiles")
    .select("created_at")
    .eq("affiliate_manager_id", userId);

  const all = data ?? [];
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonth = all.filter((p) => (p.created_at as string) >= startOfMonth).length;

  return { total: all.length, thisMonth };
}

// ─── Register performer via referral ─────────────────────────────────────────

export async function affiliateLinkPerformerByCode(performerUserId: string, refCode: string): Promise<void> {
  // Find affiliate manager by code
  const { data } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("affiliate_code", refCode)
    .single();

  if (!data) return;

  await supabase
    .from("performer_profiles")
    .update({ affiliate_manager_id: data.user_id })
    .eq("user_id", performerUserId);
}

// ─── Admin: create task ───────────────────────────────────────────────────────

export async function adminCreateAffiliateTask(task: {
  title: string;
  description: string;
  priority: string;
  target: string;
  dueDate: string | null;
  createdBy: string;
  category?: string;
}): Promise<void> {
  await supabase.from("affiliate_tasks").insert({
    title: task.title,
    description: task.description,
    priority: task.priority,
    target: task.target,
    due_date: task.dueDate || null,
    created_by: task.createdBy,
    category: task.category ?? "task",
    workflow_status: "todo",
    checklist: [],
  });
}

export async function adminUpdateAffiliateTask(taskId: string, patch: {
  title?: string;
  description?: string;
  priority?: string;
  target?: string;
  dueDate?: string | null;
  category?: string;
  workflowStatus?: string;
  checklist?: ChecklistItem[];
}): Promise<void> {
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.priority !== undefined) update.priority = patch.priority;
  if (patch.target !== undefined) update.target = patch.target;
  if (patch.dueDate !== undefined) update.due_date = patch.dueDate || null;
  if (patch.category !== undefined) update.category = patch.category;
  if (patch.workflowStatus !== undefined) update.workflow_status = patch.workflowStatus;
  if (patch.checklist !== undefined) update.checklist = patch.checklist;
  await supabase.from("affiliate_tasks").update(update).eq("id", taskId);
}

export async function adminDeleteAffiliateTask(taskId: string): Promise<void> {
  await supabase.from("affiliate_tasks").delete().eq("id", taskId);
}

export async function adminLoadAffiliateTasks(): Promise<AffiliateTask[]> {
  const { data: tasks } = await supabase
    .from("affiliate_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (!tasks) return [];

  return tasks.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) ?? "",
    priority: ((r.priority as string) ?? "normal") as "low" | "normal" | "high",
    target: (r.target as string) ?? "all",
    dueDate: (r.due_date as string) ?? null,
    createdAt: (r.created_at as string) ?? "",
    completedAt: null,
    category: ((r.category as string) ?? "task") as TaskCategory,
    workflowStatus: ((r.workflow_status as string) ?? "todo") as TaskWorkflowStatus,
    checklist: (r.checklist as ChecklistItem[]) ?? [],
  }));
}

// ─── Verification queue ───────────────────────────────────────────────────────

export interface AffiliateVerificationItem {
  performerId: string;
  name: string;
  phone: string;
  city: string;
  specializations: string[];
  submittedAt: string;
  passportUrl: string | null;
  selfieUrl: string | null;
  experienceYears: number | null;
  experienceDescription: string | null;
}

export async function affiliateLoadVerificationQueue(userId: string): Promise<AffiliateVerificationItem[]> {
  const { data: performers } = await supabase
    .from("performer_profiles")
    .select("user_id, name, phone")
    .eq("affiliate_manager_id", userId)
    .eq("verification_status", "pending");

  if (!performers || performers.length === 0) return [];

  const ids = performers.map((p) => p.user_id as string);

  const { data: requests } = await supabase
    .from("verification_requests")
    .select("*")
    .in("performer_id", ids)
    .order("submitted_at", { ascending: false });

  const perfMap = Object.fromEntries(performers.map((p) => [p.user_id, p]));

  return (requests ?? []).map((r) => ({
    performerId: r.performer_id as string,
    name: (perfMap[r.performer_id as string]?.name as string) ?? "—",
    phone: (perfMap[r.performer_id as string]?.phone as string) ?? "—",
    city: (r.city as string) ?? "—",
    specializations: (r.specializations as string[]) ?? [],
    submittedAt: (r.submitted_at as string) ?? "",
    passportUrl: (r.passport_url as string) ?? null,
    selfieUrl: (r.selfie_url as string) ?? null,
    experienceYears: (r.experience_years as number) ?? null,
    experienceDescription: (r.experience_description as string) ?? null,
  }));
}

export async function affiliateApprovePerformer(performerId: string): Promise<void> {
  await supabase
    .from("performer_profiles")
    .update({ verification_status: "approved", rejection_reason: null })
    .eq("user_id", performerId);
}

export async function affiliateRejectPerformer(performerId: string, reason: string): Promise<void> {
  await supabase
    .from("performer_profiles")
    .update({ verification_status: "rejected", rejection_reason: reason })
    .eq("user_id", performerId);
}

export async function adminLoadAffiliateManagers(): Promise<{ id: string; name: string; email: string }[]> {
  const { data } = await supabase
    .from("profiles")
    .select("user_id, name, email")
    .eq("role", "affiliate_manager")
    .order("name");

  return (data ?? []).map((r) => ({
    id: r.user_id as string,
    name: (r.name as string) ?? "—",
    email: (r.email as string) ?? "—",
  }));
}
