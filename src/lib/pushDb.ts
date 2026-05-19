import { supabase } from "./supabase";

export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

// ─── Subscribe / Unsubscribe ──────────────────────────────────────────────────

export async function dbSavePushSubscription(
  userId: string,
  sub: PushSubscription
): Promise<void> {
  const json = sub.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!p256dh || !auth) return;

  await supabase.from("push_subscriptions").upsert(
    { user_id: userId, endpoint: sub.endpoint, p256dh, auth },
    { onConflict: "user_id,endpoint" }
  );
}

export async function dbRemovePushSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);
}

// ─── Send push via Edge Function ─────────────────────────────────────────────

export async function dbSendPushToUsers(
  target: { userIds?: string[]; emails?: string[] },
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<void> {
  try {
    await supabase.functions.invoke("send-push", {
      body: { ...target, ...payload },
    });
  } catch {
    // Never crash the caller
  }
}

// ─── Notification preference helpers ─────────────────────────────────────────

export async function dbGetNotificationPrefs(userId: string): Promise<{
  pushEnabled: boolean;
  orderNotifications: boolean;
  chatNotifications: boolean;
}> {
  const { data } = await supabase
    .from("profiles")
    .select("push_enabled, order_notifications_enabled, chat_notifications_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    pushEnabled: data?.push_enabled ?? true,
    orderNotifications: data?.order_notifications_enabled ?? true,
    chatNotifications: data?.chat_notifications_enabled ?? true,
  };
}

export async function dbUpdateNotificationPrefs(
  userId: string,
  prefs: Partial<{
    pushEnabled: boolean;
    orderNotifications: boolean;
    chatNotifications: boolean;
  }>
): Promise<void> {
  const update: Record<string, boolean> = {};
  if (prefs.pushEnabled !== undefined) update.push_enabled = prefs.pushEnabled;
  if (prefs.orderNotifications !== undefined) update.order_notifications_enabled = prefs.orderNotifications;
  if (prefs.chatNotifications !== undefined) update.chat_notifications_enabled = prefs.chatNotifications;
  if (!Object.keys(update).length) return;
  await supabase.from("profiles").update(update).eq("user_id", userId);
}
