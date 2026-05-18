import { create } from "zustand";
import {
  dbGetOrCreateChat,
  dbLoadMessages,
  dbSendMessage,
  dbMarkChatRead,
  dbSubscribeMessages,
  dbGetUnreadCount,
} from "../lib/chatDb";
import { useAuthStore } from "./authStore";
import { trackEvent } from "../lib/analytics";
import type { Chat, Message, ChatType } from "../chat/types";

interface ChatState {
  activeChat: Chat | null;
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  isSending: boolean;
  unreadByOrder: Record<string, number>;
  _unsubscribe: (() => void) | null;

  openChatForOrder: (
    orderId: string,
    type: ChatType,
    clientId: string | null,
    performerId: string | null
  ) => Promise<void>;
  openChatById: (chatId: string, chatData: Chat) => Promise<void>;
  closeChat: () => void;
  sendMessage: (body: string) => Promise<void>;
  refreshUnread: (orderId: string, type: ChatType) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeChat: null,
  messages: [],
  isOpen: false,
  isLoading: false,
  isSending: false,
  unreadByOrder: {},
  _unsubscribe: null,

  openChatForOrder: async (orderId, type, clientId, performerId) => {
    const prev = get()._unsubscribe;
    if (prev) prev();

    set({ isOpen: true, isLoading: true, messages: [], _unsubscribe: null });

    const chat = await dbGetOrCreateChat(orderId, type, clientId, performerId);
    if (!chat) {
      set({ isLoading: false });
      return;
    }

    const userId = useAuthStore.getState().user?.id ?? null;
    const messages = await dbLoadMessages(chat.id);
    if (userId) await dbMarkChatRead(chat.id, userId);

    const unsub = dbSubscribeMessages(chat.id, (msg) => {
      set((s) => ({ messages: [...s.messages, msg] }));
      const uid = useAuthStore.getState().user?.id;
      if (uid) dbMarkChatRead(chat.id, uid);
    });

    set({
      activeChat: chat,
      messages,
      isLoading: false,
      _unsubscribe: unsub,
      unreadByOrder: { ...get().unreadByOrder, [orderId]: 0 },
    });

    trackEvent("message_sent", { chatId: chat.id, action: "chat_opened" });
  },

  openChatById: async (chatId, chatData) => {
    const prev = get()._unsubscribe;
    if (prev) prev();

    set({ isOpen: true, isLoading: true, messages: [], _unsubscribe: null, activeChat: chatData });

    const userId = useAuthStore.getState().user?.id ?? null;
    const messages = await dbLoadMessages(chatId);
    if (userId) await dbMarkChatRead(chatId, userId);

    const unsub = dbSubscribeMessages(chatId, (msg) => {
      set((s) => ({ messages: [...s.messages, msg] }));
      const uid = useAuthStore.getState().user?.id;
      if (uid) dbMarkChatRead(chatId, uid);
    });

    set({ messages, isLoading: false, _unsubscribe: unsub });
  },

  closeChat: () => {
    const unsub = get()._unsubscribe;
    if (unsub) unsub();
    set({ isOpen: false, activeChat: null, messages: [], _unsubscribe: null });
  },

  sendMessage: async (body) => {
    const { activeChat } = get();
    const userId = useAuthStore.getState().user?.id;
    if (!activeChat || !userId || !body.trim()) return;

    set({ isSending: true });
    await dbSendMessage(activeChat.id, userId, body.trim());
    set({ isSending: false });

    trackEvent("message_sent", { chatId: activeChat.id });
  },

  refreshUnread: async (orderId, type) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    // Find existing chat without creating one
    const { dbGetChatForOrder } = await import("../lib/chatDb");
    const chat = await dbGetChatForOrder(orderId, type);
    if (!chat) return;

    const count = await dbGetUnreadCount(chat.id, userId);
    set((s) => ({ unreadByOrder: { ...s.unreadByOrder, [orderId]: count } }));
  },
}));
