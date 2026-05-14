import { create } from "zustand";
import type {
  PerformerOrder,
  PerformerOrderStatus,
  PerformerProfile,
  EarningsRecord,
  PerformerNotification,
  BankCard,
  WithdrawRecord,
} from "../types";
import { useSharedOrdersStore } from "../../store/sharedOrdersStore";
import type { AcceptResult } from "../../store/sharedOrdersStore";
import { calculateDistance, estimateETA, formatDistance } from "../utils/distance";
import { useAuthStore } from "../../store/authStore";
import {
  dbLoadPerformerProfile,
  dbSavePerformerProfile,
  dbLoadPerformerBalance,
  dbUpdatePerformerBalance,
  dbUpdateOrder,
  dbAcceptSharedOrder,
  dbLoadPerformerActiveOrders,
  dbRequestOrderCompletion,
} from "../../lib/db";

interface PerformerState {
  profile: PerformerProfile;
  isOnline: boolean;
  balance: number;
  pendingBalance: number;
  availableOrders: PerformerOrder[];
  activeOrders: PerformerOrder[];
  completedOrders: PerformerOrder[];
  earnings: EarningsRecord[];
  notifications: PerformerNotification[];
  bankCards: BankCard[];
  withdrawHistory: WithdrawRecord[];
  isHydrated: boolean;

  // Actions
  hydratePerformer: (userId: string) => Promise<void>;
  toggleOnline: () => void;
  acceptOrder: (orderId: string) => Promise<AcceptResult>;
  rejectOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: PerformerOrderStatus) => void;
  submitCompletion: (orderId: string, comment: string) => Promise<void>;
  onClientConfirmed: (orderId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  updateProfile: (data: Partial<PerformerProfile>) => void;
  withdraw: (amount: number, cardId: string) => void;
  addBankCard: (card: Omit<BankCard, "id">) => void;
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
  isOnline: true,
  balance: 0,
  pendingBalance: 0,
  availableOrders: [],
  activeOrders: [],
  completedOrders: [],
  earnings: [],
  notifications: [],
  bankCards: [],
  withdrawHistory: [],
  isHydrated: false,

  hydratePerformer: async (userId) => {
    const [profile, balanceData, sharedActiveOrders] = await Promise.all([
      dbLoadPerformerProfile(userId),
      dbLoadPerformerBalance(userId),
      dbLoadPerformerActiveOrders(userId),
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

    if (profile) {
      set((s) => ({
        profile,
        availableOrders: enrichWithDistance([...s.availableOrders], profile),
        activeOrders: restoredActiveOrders,
        isHydrated: true,
      }));
    } else {
      set({ activeOrders: restoredActiveOrders, isHydrated: true });
    }
    if (balanceData) {
      set({ balance: balanceData.balance, pendingBalance: balanceData.pendingBalance });
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
    await dbRequestOrderCompletion(orderId, comment);
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

      // Persist status change to DB (updates client-visible order_history row)
      dbUpdateOrder(orderId, { status });

      return { activeOrders: s.activeOrders.map((o) => (o.id === orderId ? updatedOrder : o)) };
    });
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

  withdraw: (amount, cardId) =>
    set((s) => {
      if (amount > s.balance) return s;
      const card = s.bankCards.find((c) => c.id === cardId);
      const now = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      const record: WithdrawRecord = {
        id: `w-${Date.now()}`,
        amount,
        cardLast4: card?.last4 ?? "????",
        date: new Date().toISOString().split("T")[0],
        time: now,
        status: "completed",
      };
      return {
        balance: s.balance - amount,
        withdrawHistory: [record, ...s.withdrawHistory],
      };
    }),

  addBankCard: (card) =>
    set((s) => ({
      bankCards: [...s.bankCards, { ...card, id: `card-${Date.now()}` }],
    })),

  removeBankCard: (id) =>
    set((s) => ({ bankCards: s.bankCards.filter((c) => c.id !== id) })),

  setDefaultCard: (id) =>
    set((s) => ({
      bankCards: s.bankCards.map((c) => ({ ...c, isDefault: c.id === id })),
    })),
}));
