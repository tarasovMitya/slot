export type AdminRole = "super_admin" | "support_admin" | "finance_admin" | "verifier" | "operator";

export const ADMIN_ROLES: AdminRole[] = ["super_admin", "support_admin", "finance_admin", "verifier", "operator"];

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Супер-админ",
  support_admin: "Поддержка",
  finance_admin: "Финансы",
  verifier: "Верификатор",
  operator: "Оператор",
};

export interface AdminStats {
  activeOrders: number;
  completedOrders: number;
  searchingOrders: number;
  performersTotal: number;
  openDisputes: number;
  pendingPayouts: number;
  revenueTotal: number;
  ordersToday: number;
}

export interface AdminOrder {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  performerName: string | null;
  performerId: string | null;
  categoryName: string;
  serviceName: string;
  address: string;
  priceTotal: number;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  createdAt: string;
  completionComment: string | null;
  disputeComment: string | null;
  clientRating: number | null;
}

export interface AdminPerformer {
  id: string;
  name: string;
  phone: string;
  telegram: string;
  rating: number;
  completedOrders: number;
  balance: number;
  pendingBalance: number;
  address: string;
  city: string;
  workRadius: number;
  specializations: string[];
  isOnline: boolean;
  verificationStatus: "pending" | "approved" | "rejected";
  createdAt?: string;
}

export interface AdminDispute {
  id: string;
  orderId: string;
  clientName: string;
  performerName: string;
  serviceName: string;
  priceTotal: number;
  disputeComment: string | null;
  status: string;
  createdAt: string;
}

export interface AdminClient {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  createdAt?: string;
  ordersCount?: number;
}

export type OrderStatusFilter =
  | "all"
  | "pending_payment"
  | "searching_performer"
  | "in_progress"
  | "waiting_client_confirmation"
  | "completed"
  | "dispute_opened"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  all: "Все",
  pending_payment: "Ожидает оплаты",
  searching_performer: "Поиск исполнителя",
  accepted: "Принят",
  on_the_way: "Едет к клиенту",
  in_progress: "В процессе",
  waiting_client_confirmation: "Ожидает подтверждения",
  completed: "Завершён",
  dispute_opened: "Спор",
  cancelled: "Отменён",
};
