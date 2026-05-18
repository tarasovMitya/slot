import { useEffect, useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { dbLoadAllChats } from "../../lib/chatDb";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { ChatWindow } from "../../chat/components/ChatWindow";
import type { ChatWithMeta } from "../../chat/types";

const TYPE_LABELS: Record<string, string> = {
  client_performer: "Клиент ↔ Исполнитель",
  client_admin: "Клиент ↔ Поддержка",
  performer_admin: "Исполнитель ↔ Поддержка",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} д назад`;
}

export function AdminChatsPage() {
  const [chats, setChats] = useState<ChatWithMeta[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const { activeChat, messages, isLoading, isSending, openChatById, sendMessage } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    dbLoadAllChats()
      .then(setChats)
      .finally(() => setIsLoadingList(false));
  }, []);

  const handleSelectChat = (chat: ChatWithMeta) => {
    openChatById(chat.id, chat);
  };

  return (
    <div className="flex h-full">
      {/* Left panel — chat list */}
      <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-base font-bold text-gray-900">Чаты</h1>
          <p className="text-xs text-gray-400 mt-0.5">{chats.length} всего</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingList ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="text-gray-300 animate-spin" />
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center px-4">
              <MessageSquare size={28} className="text-gray-200" />
              <p className="text-sm text-gray-400">Чатов пока нет</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = activeChat?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors ${
                    isActive ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {chat.serviceName ?? "Заказ"}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">
                      {timeAgo(chat.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{TYPE_LABELS[chat.type] ?? chat.type}</p>
                  {chat.orderStatus && (
                    <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                      {chat.orderStatus}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel — chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChat && user ? (
          <>
            <div className="px-5 py-3.5 border-b border-gray-100 shrink-0">
              <p className="text-sm font-semibold text-gray-900">
                {(activeChat as ChatWithMeta).serviceName ?? "Чат"}
              </p>
              <p className="text-xs text-gray-400">
                {TYPE_LABELS[activeChat.type] ?? activeChat.type}
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <ChatWindow
                chat={activeChat}
                messages={messages}
                currentUserId={user.id}
                isLoading={isLoading}
                isSending={isSending}
                clientName="Клиент"
                performerName="Исполнитель"
                onSend={sendMessage}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <MessageSquare size={36} className="text-gray-200" />
            <p className="text-sm text-gray-400">Выберите чат слева</p>
          </div>
        )}
      </div>
    </div>
  );
}
