import { create } from "zustand";
import type {
  Order,
  Address,
  PaymentMethod,
  Notification,
  UserProfile,
  PendingOrder,
  PaymentStatus,
  OrderFlowStatus,
  ActivePerformer,
} from "../types";
import { useSharedOrdersStore } from "../../store/sharedOrdersStore";
import { useAuthStore } from "../../store/authStore";
import {
  dbLoadProfile,
  dbSaveProfile,
  dbLoadAddresses,
  dbAddAddress,
  dbDeleteAddress,
  dbSetDefaultAddress,
  dbLoadOrders,
  dbSaveOrder,
  dbUpdateOrder,
  dbDeleteOrder,
  dbCreateSharedOrder,
  dbCancelSharedOrder,
} from "../../lib/db";

interface DashboardState {
  orders: Order[];
  addresses: Address[];
  payments: PaymentMethod[];
  notifications: Notification[];
  profile: UserProfile;
  isLoading: boolean;
  isHydrated: boolean;

  // --- Order flow state machine ---
  paymentStatus: PaymentStatus;
  orderFlowStatus: OrderFlowStatus;
  pendingOrder: PendingOrder | null;
  activePerformer: ActivePerformer | null;
  activeSharedOrderId: string | null;
  draftOrderId: string | null;

  // Actions
  hydrateClient: (userId: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  setDefaultAddress: (id: string) => void;
  deleteAddress: (id: string) => void;
  addAddress: (address: Omit<Address, "id">) => void;
  setDefaultPayment: (id: string) => void;
  deletePayment: (id: string) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  simulateLoading: (ms?: number) => void;

  // --- Order flow actions ---
  setPendingOrder: (order: PendingOrder) => void;
  startPayment: () => void;
  completePayment: () => void;
  setOrderFlowStatus: (status: OrderFlowStatus) => void;
  onPerformerAssigned: () => void;
  cancelOrder: (orderId: string) => void;
  resetOrderFlow: () => void;
}

const emptyProfile: UserProfile = {
  id: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  notifyEmail: true,
  notifySms: true,
  notifyPush: false,
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  orders: [],
  addresses: [],
  payments: [],
  notifications: [],
  profile: emptyProfile,
  isLoading: false,
  isHydrated: false,

  paymentStatus: "idle" as PaymentStatus,
  orderFlowStatus: "idle" as OrderFlowStatus,
  pendingOrder: null,
  activePerformer: null,
  activeSharedOrderId: null,
  draftOrderId: null,

  hydrateClient: async (userId) => {
    set({ isLoading: true });
    const [profile, addresses, orders] = await Promise.all([
      dbLoadProfile(userId),
      dbLoadAddresses(userId),
      dbLoadOrders(userId),
    ]);
    set({
      profile: profile ?? emptyProfile,
      addresses,
      orders,
      isLoading: false,
      isHydrated: true,
    });
  },

  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  setDefaultAddress: (id) => {
    set((s) => ({
      addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
    }));
    const userId = useAuthStore.getState().user?.id;
    if (userId) dbSetDefaultAddress(userId, id);
  },

  deleteAddress: (id) => {
    set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) }));
    dbDeleteAddress(id);
  },

  addAddress: (address) => {
    const id = crypto.randomUUID();
    set((s) => ({
      addresses: [...s.addresses, { ...address, id }],
    }));
    const userId = useAuthStore.getState().user?.id;
    if (userId) dbAddAddress(userId, address, id);
  },

  setDefaultPayment: (id) =>
    set((s) => ({
      payments: s.payments.map((p) => ({ ...p, isDefault: p.id === id })),
    })),

  deletePayment: (id) =>
    set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),

  updateProfile: (data) => {
    set((s) => ({ profile: { ...s.profile, ...data } }));
    const userId = useAuthStore.getState().user?.id;
    if (userId) dbSaveProfile(userId, data);
  },

  simulateLoading: (ms = 800) => {
    set({ isLoading: true });
    setTimeout(() => set({ isLoading: false }), ms);
  },

  setPendingOrder: (order) => {
    const draftId = `draft-${Date.now()}`;
    const now = new Date().toISOString();
    set({ pendingOrder: order, paymentStatus: "pending", orderFlowStatus: "idle", draftOrderId: draftId });
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      const draftOrder: Order = {
        id: draftId,
        createdAt: now,
        scheduledDate: order.scheduledDate,
        scheduledTime: order.scheduledTime,
        status: "pending_payment",
        categoryName: order.categoryName,
        serviceName: order.serviceName,
        serviceId: "draft",
        address: order.address,
        priceTotal: order.priceTotal,
        priceBreakdown: order.priceBreakdown,
        performer: null,
        eta: null,
        duration: order.duration,
        fieldValues: {},
        timeline: [],
      };
      dbSaveOrder(userId, draftOrder);
      set((s) => ({ orders: [draftOrder, ...s.orders.filter((o) => o.status !== "pending_payment")] }));
    }
  },

  startPayment: () => set({ paymentStatus: "processing" }),

  completePayment: () => {
    const { pendingOrder, profile, draftOrderId } = get();
    if (!pendingOrder) return;

    // Remove the draft/pending_payment order from local state and DB
    if (draftOrderId) {
      set((s) => ({ orders: s.orders.filter((o) => o.id !== draftOrderId) }));
      dbDeleteOrder(draftOrderId);
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

    const sharedId = useSharedOrdersStore.getState().createOrder({
      status: "searching_performer",
      scheduledDate: pendingOrder.scheduledDate,
      scheduledTime: pendingOrder.scheduledTime,
      categoryName: pendingOrder.categoryName,
      serviceName: pendingOrder.serviceName,
      address: pendingOrder.address,
      priceTotal: pendingOrder.priceTotal,
      priceBreakdown: pendingOrder.priceBreakdown,
      duration: pendingOrder.duration,
      clientEmail: profile.email,
      clientName: profile.name,
      clientPhone: profile.phone,
    });

    const newOrder: Order = {
      id: sharedId,
      createdAt: now.toISOString(),
      scheduledDate: pendingOrder.scheduledDate,
      scheduledTime: pendingOrder.scheduledTime,
      status: "searching",
      categoryName: pendingOrder.categoryName,
      serviceName: pendingOrder.serviceName,
      serviceId: "new",
      address: pendingOrder.address,
      priceTotal: pendingOrder.priceTotal,
      priceBreakdown: pendingOrder.priceBreakdown,
      performer: null,
      eta: null,
      duration: pendingOrder.duration,
      fieldValues: {},
      timeline: [
        { id: "t1", label: "Заказ создан", time: timeStr, completed: true },
        { id: "t2", label: "Оплата подтверждена", time: timeStr, completed: true },
        { id: "t3", label: "Поиск исполнителя", time: "", completed: false },
        { id: "t4", label: "Исполнитель назначен", time: "", completed: false },
      ],
    };

    set((s) => ({
      paymentStatus: "paid",
      orderFlowStatus: "searching",
      activeSharedOrderId: sharedId,
      orders: [newOrder, ...s.orders],
    }));

    // Persist to DB
    const userId = useAuthStore.getState().user?.id;
    if (userId) dbSaveOrder(userId, newOrder);

    // Publish to shared_orders so performers in other sessions see it
    const sharedOrder = useSharedOrdersStore.getState().orders.find((o) => o.id === sharedId);
    if (sharedOrder) dbCreateSharedOrder(sharedOrder);
  },

  setOrderFlowStatus: (status) => set({ orderFlowStatus: status }),

  onPerformerAssigned: () => {
    const { activeSharedOrderId } = get();
    if (!activeSharedOrderId) return;
    const sharedOrder = useSharedOrdersStore.getState().orders.find(
      (o) => o.id === activeSharedOrderId
    );
    if (!sharedOrder || !sharedOrder.performerName) return;

    const assignedTime = new Date().toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    set((s) => ({
      orderFlowStatus: "assigned",
      orders: s.orders.map((o) =>
        o.id === activeSharedOrderId
          ? {
              ...o,
              status: "assigned" as const,
              performer: {
                id: sharedOrder.performerId ?? "p-1",
                name: sharedOrder.performerName!,
                avatar: sharedOrder.performerAvatar ?? sharedOrder.performerName!.slice(0, 2).toUpperCase(),
                rating: sharedOrder.performerRating ?? 0,
                reviewCount: sharedOrder.performerJobsCompleted ?? 0,
                phone: sharedOrder.performerPhone ?? "",
                jobsCompleted: sharedOrder.performerJobsCompleted ?? 0,
                telegram: sharedOrder.performerTelegram ?? undefined,
              },
              eta: `${new Date(o.scheduledDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} в ${o.scheduledTime}`,
              timeline: o.timeline.map((t, i) =>
                i >= 2 ? { ...t, time: assignedTime, completed: true } : t
              ),
            }
          : o
      ),
    }));

    // Persist performer assignment to DB
    const assignedAt = new Date().toISOString();
    const userId = useAuthStore.getState().user?.id;
    if (userId && activeSharedOrderId) {
      dbUpdateOrder(activeSharedOrderId, {
        status: "assigned",
        assigned_at: assignedAt,
        performer_id: sharedOrder.performerId ?? null,
        performer_name: sharedOrder.performerName,
        performer_phone: sharedOrder.performerPhone ?? null,
        performer_telegram: sharedOrder.performerTelegram ?? null,
        performer_rating: sharedOrder.performerRating ?? null,
        performer_avatar: sharedOrder.performerAvatar ?? null,
        performer_jobs_completed: sharedOrder.performerJobsCompleted ?? null,
      });
    }

    // Also store assignedAt in local order state for the cancel timer
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === activeSharedOrderId ? { ...o, assignedAt } : o
      ),
    }));
  },

  cancelOrder: (orderId) => {
    set((s) => {
      const isActiveOrder = s.activeSharedOrderId === orderId;
      return {
        orders: s.orders.map((o) =>
          o.id === orderId ? { ...o, status: "cancelled" as const } : o
        ),
        ...(isActiveOrder && {
          paymentStatus: "idle" as const,
          orderFlowStatus: "idle" as const,
          pendingOrder: null,
          activePerformer: null,
          activeSharedOrderId: null,
          draftOrderId: null,
        }),
      };
    });
    dbUpdateOrder(orderId, { status: "cancelled" });
    dbCancelSharedOrder(orderId);
  },

  resetOrderFlow: () =>
    set({
      paymentStatus: "idle",
      orderFlowStatus: "idle",
      pendingOrder: null,
      activePerformer: null,
      activeSharedOrderId: null,
      draftOrderId: null,
    }),
}));
