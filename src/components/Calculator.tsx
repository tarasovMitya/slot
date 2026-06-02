import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { trackEvent } from "../hooks/useAnalytics";
import { useCalculatorStore } from "../store/calculatorStore";
import { useDashboardStore } from "../dashboard/store/dashboardStore";
import { ProgressBar } from "./ProgressBar";
import { PriceSummary } from "./PriceSummary";
import { CategoryStep } from "./steps/CategoryStep";
import { ServiceStep } from "./steps/ServiceStep";
import { ParametersStep } from "./steps/ParametersStep";
import { DateTimeStep } from "./steps/DateTimeStep";
import { AddMoreStep } from "./steps/AddMoreStep";
import { AuthStep } from "./steps/AuthStep";
import { CheckoutStep } from "./steps/CheckoutStep";
import { supabase } from "../lib/supabase";
import { dbSaveProfile } from "../lib/db";
import { ENABLE_PAYMENTS } from "../lib/featureFlags";

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

const STEPS_ORDER = [
  "category",
  "service",
  "parameters",
  "add-more",
  "datetime",
  "auth",
  "checkout",
  "success",
];

export function Calculator({ embedded = false }: { embedded?: boolean }) {
  usePageMeta(
    embedded
      ? {}
      : { title: "Калькулятор услуг", description: "Рассчитайте стоимость бытовых услуг онлайн: электрика, сантехника, уборка, сборка мебели и другое.", canonical: "https://slot-home.ru/calculator" }
  );
  const navigate = useNavigate();
  const { setPendingOrder, createOrderDirectly } = useDashboardStore();
  const {
    step,
    goBack,
    goNext,
    setStep,
    setIsSubmitting,
    isSubmitting,
    reset,
    schedule,
    contacts,
    cart,
    addToCart,
    editingCartItemId,
    clearCurrentService,
  } = useCalculatorStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const stepIdx = STEPS_ORDER.indexOf(step);
  const stepIdxRef = useRef(stepIdx);
  const orderCreatedRef = useRef(false);
  useEffect(() => { stepIdxRef.current = stepIdx; }, [stepIdx]);
  useEffect(() => {
    return () => {
      if (!orderCreatedRef.current && stepIdxRef.current > 0) {
        trackEvent("calculator_abandoned");
      }
    };
  }, []);

  // When at "category" with cart items already present, allow going back to the cart
  const canGoBack =
    step !== "auth" &&
    step !== "add-more" &&
    (stepIdx > 0 || (step === "category" && cart.length > 0));

  const handleBack = () => {
    if (step === "category" && cart.length > 0) {
      clearCurrentService();
      setStep("add-more");
    } else {
      goBack();
    }
  };

  const handleNext = () => {
    if (step === "auth") {
      const form = document.getElementById("profile-form") as HTMLFormElement | null;
      form?.requestSubmit();
      return;
    }
    if (step === "checkout") {
      handleSubmit();
      return;
    }
    if (step === "parameters") {
      addToCart();
      goNext();
      return;
    }
    if (step === "category") {
      trackEvent("calculator_started");
    }
    if (step === "add-more") {
      trackEvent("payment_started");
    }
    goNext();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const cartTotal = cart.reduce((sum, item) => sum + item.priceTotal, 0);
    const allBreakdown =
      cart.length === 1
        ? cart[0].priceBreakdown
        : cart.map((item) => ({ label: item.serviceName, amount: item.priceTotal }));
    const primaryService = cart[0];
    const duration = cart.length === 1 ? cart[0].duration : "По согласованию";
    const serviceName = cart.length === 1
      ? primaryService.serviceName
      : `${primaryService.serviceName} + ещё ${cart.length - 1}`;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Audit log — non-blocking, failure doesn't block order creation
      supabase.from("orders").insert({
        user_id: user?.id ?? null,
        email: contacts.email,
        name: contacts.name,
        category_id: primaryService.categoryId,
        category_name: primaryService.categoryName,
        service_id: primaryService.serviceId,
        service_name: serviceName,
        field_values: cart.length === 1 ? primaryService.fieldValues : {},
        price_total: cartTotal,
        price_breakdown: allBreakdown,
        scheduled_date: schedule.date,
        scheduled_time: schedule.time,
        address: contacts.address,
        comment: contacts.comment,
      }).then(({ error }) => { if (error) console.warn("Order audit log:", error.message); });

      const orderData = {
        serviceName,
        categoryName: primaryService.categoryName,
        duration,
        scheduledDate: schedule.date,
        scheduledTime: schedule.time,
        priceTotal: cartTotal,
        priceBreakdown: allBreakdown,
        address: contacts.address,
      };

      if (ENABLE_PAYMENTS) {
        setPendingOrder(orderData);
      } else {
        createOrderDirectly(orderData);
      }

      // Save filled-in profile data — non-blocking
      if (user) {
        const profilePatch: Record<string, string> = {};
        if (contacts.name && !contacts.name.startsWith("tg_"))    profilePatch.name    = contacts.name;
        if (contacts.phone && contacts.phone.length > 3)           profilePatch.phone   = contacts.phone;
        if (contacts.email && !contacts.email.endsWith("@slot-home.ru")) profilePatch.email = contacts.email;
        if (contacts.address)                                       profilePatch.address = contacts.address;
        if (Object.keys(profilePatch).length > 0) {
          dbSaveProfile(user.id, profilePatch).catch(() => {});
          if (profilePatch.name) {
            supabase.auth.updateUser({ data: { full_name: profilePatch.name } }).catch(() => {});
          }
        }
      }

      orderCreatedRef.current = true;
      trackEvent("order_created", { value: cartTotal });
      reset();
      navigate("/dashboard");
    } catch (err) {
      console.error("Order save error:", err);
      setSubmitError("Не удалось создать заказ. Проверьте соединение и попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel =
    step === "checkout"
      ? "Оформить заказ"
      : step === "auth"
      ? "Далее"
      : step === "parameters"
      ? editingCartItemId
        ? "Обновить услугу"
        : "Добавить в заказ"
      : "Продолжить";

  // Steps that manage their own CTAs — no external nav buttons
  const selfContained = ["category", "service", "add-more", "auth"];
  const showNavigation = !selfContained.includes(step);

  if (embedded) {
    return (
      <div className="bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          {canGoBack && (
            <button
              onClick={handleBack}
              className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors mb-4"
            >
              ← Назад
            </button>
          )}
          <ProgressBar />
          <div className="mt-6">
            <AnimatePresence mode="wait" custom={stepIdx}>
              <motion.div
                key={step}
                custom={stepIdx}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {step === "category" && <CategoryStep />}
                {step === "service" && <ServiceStep />}
                {step === "parameters" && <ParametersStep />}
                {step === "add-more" && <AddMoreStep />}
                {step === "datetime" && <DateTimeStep />}
                {step === "auth" && <AuthStep />}
                {step === "checkout" && <CheckoutStep />}
              </motion.div>
            </AnimatePresence>

            {showNavigation && (
              <div className="mt-6 flex flex-col gap-2">
                {submitError && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{submitError}</p>
                )}
                <div className="flex gap-3">
                  {canGoBack && (
                    <button
                      onClick={handleBack}
                      className="px-6 py-3 rounded-xl border-2 border-gray-100 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all"
                    >
                      Назад
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-xl bg-[#006AFF] text-white text-sm font-semibold hover:bg-[#004CB8] disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isSubmitting ? "Оформляем..." : submitLabel}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-bold text-gray-900 tracking-tight">SLOT</span>
            {canGoBack && (
              <button
                onClick={handleBack}
                className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
              >
                ← Назад
              </button>
            )}
          </div>
          <ProgressBar />
        </header>

        {/* Content */}
        <div className="flex gap-12 items-start">
          {/* Main */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait" custom={stepIdx}>
              <motion.div
                key={step}
                custom={stepIdx}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {step === "category" && <CategoryStep />}
                {step === "service" && <ServiceStep />}
                {step === "parameters" && <ParametersStep />}
                {step === "add-more" && <AddMoreStep />}
                {step === "datetime" && <DateTimeStep />}
                {step === "auth" && <AuthStep />}
                {step === "checkout" && <CheckoutStep />}
              </motion.div>
            </AnimatePresence>

            {/* Desktop nav */}
            {showNavigation && (
              <div className="mt-8 hidden lg:flex flex-col gap-2">
                {submitError && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{submitError}</p>
                )}
                <div className="flex gap-3">
                  {canGoBack && (
                    <button
                      onClick={handleBack}
                      className="px-6 py-3 rounded-xl border-2 border-gray-100 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all"
                    >
                      Назад
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-xl bg-[#006AFF] text-white text-sm font-semibold hover:bg-[#004CB8] disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isSubmitting ? "Оформляем..." : submitLabel}
                  </button>
                </div>
              </div>
            )}

            {showNavigation && <div className="h-24 lg:hidden" />}
          </div>

          {/* Sidebar */}
          <PriceSummary
            variant="sidebar"
            onSubmit={showNavigation ? handleNext : undefined}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      {/* Mobile bottom bar */}
      {showNavigation && (
        <PriceSummary
          variant="bottom"
          onSubmit={handleNext}
          submitLabel={submitLabel}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
