import type { Message } from "../types";

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  senderLabel: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function ChatBubble({ message, isOwn, senderLabel }: ChatBubbleProps) {
  if (message.isSystem) {
    return (
      <div className="flex justify-center my-1">
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1 max-w-xs text-center">
          {message.body}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
      {!isOwn && (
        <span className="text-xs text-gray-400 px-1">{senderLabel}</span>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? "bg-[#006AFF] text-white rounded-br-sm"
            : "bg-gray-100 text-gray-900 rounded-bl-sm"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.body}</p>
        {message.attachments.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            {message.attachments.map((att, i) =>
              att.type === "image" ? (
                <img
                  key={i}
                  src={att.url}
                  alt={att.name ?? "вложение"}
                  className="rounded-xl max-w-full max-h-48 object-cover"
                />
              ) : (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs underline ${isOwn ? "text-gray-300" : "text-blue-600"}`}
                >
                  {att.name ?? "Файл"}
                </a>
              )
            )}
          </div>
        )}
      </div>
      <span className={`text-xs text-gray-400 px-1 ${isOwn ? "text-right" : ""}`}>
        {formatTime(message.createdAt)}
      </span>
    </div>
  );
}
