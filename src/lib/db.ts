import { supabase } from "./supabase";
import type { UserProfile, Address, Order, PriceItem } from "../dashboard/types";
import type { PerformerProfile } from "../performer/types";
import type { SharedOrder, SharedOrderStatus, PerformerInfo } from "../store/sharedOrdersStore";

// ─── Client Profile ────────────────────────────────────────────────────────────

export async function dbLoadProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    avatar: data.avatar || undefined,
    notifyEmail: data.notify_email,
    notifySms: data.notify_sms,
    notifyPush: data.notify_push,
  };
}

export async function dbSaveProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  const row: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
  if (profile.name !== undefined) row.name = profile.name;
  if (profile.email !== undefined) row.email = profile.email;
  if (profile.phone !== undefined) row.phone = profile.phone;
  if (profile.address !== undefined) row.address = profile.address;
  if (profile.avatar !== undefined) row.avatar = profile.avatar;
  if (profile.notifyEmail !== undefined) row.notify_email = profile.notifyEmail;
  if (profile.notifySms !== undefined) row.notify_sms = profile.notifySms;
  if (profile.notifyPush !== undefined) row.notify_push = profile.notifyPush;
  await supabase.from("profiles").upsert(row, { onConflict: "user_id" });
}

// ─── Addresses ────────────────────────────────────────────────────────────────

export async function dbLoadAddresses(userId: string): Promise<Address[]> {
  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    label: r.label,
    street: r.street,
    city: r.city,
    isDefault: r.is_default,
  }));
}

export async function dbAddAddress(userId: string, addr: Omit<Address, "id">, id: string): Promise<void> {
  await supabase.from("addresses").insert({
    id,
    user_id: userId,
    label: addr.label,
    street: addr.street,
    city: addr.city,
    is_default: addr.isDefault,
  });
}

export async function dbDeleteAddress(id: string): Promise<void> {
  await supabase.from("addresses").delete().eq("id", id);
}

export async function dbSetDefaultAddress(userId: string, id: string): Promise<void> {
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  await supabase.from("addresses").update({ is_default: true }).eq("id", id);
}

// ─── Order history ─────────────────────────────────────────────────────────────

export async function dbLoadOrders(userId: string): Promise<Order[]> {
  const { data } = await supabase
    .from("order_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!data) return [];
  return data.map(rowToOrder);
}

export async function dbSaveOrder(userId: string, order: Order): Promise<void> {
  await supabase.from("order_history").upsert(
    {
      id: order.id,
      user_id: userId,
      category_name: order.categoryName,
      service_name: order.serviceName,
      service_id: order.serviceId,
      address: order.address,
      price_total: order.priceTotal,
      price_breakdown: order.priceBreakdown,
      duration: order.duration,
      comment: order.comment ?? "",
      status: order.status,
      scheduled_date: order.scheduledDate,
      scheduled_time: order.scheduledTime,
      performer_id: order.performer?.id ?? null,
      performer_name: order.performer?.name ?? null,
      performer_phone: order.performer?.phone ?? null,
      performer_telegram: order.performer?.telegram ?? null,
      performer_rating: order.performer?.rating ?? null,
      performer_avatar: order.performer?.avatar ?? null,
      performer_jobs_completed: order.performer?.jobsCompleted ?? null,
      performer_review_count: order.performer?.reviewCount ?? null,
      field_values: order.fieldValues ?? {},
      timeline: order.timeline ?? [],
      eta: order.eta ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}

export async function dbUpdateOrder(id: string, fields: Record<string, unknown>): Promise<void> {
  await supabase
    .from("order_history")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function dbDeleteOrder(id: string): Promise<void> {
  await supabase.from("order_history").delete().eq("id", id);
}

function rowToOrder(r: Record<string, unknown>): Order {
  const performerName = ((r.performer_name as string) || "").trim();
  const performer = performerName
    ? {
        id: (r.performer_id as string) ?? "",
        name: performerName,
        avatar: (r.performer_avatar as string) ?? "",
        rating: (r.performer_rating as number) ?? 0,
        reviewCount: (r.performer_review_count as number) ?? 0,
        phone: (r.performer_phone as string) ?? "",
        jobsCompleted: (r.performer_jobs_completed as number) ?? 0,
        telegram: (r.performer_telegram as string) ?? undefined,
      }
    : null;

  return {
    id: r.id as string,
    createdAt: r.created_at as string,
    scheduledDate: r.scheduled_date as string,
    scheduledTime: r.scheduled_time as string,
    status: r.status as Order["status"],
    categoryName: r.category_name as string,
    serviceName: r.service_name as string,
    serviceId: r.service_id as string,
    address: r.address as string,
    priceTotal: r.price_total as number,
    priceBreakdown: (r.price_breakdown as Order["priceBreakdown"]) ?? [],
    performer,
    eta: (r.eta as string) ?? null,
    duration: (r.duration as string) ?? "",
    comment: (r.comment as string) ?? "",
    assignedAt: (r.assigned_at as string) ?? undefined,
    fieldValues: (r.field_values as Order["fieldValues"]) ?? {},
    timeline: (r.timeline as Order["timeline"]) ?? [],
    completionComment: (r.completion_comment as string) ?? null,
    completionRequestedAt: (r.completion_requested_at as string) ?? null,
    clientRating: (r.client_rating as number) ?? null,
    clientReview: (r.client_review as string) ?? null,
  };
}

// ─── Performer Profile ─────────────────────────────────────────────────────────

export async function dbLoadPerformerProfile(userId: string): Promise<PerformerProfile | null> {
  const { data } = await supabase
    .from("performer_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (!data) return null;
  return {
    id: data.user_id,
    name: data.name,
    avatar: data.avatar,
    rating: data.rating,
    completedOrders: data.completed_orders,
    phone: data.phone,
    telegram: data.telegram,
    specializations: data.specializations ?? [],
    address: data.address,
    city: data.city,
    lat: data.lat,
    lng: data.lng,
    workRadius: data.work_radius,
  };
}

export async function dbSavePerformerProfile(userId: string, profile: Partial<PerformerProfile>): Promise<void> {
  const row: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
  if (profile.name !== undefined) row.name = profile.name;
  if (profile.phone !== undefined) row.phone = profile.phone;
  if (profile.telegram !== undefined) row.telegram = profile.telegram;
  if (profile.avatar !== undefined) row.avatar = profile.avatar;
  if (profile.rating !== undefined) row.rating = profile.rating;
  if (profile.completedOrders !== undefined) row.completed_orders = profile.completedOrders;
  if (profile.specializations !== undefined) row.specializations = profile.specializations;
  if (profile.address !== undefined) row.address = profile.address;
  if (profile.city !== undefined) row.city = profile.city;
  if (profile.lat !== undefined) row.lat = profile.lat;
  if (profile.lng !== undefined) row.lng = profile.lng;
  if (profile.workRadius !== undefined) row.work_radius = profile.workRadius;
  await supabase.from("performer_profiles").upsert(row, { onConflict: "user_id" });
}

export async function dbLoadPerformerBalance(userId: string): Promise<{ balance: number; pendingBalance: number } | null> {
  const { data } = await supabase
    .from("performer_profiles")
    .select("balance, pending_balance")
    .eq("user_id", userId)
    .single();
  if (!data) return null;
  return { balance: data.balance, pendingBalance: data.pending_balance };
}

export async function dbUpdatePerformerBalance(userId: string, balance: number, pendingBalance: number): Promise<void> {
  await supabase
    .from("performer_profiles")
    .update({ balance, pending_balance: pendingBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

// ─── Shared Orders (cross-session order board) ────────────────────────────────

function rowToSharedOrder(r: Record<string, unknown>): SharedOrder {
  return {
    id: r.id as string,
    createdAt: r.created_at as string,
    scheduledDate: r.scheduled_date as string,
    scheduledTime: r.scheduled_time as string,
    status: r.status as SharedOrderStatus,
    categoryName: r.category_name as string,
    serviceName: r.service_name as string,
    address: r.address as string,
    priceTotal: r.price_total as number,
    priceBreakdown: (r.price_breakdown as PriceItem[]) ?? [],
    duration: r.duration as string,
    comment: (r.comment as string) ?? undefined,
    clientEmail: r.client_email as string,
    clientName: r.client_name as string,
    clientPhone: r.client_phone as string,
    performerId: (r.performer_id as string) ?? null,
    performerName: (r.performer_name as string) ?? null,
    performerPhone: (r.performer_phone as string) ?? null,
    performerTelegram: (r.performer_telegram as string) ?? null,
    performerRating: (r.performer_rating as number) ?? null,
    performerAvatar: (r.performer_avatar as string) ?? null,
    performerJobsCompleted: (r.performer_jobs_completed as number) ?? null,
    acceptedAt: (r.accepted_at as string) ?? null,
    completionComment: (r.completion_comment as string) ?? null,
    completionRequestedAt: (r.completion_requested_at as string) ?? null,
    clientConfirmedAt: (r.client_confirmed_at as string) ?? null,
    disputeComment: (r.dispute_comment as string) ?? null,
    performerLat: (r.performer_lat as number) ?? null,
    performerLng: (r.performer_lng as number) ?? null,
    performerLastSeen: (r.performer_last_seen as string) ?? null,
    clientRating: (r.client_rating as number) ?? null,
    clientReview: (r.client_review as string) ?? null,
  };
}

export async function dbCreateSharedOrder(order: SharedOrder): Promise<void> {
  await supabase.from("shared_orders").insert({
    id: order.id,
    status: order.status,
    scheduled_date: order.scheduledDate,
    scheduled_time: order.scheduledTime,
    category_name: order.categoryName,
    service_name: order.serviceName,
    address: order.address,
    price_total: order.priceTotal,
    price_breakdown: order.priceBreakdown,
    duration: order.duration,
    comment: order.comment ?? null,
    client_email: order.clientEmail,
    client_name: order.clientName,
    client_phone: order.clientPhone,
  });
}

export async function dbLoadSearchingOrders(): Promise<SharedOrder[]> {
  const { data } = await supabase
    .from("shared_orders")
    .select("*")
    .eq("status", "searching_performer")
    .order("created_at", { ascending: false });
  if (!data) return [];
  return data.map(rowToSharedOrder);
}

/** Atomically claim an order. Returns true if this performer got it, false if already taken. */
export async function dbAcceptSharedOrder(orderId: string, performer: PerformerInfo): Promise<boolean> {
  const { data, error } = await supabase
    .from("shared_orders")
    .update({
      status: "performer_assigned",
      performer_id: performer.id,
      performer_name: performer.name,
      performer_phone: performer.phone,
      performer_telegram: performer.telegram,
      performer_rating: performer.rating,
      performer_avatar: performer.avatar,
      performer_jobs_completed: performer.jobsCompleted,
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "searching_performer")
    .select("id");
  return !error && Array.isArray(data) && data.length > 0;
}

/** Subscribe to new shared orders appearing in DB. Returns an unsubscribe function. */
export function dbSubscribeSharedOrders(onNew: (order: SharedOrder) => void): () => void {
  const channel = supabase
    .channel("shared_orders_inserts")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "shared_orders" },
      (payload) => onNew(rowToSharedOrder(payload.new as Record<string, unknown>))
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/** Subscribe to UPDATE events on shared_orders.
 *  Pass orderId to filter to one order, or "__all__" to receive every update
 *  (caller handles filtering). */
export function dbSubscribeSharedOrderUpdates(
  orderId: string,
  onUpdate: (order: SharedOrder) => void
): () => void {
  const channel = supabase
    .channel(`shared_orders_updates_${orderId}_${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "shared_orders" },
      (payload) => {
        const updated = rowToSharedOrder(payload.new as Record<string, unknown>);
        if (orderId === "__all__" || updated.id === orderId) onUpdate(updated);
      }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function dbLoadPerformerActiveOrders(performerId: string): Promise<SharedOrder[]> {
  const { data } = await supabase
    .from("shared_orders")
    .select("*")
    .eq("performer_id", performerId)
    .in("status", ["performer_assigned", "in_progress", "waiting_client_confirmation"])
    .order("created_at", { ascending: false });
  if (!data) return [];
  return data.map(rowToSharedOrder);
}

export async function dbGetSharedOrder(orderId: string): Promise<SharedOrder | null> {
  const { data } = await supabase
    .from("shared_orders")
    .select("*")
    .eq("id", orderId)
    .single();
  return data ? rowToSharedOrder(data as Record<string, unknown>) : null;
}

export async function dbCancelSharedOrder(orderId: string): Promise<void> {
  await supabase
    .from("shared_orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId);
}

export async function dbRequestOrderCompletion(orderId: string, comment: string): Promise<void> {
  const now = new Date().toISOString();
  // Status update is always attempted first — critical for client to receive update
  await supabase.from("shared_orders")
    .update({ status: "waiting_client_confirmation", updated_at: now })
    .eq("id", orderId);
  // Metadata columns may not exist yet — fail silently if migration not run
  await supabase.from("shared_orders")
    .update({ completion_comment: comment, completion_requested_at: now })
    .eq("id", orderId)
    .then(() => {}, () => {});
  await dbUpdateOrder(orderId, {
    status: "waiting_client_confirmation",
    completion_comment: comment,
    completion_requested_at: now,
  });
}

export async function dbConfirmOrderCompletion(orderId: string): Promise<void> {
  const now = new Date().toISOString();
  await supabase.from("shared_orders")
    .update({ status: "completed", updated_at: now })
    .eq("id", orderId);
  await supabase.from("shared_orders")
    .update({ client_confirmed_at: now })
    .eq("id", orderId)
    .then(() => {}, () => {});
  await dbUpdateOrder(orderId, { status: "completed", client_confirmed_at: now });
}

export async function dbUpdateSharedOrderStatus(orderId: string, status: string): Promise<void> {
  await supabase
    .from("shared_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);
}

export async function dbUpdatePerformerLocation(orderId: string, lat: number, lng: number): Promise<void> {
  await supabase
    .from("shared_orders")
    .update({
      performer_lat: lat,
      performer_lng: lng,
      performer_last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function dbCreateReview(
  orderId: string,
  clientId: string,
  performerId: string,
  rating: number,
  comment: string
): Promise<boolean> {
  const { error } = await supabase.from("reviews").insert({
    order_id: orderId,
    client_id: clientId,
    performer_id: performerId,
    rating,
    comment,
  });
  if (error) return false;
  // Also store rating on the order itself for quick reads
  await supabase.from("shared_orders")
    .update({ client_rating: rating, client_review: comment })
    .eq("id", orderId)
    .then(() => {}, () => {});
  await dbUpdateOrder(orderId, { client_rating: rating, client_review: comment });

  // Recalculate performer's average rating from all reviews
  const { data: allReviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("performer_id", performerId);
  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length;
    const rounded = Math.round(avg * 10) / 10;
    await supabase.from("performer_profiles").update({ rating: rounded }).eq("user_id", performerId);
  }

  return true;
}

export async function dbLoadPerformerCompletedOrders(performerId: string): Promise<SharedOrder[]> {
  const { data } = await supabase
    .from("shared_orders")
    .select("*")
    .eq("performer_id", performerId)
    .in("status", ["completed", "cancelled"])
    .order("created_at", { ascending: false });
  if (!data) return [];
  return data.map(rowToSharedOrder);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface DBNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export async function dbLoadNotifications(userId: string): Promise<DBNotification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (!data) return [];
  return data.map((r) => ({
    id: r.id as string,
    type: r.type as string,
    title: r.title as string,
    body: r.body as string,
    orderId: (r.order_id as string) ?? undefined,
    read: r.read as boolean,
    createdAt: r.created_at as string,
  }));
}

export async function dbCreateNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  orderId?: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({ user_id: userId, type, title, body, order_id: orderId ?? null })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id as string;
}

export async function dbMarkNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function dbMarkAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from("notifications").update({ read: false }).eq("user_id", userId);
}

export async function dbSubscribeNotifications(
  userId: string,
  onNew: (n: DBNotification) => void
): Promise<() => void> {
  const channel = supabase
    .channel(`notifications_${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => {
        const r = payload.new as Record<string, unknown>;
        onNew({
          id: r.id as string,
          type: r.type as string,
          title: r.title as string,
          body: r.body as string,
          orderId: (r.order_id as string) ?? undefined,
          read: false,
          createdAt: r.created_at as string,
        });
      }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function dbOpenDispute(orderId: string, comment: string): Promise<void> {
  const now = new Date().toISOString();
  await supabase.from("shared_orders")
    .update({ status: "dispute_opened", updated_at: now })
    .eq("id", orderId);
  await supabase.from("shared_orders")
    .update({ dispute_comment: comment })
    .eq("id", orderId)
    .then(() => {}, () => {});
  await dbUpdateOrder(orderId, { status: "dispute_opened", dispute_comment: comment });
}
