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
import {
  mockAddresses,
  mockPayments,
  mockNotifications,
} from "../data/mockData";

const MOCK_PERFORMER: ActivePerformer = {
  name: "Александр",
  avatar: "АЛ",
  rating: 4.9,
  jobsCompleted: 248,
  phone: "+7 999 123-45-67",
  telegram: "@alex_master",
  eta: "Приедет через 45 минут",
};

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
  assignPerformer: () => void;
  resetOrderFlow: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  orders: [],
  addresses: mockAddresses,
  payments: mockPayments,
  notifications: mockNotifications,
  profile: { id: "", name: "", phone: "", email: "", address: "", notifyEmail: true, notifySms: true, notifyPush: false },
  isLoading: false,

  // Order flow state machine
  paymentStatus: "idle" as PaymentStatus,
  orderFlowStatus: "idle" as OrderFlowStatus,
  pendingOrder: null,
  activePerformer: null,

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
    const pendingOrder = get().pendingOrder;
    if (!pendingOrder) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const newOrderId = `ord-new-${Date.now()}`;

    const newOrder: Order = {
      id: newOrderId,
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
      orders: [newOrder, ...s.orders],
    }));

    const delay = 5000 + Math.random() * 5000;
    setTimeout(() => {
      const assignedTime = new Date().toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
      set((s) => ({
        orderFlowStatus: "assigned",
        activePerformer: MOCK_PERFORMER,
        orders: s.orders.map((o) =>
          o.id === newOrderId
            ? {
                ...o,
                status: "assigned" as const,
                performer: {
                  id: "alex-1",
                  name: MOCK_PERFORMER.name,
                  avatar: MOCK_PERFORMER.avatar,
                  rating: MOCK_PERFORMER.rating,
                  reviewCount: 248,
                  phone: MOCK_PERFORMER.phone,
                  jobsCompleted: MOCK_PERFORMER.jobsCompleted,
                  telegram: MOCK_PERFORMER.telegram,
                  eta: MOCK_PERFORMER.eta,
                },
                eta: `${new Date(o.scheduledDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} в ${o.scheduledTime}`,
                timeline: [
                  { id: "t1", label: "Заказ создан", time: o.timeline[0].time, completed: true },
                  { id: "t2", label: "Оплата подтверждена", time: o.timeline[1].time, completed: true },
                  { id: "t3", label: "Поиск исполнителя", time: assignedTime, completed: true },
                  { id: "t4", label: "Исполнитель назначен", time: assignedTime, completed: true },
                ],
              }
            : o
        ),
      }));
    }, delay);
  },

  assignPerformer: () =>
    set({ orderFlowStatus: "assigned", activePerformer: MOCK_PERFORMER }),

  resetOrderFlow: () =>
    set({
      paymentStatus: "idle",
      orderFlowStatus: "idle",
      pendingOrder: null,
      activePerformer: null,
    }),
}));
