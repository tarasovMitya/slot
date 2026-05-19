import { supabase } from "./supabase";
import { useAuthStore } from "../store/authStore";

// ─── Event Types ──────────────────────────────────────────────────────────────

export type EventName =
  // Auth
  | "login_started" | "login_success" | "login_failed" | "magic_link_sent"
  | "auth_session_restored" | "logout"
  // Calculator
  | "calculator_started" | "category_selected" | "service_selected"
  | "params_changed" | "price_calculated" | "calculator_completed"
  | "cart_item_added" | "flow_abandoned"
  // Funnel
  | "registration_started" | "registration_completed"
  | "payment_started" | "payment_success" | "payment_failed"
  // Orders
  | "order_created" | "performer_search_started" | "performer_assigned"
  | "performer_rejected" | "order_started" | "order_completed"
  | "client_confirmed_completion" | "dispute_opened" | "order_cancelled"
  // Performer
  | "performer_onboarding_started" | "performer_onboarding_step"
  | "performer_registered" | "performer_verified"
  | "order_accepted" | "performer_status_changed"
  // Verification
  | "verification_started" | "verification_submitted"
  | "verification_approved" | "verification_rejected"
  // Chat
  | "message_sent" | "chat_escalated"
  // Schedule
  | "schedule_opened" | "timeline_order_clicked"
  // Errors
  | "api_error" | "react_error" | "auth_error" | "db_error"
  | "realtime_error" | "network_error"
  // Navigation
  | "page_view" | "step_changed";

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

// ─── Internal queue (batch writes) ───────────────────────────────────────────

interface QueuedEvent {
  user_id: string | null;
  session_id: string;
  role: string | null;
  event_name: string;
  page: string;
  metadata: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
}

const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem("_sid");
    if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem("_sid", sid); }
    return sid;
  } catch { return "unknown"; }
}

function getCurrentUserId(): string | null {
  try {
    return useAuthStore.getState().user?.id ?? null;
  } catch { return null; }
}

async function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  try {
    await supabase.from("event_logs").insert(batch);
  } catch {
    // Analytics must never crash the app
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = null; flush(); }, 1500);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function trackEvent(
  event: EventName,
  metadata?: Record<string, unknown>,
  options?: { errorMessage?: string; role?: string }
) {
  try {
    queue.push({
      user_id: getCurrentUserId(),
      session_id: getSessionId(),
      role: options?.role ?? null,
      event_name: event,
      page: typeof window !== "undefined" ? window.location.pathname : "",
      metadata: metadata ?? null,
      error_message: options?.errorMessage ?? null,
      created_at: new Date().toISOString(),
    });
    scheduleFlush();
  } catch {
    // Never throw
  }
}

export function trackError(
  error: Error | unknown,
  context: { page?: string; component?: string; severity?: ErrorSeverity }
) {
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    const page = context.page ?? (typeof window !== "undefined" ? window.location.pathname : "");

    trackEvent("react_error", {
      component: context.component,
      severity: context.severity ?? "medium",
    }, { errorMessage: err.message });

    supabase.from("error_logs").insert({
      user_id: getCurrentUserId(),
      session_id: getSessionId(),
      page,
      component: context.component ?? null,
      error_message: err.message,
      stack_trace: err.stack ?? null,
      severity: context.severity ?? "medium",
      created_at: new Date().toISOString(),
    }).then(() => {}, () => {});
  } catch {
    // Never throw
  }
}

// Flush remaining events before page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => { flush(); });
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}
