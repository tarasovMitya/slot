// ─── SQL migration (run once in Supabase SQL Editor) ─────────────────────────
//
// create table if not exists chats (
//   id uuid primary key default gen_random_uuid(),
//   order_id uuid references shared_orders(id) on delete cascade,
//   type text not null check (type in ('client_performer', 'client_admin', 'performer_admin')),
//   client_id uuid references auth.users(id),
//   performer_id uuid references auth.users(id),
//   created_at timestamptz default now()
// );
// create unique index if not exists chats_order_type_idx on chats(order_id, type);
//
// create table if not exists messages (
//   id uuid primary key default gen_random_uuid(),
//   chat_id uuid not null references chats(id) on delete cascade,
//   sender_id uuid references auth.users(id),
//   body text not null default '',
//   attachments jsonb not null default '[]',
//   is_system boolean not null default false,
//   created_at timestamptz default now()
// );
// create index if not exists messages_chat_created_idx on messages(chat_id, created_at);
//
// create table if not exists chat_reads (
//   chat_id uuid not null references chats(id) on delete cascade,
//   user_id uuid not null references auth.users(id),
//   last_read_at timestamptz not null default now(),
//   primary key (chat_id, user_id)
// );
//
// alter table chats enable row level security;
// alter table messages enable row level security;
// alter table chat_reads enable row level security;
//
// create policy "chats_participant_select" on chats for select
//   using (client_id = auth.uid() or performer_id = auth.uid() or is_admin());
// create policy "chats_insert_auth" on chats for insert
//   with check (auth.role() = 'authenticated');
//
// create policy "messages_participant_select" on messages for select
//   using (exists (
//     select 1 from chats c where c.id = messages.chat_id
//       and (c.client_id = auth.uid() or c.performer_id = auth.uid() or is_admin())
//   ));
// create policy "messages_participant_insert" on messages for insert
//   with check (exists (
//     select 1 from chats c where c.id = messages.chat_id
//       and (c.client_id = auth.uid() or c.performer_id = auth.uid() or is_admin())
//   ));
//
// create policy "chat_reads_own" on chat_reads for all using (user_id = auth.uid());
//
// alter publication supabase_realtime add table messages;
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase";
import type { Chat, Message, ChatType, ChatWithMeta } from "../chat/types";

function rowToChat(r: Record<string, unknown>): Chat {
  return {
    id: r.id as string,
    orderId: (r.order_id as string) ?? null,
    type: r.type as ChatType,
    clientId: (r.client_id as string) ?? null,
    performerId: (r.performer_id as string) ?? null,
    createdAt: r.created_at as string,
  };
}

function rowToMessage(r: Record<string, unknown>): Message {
  return {
    id: r.id as string,
    chatId: r.chat_id as string,
    senderId: (r.sender_id as string) ?? null,
    body: r.body as string,
    attachments: (r.attachments as Message["attachments"]) ?? [],
    isSystem: r.is_system as boolean,
    createdAt: r.created_at as string,
  };
}

export async function dbGetOrCreateChat(
  orderId: string,
  type: ChatType,
  clientId: string | null,
  performerId: string | null
): Promise<Chat | null> {
  const { data: existing } = await supabase
    .from("chats")
    .select("*")
    .eq("order_id", orderId)
    .eq("type", type)
    .maybeSingle();

  if (existing) return rowToChat(existing as Record<string, unknown>);

  const { data, error } = await supabase
    .from("chats")
    .insert({ order_id: orderId, type, client_id: clientId, performer_id: performerId })
    .select()
    .single();

  if (error || !data) return null;
  return rowToChat(data as Record<string, unknown>);
}

export async function dbGetChatForOrder(orderId: string, type: ChatType): Promise<Chat | null> {
  const { data } = await supabase
    .from("chats")
    .select("*")
    .eq("order_id", orderId)
    .eq("type", type)
    .maybeSingle();
  if (!data) return null;
  return rowToChat(data as Record<string, unknown>);
}

export async function dbLoadMessages(chatId: string, limit = 80): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (!data) return [];
  return data.map((r) => rowToMessage(r as Record<string, unknown>));
}

export async function dbSendMessage(
  chatId: string,
  senderId: string,
  body: string
): Promise<Message | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, sender_id: senderId, body, is_system: false })
    .select()
    .single();
  if (error || !data) return null;
  return rowToMessage(data as Record<string, unknown>);
}

export async function dbSendSystemMessage(chatId: string, body: string): Promise<void> {
  await supabase
    .from("messages")
    .insert({ chat_id: chatId, sender_id: null, body, is_system: true })
    .then(() => {}, () => {});
}

export function dbSubscribeMessages(
  chatId: string,
  onNew: (msg: Message) => void
): () => void {
  const channel = supabase
    .channel(`messages_${chatId}_${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
      (payload) => onNew(rowToMessage(payload.new as Record<string, unknown>))
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function dbMarkChatRead(chatId: string, userId: string): Promise<void> {
  await supabase
    .from("chat_reads")
    .upsert(
      { chat_id: chatId, user_id: userId, last_read_at: new Date().toISOString() },
      { onConflict: "chat_id,user_id" }
    )
    .then(() => {}, () => {});
}

export async function dbGetUnreadCount(chatId: string, userId: string): Promise<number> {
  const { data: readData } = await supabase
    .from("chat_reads")
    .select("last_read_at")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .maybeSingle();

  const lastReadAt = (readData?.last_read_at as string) ?? "1970-01-01T00:00:00Z";

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("chat_id", chatId)
    .neq("sender_id", userId)
    .gt("created_at", lastReadAt);

  return count ?? 0;
}

// ─── Admin: load all chats with order metadata ────────────────────────────────

export async function dbLoadAllChats(): Promise<ChatWithMeta[]> {
  const { data } = await supabase
    .from("chats")
    .select("*, shared_orders(service_name, status)")
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((r) => {
    const order = r.shared_orders as Record<string, unknown> | null;
    return {
      ...rowToChat(r as Record<string, unknown>),
      serviceName: (order?.service_name as string) ?? undefined,
      orderStatus: (order?.status as string) ?? undefined,
    };
  });
}

// ─── Auto-create chat when performer accepts order ────────────────────────────

export async function dbAutoCreateOrderChat(
  orderId: string,
  performerId: string
): Promise<void> {
  try {
    const { data: orderData } = await supabase
      .from("shared_orders")
      .select("client_email")
      .eq("id", orderId)
      .single();

    if (!orderData?.client_email) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", orderData.client_email)
      .maybeSingle();

    const clientId = (profileData?.user_id as string) ?? null;

    const { data: chatData } = await supabase
      .from("chats")
      .insert({ order_id: orderId, type: "client_performer", client_id: clientId, performer_id: performerId })
      .select("id")
      .single();

    if (chatData?.id) {
      await supabase.from("messages").insert({
        chat_id: chatData.id,
        sender_id: null,
        body: "Исполнитель принял заказ. Чат открыт — можете начать общение.",
        is_system: true,
      }).then(() => {}, () => {});
    }
  } catch {
    // Never crash the accept flow
  }
}
