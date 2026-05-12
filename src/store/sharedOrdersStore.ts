import { create } from "zustand";
import type { PriceItem } from "../dashboard/types";

// ─── Status ──────────────────────────────────────────────────────────────────

export type SharedOrderStatus =
  | "searching_performer"
  | "performer_assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type AcceptResult = "success" | "already_taken" | "not_found";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SharedOrder {
  id: string;
  createdAt: string;
  scheduledDate: string;
  scheduledTime: string;
  status: SharedOrderStatus;
  categoryName: string;
  serviceName: string;
  address: string;
  priceTotal: number;
  priceBreakdown: PriceItem[];
  duration: string;
  comment?: string;

  // Client
  clientEmail: string;
  clientName: string;
  clientPhone: string;

  // Performer — null until accepted
  performerId: string | null;
  performerName: string | null;
  performerPhone: string | null;
  performerTelegram: string | null;
  performerRating: number | null;
  performerAvatar: string | null;
  performerJobsCompleted: number | null;
  acceptedAt: string | null;

  // Future: geo filtering
  lat?: number;
  lng?: number;
}

export interface PerformerInfo {
  id: string;
  name: string;
  phone: string;
  telegram: string;
  rating: number;
  avatar: string;
  jobsCompleted: number;
}

type CreateOrderData = Omit<
  SharedOrder,
  | "id"
  | "createdAt"
  | "performerId"
  | "performerName"
  | "performerPhone"
  | "performerTelegram"
  | "performerRating"
  | "performerAvatar"
  | "performerJobsCompleted"
  | "acceptedAt"
>;

// ─── Store ───────────────────────────────────────────────────────────────────

interface SharedOrdersState {
  orders: SharedOrder[];

  /** Create a new order visible to performers. Returns the new order id. */
  createOrder: (data: CreateOrderData) => string;

  /** Add a single order from DB/Realtime (no-op if already present). */
  addOrder: (order: SharedOrder) => void;

  /**
   * Atomically accept an order. If the order is still in searching_performer
   * status, it is assigned to the performer and 'success' is returned.
   * Otherwise 'already_taken' or 'not_found'.
   */
  acceptOrder: (orderId: string, performer: PerformerInfo) => AcceptResult;

  /** Update order status (e.g. in_progress → completed from performer side). */
  updateStatus: (orderId: string, status: SharedOrderStatus) => void;

  /** Replace a full order received from Realtime (upsert). */
  updateOrder: (order: SharedOrder) => void;
}

export const useSharedOrdersStore = create<SharedOrdersState>((set, get) => ({
  orders: [],

  createOrder: (data) => {
    const id = `ord-${Date.now()}`;
    const order: SharedOrder = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      performerId: null,
      performerName: null,
      performerPhone: null,
      performerTelegram: null,
      performerRating: null,
      performerAvatar: null,
      performerJobsCompleted: null,
      acceptedAt: null,
    };
    set((s) => ({ orders: [order, ...s.orders] }));
    return id;
  },

  addOrder: (order) =>
    set((s) =>
      s.orders.some((o) => o.id === order.id)
        ? s
        : { orders: [order, ...s.orders] }
    ),

  acceptOrder: (orderId, performer) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return "not_found";
    // Guard against race conditions: only accept if still searching
    if (order.status !== "searching_performer" || order.performerId !== null) {
      return "already_taken";
    }
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "performer_assigned" as SharedOrderStatus,
              performerId: performer.id,
              performerName: performer.name,
              performerPhone: performer.phone,
              performerTelegram: performer.telegram,
              performerRating: performer.rating,
              performerAvatar: performer.avatar,
              performerJobsCompleted: performer.jobsCompleted,
              acceptedAt: new Date().toISOString(),
            }
          : o
      ),
    }));
    return "success";
  },

  updateStatus: (orderId, status) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    })),

  updateOrder: (order) =>
    set((s) => ({
      orders: s.orders.some((o) => o.id === order.id)
        ? s.orders.map((o) => (o.id === order.id ? order : o))
        : [order, ...s.orders],
    })),
}));
