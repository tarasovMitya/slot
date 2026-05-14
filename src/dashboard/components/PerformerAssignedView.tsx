import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, MessageCircle, Star, Clock, CheckCircle } from "lucide-react";
import { useDashboardStore } from "../store/dashboardStore";

export function PerformerAssignedView() {
  const { activeSharedOrderId, orders, resetOrderFlow } = useDashboardStore();
  const order = orders.find((o) => o.id === activeSharedOrderId) ?? null;

  const [imgFailed, setImgFailed] = useState(false);

  if (!order?.performer) return null;

  const { performer } = order;
  const eta = order.eta ?? "";
  const displayName = (performer.name || "").trim() || "Исполнитель";
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarText = (performer.avatar || "").trim();
  const isPhotoUrl = avatarText.startsWith("http");
  const showImg = isPhotoUrl && !imgFailed;

  return (
    <div className="max-w-sm mx-auto px-4 pt-8 pb-10">
      {/* Success badge */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-6"
      >
        <CheckCircle size={16} className="text-green-600" />
        <span className="text-sm font-semibold text-green-700">Исполнитель назначен</span>
      </motion.div>

      {/* Performer card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border border-gray-100 rounded-3xl overflow-hidden"
      >
        {/* Avatar + info */}
        <div className="p-6 flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 shrink-0"
          >
            {showImg ? (
            <img
              src={avatarText}
              alt={displayName}
              className="w-full h-full object-cover rounded-full"
              onError={() => setImgFailed(true)}
            />
          ) : (
            avatarText && !isPhotoUrl ? avatarText : initials
          )}
          </motion.div>
          <div>
            <p className="text-lg font-bold text-gray-900">{displayName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-gray-800">{performer.rating}</span>
              {performer.jobsCompleted != null && (
                <span className="text-sm text-gray-400">· {performer.jobsCompleted} заказов</span>
              )}
            </div>
          </div>
        </div>

        {/* ETA */}
        {eta && (
          <div className="px-6 py-3 bg-gray-50 flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">{eta}</span>
          </div>
        )}

        {/* Order info */}
        <div className="px-6 py-4 border-t border-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Заказ
          </p>
          <p className="text-sm font-semibold text-gray-900">{order.serviceName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {order.scheduledDate
              ? new Date(order.scheduledDate).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                })
              : ""}
            {order.scheduledTime && ` · ${order.scheduledTime}`}
          </p>
        </div>

        {/* Contact buttons */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          {performer.phone && (
            <a
              href={`tel:${performer.phone}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-black text-white font-semibold text-sm hover:bg-gray-800 transition-all active:scale-95"
            >
              <Phone size={16} />
              Позвонить мастеру
            </a>
          )}
          {performer.telegram && (
            <a
              href={`https://t.me/${performer.telegram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gray-100 text-sm font-semibold text-gray-700 hover:border-gray-300 transition-all"
            >
              <MessageCircle size={16} />
              Написать в Telegram
            </a>
          )}
        </div>
      </motion.div>

      {/* Dismiss */}
      <button
        onClick={resetOrderFlow}
        className="w-full mt-4 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Перейти в личный кабинет
      </button>
    </div>
  );
}
