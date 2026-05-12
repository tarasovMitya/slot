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

interface DashboardState {
  orders: Order[];
  addresses: Address[];
  payments: PaymentMethod[];
  notifications: Notification[];
  profile: UserProfile;
  isLoading: boolean;

  // --- Order flow state machine ---
  paymentStatus: PaymentStatus;
  orderFlowStatus: OrderFlowStatus;
  pendingOrder: PendingOrder | null;
  activePerformer: ActivePerformer | null;
  /** ID of the active order in sharedOrdersStore (set after payment). */
  activeSharedOrderId: string | null;

  // Actions
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
  /** Called when sharedOrdersStore shows performer_assigned — syncs local order list. */
  onPerformerAssigned: () => void;
  resetOrderFlow: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  orders: [],
  addresses: [],
  payments: [],
  notifications: [],
  profile: { id: "", name: "", phone: "", email: "", address: "", notifyEmail: true, notifySms: true, notifyPush: false },
  isLoading: false,

  paymentStatus: "idle" as PaymentStatus,
  orderFlowStatus: "idle" as OrderFlowStatus,
  pendingOrder: null,
  activePerformer: null,
  activeSharedOrderId: null,

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

  setDefaultAddress: (id) =>
    set((s) => ({
      addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
    })),

  deleteAddress: (id) =>
    set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) })),

  addAddress: (address) =>
    set((s) => ({
      addresses: [
        ...s.addresses,
        { ...address, id: `addr-${Date.now()}` },
      ],
    })),

  setDefaultPayment: (id) =>
    set((s) => ({
      payments: s.payments.map((p) => ({ ...p, isDefault: p.id === id })),
    })),

  deletePayment: (id) =>
    set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),

  updateProfile: (data) =>
    set((s) => ({ profile: { ...s.profile, ...data } })),

  simulateLoading: (ms = 800) => {
    set({ isLoading: true });
    setTimeout(() => set({ isLoading: false }), ms);
  },

  setPendingOrder: (order) =>
    set({ pendingOrder: order, paymentStatus: "pending", orderFlowStatus: "idle" }),

  startPayment: () => set({ paymentStatus: "processing" }),

  completePayment: () => {
    const { pendingOrder, profile } = get();
    if (!pendingOrder) return;

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
  },

  resetOrderFlow: () =>
    set({
      paymentStatus: "idle",
      orderFlowStatus: "idle",
      pendingOrder: null,
      activePerformer: null,
      activeSharedOrderId: null,
    }),
}));
