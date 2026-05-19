import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Loader2, AlertCircle } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { ChatWindow } from "./ChatWindow";

interface ChatDrawerProps {
  clientName?: string;
  performerName?: string;
  title?: string;
}

export function ChatDrawer({
  clientName = "Клиент",
  performerName = "Исполнитель",
  title = "Чат",
}: ChatDrawerProps) {
  const { isOpen, activeChat, messages, isLoading, isSending, chatError, closeChat, sendMessage } =
    useChatStore();
  const { user } = useAuthStore();

  const chatTitle =
    activeChat?.type === "client_performer" ? "Чат с исполнителем"
    : activeChat?.type === "client_admin" ? "Чат с поддержкой"
    : activeChat?.type === "performer_admin" ? "Чат с поддержкой"
    : title;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={closeChat}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[60] w-full max-w-md bg-white shadow-2xl flex flex-col"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                <MessageCircle size={15} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{chatTitle}</p>
                <p className="text-xs text-gray-400">Онлайн-чат</p>
              </div>
              <button
                onClick={closeChat}
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Chat */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeChat && user ? (
                <ChatWindow
                  chat={activeChat}
                  messages={messages}
                  currentUserId={user.id}
                  isLoading={isLoading}
                  isSending={isSending}
                  clientName={clientName}
                  performerName={performerName}
                  onSend={sendMessage}
                />
              ) : chatError ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                  <AlertCircle size={24} className="text-red-400" />
                  <p className="text-sm text-gray-500">{chatError}</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={24} className="text-gray-300 animate-spin" />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
