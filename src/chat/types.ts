export type ChatType = "client_performer" | "client_admin" | "performer_admin";

export interface AttachmentItem {
  url: string;
  type: "image" | "file";
  name?: string;
}

export interface Chat {
  id: string;
  orderId: string | null;
  type: ChatType;
  clientId: string | null;
  performerId: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string | null;
  body: string;
  attachments: AttachmentItem[];
  isSystem: boolean;
  createdAt: string;
}

export interface ChatWithMeta extends Chat {
  serviceName?: string;
  orderStatus?: string;
  lastMessageBody?: string;
  lastMessageAt?: string;
}
