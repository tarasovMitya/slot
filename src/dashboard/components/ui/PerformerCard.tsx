import { Star, Phone } from "lucide-react";
import type { Performer } from "../../types";

interface PerformerCardProps {
  performer: Performer;
  showPhone?: boolean;
}

export function PerformerCard({ performer, showPhone = false }: PerformerCardProps) {
  const displayName = performer.name || "Исполнитель";
  const initials = displayName.slice(0, 2).toUpperCase();
  const isPhotoUrl = performer.avatar?.startsWith("http");

  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
        {isPhotoUrl ? (
          <img src={performer.avatar} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          performer.avatar || initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{displayName}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          <span className="text-xs font-medium text-gray-700">{performer.rating}</span>
          <span className="text-xs text-gray-400">· {performer.reviewCount} отзывов</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{performer.jobsCompleted} выполненных заказов</p>
      </div>
      {showPhone && (
        <a
          href={`tel:${performer.phone}`}
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
        >
          <Phone size={16} className="text-gray-600" />
        </a>
      )}
    </div>
  );
}
