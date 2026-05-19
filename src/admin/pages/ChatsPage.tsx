import { useEffect, useState, useMemo } from "react";
import { MessageSquare, Loader2, Search, X } from "lucide-react";
import { dbLoadAllChats } from "../../lib/chatDb";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { ChatWindow } from "../../chat/components/ChatWindow";
import type { ChatWithMeta } from "../../chat/types";

const TYPE_LABELS: Record<string, string> = {
  client_performer: "Клиент ↔ Исполнитель",
  client_admin:     "Клиент ↔ Поддержка",
  performer_admin:  "Исполнитель ↔ Поддержка",
};

const FILTERS = [
  { key: "all",              label: "Все" },
  { key: "client_performer", label: "Кл. ↔ Исп." },
  { key: "client_admin",     label: "Кл. ↔ Под." },
  { key: "performer_admin",  label: "Исп. ↔ Под." },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const { activeChat, messages, isLoading, isSending, openChatById, sendMessage } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    dbLoadAllChats()
      .then(setChats)
      .finally(() => setIsLoadingList(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chats.filter((c) => {
      if (filter !== "all" && c.type !== filter) return false;
      if (!q) return true;
      return (
        (c.serviceName ?? "").toLowerCase().includes(q) ||
        (c.orderStatus ?? "").toLowerCase().includes(q) ||
        TYPE_LABELS[c.type]?.toLowerCase().includes(q)
      );
    });
  }, [chats, search, filter]);

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-bold text-gray-900">Чаты</h1>
            <span className="text-xs text-gray-400">{filtered.length} / {chats.length}</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === f.key
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingList ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="text-gray-300 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center px-4">
              <MessageSquare size={28} className="text-gray-200" />
              <p className="text-sm text-gray-400">
                {chats.length === 0 ? "Чатов пока нет" : "Ничего не найдено"}
              </p>
            </div>
          ) : (
            filtered.map((chat) => {
              const isActive = activeChat?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => openChatById(chat.id, chat)}
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

      {/* Right panel */}
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
