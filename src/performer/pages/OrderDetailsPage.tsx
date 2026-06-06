import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MapPin, Clock, ArrowLeft, Navigation, Check, LocateFixed, AlertTriangle, MessageCircle, Loader2, Camera, Plus } from "lucide-react";
import { usePerformerStore } from "../store/performerStore";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { ChatDrawer } from "../../chat/components/ChatDrawer";
import { PerformerStatusBadge } from "../components/ui/StatusBadge";
import { CompletionModal } from "../components/CompletionModal";
import { AdditionalWorkModal } from "../components/AdditionalWorkModal";
import { OrderLocationMap } from "../components/OrderLocationMap";
import { DropZone } from "../../components/ui/DropZone";
import { WarningCard } from "../../components/ui/WarningCard";
import { formatPrice } from "../../utils/priceCalculator";
import type { PhotoFile } from "../../components/ui/DropZone";
import type { PerformerOrderStatus } from "../types";

const statusFlow: { from: PerformerOrderStatus; to: PerformerOrderStatus; label: string }[] = [
  { from: "accepted", to: "on_the_way", label: "Еду к клиенту" },
  { from: "on_the_way", to: "in_progress", label: "Начать работу" },
  { from: "in_progress", to: "waiting_client_confirmation", label: "Завершить заказ" },
];

export function PerformerOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeOrders, completedOrders, isHydrated, updateOrderStatus, submitCompletion, startLocationTracking, stopLocationTracking } = usePerformerStore();
  const { user } = useAuthStore();
  const { openChatForOrder } = useChatStore();
  const [showModal, setShowModal] = useState(false);
  const [showAdditionalWork, setShowAdditionalWork] = useState(false);
  const [showGeoSheet, setShowGeoSheet] = useState(false);
  const [geoBlocked, setGeoBlocked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [beforePhotos, setBeforePhotos] = useState<PhotoFile[]>([]);

  const order =
    activeOrders.find((o) => o.id === id) ??
    completedOrders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="flex items-center justify-center py-20">
        {!isHydrated
          ? <Loader2 size={24} className="text-gray-300 animate-spin" />
          : <p className="text-gray-400">Заказ не найден</p>
        }
      </div>
    );
  }

  const nextAction = statusFlow.find((s) => s.from === order.status);

  const handleStatusUpdate = () => {
    if (!nextAction || isUpdating) return;
    if (nextAction.to === "waiting_client_confirmation") {
      setShowModal(true);
      return;
    }
    if (nextAction.to === "on_the_way") {
      setShowGeoSheet(true);
      return;
    }
    updateOrderStatus(order.id, nextAction.to);
    if (nextAction.to === "in_progress") stopLocationTracking();
  };

  const handleConfirmGeo = async () => {
    setGeoBlocked(false);
    setIsUpdating(true);
    const granted = await startLocationTracking(order.id);
    if (!granted) {
      setGeoBlocked(true);
      setIsUpdating(false);
      return;
    }
    updateOrderStatus(order.id, "on_the_way");
    setShowGeoSheet(false);
    setIsUpdating(false);
  };

  const handleSkipGeo = () => {
    updateOrderStatus(order.id, "on_the_way");
    setShowGeoSheet(false);
  };

  const handleCompletionSubmit = async (comment: string, _photos: File[]) => {
    await submitCompletion(order.id, comment);
    setShowModal(false);
  };

  const date = new Date(order.scheduledDate).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Назад
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {/* Status + title */}
        <div className="mb-5">
          <PerformerStatusBadge status={order.status} />
          <h1 className="text-xl font-bold text-gray-900 mt-2">{order.serviceName}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{order.categoryName}</p>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3 mb-5">
          <div className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
            <Row icon={<Clock size={14} className="text-gray-400" />} label="Дата и время" value={`${date} · ${order.scheduledTime}`} />
            <Row icon={<MapPin size={14} className="text-gray-400" />} label="Адрес" value={order.address} />
          </div>

          <OrderLocationMap address={order.address} />

          <div className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
            {order.distance && (
              <Row icon={<Navigation size={14} className="text-gray-400" />} label="Расстояние" value={`${order.distance} от вас`} />
            )}
            <Row icon={<Clock size={14} className="text-gray-400" />} label="Длительность" value={order.duration} />
          </div>

          {/* Client */}
          <div className="border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Клиент</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                  {order.client.name[0]}
                </div>
                <p className="text-sm font-semibold text-gray-900">{order.client.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    openChatForOrder(order.id, "client_performer", null, user?.id ?? null)
                  }
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
                >
                  <MessageCircle size={14} />
                  Чат
                </button>
                <a
                  href={`tel:${order.client.phone}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#006AFF] text-white text-sm font-semibold hover:bg-[#004CB8] transition-all active:scale-95"
                >
                  <Phone size={14} />
                  Позвонить
                </a>
              </div>
            </div>
          </div>

          {/* Comment */}
          {order.comment && (
            <div className="border border-gray-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Комментарий клиента</p>
              <p className="text-sm text-gray-700">{order.comment}</p>
            </div>
          )}

          {/* Фото ДО — заблокировано до выезда */}
          {order.status === "accepted" && (
            <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-2">
                <Camera size={14} className="text-gray-300" />
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Фото ДО начала работ</p>
              </div>
              <p className="text-xs text-gray-400">Будет доступно после нажатия «Еду к клиенту» — сфотографируйте помещение по прибытии</p>
            </div>
          )}
          {(order.status === "on_the_way" || order.status === "in_progress") && (
            <div className="border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Camera size={14} className="text-gray-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Фото ДО начала работ
                  {beforePhotos.length === 0 && <span className="text-red-400 ml-1">*</span>}
                </p>
                {beforePhotos.length > 0 && (
                  <span className="ml-auto text-xs font-semibold text-emerald-600">{beforePhotos.length} фото</span>
                )}
              </div>
              <DropZone
                label="Сфотографируйте помещение до начала"
                hint="Минимум 1 фото — защищает вас от претензий"
                maxFiles={6}
                files={beforePhotos}
                onChange={setBeforePhotos}
                required
              />
              {beforePhotos.length === 0 && (
                <WarningCard variant="warning" className="mt-2.5">
                  Без фото ДО вы не защищены от необоснованных претензий клиента
                </WarningCard>
              )}
            </div>
          )}

          {/* Доп. работы кнопка — только в процессе */}
          {order.status === "in_progress" && (
            <button
              onClick={() => setShowAdditionalWork(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all"
            >
              <Plus size={16} />
              Запросить доп. работы
            </button>
          )}

          {/* Completion comment (waiting confirmation) */}
          {order.status === "waiting_client_confirmation" && order.completionComment && (
            <div className="border border-orange-100 bg-orange-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Ваш отчёт о работе</p>
              <p className="text-sm text-gray-700">{order.completionComment}</p>
            </div>
          )}

          {/* Price */}
          <div className="border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Состав заказа</p>
            <div className="flex flex-col gap-2">
              {order.priceBreakdown.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900">{formatPrice(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-100 mt-1">
                <span className="text-sm font-bold text-gray-900">Итого</span>
                <span className="text-base font-bold text-gray-900">{formatPrice(order.priceTotal)}</span>
              </div>
            </div>
          </div>

          {/* Timeline — только завершённые шаги, чтобы не дублировать кнопку следующего действия */}
          {order.timeline.filter((t) => t.completed).length > 0 && (
            <div className="border border-gray-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">История статусов</p>
              <div className="flex flex-col gap-2.5">
                {order.timeline.filter((t) => t.completed).map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-black">
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{t.label}</span>
                    {t.time && (
                      <span className="ml-auto text-xs text-gray-400">{t.time}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Waiting state — client must confirm */}
      {order.status === "waiting_client_confirmation" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 lg:bottom-0 inset-x-0 p-4 bg-white border-t border-gray-100 lg:max-w-2xl lg:mx-auto lg:left-60"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-3 py-3 rounded-2xl bg-orange-50">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-sm font-semibold text-orange-700">Ожидаем подтверждения клиента</span>
            </div>
            <button
              onClick={() => openChatForOrder(order.id, "client_performer", null, user?.id ?? null)}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <MessageCircle size={13} />
              Написать клиенту
            </button>
          </div>
        </motion.div>
      )}

      {/* Status action — only for active statuses */}
      <AnimatePresence>
        {nextAction && order.status !== "waiting_client_confirmation" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 lg:bottom-0 inset-x-0 p-4 bg-white border-t border-gray-100 lg:max-w-2xl lg:mx-auto lg:left-60"
          >
            <button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className="w-full py-4 rounded-2xl bg-[#006AFF] text-white font-semibold text-base hover:bg-[#004CB8] transition-all active:scale-95 disabled:opacity-60"
            >
              {isUpdating ? "Определяем геолокацию..." : nextAction.label}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CompletionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCompletionSubmit}
      />

      <AdditionalWorkModal
        isOpen={showAdditionalWork}
        onClose={() => setShowAdditionalWork(false)}
        onSubmit={async (data) => {
          console.log("Additional work request:", data);
        }}
      />

      <ChatDrawer
        clientName={order.client.name}
        performerName="Вы"
        title="Чат с клиентом"
      />

      {/* Geolocation permission sheet */}
      <AnimatePresence>
        {showGeoSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => !isUpdating && setShowGeoSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl p-6 pb-10 shadow-xl"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <LocateFixed size={28} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">Поделиться геолокацией</p>
                  <p className="text-sm text-gray-500 mt-1.5">
                    Клиент увидит вашу точку на карте и сможет отследить, когда вы приедете
                  </p>
                </div>

                {geoBlocked && (
                  <div className="w-full flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 text-left">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Доступ к геолокации запрещён</p>
                      <p className="text-xs text-red-500 mt-0.5">
                        Разрешите доступ в настройках браузера или нажмите «Продолжить без геолокации»
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleConfirmGeo}
                  disabled={isUpdating}
                  className="w-full py-4 rounded-2xl bg-[#006AFF] text-white font-semibold text-base disabled:opacity-60 transition-all active:scale-95"
                >
                  {isUpdating ? "Определяем местоположение..." : "Разрешить геолокацию"}
                </button>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={handleSkipGeo}
                    disabled={isUpdating}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Продолжить без геолокации
                  </button>
                  <p className="text-xs text-gray-300">Клиент не увидит вашу позицию на карте</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
