import { useEffect } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { useAffiliateStore } from "../store/affiliateStore";
import { formatPrice } from "../../utils/priceCalculator";
import { useChatStore } from "../../store/chatStore";
import { useNavigate } from "react-router-dom";

export function AffiliateDisputesPage() {
  const { orders, isLoadingOrders, loadOrders } = useAffiliateStore();
  const { openChatById } = useChatStore();
  const navigate = useNavigate();

  useEffect(() => { loadOrders("dispute_opened"); }, []);

  const disputes = orders.filter((o) => o.status === "dispute_opened");

  async function handleOpenChat(orderId: string) {
    await openChatById(orderId, undefined as any);
    navigate("/affiliate/chats");
  }

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Споры</h1>
        <p className="text-sm text-[#6b7194] mt-0.5">{disputes.length} открытых споров</p>
      </div>

      {isLoadingOrders ? (
        <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-[#006AFF]" /></div>
      ) : disputes.length === 0 ? (
        <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] p-10 text-center">
          <p className="text-[#6b7194] text-sm">Открытых споров нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {disputes.map((o) => (
            <div key={o.id} className="bg-[#0f1120] rounded-xl border border-white/[0.06] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{o.serviceName ?? o.categoryName}</p>
                  <p className="text-sm text-[#6b7194] mt-0.5">Исполнитель: {o.performerName}</p>
                  <p className="text-sm text-[#6b7194]">Адрес: {o.address}</p>
                  <p className="text-sm text-[#a0a5c0] font-medium mt-1">{formatPrice(o.priceTotal)}</p>
                  {o.disputeComment && (
                    <div className="mt-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-sm text-orange-700">
                      <span className="font-medium">Причина спора:</span> {o.disputeComment}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleOpenChat(o.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#006AFF] hover:bg-[#004CB8] text-white text-sm font-medium rounded-xl transition-colors shrink-0"
                >
                  <MessageSquare size={15} />
                  Открыть чат
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
