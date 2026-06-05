import { useEffect, useState, useMemo } from "react";
import { MessageSquare, Loader2, Search, X, ArrowLeft } from "lucide-react";
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
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

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

  function handleOpenChat(chatId: string, chat: ChatWithMeta) {
    openChatById(chatId, chat);
    setMobileView("chat");
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel */}
      <div className={`flex-col border-r border-white/[0.06] w-full md:w-72 md:shrink-0 ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-bold text-white">Чаты</h1>
            <span className="text-xs text-[#6b7194]">{filtered.length} / {chats.length}</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7194] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full pl-7 pr-7 py-1.5 text-xs border border-white/[0.08] rounded-lg bg-white/[0.06] focus:outline-none focus:border-[#006AFF]/40 focus:bg-white/[0.08] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7194] hover:text-[#8b90a8]"
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
                    ? "bg-[#003B8F] text-white"
                    : "bg-white/[0.06] text-[#6b7194] hover:bg-white/[0.08]"
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
              <Loader2 size={20} className="text-[#4a4f68] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center px-4">
              <MessageSquare size={28} className="text-gray-200" />
              <p className="text-sm text-[#6b7194]">
                {chats.length === 0 ? "Чатов пока нет" : "Ничего не найдено"}
              </p>
            </div>
          ) : (
            filtered.map((chat) => {
              const isActive = activeChat?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => handleOpenChat(chat.id, chat)}
                  className={`w-full text-left px-4 py-3.5 border-b border-white/[0.04] transition-colors ${
                    isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {chat.serviceName ?? "Заказ"}
                    </p>
                    <span className="text-xs text-[#6b7194] shrink-0">
                      {timeAgo(chat.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7194]">{TYPE_LABELS[chat.type] ?? chat.type}</p>
                  {chat.orderStatus && (
                    <span className="inline-block mt-1.5 text-xs bg-white/[0.06] text-[#6b7194] rounded-full px-2 py-0.5">
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
      <div className={`flex-col min-w-0 w-full md:flex-1 ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
        {activeChat && user ? (
          <>
            <div className="px-4 py-3.5 border-b border-white/[0.06] shrink-0 flex items-center gap-3">
              <button
                onClick={() => setMobileView("list")}
                className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-[#6b7194] hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
                aria-label="Назад"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {(activeChat as ChatWithMeta).serviceName ?? "Чат"}
                </p>
                <p className="text-xs text-[#6b7194]">
                  {TYPE_LABELS[activeChat.type] ?? activeChat.type}
                </p>
              </div>
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
            <p className="text-sm text-[#6b7194]">Выберите чат слева</p>
          </div>
        )}
      </div>
    </div>
  );
}
