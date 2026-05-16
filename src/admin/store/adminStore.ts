import { create } from "zustand";
import type { AdminRole, AdminStats, AdminOrder, AdminPerformer, AdminDispute } from "../types";
import {
  adminLoadStats,
  adminLoadOrders,
  adminLoadPerformers,
  adminLoadDisputes,
  adminUpdateOrderStatus,
  adminCancelOrder,
  adminGetUserRole,
  adminAdjustPerformerBalance,
  adminApprovePerformerPayout,
} from "../lib/adminDb";

interface AdminState {
  role: AdminRole | null;
  isLoadingRole: boolean;

  stats: AdminStats | null;
  orders: AdminOrder[];
  performers: AdminPerformer[];
  disputes: AdminDispute[];

  isLoadingStats: boolean;
  isLoadingOrders: boolean;
  isLoadingPerformers: boolean;
  isLoadingDisputes: boolean;

  loadRole: (userId: string) => Promise<void>;
  loadStats: () => Promise<void>;
  loadOrders: (statusFilter?: string) => Promise<void>;
  loadPerformers: () => Promise<void>;
  loadDisputes: () => Promise<void>;

  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  adjustBalance: (performerId: string, delta: number) => Promise<void>;
  approvePayout: (performerId: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  role: null,
  isLoadingRole: true,
  stats: null,
  orders: [],
  performers: [],
  disputes: [],
  isLoadingStats: false,
  isLoadingOrders: false,
  isLoadingPerformers: false,
  isLoadingDisputes: false,

  loadRole: async (userId) => {
    set({ isLoadingRole: true });
    const role = await adminGetUserRole(userId);
    set({ role: role as AdminRole | null, isLoadingRole: false });
  },

  loadStats: async () => {
    set({ isLoadingStats: true });
    const stats = await adminLoadStats();
    set({ stats, isLoadingStats: false });
  },

  loadOrders: async (statusFilter) => {
    set({ isLoadingOrders: true });
    const orders = await adminLoadOrders(statusFilter);
    set({ orders, isLoadingOrders: false });
  },

  loadPerformers: async () => {
    set({ isLoadingPerformers: true });
    const performers = await adminLoadPerformers();
    set({ performers, isLoadingPerformers: false });
  },

  loadDisputes: async () => {
    set({ isLoadingDisputes: true });
    const disputes = await adminLoadDisputes();
    set({ disputes, isLoadingDisputes: false });
  },

  updateOrderStatus: async (orderId, status) => {
    await adminUpdateOrderStatus(orderId, status);
    set((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    }));
  },

  cancelOrder: async (orderId) => {
    await adminCancelOrder(orderId);
    set((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)),
    }));
  },

  adjustBalance: async (performerId, delta) => {
    await adminAdjustPerformerBalance(performerId, delta);
    await get().loadPerformers();
  },

  approvePayout: async (performerId) => {
    await adminApprovePerformerPayout(performerId);
    set((s) => ({
      performers: s.performers.map((p) =>
        p.id === performerId ? { ...p, pendingBalance: 0 } : p
      ),
    }));
  },
}));
