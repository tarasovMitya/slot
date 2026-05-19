import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { ChatBubble } from "./ChatBubble";
import type { Chat, Message } from "../types";
import { sanitizeMessage } from "../../lib/sanitize";

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  isSending: boolean;
  clientName?: string;
  performerName?: string;
  onSend: (body: string) => void;
}

function getSenderLabel(
  msg: Message,
  chat: Chat,
  currentUserId: string,
  clientName: string,
  performerName: string
): string {
  if (msg.senderId === currentUserId) return "Вы";
  if (msg.senderId === chat.clientId) return clientName || "Клиент";
  if (msg.senderId === chat.performerId) return performerName || "Исполнитель";
  return "Поддержка";
}

export function ChatWindow({
  chat,
  messages,
  currentUserId,
  isLoading,
  isSending,
  clientName = "Клиент",
  performerName = "Исполнитель",
  onSend,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = sanitizeMessage(input.trim());
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setInput("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="text-gray-300 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400 text-center">
              Напишите первое сообщение
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
              senderLabel={getSenderLabel(msg, chat, currentUserId, clientName, performerName)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 px-4 py-3 flex items-end gap-2 bg-white">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 max-h-32 overflow-y-auto"
          style={{ lineHeight: "1.5" }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center shrink-0 hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
