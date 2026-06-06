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
import type { SharedOrder } from "../../store/sharedOrdersStore";
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
  dbGetSharedOrder,
  dbConfirmOrderCompletion,
  dbOpenDispute,
  dbCreateReview,
  dbLoadNotifications,
  dbCreateNotification,
  dbMarkNotificationRead,
  dbMarkAllNotificationsRead,
  dbSubscribeNotifications,
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
  createOrderDirectly: (order: PendingOrder) => void;
  setOrderFlowStatus: (status: OrderFlowStatus) => void;
  onPerformerAssigned: () => void;
  applyPerformerFromSharedOrder: (sharedOrder: SharedOrder) => void;
  applyCompletionRequest: (sharedOrder: SharedOrder) => void;
  applyPerformerOnTheWay: (sharedOrder: SharedOrder) => void;
  applyLocationUpdate: (orderId: string, lat: number, lng: number, lastSeen: string) => void;
  applyOrderStatusFromShared: (orderId: string, status: Order["status"]) => void;
  confirmOrderCompletion: (orderId: string) => Promise<void>;
  openDispute: (orderId: string, comment: string) => Promise<void>;
  cancelOrder: (orderId: string) => void;
  resumePayment: (orderId: string) => void;
  dismissPayment: () => void;
  resetOrderFlow: () => void;

  // --- Notifications ---
  hydrateNotifications: (userId: string) => Promise<void>;
  subscribeNotifications: (userId: string) => Promise<() => void>;
  addNotification: (n: Omit<Notification, "id" | "read" | "time">, persist?: { userId: string; orderId?: string }) => void;

  // --- Reviews ---
  submitClientRating: (orderId: string, performerId: string, rating: number, comment: string) => Promise<void>;
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
    const [profile, addresses, rawOrders] = await Promise.all([
      dbLoadProfile(userId),
      dbLoadAddresses(userId),
      dbLoadOrders(userId),
    ]);
    let orders = rawOrders;

    // Restore order flow state so views survive page refresh
    const assignedOrder = orders.find((o) => o.status === "assigned");

    let flowRestore: Partial<DashboardState> = {};
    if (assignedOrder) {
      // Always re-fetch from shared_orders to get the latest performer data.
      // This covers: (a) performer data never persisted, (b) performer advanced status
      // to "in_progress"/"done" so the old "performer_assigned" status check would miss it.
      const sharedOrder = await dbGetSharedOrder(assignedOrder.id);
      const hasPerformerInShared =
        !!sharedOrder?.performerName &&
        sharedOrder.status !== "searching_performer" &&
        sharedOrder.status !== "cancelled";
      if (hasPerformerInShared && sharedOrder) {
        const assignedAt = sharedOrder.acceptedAt ?? assignedOrder.assignedAt ?? new Date().toISOString();
        const assignedTime = new Date(assignedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        const perfName = (sharedOrder.performerName || "").trim() || "Исполнитель";
        const perfAvatar = (sharedOrder.performerAvatar || "").trim() || perfName.slice(0, 2).toUpperCase();
        orders = orders.map((o) =>
          o.id === assignedOrder.id
            ? {
                ...o,
                assignedAt,
                performer: {
                  id: sharedOrder.performerId ?? "",
                  name: perfName,
                  avatar: perfAvatar,
                  rating: sharedOrder.performerRating ?? 0,
                  reviewCount: sharedOrder.performerJobsCompleted ?? 0,
                  phone: sharedOrder.performerPhone ?? "",
                  jobsCompleted: sharedOrder.performerJobsCompleted ?? 0,
                  telegram: sharedOrder.performerTelegram ?? undefined,
                },
                timeline: o.timeline.map((t) =>
                  t.label === "Заказ выполнен" ? t : { ...t, time: t.completed ? t.time : assignedTime, completed: true }
                ),
              }
            : o
        );
        dbUpdateOrder(assignedOrder.id, {
          performer_name: sharedOrder.performerName,
          performer_phone: sharedOrder.performerPhone ?? null,
          performer_telegram: sharedOrder.performerTelegram ?? null,
          performer_rating: sharedOrder.performerRating ?? null,
          performer_avatar: sharedOrder.performerAvatar ?? null,
          performer_id: sharedOrder.performerId ?? null,
          performer_jobs_completed: sharedOrder.performerJobsCompleted ?? null,
          assigned_at: assignedAt,
        });
      }
      // Ensure performer is never null for an assigned order — PerformerAssignedView
      // returns null (blank screen) if performer is missing, so set a minimal fallback
      // when we couldn't restore real data from shared_orders.
      if (!orders.find((o) => o.id === assignedOrder.id)?.performer) {
        orders = orders.map((o) =>
          o.id === assignedOrder.id && !o.performer
            ? {
                ...o,
                performer: {
                  id: "",
                  name: "Исполнитель",
                  avatar: "ИС",
                  rating: 0,
                  reviewCount: 0,
                  phone: "",
                  jobsCompleted: 0,
                  telegram: undefined,
                },
              }
            : o
        );
      }
      flowRestore = { orderFlowStatus: "assigned" as const, activeSharedOrderId: assignedOrder.id };
    }

    // Handle ALL searching orders independently — performer may have accepted any of them.
    // This runs even when there is also an assigned order (multiple concurrent orders).
    const searchingOrders = orders.filter((o) => o.status === "searching");
    for (const searchingOrder of searchingOrders) {
      const sharedOrder = await dbGetSharedOrder(searchingOrder.id);
      if (sharedOrder?.performerName && sharedOrder.status !== "searching_performer" && sharedOrder.status !== "cancelled") {
        const assignedAt = sharedOrder.acceptedAt ?? new Date().toISOString();
        const assignedTime = new Date(assignedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        const perfName = (sharedOrder.performerName || "").trim() || "Исполнитель";
        const perfAvatar = (sharedOrder.performerAvatar || "").trim() || perfName.slice(0, 2).toUpperCase();
        orders = orders.map((o) =>
          o.id === searchingOrder.id
            ? {
                ...o,
                status: "assigned" as const,
                assignedAt,
                performer: {
                  id: sharedOrder.performerId ?? "",
                  name: perfName,
                  avatar: perfAvatar,
                  rating: sharedOrder.performerRating ?? 0,
                  reviewCount: sharedOrder.performerJobsCompleted ?? 0,
                  phone: sharedOrder.performerPhone ?? "",
                  jobsCompleted: sharedOrder.performerJobsCompleted ?? 0,
                  telegram: sharedOrder.performerTelegram ?? undefined,
                },
                eta: `${new Date(o.scheduledDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} в ${o.scheduledTime}`,
                timeline: o.timeline.map((t) =>
                  t.label === "Заказ выполнен" ? t : { ...t, time: t.completed ? t.time : assignedTime, completed: true }
                ),
              }
            : o
        );
        // Only override flowRestore if we haven't already set it from an assignedOrder
        if (!flowRestore.activeSharedOrderId) {
          flowRestore = { orderFlowStatus: "assigned" as const, activeSharedOrderId: searchingOrder.id };
        }
        dbUpdateOrder(searchingOrder.id, {
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
      } else if (!flowRestore.activeSharedOrderId) {
        // Still searching — start watching this order
        flowRestore = { orderFlowStatus: "searching" as const, activeSharedOrderId: searchingOrder.id };
      }
    }

    set({
      profile: profile ?? emptyProfile,
      addresses,
      orders,
      isLoading: false,
      isHydrated: true,
      ...flowRestore,
    });
  },

  markNotificationRead: (id) => {
    set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) }));
    dbMarkNotificationRead(id);
  },

  markAllRead: () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    const userId = useAuthStore.getState().user?.id;
    if (userId) dbMarkAllNotificationsRead(userId);
  },

  hydrateNotifications: async (userId) => {
    const records = await dbLoadNotifications(userId);
    const notifications: Notification[] = records.map((r) => ({
      id: r.id,
      type: (r.type as Notification["type"]) ?? "status",
      title: r.title,
      body: r.body,
      time: new Date(r.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      read: r.read,
      orderId: r.orderId,
    }));
    set((s) => ({ notifications: [...notifications, ...s.notifications.filter((n) => !records.some((r) => r.id === n.id))] }));
  },

  subscribeNotifications: async (userId) => {
    return dbSubscribeNotifications(userId, (r) => {
      const n: Notification = {
        id: r.id,
        type: (r.type as Notification["type"]) ?? "status",
        title: r.title,
        body: r.body,
        time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        read: false,
        orderId: r.orderId,
      };
      set((s) => {
        // Deduplicate: skip if notification with this DB UUID is already in store
        if (s.notifications.some((x) => x.id === n.id)) return s;
        return { notifications: [n, ...s.notifications] };
      });
    });
  },

  addNotification: (n, persist) => {
    const tempId = `notif-${Date.now()}-${Math.random()}`;
    const time = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const notification = { ...n, id: tempId, time, read: false } satisfies import("../types").Notification;
    set((s) => ({ notifications: [notification, ...s.notifications] }));
    if (persist?.userId) {
      dbCreateNotification(persist.userId, n.type, n.title, n.body, persist.orderId).then((dbId) => {
        if (dbId) {
          // Replace temp ID with DB UUID so subscription dedup and future hydration work correctly
          set((s) => ({ notifications: s.notifications.map((x) => x.id === tempId ? { ...x, id: dbId } : x) }));
        }
      });
    }
  },

  submitClientRating: async (orderId, performerId, rating, comment) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    await dbCreateReview(orderId, userId, performerId, rating, comment);
    set((s) => ({
      orders: s.orders.map((o) => o.id === orderId ? { ...o, clientRating: rating, clientReview: comment } : o),
    }));
  },

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

  createOrderDirectly: (order) => {
    const { profile } = get();
    const now = new Date();
    const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

    const sharedId = useSharedOrdersStore.getState().createOrder({
      status: "searching_performer",
      scheduledDate: order.scheduledDate,
      scheduledTime: order.scheduledTime,
      categoryName: order.categoryName,
      serviceName: order.serviceName,
      address: order.address,
      priceTotal: order.priceTotal,
      priceBreakdown: order.priceBreakdown,
      duration: order.duration,
      clientEmail: profile.email,
      clientName: profile.name,
      clientPhone: profile.phone,
    });

    const newOrder: Order = {
      id: sharedId,
      createdAt: now.toISOString(),
      scheduledDate: order.scheduledDate,
      scheduledTime: order.scheduledTime,
      status: "searching",
      categoryName: order.categoryName,
      serviceName: order.serviceName,
      serviceId: "new",
      address: order.address,
      priceTotal: order.priceTotal,
      priceBreakdown: order.priceBreakdown,
      performer: null,
      eta: null,
      duration: order.duration,
      fieldValues: {},
      timeline: [
        { id: "t1", label: "Заказ создан", time: timeStr, completed: true },
        { id: "t2", label: "Поиск исполнителя", time: "", completed: false },
        { id: "t3", label: "Исполнитель найден", time: "", completed: false },
        { id: "t4", label: "Заказ выполнен", time: "", completed: false },
      ],
    };

    set((s) => ({
      orderFlowStatus: "searching",
      activeSharedOrderId: sharedId,
      orders: [newOrder, ...s.orders],
    }));

    const userId = useAuthStore.getState().user?.id;
    if (userId) dbSaveOrder(userId, newOrder);

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
              timeline: o.timeline.map((t) =>
                t.label === "Заказ выполнен" ? t : { ...t, time: t.completed ? t.time : assignedTime, completed: true }
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

  applyPerformerFromSharedOrder: (sharedOrder) => {
    const { orders } = get();
    // Guard: only apply if this order is still in searching state in local store
    const targetOrder = orders.find((o) => o.id === sharedOrder.id && o.status === "searching");
    if (!targetOrder) return;
    const perfName = (sharedOrder.performerName || "").trim() || "Исполнитель";
    if (!perfName || sharedOrder.status === "searching_performer" || sharedOrder.status === "cancelled") return;

    const assignedAt = new Date().toISOString();
    const assignedTime = new Date().toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const perfAvatar = (sharedOrder.performerAvatar || "").trim() || perfName.slice(0, 2).toUpperCase();

    set((s) => ({
      // Only flip the flow status if this is the currently tracked order
      ...(s.activeSharedOrderId === sharedOrder.id && { orderFlowStatus: "assigned" as OrderFlowStatus }),
      orders: s.orders.map((o) =>
        o.id === sharedOrder.id
          ? {
              ...o,
              status: "assigned" as const,
              assignedAt,
              performer: {
                id: sharedOrder.performerId ?? "",
                name: perfName,
                avatar: perfAvatar,
                rating: sharedOrder.performerRating ?? 0,
                reviewCount: sharedOrder.performerJobsCompleted ?? 0,
                phone: sharedOrder.performerPhone ?? "",
                jobsCompleted: sharedOrder.performerJobsCompleted ?? 0,
                telegram: sharedOrder.performerTelegram ?? undefined,
              },
              eta: `${new Date(o.scheduledDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} в ${o.scheduledTime}`,
              timeline: o.timeline.map((t) =>
                t.label === "Заказ выполнен" ? t : { ...t, time: t.completed ? t.time : assignedTime, completed: true }
              ),
            }
          : o
      ),
    }));

    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      dbUpdateOrder(sharedOrder.id, {
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
      get().addNotification(
        { type: "performer", title: "Исполнитель найден", body: `${perfName} принял ваш заказ`, orderId: sharedOrder.id },
        { userId, orderId: sharedOrder.id }
      );
    }
  },

  applyCompletionRequest: (sharedOrder) => {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === sharedOrder.id
          ? {
              ...o,
              status: "waiting_client_confirmation" as const,
              completionComment: sharedOrder.completionComment,
              completionRequestedAt: sharedOrder.completionRequestedAt,
            }
          : o
      ),
    }));
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      get().addNotification(
        { type: "completed", title: "Требуется подтверждение", body: "Исполнитель завершил работу — подтвердите выполнение", orderId: sharedOrder.id },
        { userId, orderId: sharedOrder.id }
      );
    }
  },

  applyPerformerOnTheWay: (sharedOrder) => {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === sharedOrder.id
          ? {
              ...o,
              status: "on_the_way" as const,
              performerLat: sharedOrder.performerLat ?? null,
              performerLng: sharedOrder.performerLng ?? null,
              performerLastSeen: sharedOrder.performerLastSeen ?? null,
            }
          : o
      ),
    }));
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      get().addNotification(
        { type: "status", title: "Исполнитель в пути", body: "Исполнитель едет к вам", orderId: sharedOrder.id },
        { userId, orderId: sharedOrder.id }
      );
    }
  },

  applyLocationUpdate: (orderId, lat, lng, lastSeen) => {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId
          ? { ...o, performerLat: lat, performerLng: lng, performerLastSeen: lastSeen }
          : o
      ),
    }));
  },

  applyOrderStatusFromShared: (orderId, status) => {
    set((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    }));
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      if (status === "in_progress") {
        get().addNotification(
          { type: "status", title: "Работа началась", body: "Исполнитель приступил к выполнению заказа", orderId },
          { userId, orderId }
        );
      } else if (status === "cancelled") {
        get().addNotification(
          { type: "status", title: "Заказ отменён", body: "Ваш заказ был отменён", orderId },
          { userId, orderId }
        );
      }
    }
  },

  confirmOrderCompletion: async (orderId) => {
    const doneTime = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "completed" as const,
              timeline: o.timeline.map((t) =>
                t.completed ? t : { ...t, time: doneTime, completed: true }
              ),
            }
          : o
      ),
      ...(s.activeSharedOrderId === orderId && {
        orderFlowStatus: "idle" as const,
        activeSharedOrderId: null as null,
      }),
    }));
    await dbConfirmOrderCompletion(orderId);
  },

  openDispute: async (orderId, comment) => {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, status: "dispute_opened" as const } : o
      ),
    }));
    await dbOpenDispute(orderId, comment);
  },

  dismissPayment: () => set({ paymentStatus: "idle" }),

  resumePayment: (orderId) => {
    const order = get().orders.find((o) => o.id === orderId && o.status === "pending_payment");
    if (!order) return;
    const pendingOrder: import("../types").PendingOrder = {
      serviceName: order.serviceName,
      categoryName: order.categoryName,
      duration: order.duration,
      scheduledDate: order.scheduledDate,
      scheduledTime: order.scheduledTime,
      priceTotal: order.priceTotal,
      priceBreakdown: order.priceBreakdown,
      address: order.address,
    };
    set({ pendingOrder, paymentStatus: "pending", draftOrderId: orderId });
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
