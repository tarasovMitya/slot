import { useState } from "react";
import { Star, Phone, MessageCircle } from "lucide-react";
import type { Performer } from "../../types";

interface PerformerCardProps {
  performer: Performer;
  showPhone?: boolean;
  onChat?: () => void;
}

export function PerformerCard({ performer, showPhone = false, onChat }: PerformerCardProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const displayName = (performer.name || "").trim() || "Исполнитель";
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarText = (performer.avatar || "").trim();
  const isPhotoUrl = avatarText.startsWith("http") || avatarText.startsWith("data:");
  const showImg = isPhotoUrl && !imgFailed;

  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
        {showImg ? (
          <img
            src={avatarText}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          avatarText && !isPhotoUrl ? avatarText : initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{displayName}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          <span className="text-xs font-medium text-gray-700">
            {performer.rating > 0 ? performer.rating.toFixed(1) : "—"}
          </span>
          {performer.reviewCount > 0 && (
            <span className="text-xs text-gray-400">· {performer.reviewCount} отзывов</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{performer.jobsCompleted} выполненных заказов</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onChat && (
          <button
            onClick={onChat}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <MessageCircle size={16} className="text-gray-600" />
          </button>
        )}
        {showPhone && (
          <a
            href={`tel:${performer.phone}`}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Phone size={16} className="text-gray-600" />
          </a>
        )}
      </div>
    </div>
  );
}
