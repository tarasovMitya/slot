import { useEffect, useState } from "react";
import { ShieldCheck, Star, MapPin, Phone, MessageCircle } from "lucide-react";
import { useAdminStore } from "../store/adminStore";
import type { AdminPerformer } from "../types";
import { supabase } from "../../lib/supabase";

export function AdminVerificationPage() {
  const { performers, isLoadingPerformers, loadPerformers } = useAdminStore();
  const [selected, setSelected] = useState<AdminPerformer | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { loadPerformers(); }, []);

  const queue = performers.filter((p) => p.verificationStatus === "pending");
  const approved = performers.filter((p) => p.verificationStatus === "approved");
  const rejected = performers.filter((p) => p.verificationStatus === "rejected");

  async function setVerification(performerId: string, status: "approved" | "rejected") {
    setActionLoading(performerId + status);
    await supabase
      .from("performer_profiles")
      .update({ verification_status: status })
      .eq("user_id", performerId);
    await loadPerformers();
    setActionLoading(null);
    setSelected(null);
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Верификация</h1>
        <p className="text-sm text-gray-500 mt-0.5">Проверка и одобрение исполнителей</p>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{queue.length}</p>
          <p className="text-xs font-semibold text-yellow-600 mt-0.5">Ожидают проверки</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{approved.length}</p>
          <p className="text-xs font-semibold text-green-600 mt-0.5">Одобрено</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{rejected.length}</p>
          <p className="text-xs font-semibold text-red-600 mt-0.5">Отклонено</p>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Queue */}
        <div className="flex-1">
          {isLoadingPerformers ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">Загрузка...</div>
          ) : (
            <>
              {/* Pending */}
              {queue.length > 0 && (
                <div className="bg-white rounded-xl border border-yellow-200 mb-4 overflow-hidden">
                  <div className="px-5 py-4 border-b border-yellow-100 flex items-center gap-2">
                    <ShieldCheck size={15} className="text-yellow-600" />
                    <p className="text-sm font-semibold text-gray-900">На проверке</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {queue.map((p) => (
                      <PerformerRow
                        key={p.id}
                        performer={p}
                        selected={selected?.id === p.id}
                        onClick={() => setSelected(p.id === selected?.id ? null : p)}
                        actions={
                          <div className="flex gap-1.5">
                            <button
                              disabled={actionLoading === p.id + "approved"}
                              onClick={(e) => { e.stopPropagation(); setVerification(p.id, "approved"); }}
                              className="px-2.5 py-1 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === p.id + "approved" ? "..." : "Одобрить"}
                            </button>
                            <button
                              disabled={actionLoading === p.id + "rejected"}
                              onClick={(e) => { e.stopPropagation(); setVerification(p.id, "rejected"); }}
                              className="px-2.5 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === p.id + "rejected" ? "..." : "Отклонить"}
                            </button>
                          </div>
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Approved */}
              {approved.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <ShieldCheck size={15} className="text-green-600" />
                    <p className="text-sm font-semibold text-gray-900">Одобренные</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {approved.map((p) => (
                      <PerformerRow
                        key={p.id}
                        performer={p}
                        selected={selected?.id === p.id}
                        onClick={() => setSelected(p.id === selected?.id ? null : p)}
                        actions={
                          <button
                            disabled={actionLoading === p.id + "rejected"}
                            onClick={(e) => { e.stopPropagation(); setVerification(p.id, "rejected"); }}
                            className="px-2.5 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            Отклонить
                          </button>
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Rejected */}
              {rejected.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <ShieldCheck size={15} className="text-red-500" />
                    <p className="text-sm font-semibold text-gray-900">Отклонённые</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {rejected.map((p) => (
                      <PerformerRow
                        key={p.id}
                        performer={p}
                        selected={selected?.id === p.id}
                        onClick={() => setSelected(p.id === selected?.id ? null : p)}
                        actions={
                          <button
                            disabled={actionLoading === p.id + "approved"}
                            onClick={(e) => { e.stopPropagation(); setVerification(p.id, "approved"); }}
                            className="px-2.5 py-1 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            Одобрить
                          </button>
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {performers.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                  Нет исполнителей
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0 bg-white rounded-xl border border-gray-200 p-4 self-start space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Профиль</p>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-base font-bold text-gray-900">{selected.name}</p>
              <div className="flex items-center gap-1.5 text-amber-500">
                <Star size={13} fill="currentColor" />
                <span className="font-semibold">{selected.rating.toFixed(1)}</span>
                <span className="text-gray-400 text-xs">· {selected.completedOrders} заказов</span>
              </div>

              {selected.phone && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Phone size={13} />
                  <span>{selected.phone}</span>
                </div>
              )}
              {selected.telegram && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <MessageCircle size={13} />
                  <span>{selected.telegram}</span>
                </div>
              )}
              {selected.city && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <MapPin size={13} />
                  <span>{selected.city} · {selected.workRadius} км</span>
                </div>
              )}
              {selected.address && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Адрес</p>
                  <p className="text-gray-700">{selected.address}</p>
                </div>
              )}
              {selected.specializations.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Специализации</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.specializations.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {selected.createdAt && (
                <div>
                  <p className="text-xs text-gray-400">Дата регистрации</p>
                  <p className="text-gray-700">{new Date(selected.createdAt).toLocaleDateString("ru-RU")}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {selected.verificationStatus !== "approved" && (
                <button
                  disabled={!!actionLoading}
                  onClick={() => setVerification(selected.id, "approved")}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Одобрить
                </button>
              )}
              {selected.verificationStatus !== "rejected" && (
                <button
                  disabled={!!actionLoading}
                  onClick={() => setVerification(selected.id, "rejected")}
                  className="w-full px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  Отклонить
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PerformerRow({
  performer, selected, onClick, actions,
}: {
  performer: AdminPerformer;
  selected: boolean;
  onClick: () => void;
  actions: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${selected ? "bg-blue-50" : ""}`}
    >
      <div>
        <p className="text-sm font-medium text-gray-900">{performer.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{performer.city || "—"} · {performer.completedOrders} заказов</p>
      </div>
      {actions}
    </div>
  );
}
