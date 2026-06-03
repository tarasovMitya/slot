import { useEffect, useState, useMemo } from "react";
import { MessageSquare, Loader2, Search, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { useAffiliateStore } from "../store/affiliateStore";
import { ChatWindow } from "../../chat/components/ChatWindow";
import type { ChatWithMeta } from "../../chat/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} д назад`;
}

export function AffiliateChatsPage() {
  const [chats, setChats] = useState<ChatWithMeta[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [search, setSearch] = useState("");

  const { activeChat, messages, isLoading, isSending, openChatById, sendMessage } = useChatStore();
  const { user } = useAuthStore();
  const { userId, loadPerformers } = useAffiliateStore();

  useEffect(() => {
    if (!userId) return;
    loadPerformers();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    // Load performer_admin chats filtered to own performers
    supabase
      .from("performer_profiles")
      .select("user_id")
      .eq("affiliate_manager_id", userId)
      .then(async ({ data: pData }) => {
        const pIds = (pData ?? []).map((p: any) => p.user_id as string);
        if (pIds.length === 0) { setIsLoadingList(false); return; }

        const { data } = await supabase
          .from("chats")
          .select("id, type, created_at, performer_id, order_id, orders:order_id(service_name, status)")
          .eq("type", "performer_admin")
          .in("performer_id", pIds)
          .order("created_at", { ascending: false });

        const mapped: ChatWithMeta[] = (data ?? []).map((c: any) => ({
          id: c.id,
          type: c.type,
          orderId: c.order_id,
          performerId: c.performer_id,
          clientId: null,
          createdAt: c.created_at,
          serviceName: c.orders?.service_name ?? null,
          orderStatus: c.orders?.status ?? null,
        }));
        setChats(mapped);
        setIsLoadingList(false);
      });
  }, [userId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) =>
      (c.serviceName ?? "").toLowerCase().includes(q) ||
      (c.orderStatus ?? "").toLowerCase().includes(q)
    );
  }, [chats, search]);

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-bold text-white">Чаты</h1>
            <span className="text-xs text-[#6b7194]">{filtered.length} / {chats.length}</span>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7194] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7194] hover:text-[#8b90a8]">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingList ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="text-gray-300 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center px-4">
              <MessageSquare size={28} className="text-gray-200" />
              <p className="text-sm text-[#6b7194]">{chats.length === 0 ? "Чатов пока нет" : "Ничего не найдено"}</p>
            </div>
          ) : (
            filtered.map((chat) => {
              const isActive = activeChat?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => openChatById(chat.id, chat)}
                  className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors ${isActive ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-white truncate">{chat.serviceName ?? "Заказ"}</p>
                    <span className="text-xs text-[#6b7194] shrink-0">{timeAgo(chat.createdAt)}</span>
                  </div>
                  <p className="text-xs text-[#6b7194]">Исполнитель ↔ Поддержка</p>
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
              <p className="text-sm font-semibold text-white">{(activeChat as ChatWithMeta).serviceName ?? "Чат"}</p>
              <p className="text-xs text-[#6b7194]">Исполнитель ↔ Поддержка</p>
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
