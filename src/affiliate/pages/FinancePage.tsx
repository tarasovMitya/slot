import { useEffect, useState } from "react";
import { Loader2, DollarSign, TrendingUp, Clock } from "lucide-react";
import { useAffiliateStore } from "../store/affiliateStore";
import { formatPrice } from "../../utils/priceCalculator";

type Period = "all" | "month" | "week";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "all",   label: "Всё время" },
  { value: "month", label: "Месяц" },
  { value: "week",  label: "Неделя" },
];

function periodStart(period: Period): Date | null {
  const now = new Date();
  if (period === "week") return new Date(now.getTime() - 7 * 86400000);
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

export function AffiliateFinancePage() {
  const { earnings, isLoadingEarnings, loadEarnings } = useAffiliateStore();
  const [period, setPeriod] = useState<Period>("all");

  useEffect(() => { loadEarnings(); }, []);

  const cutoff = periodStart(period);
  const filtered = earnings.filter((e) =>
    cutoff ? new Date(e.createdAt) >= cutoff : true
  );

  const total = filtered.reduce((s, e) => s + e.affiliateFee, 0);
  const monthTotal = earnings
    .filter((e) => new Date(e.createdAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    .reduce((s, e) => s + e.affiliateFee, 0);

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Финансы</h1>
        <p className="text-sm text-[#6b7194] mt-0.5">Ваш заработок с исполнителей</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0f1120] rounded-xl p-5 border border-white/[0.06] flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-[#6b7194] font-medium">Итого заработано</p>
            <p className="text-xl font-bold text-white mt-0.5">{formatPrice(earnings.reduce((s, e) => s + e.affiliateFee, 0))}</p>
          </div>
        </div>
        <div className="bg-[#0f1120] rounded-xl p-5 border border-white/[0.06] flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50 text-[#006AFF]">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs text-[#6b7194] font-medium">За текущий месяц</p>
            <p className="text-xl font-bold text-white mt-0.5">{formatPrice(monthTotal)}</p>
          </div>
        </div>
        <div className="bg-[#0f1120] rounded-xl p-5 border border-white/[0.06] flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-orange-50 text-orange-500">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-[#6b7194] font-medium">Ожидает выплаты</p>
            <p className="text-xl font-bold text-white mt-0.5">—</p>
          </div>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex gap-2 mb-4">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              period === opt.value
                ? "bg-[#006AFF] text-white"
                : "border border-white/[0.08] text-[#6b7194] hover:text-white hover:border-white/20" 
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoadingEarnings ? (
        <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-[#006AFF]" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] p-10 text-center">
          <p className="text-[#6b7194] text-sm">Начислений за выбранный период нет</p>
        </div>
      ) : (
        <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#0c0e1a] border-b border-white/[0.05]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Дата</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Исполнитель</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Сумма заказа</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Комиссия платформы (20%)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7194]">Мой заработок (10% от комиссии)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 text-[#6b7194]">{new Date(e.createdAt).toLocaleDateString("ru-RU")}</td>
                  <td className="px-4 py-3 font-medium text-white">{e.performerName ?? "—"}</td>
                  <td className="px-4 py-3 text-[#a0a5c0]">{formatPrice(e.orderAmount)}</td>
                  <td className="px-4 py-3 text-[#a0a5c0]">{formatPrice(e.platformFee)}</td>
                  <td className="px-4 py-3 text-emerald-600 font-semibold">{formatPrice(e.affiliateFee)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#0c0e1a] border-t border-white/[0.05]">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-[#a0a5c0] text-right">Итого за период:</td>
                <td className="px-4 py-3 text-emerald-600 font-bold">{formatPrice(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
