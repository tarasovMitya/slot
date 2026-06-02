import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Clock, CheckCircle2, AlertCircle, ChevronRight, X, MessageSquare, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { DropZone } from "../../components/ui/DropZone";
import { WarningCard } from "../../components/ui/WarningCard";
import type { PhotoFile } from "../../components/ui/DropZone";

type DisputeStatus = "open" | "reviewing" | "resolved_client" | "resolved_performer" | "closed";

interface Dispute {
  id: string;
  orderId: string;
  orderName: string;
  reason: string;
  status: DisputeStatus;
  createdAt: string;
  compensation?: number;
}

const STATUS_CONFIG: Record<DisputeStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  open:                { label: "Открыт",               color: "text-orange-600", bg: "bg-orange-50 border-orange-100",   icon: AlertCircle   },
  reviewing:           { label: "Рассматривается",      color: "text-blue-600",   bg: "bg-blue-50 border-blue-100",       icon: Clock         },
  resolved_client:     { label: "Решён в вашу пользу", color: "text-emerald-600",bg: "bg-emerald-50 border-emerald-100", icon: CheckCircle2  },
  resolved_performer:  { label: "Решён не в вашу пользу", color: "text-red-600", bg: "bg-red-50 border-red-100",         icon: X             },
  closed:              { label: "Закрыт",               color: "text-gray-500",   bg: "bg-gray-50 border-gray-100",       icon: CheckCircle2  },
};

const TIMELINE_STEPS = [
  { id: "opened",    label: "Спор открыт" },
  { id: "notified",  label: "Уведомлён исполнитель" },
  { id: "reviewing", label: "Рассмотрение модератором" },
  { id: "resolved",  label: "Решение вынесено" },
];

const REASONS = [
  "Работа выполнена некачественно",
  "Исполнитель не явился",
  "Повреждено имущество",
  "Оплата вне платформы",
  "Другое",
];

function DisputeTimeline({ status }: { status: DisputeStatus }) {
  const activeStep = status === "open" ? 1 : status === "reviewing" ? 2 : 3;
  return (
    <div className="flex flex-col gap-2 py-1">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i < activeStep;
        const current = i === activeStep;
        return (
          <div key={step.id} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${done ? "bg-black" : current ? "border-2 border-[#006AFF] bg-white" : "border-2 border-gray-200"}`}>
              {done && <Check size={10} className="text-white" strokeWidth={3} />}
              {current && <div className="w-2 h-2 rounded-full bg-black animate-pulse" />}
            </div>
            <span className={`text-sm ${done || current ? "text-gray-900 font-medium" : "text-gray-400"}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DisputeCard({ dispute, onClick }: { dispute: Dispute; onClick: () => void }) {
  const cfg = STATUS_CONFIG[dispute.status];
  const Icon = cfg.icon;
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full text-left border border-gray-100 rounded-2xl p-4 hover:border-gray-300 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
          <Icon size={11} />
          {cfg.label}
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5" />
      </div>
      <p className="text-sm font-semibold text-gray-900 mb-0.5">{dispute.orderName}</p>
      <p className="text-xs text-gray-400 mb-1">{dispute.reason}</p>
      <p className="text-xs text-gray-300">
        {new Date(dispute.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
      </p>
      {dispute.status === "resolved_client" && dispute.compensation != null && (
        <div className="mt-2 text-xs font-semibold text-emerald-600">
          Компенсация: {dispute.compensation.toLocaleString("ru-RU")} ₽
        </div>
      )}
    </motion.button>
  );
}

function NewDisputeSheet({ onClose, onSubmit }: { onClose: () => void; onSubmit: (d: Dispute) => void }) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = reason && comment.trim().length > 10 && agreed && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    onSubmit({
      id: `dsp-${Date.now()}`,
      orderId: "",
      orderName: "Заказ",
      reason,
      status: "open",
      createdAt: new Date().toISOString(),
    });
    setSubmitting(false);
    setDone(true);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl p-6 pb-10 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-base font-bold text-gray-900">Новый спор</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {done ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <CheckCircle2 size={22} className="text-orange-500" />
            </div>
            <p className="font-bold text-gray-900">Спор открыт</p>
            <p className="text-sm text-gray-500">Рассматриваем 1–3 рабочих дня. Средства заморожены до решения.</p>
            <button onClick={onClose} className="mt-2 w-full py-3.5 rounded-2xl bg-[#003B8F] text-white text-sm font-semibold">Закрыть</button>
          </motion.div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Причина <span className="text-red-400">*</span></p>
              <div className="flex flex-col gap-1.5">
                {REASONS.map((r) => (
                  <label key={r} className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-gray-100 cursor-pointer hover:border-gray-300 transition-colors">
                    <div onClick={() => setReason(r)} className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${reason === r ? "border-[#006AFF]" : "border-gray-300"}`}>
                      {reason === r && <div className="w-2 h-2 rounded-full bg-black" />}
                    </div>
                    <span className="text-sm text-gray-700">{r}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Описание <span className="text-red-400">*</span></label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Опишите ситуацию подробно..." rows={3}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100" />
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Доказательства</label>
              <DropZone label="Добавить фото" hint="До 5 файлов" maxFiles={5} files={photos} onChange={setPhotos} />
            </div>
            <WarningCard variant="info" className="mb-4">
              Спор рассматривается 1–3 рабочих дня. Средства заморожены до решения.
            </WarningCard>
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <button onClick={() => setAgreed(!agreed)}
                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${agreed ? "bg-[#006AFF] border-[#006AFF]" : "border-gray-300"}`}>
                {agreed && <Check size={11} className="text-white" strokeWidth={3} />}
              </button>
              <span className="text-sm text-gray-700 leading-snug">Подтверждаю, что приведённые сведения достоверны</span>
            </label>
            <button onClick={handleSubmit} disabled={!canSubmit}
              className="w-full py-4 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all active:scale-95 disabled:opacity-40">
              {submitting ? "Отправка..." : "Открыть спор"}
            </button>
          </>
        )}
      </motion.div>
    </>
  );
}

function DisputeDetailSheet({ dispute, onClose }: { dispute: Dispute; onClose: () => void }) {
  const cfg = STATUS_CONFIG[dispute.status];
  const Icon = cfg.icon;
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl p-6 pb-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-base font-bold text-gray-900">{dispute.orderName}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border mb-5 ${cfg.bg} ${cfg.color}`}>
          <Icon size={14} /> {cfg.label}
        </div>

        <div className="border border-gray-100 rounded-2xl p-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Статус рассмотрения</p>
          <DisputeTimeline status={dispute.status} />
        </div>

        <div className="border border-gray-100 rounded-2xl p-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Причина</p>
          <p className="text-sm text-gray-700">{dispute.reason}</p>
        </div>

        {dispute.status === "resolved_client" && dispute.compensation != null && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4">
            <p className="text-sm font-semibold text-emerald-700 mb-1">Решение в вашу пользу</p>
            <p className="text-sm text-emerald-600">Компенсация: <span className="font-bold">{dispute.compensation.toLocaleString("ru-RU")} ₽</span></p>
            <p className="text-xs text-emerald-500 mt-1">Вернётся на карту в течение 2–5 рабочих дней</p>
          </div>
        )}

        <Link
          to="/dashboard/support"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-all"
          onClick={onClose}
        >
          <MessageSquare size={15} />
          Чат с поддержкой
        </Link>
      </motion.div>
    </>
  );
}

export function ClientDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<Dispute | null>(null);

  const addDispute = (d: Dispute) => {
    setDisputes((prev) => [d, ...prev]);
    setShowNew(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto px-4 pt-6 pb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <ShieldAlert size={20} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Споры и компенсации</h1>
            <p className="text-xs text-gray-400 mt-0.5">Защита ваших прав в платформе</p>
          </div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#006AFF] text-white text-xs font-semibold hover:bg-[#004CB8] transition-all active:scale-95"
        >
          + Новый спор
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold text-blue-700 mb-2">Как работают споры?</p>
        <div className="flex flex-col gap-1.5">
          {[
            "Спор можно открыть в течение 24 часов после закрытия заказа",
            "Средства замораживаются до вынесения решения",
            "Рассмотрение занимает 1–3 рабочих дня",
          ].map((t) => (
            <div key={t} className="flex items-start gap-2 text-xs text-blue-700">
              <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              {t}
            </div>
          ))}
        </div>
      </div>

      {disputes.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <ShieldAlert size={28} className="text-gray-300" />
          </div>
          <p className="text-base font-semibold text-gray-400">Споров нет</p>
          <p className="text-sm text-gray-300 max-w-xs">Здесь появятся ваши обращения, если возникнут проблемы с заказом</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {disputes.map((d) => (
            <DisputeCard key={d.id} dispute={d} onClick={() => setSelected(d)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showNew && <NewDisputeSheet onClose={() => setShowNew(false)} onSubmit={addDispute} />}
        {selected && <DisputeDetailSheet dispute={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
