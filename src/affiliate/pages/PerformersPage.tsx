import { useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import { useAffiliateStore } from "../store/affiliateStore";

const VERIFICATION_LABEL: Record<string, { label: string; className: string }> = {
  approved: { label: "Одобрен",  className: "bg-green-100 text-green-700" },
  pending:  { label: "На проверке", className: "bg-yellow-100 text-yellow-700" },
  rejected: { label: "Отклонён", className: "bg-red-100 text-red-700" },
};

export function AffiliatePerformersPage() {
  const { performers, isLoadingPerformers, loadPerformers } = useAffiliateStore();

  useEffect(() => { loadPerformers(); }, []);

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Мои исполнители</h1>
        <p className="text-sm text-[#6b7194] mt-0.5">{performers.length} чел. привлечено по вашей ссылке</p>
      </div>

      {isLoadingPerformers ? (
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
      )}
    </div>
  );
}
