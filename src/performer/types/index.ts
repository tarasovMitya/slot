export type PerformerOrderStatus =
  | "available"
  | "accepted"
  | "on_the_way"
  | "in_progress"
  | "waiting_client_confirmation"
  | "dispute_opened"
  | "completed"
  | "rejected";

export interface PriceItem {
  label: string;
  amount: number;
}

export interface TimelineEvent {
  id: string;
  label: string;
  time: string;
  completed: boolean;
}

export interface ClientInfo {
  name: string;
  phone: string;
}

export interface PerformerOrder {
  id: string;
  createdAt: string;
  scheduledDate: string;
  scheduledTime: string;
  status: PerformerOrderStatus;
  categoryName: string;
  serviceName: string;
  address: string;
  lat?: number;
  lng?: number;
  distance?: string;
  etaMinutes?: number;
  priceTotal: number;
  priceBreakdown: PriceItem[];
  duration: string;
  comment?: string;
  client: ClientInfo;
  timeline: TimelineEvent[];
  completionComment?: string | null;
  completionRequestedAt?: string | null;
}

export interface PerformerProfile {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  completedOrders: number;
  phone: string;
  telegram: string;
  specializations: string[];
  about: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  workRadius: number; // km
}

export interface BankCard {
  id: string;
  last4: string;
  brand: "Visa" | "Mastercard" | "МИР";
  expiry: string;
  isDefault: boolean;
}

export interface WithdrawRecord {
  id: string;
  amount: number;
  cardLast4: string;
  date: string;
  time: string;
  status: "completed" | "pending";
}

export interface EarningsRecord {
  id: string;
  orderId: string;
  serviceName: string;
  amount: number;
  date: string;
  time: string;
}

export interface PerformerNotification {
  id: string;
  type: "new_order" | "status_change" | "cancellation" | "payment";
  title: string;
  body: string;
  time: string;
  read: boolean;
  orderId?: string;
}
