import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, RotateCcw, MessageCircle, CreditCard, XCircle, AlertTriangle } from "lucide-react";
import { LiveTrackingMap } from "../components/LiveTrackingMap";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "../store/dashboardStore";
import { trackEvent } from "../../hooks/useAnalytics";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { ChatDrawer } from "../../chat/components/ChatDrawer";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Timeline } from "../components/ui/Timeline";
import { PerformerCard } from "../components/ui/PerformerCard";
import { CompletionConfirmBlock } from "../components/CompletionConfirmBlock";
import { DisputeModal } from "../components/DisputeModal";
import { RatingModal } from "../components/RatingModal";
import { formatPrice } from "../../utils/priceCalculator";

const CHAT_VISIBLE_STATUSES = new Set([
  "assigned",
  "on_the_way",
  "in_progress",
  "waiting_client_confirmation",
  "dispute_opened",
]);

const CANCELLABLE_STATUSES = new Set([
  "pending_payment",
  "searching",
  "assigned",
  "on_the_way",
  "in_progress",
  "waiting_client_confirmation",
]);

export function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, confirmOrderCompletion, submitClientRating, openDispute, resumePayment, cancelOrder } = useDashboardStore();
  const { user } = useAuthStore();
  const { openChatForOrder } = useChatStore();
  const order = orders.find((o) => o.id === id);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [locationTimedOut, setLocationTimedOut] = useState(false);

  useEffect(() => {
    if (!order || order.status !== "on_the_way") return;
    if (order.performerLat != null && order.performerLng != null) return;
    const t = setTimeout(() => setLocationTimedOut(true), 10000);
    return () => clearTimeout(t);
  }, [order?.status, order?.performerLat, order?.performerLng]);

  const ratingSkipKey = order ? `rating_skipped_${order.id}` : null;
  const ratingWasSkipped = ratingSkipKey ? sessionStorage.getItem(ratingSkipKey) === "1" : false;

  const handleCancel = () => {
    trackEvent("order_cancelled", { service: order!.serviceName });
    cancelOrder(order!.id);
    navigate("/dashboard/orders");
  };

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <p className="text-gray-500">Заказ не найден</p>
      </div>
    );
  }

  const date = new Date(order.scheduledDate).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto px-4 pt-6 pb-10"
    >
      {/* Back */}
      <Link
        to="/dashboard/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Назад
      </Link>

      {/* Header */}
      <div className="mb-6">
        <StatusBadge status={order.status} />
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
          {order.serviceName}
        </h1>
        <p className="text-sm text-gray-400 mt-1">{order.categoryName}</p>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-5">
        {/* Details */}
        <Section title="Детали заказа">
          <Row label="Дата" value={date} />
          <Row label="Время" value={order.scheduledTime} />
          <Row label="Адрес" value={order.address} />
          <Row label="Длительность" value={order.duration} />
          {order.comment && <Row label="Комментарий" value={order.comment} />}
        </Section>

        {/* Price */}
        <Section title="Стоимость">
          {order.priceBreakdown.map((item, i) => (
            <Row key={i} label={item.label} value={formatPrice(item.amount)} />
          ))}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <span className="text-sm font-bold text-gray-900">Итого</span>
            <span className="text-base font-bold text-gray-900">{formatPrice(order.priceTotal)}</span>
          </div>
        </Section>

        {/* Performer */}
        {order.performer && (
          <Section title="Исполнитель">
            <PerformerCard
              performer={order.performer}
              showPhone={order.status !== "completed"}
              onChat={
                CHAT_VISIBLE_STATUSES.has(order.status)
                  ? () => openChatForOrder(order.id, "client_performer", user?.id ?? null, order.performer!.id)
                  : undefined
              }
            />
          </Section>
        )}

        {/* Live tracking map */}
        {order.status === "on_the_way" && (
          <Section title={`Исполнитель едет${order.performer?.name ? ` · ${order.performer.name}` : ""}`}>
            {order.performerLat != null && order.performerLng != null ? (
              <LiveTrackingMap
                performerLat={order.performerLat}
                performerLng={order.performerLng}
                performerName={order.performer?.name ?? "Исполнитель"}
                performerAvatar={order.performer?.avatar}
                destinationAddress={order.address}
                performerLastSeen={order.performerLastSeen}
              />
            ) : locationTimedOut ? (
              <p className="py-4 text-sm text-gray-400 text-center">
                Местоположение недоступно — исполнитель уже в пути
              </p>
            ) : (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
                <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-blue-400 animate-spin" />
                Определяем местоположение...
              </div>
            )}
          </Section>
        )}

        {/* Timeline */}
        <Section title="История заказа">
          <Timeline events={order.timeline} />
        </Section>

        {/* Dispute banner */}
        {order.status === "dispute_opened" && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500 shrink-0" />
              <span className="text-sm font-semibold text-orange-800">Спор рассматривается</span>
            </div>
            <p className="text-sm text-orange-700">
              Ваше обращение принято. Администратор изучит ситуацию и свяжется с вами в чате.
            </p>
            <button
              onClick={() => openChatForOrder(order.id, "client_admin", user?.id ?? null, null)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-200 bg-white text-sm font-semibold text-orange-700 hover:bg-orange-100 transition-colors"
            >
              <MessageCircle size={14} />
              Чат с поддержкой
            </button>
          </div>
        )}

        {/* Completion confirm block */}
        {order.status === "waiting_client_confirmation" && (
          <CompletionConfirmBlock
            comment={order.completionComment}
            completionTime={order.completionRequestedAt}
            onConfirm={async () => { await confirmOrderCompletion(order.id); setShowRatingModal(true); }}
            onDispute={() => setShowDisputeModal(true)}
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3">
        {order.status === "pending_payment" && (
          <button
            onClick={() => { resumePayment(order.id); navigate("/dashboard"); }}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-black text-white font-semibold hover:bg-gray-800 transition-all active:scale-95"
          >
            <CreditCard size={16} />
            Оплатить заказ
          </button>
        )}
        {order.status === "completed" && (
          <Link
            to="/calculator"
            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-black text-white font-semibold hover:bg-gray-800 transition-all"
          >
            <RotateCcw size={16} />
            Повторить заказ
          </Link>
        )}

        {/* Cancel order */}
        {CANCELLABLE_STATUSES.has(order.status) && (
          <AnimatePresence mode="wait">
            {showCancelConfirm ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="rounded-2xl border-2 border-red-100 bg-red-50 p-4 flex flex-col gap-3"
              >
                <p className="text-sm font-semibold text-red-800 text-center">Отменить заказ?</p>
                <p className="text-xs text-red-600 text-center">Это действие нельзя отменить</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-all"
                  >
                    Нет
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all active:scale-95"
                  >
                    Да, отменить
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="cancel-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowCancelConfirm(true)}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-100 text-sm font-semibold text-red-500 hover:border-red-300 hover:bg-red-50 transition-all"
              >
                <XCircle size={16} />
                Отменить заказ
              </motion.button>
            )}
          </AnimatePresence>
        )}

        {/* Chat with performer */}
        {CHAT_VISIBLE_STATUSES.has(order.status) && order.performer && (
          <button
            onClick={() =>
              openChatForOrder(
                order.id,
                "client_performer",
                user?.id ?? null,
                order.performer!.id
              )
            }
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-100 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all"
          >
            <MessageCircle size={16} />
            Чат с исполнителем
          </button>
        )}

        <button
          onClick={() => openChatForOrder(order.id, "client_admin", user?.id ?? null, null)}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-100 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all"
        >
          <MessageCircle size={16} />
          Чат с поддержкой
        </button>
      </div>

      <ChatDrawer
        clientName="Вы"
        performerName={order.performer?.name ?? "Исполнитель"}
        title="Чат с исполнителем"
      />

      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        onSubmit={async (comment) => { await openDispute(order.id, comment); }}
      />
      {showRatingModal && order.performer && !order.clientRating && !ratingWasSkipped && (
        <RatingModal
          performerName={order.performer.name}
          onSubmit={async (rating, comment) => {
            await submitClientRating(order.id, order.performer!.id, rating, comment);
            trackEvent("review_submitted", { rating });
            setShowRatingModal(false);
          }}
          onSkip={() => {
            if (ratingSkipKey) sessionStorage.setItem(ratingSkipKey, "1");
            setShowRatingModal(false);
          }}
        />
      )}
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</p>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}
