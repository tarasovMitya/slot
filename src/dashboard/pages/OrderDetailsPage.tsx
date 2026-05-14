import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, RotateCcw, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useDashboardStore } from "../store/dashboardStore";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Timeline } from "../components/ui/Timeline";
import { PerformerCard } from "../components/ui/PerformerCard";
import { CompletionConfirmBlock } from "../components/CompletionConfirmBlock";
import { DisputeModal } from "../components/DisputeModal";
import { formatPrice } from "../../utils/priceCalculator";

export function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { orders, confirmOrderCompletion, openDispute } = useDashboardStore();
  const order = orders.find((o) => o.id === id);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

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
            <PerformerCard performer={order.performer} showPhone={order.status !== "completed"} />
          </Section>
        )}

        {/* Timeline */}
        <Section title="История заказа">
          <Timeline events={order.timeline} />
        </Section>

        {/* Completion confirm block */}
        {order.status === "waiting_client_confirmation" && (
          <CompletionConfirmBlock
            comment={order.completionComment}
            completionTime={order.completionRequestedAt}
            onConfirm={async () => { await confirmOrderCompletion(order.id); }}
            onDispute={() => setShowDisputeModal(true)}
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3">
        {order.status === "completed" && (
          <Link
            to="/calculator"
            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-black text-white font-semibold hover:bg-gray-800 transition-all"
          >
            <RotateCcw size={16} />
            Повторить заказ
          </Link>
        )}
        <Link
          to="/dashboard/support"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-100 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all"
        >
          <MessageCircle size={16} />
          Связаться с поддержкой
        </Link>
      </div>
      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        onSubmit={async (comment) => { await openDispute(order.id, comment); }}
      />
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
