import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Plus, RotateCcw, ClipboardList, LogOut } from "lucide-react";
import { useDashboardStore } from "../store/dashboardStore";
import { useCalculatorStore } from "../../store/calculatorStore";
import { useAuthStore } from "../../store/authStore";
import { ActiveOrderCard } from "../components/cards/ActiveOrderCard";
import { SearchingOrderCard } from "../components/cards/SearchingOrderCard";
import { OrderCard } from "../components/cards/OrderCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { DashboardSkeleton } from "../components/ui/SkeletonLoader";
import { EmptyState } from "../components/ui/EmptyState";
import { PaymentModal } from "../components/PaymentModal";
import { TestModeBanner } from "../../components/ui/TestModeBanner";
import { ENABLE_PAYMENTS } from "../../lib/featureFlags";

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    orders, isHydrated, addresses,
    cancelOrder,
  } = useDashboardStore();
  const { setSkipAuth, setContacts } = useCalculatorStore();
  const { user, signOut } = useAuthStore();

  const displayName = user?.user_metadata?.full_name as string | undefined
    ?? user?.email?.split("@")[0]
    ?? "Гость";

  const handleNewOrder = () => {
    const defaultAddress = addresses.find((a) => a.isDefault);
    setContacts({
      name: displayName,
      email: user?.email ?? "",
      phone: "",
      address: defaultAddress ? `${defaultAddress.street}, ${defaultAddress.city}` : "",
      comment: "",
    });
    setSkipAuth(true);
    navigate("/calculator");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const activeOrders = orders.filter(
    (o) => !["completed", "cancelled"].includes(o.status)
  );
  const recentCompleted = orders
    .filter((o) => o.status === "completed")
    .slice(0, 2);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  if (!isHydrated) return <DashboardSkeleton />;

  return (
    <>
      {/* Blocking payment modal — only in payments mode */}
      {ENABLE_PAYMENTS && <PaymentModal />}

    <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
      {/* TEST MODE banner */}
      {!ENABLE_PAYMENTS && (
        <div className="mb-6">
          <TestModeBanner />
        </div>
      )}

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">{greeting},</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">
              {displayName} 👋
            </h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mt-1"
          >
            <LogOut size={15} />
            Выйти
          </button>
        </div>
      </motion.div>

      {/* Active Orders */}
      <section className="mb-8">
        <SectionHeader
          title="Активные заказы"
          action={
            activeOrders.length > 0 ? (
              <Link
                to="/dashboard/orders"
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                Все <ArrowRight size={14} />
              </Link>
            ) : null
          }
        />

        {activeOrders.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={28} />}
            title="Нет активных заказов"
            description="Оформите новую услугу и мы найдём мастера"
            action={
              <button
                onClick={handleNewOrder}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#006AFF] text-white text-sm font-semibold rounded-xl hover:bg-[#004CB8] transition-all"
              >
                <Plus size={16} />
                Новый заказ
              </button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {activeOrders.map((order) =>
              order.status === "searching" ? (
                <SearchingOrderCard key={order.id} order={order} onCancel={() => cancelOrder(order.id)} />
              ) : (
                <ActiveOrderCard key={order.id} order={order} onCancel={() => cancelOrder(order.id)} />
              )
            )}
          </div>
        )}
      </section>

      {/* CTA — new order */}
      {activeOrders.length > 0 && (
        <button
          onClick={handleNewOrder}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all mb-8"
        >
          <Plus size={16} />
          Новый заказ
        </button>
      )}

      {/* Recent completed */}
      {recentCompleted.length > 0 && (
        <section>
          <SectionHeader
            title="Последние заказы"
            action={
              <Link
                to="/dashboard/history"
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                Все <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="flex flex-col gap-3">
            {recentCompleted.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onRepeat={handleNewOrder}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick repeat suggestion */}
      {recentCompleted.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-5 rounded-2xl bg-gray-50"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Быстрый повтор
          </p>
          <p className="text-sm font-medium text-gray-900 mb-1">
            {recentCompleted[0].serviceName}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Вы заказывали{" "}
            {new Date(recentCompleted[0].scheduledDate).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
            })}
          </p>
          <button
            onClick={handleNewOrder}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#006AFF] text-white text-sm font-semibold rounded-xl hover:bg-[#004CB8] transition-all"
          >
            <RotateCcw size={14} />
            Повторить
          </button>
        </motion.div>
      )}
    </div>
    </>
  );
}
