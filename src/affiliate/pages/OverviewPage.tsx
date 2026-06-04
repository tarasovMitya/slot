import { useEffect } from "react";
import { Users, CheckCircle, DollarSign, AlertTriangle } from "lucide-react";
import { useAffiliateStore } from "../store/affiliateStore";
import { formatPrice } from "../../utils/priceCalculator";

function KpiCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: string; accent: string;
}) {
  return (
    <div className="rounded-xl p-5 border border-white/[0.06] flex items-center gap-4" style={{ background: "#0f1120" }}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-[#6b7194] font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function AffiliateOverviewPage() {
  const { stats, isLoadingStats, loadStats } = useAffiliateStore();

  useEffect(() => { loadStats(); }, []);

  if (isLoadingStats) {
    return (
      <div className="p-4 md:p-6 flex justify-center pt-20">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#006AFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Обзор</h1>
        <p className="text-sm text-[#6b7194] mt-0.5">Статистика по вашим исполнителям</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KpiCard
          icon={Users}
          label="Привлечено исполнителей"
          value={String(stats?.performersCount ?? 0)}
          accent="bg-[#006AFF]/10 text-[#006AFF]"
        />
        <KpiCard
          icon={CheckCircle}
          label="Выполнено заказов"
          value={String(stats?.completedOrders ?? 0)}
          accent="bg-emerald-500/10 text-emerald-400"
        />
        <KpiCard
          icon={DollarSign}
          label="Мой заработок"
          value={formatPrice(stats?.totalEarned ?? 0)}
          accent="bg-emerald-500/10 text-emerald-400"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Открытых споров"
          value={String(stats?.openDisputes ?? 0)}
          accent="bg-orange-500/10 text-orange-400"
        />
      </div>

      <div className="mt-6 rounded-xl p-4 text-sm border" style={{ background: "rgba(0,106,255,0.07)", borderColor: "rgba(0,106,255,0.15)" }}>
        <span className="font-semibold text-[#6ba3ff]">Как считается заработок:</span>
        <span className="text-[#5a7aaa] ml-1">10% от комиссии платформы (20% от суммы заказа) за каждый выполненный заказ ваших исполнителей. Пример: заказ 10 000 ₽ → комиссия платформы 2 000 ₽ → ваш заработок 200 ₽.</span>
      </div>
    </div>
  );
}
