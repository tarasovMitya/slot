import { create } from "zustand";
import type {
  PerformerOrder,
  PerformerOrderStatus,
  PerformerProfile,
  EarningsRecord,
  PerformerNotification,
  BankCard,
} from "../types";
import { useSharedOrdersStore } from "../../store/sharedOrdersStore";
import type { AcceptResult } from "../../store/sharedOrdersStore";
import { calculateDistance, estimateETA, formatDistance } from "../utils/distance";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import {
  dbLoadPerformerProfile,
  dbSavePerformerProfile,
  dbLoadPerformerBalance,
  dbUpdatePerformerBalance,
  dbUpdateOrder,
  dbAcceptSharedOrder,
  dbLoadPerformerActiveOrders,
  dbLoadPerformerCompletedOrders,
  dbRequestOrderCompletion,
  dbUpdateSharedOrderStatus,
  dbUpdatePerformerLocation,
} from "../../lib/db";
import { dbSendPushToUsers } from "../../lib/pushDb";

// Module-level watch IDs — don't need to be reactive state
let _locationWatchId: number | null = null;
let _locationLastSent = 0;
let _verStatusUnsub: (() => void) | null = null;

export type DaySchedule = { active: boolean; start: string; end: string };
export type WorkSchedule = Record<string, DaySchedule>;

export const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
  "0": { active: true,  start: "09:00", end: "18:00" },
  "1": { active: true,  start: "09:00", end: "18:00" },
  "2": { active: true,  start: "09:00", end: "18:00" },
  "3": { active: true,  start: "09:00", end: "18:00" },
  "4": { active: true,  start: "09:00", end: "18:00" },
  "5": { active: false, start: "09:00", end: "14:00" },
  "6": { active: false, start: "09:00", end: "14:00" },
};

interface PerformerState {
  profile: PerformerProfile;
  verificationStatus: string;
  rejectionReason: string | null;
  isOnline: boolean;
  balance: number;
  pendingBalance: number;
  availableOrders: PerformerOrder[];
  activeOrders: PerformerOrder[];
  completedOrders: PerformerOrder[];
  earnings: EarningsRecord[];
  notifications: PerformerNotification[];
  bankCards: BankCard[];
  isHydrated: boolean;
  workSchedule: WorkSchedule;

  // Actions
  hydratePerformer: (userId: string) => Promise<void>;
  saveWorkSchedule: (schedule: WorkSchedule) => Promise<void>;
  toggleOnline: () => void;
  acceptOrder: (orderId: string) => Promise<AcceptResult>;
  rejectOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: PerformerOrderStatus) => void;
  submitCompletion: (orderId: string, comment: string) => Promise<void>;
  onClientConfirmed: (orderId: string) => void;
  onClientCancelled: (orderId: string) => void;
  addNotification: (n: Omit<PerformerNotification, "id" | "read" | "time">) => void;
  startLocationTracking: (orderId: string) => Promise<boolean>;
  stopLocationTracking: () => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  setVerificationStatus: (status: string, reason?: string | null) => void;
  updateProfile: (data: Partial<PerformerProfile>) => void;
  addBankCard: (card: Omit<BankCard, "id">) => string;
  removeBankCard: (id: string) => void;
  setDefaultCard: (id: string) => void;
}

/** Enrich available orders with calculated distance from performer */
function enrichWithDistance(
  orders: PerformerOrder[],
  profile: PerformerProfile
): PerformerOrder[] {
  return orders.map((o) => {
    if (!o.lat || !o.lng) return o;
    const km = calculateDistance(profile.lat, profile.lng, o.lat, o.lng);
    return {
      ...o,
      distance: formatDistance(km),
      etaMinutes: estimateETA(km),
    };
  });
}

const emptyProfile: PerformerProfile = {
  id: "",
  name: "",
  avatar: "",
  rating: 0,
  completedOrders: 0,
  phone: "",
  telegram: "",
  specializations: [],
  address: "",
  city: "",
  lat: 0,
  lng: 0,
  workRadius: 10,
};

export const usePerformerStore = create<PerformerState>((set, get) => ({
  profile: emptyProfile,
  verificationStatus: "not_started",
  rejectionReason: null,
  isOnline: true,
  balance: 0,
  pendingBalance: 0,
  availableOrders: [],
  activeOrders: [],
  completedOrders: [],
  earnings: [],
  notifications: [],
  bankCards: [],
  isHydrated: false,
  workSchedule: DEFAULT_WORK_SCHEDULE,

  setVerificationStatus: (status, reason = null) =>
    set({ verificationStatus: status, rejectionReason: reason ?? null }),

  hydratePerformer: async (userId) => {
    try {
    const [profile, balanceData, sharedActiveOrders, sharedCompletedOrders, verData] = await Promise.all([
      dbLoadPerformerProfile(userId),
      dbLoadPerformerBalance(userId),
      dbLoadPerformerActiveOrders(userId),
      dbLoadPerformerCompletedOrders(userId),
      supabase.from("performer_profiles").select("verification_status, rejection_reason, work_schedule").eq("user_id", userId).single(),
    ]);

    const restoredActiveOrders: PerformerOrder[] = sharedActiveOrders.map((o) => {
      const isWaiting = o.status === "waiting_client_confirmation";
      const isInProgress = o.status === "in_progress";
      const mappedStatus: PerformerOrderStatus = isWaiting
        ? "waiting_client_confirmation"
        : isInProgress
        ? "in_progress"
        : "accepted";
      return {
        id: o.id,
        createdAt: o.createdAt,
        scheduledDate: o.scheduledDate,
        scheduledTime: o.scheduledTime,
        status: mappedStatus,
        categoryName: o.categoryName,
        serviceName: o.serviceName,
        address: o.address,
        priceTotal: o.priceTotal,
        priceBreakdown: o.priceBreakdown,
        duration: o.duration,
        comment: o.comment,
        completionComment: o.completionComment,
        completionRequestedAt: o.completionRequestedAt,
        client: { name: o.clientName, phone: o.clientPhone },
        timeline: [
          { id: "t1", label: "Заказ принят", time: o.acceptedAt ?? "", completed: true },
          { id: "t2", label: "Еду к клиенту", time: "", completed: false },
          { id: "t3", label: "Работа выполняется", time: "", completed: isInProgress || isWaiting },
          { id: "t4", label: "Завершено", time: isWaiting ? (o.completionRequestedAt ? new Date(o.completionRequestedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "") : "", completed: isWaiting },
        ],
      };
    });

    const restoredCompletedOrders: PerformerOrder[] = sharedCompletedOrders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      scheduledDate: o.scheduledDate,
      scheduledTime: o.scheduledTime,
      status: (o.status === "cancelled" ? "rejected" : "completed") as PerformerOrderStatus,
      categoryName: o.categoryName,
      serviceName: o.serviceName,
      address: o.address,
      priceTotal: o.priceTotal,
      priceBreakdown: o.priceBreakdown,
      duration: o.duration,
      comment: o.comment,
      completionComment: o.completionComment,
      completionRequestedAt: o.completionRequestedAt,
      client: { name: o.clientName, phone: o.clientPhone },
      timeline: [
        { id: "t1", label: "Заказ принят", time: o.acceptedAt ?? "", completed: true },
        { id: "t2", label: "Еду к клиенту", time: "", completed: true },
        { id: "t3", label: "Работа выполняется", time: "", completed: true },
        { id: "t4", label: "Завершено", time: o.clientConfirmedAt ? new Date(o.clientConfirmedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "", completed: o.status === "completed" },
      ],
    }));

    const restoredEarnings: EarningsRecord[] = sharedCompletedOrders
      .filter((o) => o.status === "completed")
      .map((o) => {
        const ts = o.clientConfirmedAt || o.createdAt;
        return {
          id: `e-${o.id}`,
          orderId: o.id,
          serviceName: o.serviceName,
          amount: o.priceTotal,
          date: new Date(ts).toISOString().split("T")[0],
          time: new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        };
      });

    if (profile) {
      set((s) => ({
        profile,
        availableOrders: enrichWithDistance([...s.availableOrders], profile),
        activeOrders: restoredActiveOrders,
        completedOrders: restoredCompletedOrders,
        earnings: restoredEarnings,
        isHydrated: true,
        verificationStatus: (verData.data?.verification_status as string) ?? "not_started",
        rejectionReason: (verData.data?.rejection_reason as string) ?? null,
        workSchedule: (verData.data?.work_schedule as WorkSchedule) ?? DEFAULT_WORK_SCHEDULE,
      }));
    } else {
      set({ activeOrders: restoredActiveOrders, completedOrders: restoredCompletedOrders, earnings: restoredEarnings, isHydrated: true });
    }
    if (balanceData) {
      set({ balance: balanceData.balance, pendingBalance: balanceData.pendingBalance });
    }

    // Realtime: react to admin approval/rejection without page reload
    if (_verStatusUnsub) _verStatusUnsub();
    const verChannel = supabase
      .channel(`ver_status_${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "performer_profiles", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          set({
            verificationStatus: (row.verification_status as string) ?? "not_started",
            rejectionReason: (row.rejection_reason as string) ?? null,
          });
        }
      )
      .subscribe();
    _verStatusUnsub = () => { supabase.removeChannel(verChannel); };

    } catch {
      set({ isHydrated: true });
    }
  },

  toggleOnline: () => set((s) => ({ isOnline: !s.isOnline })),

  acceptOrder: async (orderId) => {
    const now = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    let { profile } = get();
    const userId = useAuthStore.getState().user?.id ?? "";

    // If profile name isn't loaded yet, fetch fresh from DB before accepting
    if (!profile.name && userId) {
      const fresh = await dbLoadPerformerProfile(userId);
      if (fresh) {
        profile = fresh;
        set({ profile: fresh, isHydrated: true });
      }
    }

    const performerInfo = {
      id: profile.id || userId,
      name: profile.name || "Исполнитель",
      phone: profile.phone || "",
      telegram: profile.telegram || "",
      rating: profile.rating || 0,
      avatar: profile.avatar || "",
      jobsCompleted: profile.completedOrders || 0,
    };

    // DB is the authority — atomically claim the order
    const claimed = await dbAcceptSharedOrder(orderId, performerInfo);
    if (!claimed) return "already_taken";

    // Update in-memory shared store
    useSharedOrdersStore.getState().acceptOrder(orderId, performerInfo);

    // Find the order data from shared store (already updated above)
    const sharedEntry = useSharedOrdersStore.getState().orders.find((o) => o.id === orderId);
    if (!sharedEntry) {
      // Fallback: try local available orders
      set((s) => {
        const order = s.availableOrders.find((o) => o.id === orderId);
        if (!order) return s;
        const accepted: PerformerOrder = {
          ...order,
          status: "accepted",
          timeline: [
            { id: "t1", label: "Заказ принят", time: now, completed: true },
            { id: "t2", label: "Еду к клиенту", time: "", completed: false },
            { id: "t3", label: "Работа выполняется", time: "", completed: false },
            { id: "t4", label: "Завершено", time: "", completed: false },
          ],
        };
        return {
          availableOrders: s.availableOrders.filter((o) => o.id !== orderId),
          activeOrders: [accepted, ...s.activeOrders],
        };
      });
      return "success";
    }

    const accepted: PerformerOrder = {
      id: sharedEntry.id,
      createdAt: sharedEntry.createdAt,
      scheduledDate: sharedEntry.scheduledDate,
      scheduledTime: sharedEntry.scheduledTime,
      status: "accepted",
      categoryName: sharedEntry.categoryName,
      serviceName: sharedEntry.serviceName,
      address: sharedEntry.address,
      priceTotal: sharedEntry.priceTotal,
      priceBreakdown: sharedEntry.priceBreakdown,
      duration: sharedEntry.duration,
      comment: sharedEntry.comment,
      client: { name: sharedEntry.clientName, phone: sharedEntry.clientPhone },
      timeline: [
        { id: "t1", label: "Заказ принят", time: now, completed: true },
        { id: "t2", label: "Еду к клиенту", time: "", completed: false },
        { id: "t3", label: "Работа выполняется", time: "", completed: false },
        { id: "t4", label: "Завершено", time: "", completed: false },
      ],
    };
    set((s) => ({ activeOrders: [accepted, ...s.activeOrders] }));
    return "success";
  },

  rejectOrder: (orderId) =>
    set((s) => ({
      availableOrders: s.availableOrders.filter((o) => o.id !== orderId),
    })),

  submitCompletion: async (orderId, comment) => {
    const now = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const { activeOrders: prevOrders, pendingBalance: prevPendingBalance, balance: prevBalance } = get();
    set((s) => {
      const order = s.activeOrders.find((o) => o.id === orderId);
      const newPendingBalance = s.pendingBalance + (order?.priceTotal ?? 0);
      const userId = useAuthStore.getState().user?.id;
      if (userId && order) dbUpdatePerformerBalance(userId, s.balance, newPendingBalance);
      return {
        pendingBalance: newPendingBalance,
        activeOrders: s.activeOrders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "waiting_client_confirmation" as PerformerOrderStatus,
                completionComment: comment,
                completionRequestedAt: new Date().toISOString(),
                timeline: o.timeline.map((t) =>
                  t.label === "Завершено" ? { ...t, time: now, completed: true } : t
                ),
              }
            : o
        ),
      };
    });
    try {
      await dbRequestOrderCompletion(orderId, comment);
    } catch {
      set({ activeOrders: prevOrders, pendingBalance: prevPendingBalance });
      const userId = useAuthStore.getState().user?.id;
      if (userId) dbUpdatePerformerBalance(userId, prevBalance, prevPendingBalance);
      throw new Error("Не удалось отправить отчёт");
    }
  },

  onClientConfirmed: (orderId) => {
    const now = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    set((s) => {
      const order = s.activeOrders.find((o) => o.id === orderId);
      if (!order) return s;
      const earningsRecord: EarningsRecord = {
        id: `e-${Date.now()}`,
        orderId: order.id,
        serviceName: order.serviceName,
        amount: order.priceTotal,
        date: new Date().toISOString().split("T")[0],
        time: now,
      };
      // Move from pendingBalance → balance (client confirmed, funds now available)
      const newBalance = s.balance + order.priceTotal;
      const newPendingBalance = Math.max(0, s.pendingBalance - order.priceTotal);
      const newCompleted = s.profile.completedOrders + 1;
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        dbUpdatePerformerBalance(userId, newBalance, newPendingBalance);
        dbSavePerformerProfile(userId, { completedOrders: newCompleted });
      }
      return {
        activeOrders: s.activeOrders.filter((o) => o.id !== orderId),
        completedOrders: [{ ...order, status: "completed" as PerformerOrderStatus }, ...s.completedOrders],
        earnings: [earningsRecord, ...s.earnings],
        balance: newBalance,
        pendingBalance: newPendingBalance,
        profile: { ...s.profile, completedOrders: newCompleted },
      };
    });
    get().addNotification({ type: "payment", title: "Клиент подтвердил выполнение", body: "Выплата доступна для вывода", orderId });
  },

  onClientCancelled: (orderId) => {
    set((s) => {
      const order = s.activeOrders.find((o) => o.id === orderId);
      if (!order) return s;
      // If order was in waiting_client_confirmation, refund pendingBalance
      const refund = order.status === "waiting_client_confirmation" ? order.priceTotal : 0;
      const newPendingBalance = Math.max(0, s.pendingBalance - refund);
      const userId = useAuthStore.getState().user?.id;
      if (userId && refund > 0) dbUpdatePerformerBalance(userId, s.balance, newPendingBalance);
      return {
        activeOrders: s.activeOrders.filter((o) => o.id !== orderId),
        pendingBalance: newPendingBalance,
      };
    });
    get().addNotification({ type: "cancellation", title: "Заказ отменён клиентом", body: "Клиент отменил заказ", orderId });
  },

  addNotification: (n) => {
    const id = `pnotif-${Date.now()}-${Math.random()}`;
    const time = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    set((s) => ({ notifications: [{ ...n, id, time, read: false }, ...s.notifications] }));
  },

  updateOrderStatus: (orderId, status) => {
    const now = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const timelineLabel: Record<string, string> = {
      on_the_way: "Еду к клиенту",
      in_progress: "Работа выполняется",
      completed: "Завершено",
    };
    set((s) => {
      const order = s.activeOrders.find((o) => o.id === orderId);
      if (!order) return s;
      const updatedTimeline = order.timeline.map((t) =>
        t.label === timelineLabel[status] ? { ...t, time: now, completed: true } : t
      );
      const updatedOrder: PerformerOrder = { ...order, status, timeline: updatedTimeline };

      // Persist to order_history
      dbUpdateOrder(orderId, { status });
      // Sync to shared_orders so client sees the update via Realtime
      if (status === "on_the_way") dbUpdateSharedOrderStatus(orderId, "performer_on_the_way");
      else if (status === "in_progress") dbUpdateSharedOrderStatus(orderId, "in_progress");

      return { activeOrders: s.activeOrders.map((o) => (o.id === orderId ? updatedOrder : o)) };
    });

    // Push to client
    const pushMap: Partial<Record<string, { title: string; body: string }>> = {
      on_the_way: { title: "Исполнитель в пути", body: "Исполнитель едет к вам" },
      in_progress: { title: "Работа началась", body: "Исполнитель приступил к выполнению заказа" },
      waiting_client_confirmation: { title: "Требуется подтверждение", body: "Исполнитель завершил работу — подтвердите выполнение" },
    };
    const pushPayload = pushMap[status];
    if (pushPayload) {
      supabase.from("shared_orders").select("client_email").eq("id", orderId).single()
        .then(({ data: o }) => {
          if (o?.client_email) {
            dbSendPushToUsers(
              { emails: [o.client_email as string] },
              { ...pushPayload, url: `/dashboard/orders/${orderId}` }
            );
          }
        });
    }
  },

  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

  updateProfile: (data) => {
    set((s) => {
      const updated = { ...s.profile, ...data };
      return {
        profile: updated,
        availableOrders: enrichWithDistance(s.availableOrders, updated),
      };
    });
    const userId = useAuthStore.getState().user?.id;
    if (userId) dbSavePerformerProfile(userId, data);
  },


  addBankCard: (card) => {
    const id = `card-${Date.now()}`;
    set((s) => ({ bankCards: [...s.bankCards, { ...card, id }] }));
    return id;
  },

  removeBankCard: (id) =>
    set((s) => ({ bankCards: s.bankCards.filter((c) => c.id !== id) })),

  setDefaultCard: (id) =>
    set((s) => ({
      bankCards: s.bankCards.map((c) => ({ ...c, isDefault: c.id === id })),
    })),

  saveWorkSchedule: async (schedule) => {
    set({ workSchedule: schedule });
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      await supabase
        .from("performer_profiles")
        .update({ work_schedule: schedule })
        .eq("user_id", userId);
    }
  },

  startLocationTracking: (orderId) => {
    if (!navigator.geolocation) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          dbUpdatePerformerLocation(orderId, pos.coords.latitude, pos.coords.longitude);
          _locationLastSent = Date.now();
          if (_locationWatchId === null) {
            _locationWatchId = navigator.geolocation.watchPosition(
              (p) => {
                const now = Date.now();
                if (now - _locationLastSent < 10_000) return;
                _locationLastSent = now;
                dbUpdatePerformerLocation(orderId, p.coords.latitude, p.coords.longitude);
              },
              (err) => console.warn("GPS error:", err),
              { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 }
            );
          }
          resolve(true);
        },
        () => resolve(false),
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
      );
    });
  },

  stopLocationTracking: () => {
    if (_locationWatchId !== null) {
      navigator.geolocation.clearWatch(_locationWatchId);
      _locationWatchId = null;
      _locationLastSent = 0;
    }
  },
}));
