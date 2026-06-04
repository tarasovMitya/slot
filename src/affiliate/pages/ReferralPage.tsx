import { useEffect, useState } from "react";
import { Copy, Check, Loader2, Users, UserCheck } from "lucide-react";
import { useAffiliateStore } from "../store/affiliateStore";
import { affiliateGetOrCreateCode, affiliateGetReferralStats } from "../lib/affiliateDb";

const BASE_URL = "https://slot-home.ru/performer/auth";

export function AffiliateReferralPage() {
  const { userId } = useAffiliateStore();
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; thisMonth: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      affiliateGetOrCreateCode(userId),
      affiliateGetReferralStats(userId),
    ]).then(([c, s]) => {
      setCode(c);
      setStats(s);
      setLoading(false);
    });
  }, [userId]);

  const link = code ? `${BASE_URL}?ref=${code}` : null;

  function handleCopy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Реферальная ссылка</h1>
        <p className="text-sm text-[#6b7194] mt-0.5">Привлекайте исполнителей и зарабатывайте</p>
      </div>

      {loading ? (
        <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-[#006AFF]" /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0f1120] rounded-xl p-5 border border-white/[0.06] flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#006AFF]">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-[#6b7194] font-medium">Всего привлечено</p>
                <p className="text-xl font-bold text-white">{stats?.total ?? 0}</p>
              </div>
            </div>
            <div className="bg-[#0f1120] rounded-xl p-5 border border-white/[0.06] flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                <UserCheck size={20} />
              </div>
              <div>
                <p className="text-xs text-[#6b7194] font-medium">За этот месяц</p>
                <p className="text-xl font-bold text-white">{stats?.thisMonth ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Link block */}
          <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] p-5 mb-4">
            <p className="text-sm font-semibold text-[#a0a5c0] mb-3">Ваша реферальная ссылка</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#a0a5c0] font-mono truncate">
                {link ?? "—"}
              </div>
              <button
                onClick={handleCopy}
                disabled={!link}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#006AFF] hover:bg-[#004CB8] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Скопировано" : "Копировать"}
              </button>
            </div>
            {code && (
              <p className="text-xs text-[#6b7194] mt-2">Код: <span className="font-mono font-semibold text-[#8b90a8]">{code}</span></p>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">Как это работает</p>
            <ul className="list-disc list-inside space-y-1 text-blue-600">
              <li>Поделитесь ссылкой с потенциальным исполнителем</li>
              <li>Он регистрируется на платформе по вашей ссылке</li>
              <li>Исполнитель прикрепляется к вашему кабинету</li>
              <li>Вы получаете 10% от комиссии платформы (20% от суммы заказа) с каждого его заказа</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
