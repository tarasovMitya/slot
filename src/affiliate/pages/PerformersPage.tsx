import { useEffect, useState } from "react";
import { Star, Loader2, ShieldCheck, X, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useAffiliateStore } from "../store/affiliateStore";
import { useAuthStore } from "../../store/authStore";
import {
  affiliateLoadVerificationQueue,
  affiliateApprovePerformer,
  affiliateRejectPerformer,
  type AffiliateVerificationItem,
} from "../lib/affiliateDb";

const VERIFICATION_LABEL: Record<string, { label: string; className: string }> = {
  approved: { label: "Одобрен",     className: "bg-green-100 text-green-700" },
  pending:  { label: "На проверке", className: "bg-yellow-100 text-yellow-700" },
  rejected: { label: "Отклонён",    className: "bg-red-100 text-red-700" },
};

type Tab = "list" | "verification";

// ─── Verification card ───────────────────────────────────────────────────────

function VerificationCard({
  item,
  onApprove,
  onReject,
}: {
  item: AffiliateVerificationItem;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleApprove() {
    setBusy(true);
    await onApprove();
  }

  async function handleReject() {
    if (!reason.trim()) return;
    setBusy(true);
    await onReject(reason.trim());
  }

  const date = item.submittedAt
    ? new Date(item.submittedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#1e2238] flex items-center justify-center shrink-0">
            <ShieldCheck size={16} className="text-[#006AFF]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{item.name}</p>
            <p className="text-xs text-[#6b7194] mt-0.5">{item.phone} · {item.city} · {date}</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 text-[#6b7194] hover:text-white transition-colors shrink-0"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {item.specializations.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {item.specializations.map((s) => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1e2238] text-[#a0a5c0]">{s}</span>
          ))}
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.05] pt-3 space-y-3">
          {/* Documents */}
          {(item.passportUrl || item.selfieUrl) && (
            <div>
              <p className="text-xs font-semibold text-[#6b7194] uppercase tracking-wider mb-2">Документы</p>
              <div className="flex gap-2">
                {item.passportUrl && (
                  <a href={item.passportUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2238] text-xs text-[#a0a5c0] hover:text-white transition-colors">
                    <ExternalLink size={12} /> Паспорт
                  </a>
                )}
                {item.selfieUrl && (
                  <a href={item.selfieUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2238] text-xs text-[#a0a5c0] hover:text-white transition-colors">
                    <ExternalLink size={12} /> Селфи
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Experience */}
          {item.experienceDescription && (
            <div>
              <p className="text-xs font-semibold text-[#6b7194] uppercase tracking-wider mb-1">Опыт</p>
              <p className="text-sm text-[#a0a5c0] leading-relaxed">{item.experienceDescription}</p>
              {item.experienceYears != null && (
                <p className="text-xs text-[#6b7194] mt-1">{item.experienceYears} лет опыта</p>
              )}
            </div>
          )}

          {/* Actions */}
          {!rejecting ? (
            <div className="flex gap-2 pt-1">
              <button
                disabled={busy}
                onClick={handleApprove}
                className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition-colors disabled:opacity-50"
              >
                {busy ? "..." : "Одобрить"}
              </button>
              <button
                disabled={busy}
                onClick={() => setRejecting(true)}
                className="flex-1 py-2 rounded-xl bg-red-600/20 text-red-400 text-sm font-semibold hover:bg-red-600/30 transition-colors disabled:opacity-50"
              >
                Отклонить
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="relative">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Причина отклонения..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-[#1e2238] border border-white/[0.08] text-sm text-white placeholder-[#6b7194] resize-none focus:outline-none focus:border-white/20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busy || !reason.trim()}
                  onClick={handleReject}
                  className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {busy ? "..." : "Отправить"}
                </button>
                <button
                  onClick={() => setRejecting(false)}
                  className="px-4 py-2 rounded-xl bg-[#1e2238] text-[#6b7194] text-sm font-semibold hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AffiliatePerformersPage() {
  const { performers, isLoadingPerformers, loadPerformers } = useAffiliateStore();
  const { user } = useAuthStore();

  const [tab, setTab] = useState<Tab>("list");
  const [queue, setQueue] = useState<AffiliateVerificationItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  useEffect(() => { loadPerformers(); }, []);

  useEffect(() => {
    if (tab === "verification" && user?.id) {
      setLoadingQueue(true);
      affiliateLoadVerificationQueue(user.id).then((data) => {
        setQueue(data);
        setLoadingQueue(false);
      });
    }
  }, [tab, user?.id]);

  async function handleApprove(performerId: string) {
    await affiliateApprovePerformer(performerId);
    setQueue((q) => q.filter((i) => i.performerId !== performerId));
  }

  async function handleReject(performerId: string, reason: string) {
    await affiliateRejectPerformer(performerId, reason);
    setQueue((q) => q.filter((i) => i.performerId !== performerId));
  }

  const pendingCount = performers.filter((p) => p.verificationStatus === "pending").length;

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-white">Мои исполнители</h1>
        <p className="text-sm text-[#6b7194] mt-0.5">{performers.length} чел. привлечено по вашей ссылке</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => setTab("list")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === "list" ? "bg-[#006AFF] text-white" : "text-[#6b7194] hover:text-white"}`}
        >
          Все
        </button>
        <button
          onClick={() => setTab("verification")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === "verification" ? "bg-[#006AFF] text-white" : "text-[#6b7194] hover:text-white"}`}
        >
          Верификация
          {pendingCount > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === "verification" ? "bg-white/20 text-white" : "bg-[#006AFF]/30 text-[#006AFF]"}`}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* List tab */}
      {tab === "list" && (
        isLoadingPerformers ? (
          <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-[#006AFF]" /></div>
        ) : performers.length === 0 ? (
          <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] p-10 text-center">
            <p className="text-[#6b7194] text-sm">Ещё никто не зарегистрировался по вашей реферальной ссылке</p>
          </div>
        ) : (
          <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#0c0e1a] border-b border-white/[0.05]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Имя</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Телефон</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Рейтинг</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Заказов</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Статус</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Онлайн</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {performers.map((p) => {
                  const v = VERIFICATION_LABEL[p.verificationStatus] ?? VERIFICATION_LABEL.pending;
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                      <td className="px-4 py-3 text-[#6b7194]">{p.phone}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-[#a0a5c0]">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          {p.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#a0a5c0]">{p.completedOrders}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.className}`}>
                          {v.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block w-2 h-2 rounded-full ${p.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Verification tab */}
      {tab === "verification" && (
        loadingQueue ? (
          <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-[#006AFF]" /></div>
        ) : queue.length === 0 ? (
          <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] p-10 text-center">
            <ShieldCheck size={32} className="text-[#6b7194] mx-auto mb-3" />
            <p className="text-[#6b7194] text-sm">Нет анкет на проверке</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {queue.map((item) => (
              <VerificationCard
                key={item.performerId}
                item={item}
                onApprove={() => handleApprove(item.performerId)}
                onReject={(r) => handleReject(item.performerId, r)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
