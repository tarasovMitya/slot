import { useEffect, useState } from "react";
import { ShieldCheck, Star, MapPin, Phone, MessageCircle, X, Image } from "lucide-react";
import { useAdminStore } from "../store/adminStore";
import type { AdminPerformer } from "../types";
import { supabase } from "../../lib/supabase";
import { trackEvent } from "../../lib/analytics";

interface VerificationRequest {
  first_name: string | null; last_name: string | null; birth_date: string | null;
  phone: string | null; telegram: string | null; city: string | null;
  passport_url: string | null; selfie_url: string | null;
  specializations: string[] | null; experience_years: number | null;
  experience_description: string | null; has_tools: boolean | null;
  works_with_team: boolean | null; work_photo_urls: string[] | null;
  payment_name: string | null; payment_card: string | null;
  payment_bank: string | null; submitted_at: string | null;
}

export function AdminVerificationPage() {
  const { performers, isLoadingPerformers, loadPerformers } = useAdminStore();
  const [selected, setSelected] = useState<AdminPerformer | null>(null);
  const [verRequest, setVerRequest] = useState<VerificationRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => { loadPerformers(); }, []);

  const queue    = performers.filter((p) => p.verificationStatus === "pending");
  const approved = performers.filter((p) => p.verificationStatus === "approved");
  const rejected = performers.filter((p) => p.verificationStatus === "rejected");
  const notStarted = performers.filter((p) => !["pending", "approved", "rejected"].includes(p.verificationStatus));

  async function signedUrl(storedUrl: string | null, bucket: string): Promise<string | null> {
    if (!storedUrl) return null;
    try {
      const marker = `/object/public/${bucket}/`;
      const idx = storedUrl.indexOf(marker);
      if (idx === -1) return storedUrl;
      const path = decodeURIComponent(storedUrl.slice(idx + marker.length));
      const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
      return data?.signedUrl ?? storedUrl;
    } catch { return storedUrl; }
  }

  async function loadRequest(performerId: string) {
    setLoadingRequest(true);
    setVerRequest(null);
    const { data } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("performer_id", performerId)
      .single();

    if (!data) { setLoadingRequest(false); return; }

    const row = data as VerificationRequest;

    const [passportSigned, selfieSigned] = await Promise.all([
      signedUrl(row.passport_url, "verification-documents"),
      signedUrl(row.selfie_url, "verification-documents"),
    ]);

    const workPhotosSigned = await Promise.all(
      (row.work_photo_urls ?? []).map((u) => signedUrl(u, "work-photos"))
    );

    setVerRequest({
      ...row,
      passport_url: passportSigned,
      selfie_url: selfieSigned,
      work_photo_urls: workPhotosSigned.filter(Boolean) as string[],
    });
    setLoadingRequest(false);
  }

  function selectPerformer(p: AdminPerformer) {
    if (selected?.id === p.id) { setSelected(null); setVerRequest(null); return; }
    setSelected(p);
    loadRequest(p.id);
  }

  async function approve(performerId: string) {
    setActionLoading(performerId + "approved");
    const { error } = await supabase.from("performer_profiles")
      .update({ verification_status: "approved" })
      .eq("user_id", performerId);
    if (!error) {
      // Clear rejection reason separately — silent fail if column doesn't exist
      await supabase.from("performer_profiles")
        .update({ rejection_reason: null })
        .eq("user_id", performerId)
        .then(() => {}, () => {});
      trackEvent("verification_approved");
    }
    await loadPerformers();
    setActionLoading(null);
    setSelected(null);
    setVerRequest(null);
  }

  async function reject(performerId: string) {
    if (!rejectReason.trim()) return;
    setActionLoading(performerId + "rejected");
    const { error } = await supabase.from("performer_profiles")
      .update({ verification_status: "rejected" })
      .eq("user_id", performerId);
    if (!error) {
      await supabase.from("performer_profiles")
        .update({ rejection_reason: rejectReason.trim() })
        .eq("user_id", performerId)
        .then(() => {}, () => {});
      trackEvent("verification_rejected");
    }
    await loadPerformers();
    setActionLoading(null);
    setSelected(null);
    setVerRequest(null);
    setRejectModal(false);
    setRejectReason("");
  }

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Верификация</h1>
        <p className="text-sm text-[#6b7194] mt-0.5">Проверка и одобрение исполнителей</p>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{queue.length}</p>
          <p className="text-xs font-semibold text-yellow-600 mt-0.5">На проверке</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{approved.length}</p>
          <p className="text-xs font-semibold text-green-600 mt-0.5">Одобрено</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{rejected.length}</p>
          <p className="text-xs font-semibold text-red-600 mt-0.5">Отклонено</p>
        </div>
        <div className="bg-gray-50 border border-white/[0.08] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#8b90a8]">{notStarted.length}</p>
          <p className="text-xs font-semibold text-[#6b7194] mt-0.5">Не заполнено</p>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Queue */}
        <div className="flex-1 min-w-0">
          {isLoadingPerformers ? (
            <div className="bg-white rounded-xl border border-white/[0.08] p-8 text-center text-sm text-[#6b7194]">Загрузка...</div>
          ) : (
            <>
              {queue.length > 0 && (
                <Section title="На проверке" icon={<ShieldCheck size={14} className="text-yellow-600" />} border="border-yellow-200">
                  {queue.map((p) => (
                    <PerformerRow key={p.id} performer={p} selected={selected?.id === p.id} onClick={() => selectPerformer(p)}
                      actions={
                        <div className="flex gap-1.5">
                          <ActionBtn label="Одобрить" loading={actionLoading === p.id + "approved"} color="green"
                            onClick={(e) => { e.stopPropagation(); approve(p.id); }} />
                          <ActionBtn label="Отклонить" loading={actionLoading === p.id + "rejected"} color="red"
                            onClick={(e) => { e.stopPropagation(); setSelected(p); setRejectModal(true); }} />
                        </div>
                      }
                    />
                  ))}
                </Section>
              )}

              {approved.length > 0 && (
                <Section title="Одобренные" icon={<ShieldCheck size={14} className="text-green-600" />} border="border-white/[0.08]">
                  {approved.map((p) => (
                    <PerformerRow key={p.id} performer={p} selected={selected?.id === p.id} onClick={() => selectPerformer(p)}
                      actions={
                        <ActionBtn label="Отклонить" loading={actionLoading === p.id + "rejected"} color="red"
                          onClick={(e) => { e.stopPropagation(); setSelected(p); setRejectModal(true); }} />
                      }
                    />
                  ))}
                </Section>
              )}

              {rejected.length > 0 && (
                <Section title="Отклонённые" icon={<ShieldCheck size={14} className="text-red-500" />} border="border-white/[0.08]">
                  {rejected.map((p) => (
                    <PerformerRow key={p.id} performer={p} selected={selected?.id === p.id} onClick={() => selectPerformer(p)}
                      actions={
                        <ActionBtn label="Одобрить" loading={actionLoading === p.id + "approved"} color="green"
                          onClick={(e) => { e.stopPropagation(); approve(p.id); }} />
                      }
                    />
                  ))}
                </Section>
              )}

              {performers.length === 0 && (
                <div className="bg-white rounded-xl border border-white/[0.08] p-8 text-center text-sm text-[#6b7194]">Нет исполнителей</div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 shrink-0 bg-white rounded-xl border border-white/[0.08] self-start space-y-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <p className="text-sm font-semibold text-white">Анкета исполнителя</p>
              <button onClick={() => { setSelected(null); setVerRequest(null); }} className="text-[#6b7194] hover:text-[#8b90a8]">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Profile header */}
              <div>
                <p className="text-base font-bold text-white">{selected.name}</p>
                <div className="flex items-center gap-1.5 mt-1 text-amber-500">
                  <Star size={12} fill="currentColor" />
                  <span className="text-xs font-semibold">{selected.rating.toFixed(1)}</span>
                  <span className="text-xs text-[#6b7194]">· {selected.completedOrders} заказов</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#6b7194]">
                  {selected.phone && <span className="flex items-center gap-1"><Phone size={11} />{selected.phone}</span>}
                  {selected.telegram && <span className="flex items-center gap-1"><MessageCircle size={11} />{selected.telegram}</span>}
                  {selected.city && <span className="flex items-center gap-1"><MapPin size={11} />{selected.city}</span>}
                </div>
              </div>

              {loadingRequest ? (
                <div className="py-6 text-center text-sm text-[#6b7194]">Загрузка анкеты...</div>
              ) : verRequest ? (
                <>
                  {/* Personal */}
                  <DetailSection title="Личные данные">
                    <Row label="Имя" value={[verRequest.first_name, verRequest.last_name].filter(Boolean).join(" ")} />
                    <Row label="Дата рождения" value={verRequest.birth_date} />
                    <Row label="Телефон" value={verRequest.phone} />
                    <Row label="Telegram" value={verRequest.telegram} />
                    <Row label="Город" value={verRequest.city} />
                  </DetailSection>

                  {/* Documents */}
                  {(verRequest.passport_url || verRequest.selfie_url) && (
                    <DetailSection title="Документы">
                      <div className="grid grid-cols-2 gap-2">
                        {verRequest.passport_url && (
                          <a href={verRequest.passport_url} target="_blank" rel="noopener noreferrer">
                            <img src={verRequest.passport_url} alt="Паспорт" className="w-full aspect-video object-cover rounded-lg border border-white/[0.08] hover:opacity-90" />
                            <p className="text-xs text-[#6b7194] mt-1 text-center">Паспорт</p>
                          </a>
                        )}
                        {verRequest.selfie_url && (
                          <a href={verRequest.selfie_url} target="_blank" rel="noopener noreferrer">
                            <img src={verRequest.selfie_url} alt="Селфи" className="w-full aspect-video object-cover rounded-lg border border-white/[0.08] hover:opacity-90" />
                            <p className="text-xs text-[#6b7194] mt-1 text-center">Селфи</p>
                          </a>
                        )}
                      </div>
                      {!verRequest.passport_url && !verRequest.selfie_url && (
                        <p className="text-xs text-[#6b7194]">Документы не загружены</p>
                      )}
                    </DetailSection>
                  )}

                  {/* Professional */}
                  <DetailSection title="Опыт">
                    {verRequest.specializations && verRequest.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {verRequest.specializations.map(s => (
                          <span key={s} className="px-2 py-0.5 bg-gray-100 text-[#a0a5c0] rounded-full text-xs">{s}</span>
                        ))}
                      </div>
                    )}
                    <Row label="Опыт" value={verRequest.experience_years ? `${verRequest.experience_years} лет` : null} />
                    {verRequest.experience_description && (
                      <p className="text-xs text-[#8b90a8] bg-gray-50 rounded p-2">{verRequest.experience_description}</p>
                    )}
                    <Row label="Инструменты" value={verRequest.has_tools ? "Есть" : "Нет"} />
                    <Row label="Команда" value={verRequest.works_with_team ? "Работает с командой" : "Работает один"} />
                  </DetailSection>

                  {/* Work photos */}
                  {(verRequest.work_photo_urls?.length ?? 0) > 0 && (
                    <DetailSection title={`Фото работ (${verRequest.work_photo_urls!.length})`}>
                      <div className="grid grid-cols-3 gap-1.5">
                        {verRequest.work_photo_urls!.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt="" className="w-full aspect-square object-cover rounded-lg border border-white/[0.06] hover:opacity-90" />
                          </a>
                        ))}
                      </div>
                    </DetailSection>
                  )}

                  {/* Payment */}
                  <DetailSection title="Платёжные данные">
                    <Row label="ФИО" value={verRequest.payment_name} />
                    <Row label="Карта" value={verRequest.payment_card} />
                    <Row label="Банк" value={verRequest.payment_bank} />
                  </DetailSection>

                  {verRequest.submitted_at && (
                    <p className="text-xs text-[#6b7194] text-center">
                      Подано {new Date(verRequest.submitted_at).toLocaleString("ru-RU")}
                    </p>
                  )}
                </>
              ) : (
                <div className="py-4 flex flex-col items-center gap-2 text-center">
                  <Image size={24} className="text-gray-200" />
                  <p className="text-xs text-[#6b7194]">Исполнитель не заполнил анкету верификации</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                {selected.verificationStatus !== "approved" && (
                  <button disabled={!!actionLoading} onClick={() => approve(selected.id)}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
                    Одобрить
                  </button>
                )}
                {selected.verificationStatus !== "rejected" && (
                  <button disabled={!!actionLoading} onClick={() => setRejectModal(true)}
                    className="w-full px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50">
                    Отклонить
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject reason modal */}
      {rejectModal && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold text-white">Причина отклонения</p>
              <button onClick={() => { setRejectModal(false); setRejectReason(""); }} className="text-[#6b7194] hover:text-[#8b90a8]">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-[#6b7194] mb-3">Укажите причину — исполнитель её увидит и сможет исправить</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {["Нечитаемый документ", "Плохое качество фото", "Данные не совпадают", "Неполная анкета", "Недостаточно фото работ"].map(r => (
                <button key={r} onClick={() => setRejectReason(r)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${rejectReason === r ? "bg-red-600 text-white border-red-600" : "border-white/[0.08] text-[#8b90a8] hover:border-red-300"}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Или введите произвольную причину..."
              className="w-full border border-white/[0.08] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => { setRejectModal(false); setRejectReason(""); }}
                className="flex-1 py-2 border border-white/[0.08] rounded-lg text-sm font-medium text-[#8b90a8] hover:bg-gray-50">
                Отмена
              </button>
              <button onClick={() => reject(selected.id)} disabled={!rejectReason.trim() || !!actionLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {actionLoading ? "..." : "Отклонить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, border, children }: { title: string; icon: React.ReactNode; border: string; children: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-xl border ${border} mb-4 overflow-hidden`}>
      <div className={`px-5 py-3 border-b border-white/[0.06] flex items-center gap-2`}>
        {icon}
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <div className="divide-y divide-white/[0.04]">{children}</div>
    </div>
  );
}

function PerformerRow({ performer, selected, onClick, actions }: {
  performer: AdminPerformer; selected: boolean; onClick: () => void; actions: React.ReactNode;
}) {
  return (
    <div onClick={onClick} className={`flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer ${selected ? "bg-blue-50" : ""}`}>
      <div>
        <p className="text-sm font-medium text-white">{performer.name}</p>
        <p className="text-xs text-[#6b7194] mt-0.5">{performer.city || "—"} · {performer.completedOrders} заказов</p>
      </div>
      {actions}
    </div>
  );
}

function ActionBtn({ label, loading, color, onClick }: { label: string; loading: boolean; color: "green" | "red"; onClick: (e: React.MouseEvent) => void }) {
  const cls = color === "green"
    ? "bg-green-50 text-green-700 hover:bg-green-100"
    : "bg-red-50 text-red-600 hover:bg-red-100";
  return (
    <button disabled={loading} onClick={onClick} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${cls}`}>
      {loading ? "..." : label}
    </button>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#6b7194] uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-[#6b7194] shrink-0">{label}</span>
      <span className="text-xs text-[#a0a5c0] text-right">{value}</span>
    </div>
  );
}
