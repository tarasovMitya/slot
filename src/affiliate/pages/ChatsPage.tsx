import { useEffect, useState, useMemo } from "react";
import { MessageSquare, Loader2, Search, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { useAffiliateStore } from "../store/affiliateStore";
import { ChatWindow } from "../../chat/components/ChatWindow";
import type { ChatWithMeta } from "../../chat/types";

const STATUS_FILTERS = [
  { key: "all",      label: "Все" },
  { key: "active",   label: "Активные" },
  { key: "dispute",  label: "Споры" },
  { key: "done",     label: "Завершены" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["key"];

const ACTIVE_STATUSES = new Set(["searching_performer", "performer_assigned", "in_progress", "waiting_client_confirmation"]);
const DISPUTE_STATUSES = new Set(["dispute_opened"]);
const DONE_STATUSES = new Set(["completed", "cancelled"]);

function matchesFilter(status: string | null | undefined, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "active") return ACTIVE_STATUSES.has(status ?? "");
  if (filter === "dispute") return DISPUTE_STATUSES.has(status ?? "");
  if (filter === "done") return DONE_STATUSES.has(status ?? "");
  return true;
}

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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
    return chats.filter((c) => {
      if (!matchesFilter(c.orderStatus, statusFilter)) return false;
      if (!q) return true;
      return (c.serviceName ?? "").toLowerCase().includes(q) ||
             (c.orderStatus ?? "").toLowerCase().includes(q);
    });
  }, [chats, search, statusFilter]);

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-72 shrink-0 border-r border-white/[0.06] flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-bold text-white">Чаты</h1>
            <span className="text-xs text-[#6b7194]">{filtered.length} / {chats.length}</span>
          </div>
          {/* Search */}
          <div className="relative mb-2.5">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7194] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full pl-7 pr-7 py-1.5 text-xs rounded-lg text-white placeholder:text-[#4a4f68] focus:outline-none focus:ring-1 focus:ring-[#006AFF]/40 transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7194] hover:text-[#8b90a8]">
                <X size={12} />
              </button>
            )}
          </div>
          {/* Status filter tabs */}
          <div className="flex gap-1 rounded-lg p-0.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`flex-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                  statusFilter === f.key ? "bg-[#006AFF] text-white" : "text-[#6b7194] hover:text-[#c0c5e0]"
                }`}
              >
                {f.label}
              </button>
            ))}
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
                  className={`w-full text-left px-4 py-3.5 border-b transition-colors ${isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
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
            <div className="px-5 py-3.5 border-b border-white/[0.06] shrink-0">
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
