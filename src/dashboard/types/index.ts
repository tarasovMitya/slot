export type OrderStatus =
  | "pending_payment"
  | "searching"
  | "assigned"
  | "on_the_way"
  | "in_progress"
  | "waiting_client_confirmation"
  | "dispute_opened"
  | "completed"
  | "cancelled";

export interface Performer {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  phone: string;
  jobsCompleted: number;
  telegram?: string;
  eta?: string;
}

export interface PriceItem {
  label: string;
  amount: number;
}

export interface Order {
  id: string;
  createdAt: string;
  scheduledDate: string;
  scheduledTime: string;
  status: OrderStatus;
  categoryName: string;
  serviceName: string;
  serviceId: string;
  address: string;
  priceTotal: number;
  priceBreakdown: PriceItem[];
  performer: Performer | null;
  eta: string | null;
  duration: string;
  comment?: string;
  assignedAt?: string;
  fieldValues: Record<string, unknown>;
  timeline: TimelineEvent[];
  completionComment?: string | null;
  completionRequestedAt?: string | null;
}

export interface TimelineEvent {
  id: string;
  label: string;
  time: string;
  completed: boolean;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "cash";
  last4?: string;
  brand?: string;
  expiry?: string;
  isDefault: boolean;
}

export interface Notification {
  id: string;
  type: "status" | "performer" | "completed" | "reminder" | "promo";
  title: string;
  body: string;
  time: string;
  read: boolean;
  orderId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  avatar?: string;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyPush: boolean;
}

// --- New order flow types ---

export type PaymentStatus = "idle" | "pending" | "processing" | "paid";
export type OrderFlowStatus = "idle" | "searching" | "assigned";

export interface PendingOrder {
  serviceName: string;
  categoryName: string;
  duration: string;
  scheduledDate: string;
  scheduledTime: string;
  priceTotal: number;
  priceBreakdown: PriceItem[];
  address: string;
}

export interface ActivePerformer {
  name: string;
  avatar: string;
  rating: number;
  jobsCompleted: number;
  phone: string;
  telegram: string;
  eta: string;
}
