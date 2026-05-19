import { supabase } from "./supabase";

export interface PayoutRequest {
  id: string;
  performerId: string;
  amount: number;
  cardLast4: string;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedAt: string;
  reviewedAt?: string | null;
  adminNote?: string | null;
  balanceSnapshot?: number | null;
  // Joined from performer_profiles (admin view)
  performerName?: string;
  performerPhone?: string;
}

function rowToRequest(r: Record<string, unknown>): PayoutRequest {
  const profile = r.performer_profiles as Record<string, unknown> | null;
  return {
    id: r.id as string,
    performerId: r.performer_id as string,
    amount: r.amount as number,
    cardLast4: r.card_last4 as string,
    status: r.status as PayoutRequest["status"],
    requestedAt: r.requested_at as string,
    reviewedAt: r.reviewed_at as string | null,
    adminNote: r.admin_note as string | null,
    balanceSnapshot: r.balance_snapshot as number | null,
    performerName: (profile?.name as string) ?? undefined,
    performerPhone: (profile?.phone as string) ?? undefined,
  };
}

// ── Performer: request withdrawal ──────────────────────────────────────────────

export async function dbCreatePayoutRequest(
  performerId: string,
  amount: number,
  cardLast4: string,
  balanceSnapshot: number
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("payout_requests").insert({
    performer_id: performerId,
    amount,
    card_last4: cardLast4,
    balance_snapshot: balanceSnapshot,
  });
  if (error) {
    if (error.code === "42501") return { success: false, error: "Верификация не пройдена или недостаточно средств" };
    return { success: false, error: "Не удалось создать заявку. Попробуйте позже." };
  }
  return { success: true };
}

export async function dbGetMyPayoutRequests(performerId: string): Promise<PayoutRequest[]> {
  const { data } = await supabase
    .from("payout_requests")
    .select("*")
    .eq("performer_id", performerId)
    .order("requested_at", { ascending: false });
  return (data ?? []).map((r) => rowToRequest(r as Record<string, unknown>));
}

// ── Admin: list & manage payouts ───────────────────────────────────────────────

export async function dbGetAllPayoutRequests(): Promise<PayoutRequest[]> {
  const { data } = await supabase
    .from("payout_requests")
    .select("*, performer_profiles!inner(name, phone)")
    .order("requested_at", { ascending: false });
  return (data ?? []).map((r) => rowToRequest(r as Record<string, unknown>));
}

export async function dbApprovePayoutRequest(
  requestId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc("rpc_approve_payout", {
    p_request_id: requestId,
    p_note: note ?? null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function dbRejectPayoutRequest(
  requestId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc("rpc_reject_payout", {
    p_request_id: requestId,
    p_note: note ?? null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Audit helper ───────────────────────────────────────────────────────────────

export async function dbLogAudit(
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await supabase.rpc("rpc_log_audit", {
    p_action: action,
    p_resource_type: resourceType ?? null,
    p_resource_id: resourceId ?? null,
    p_details: details ?? {},
  }).then(() => {}, () => {}); // never crash the caller
}
