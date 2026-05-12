import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCalculatorStore } from "../store/calculatorStore";
import { useDashboardStore } from "../dashboard/store/dashboardStore";
import { ProgressBar } from "./ProgressBar";
import { PriceSummary } from "./PriceSummary";
import { CategoryStep } from "./steps/CategoryStep";
import { ServiceStep } from "./steps/ServiceStep";
import { ParametersStep } from "./steps/ParametersStep";
import { DateTimeStep } from "./steps/DateTimeStep";
import { SummaryStep } from "./steps/SummaryStep";
import { AuthStep } from "./steps/AuthStep";
import { CheckoutStep } from "./steps/CheckoutStep";
import { supabase } from "../lib/supabase";
import { calculatePrice } from "../utils/priceCalculator";

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

const STEPS_ORDER = [
  "category",
  "service",
  "parameters",
  "datetime",
  "auth",
  "checkout",
  "success",
];

export function Calculator({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { setPendingOrder } = useDashboardStore();
  const {
    step,
    goBack,
    goNext,
    setIsSubmitting,
    isSubmitting,
    reset,
    selectedService,
    selectedCategory,
    fieldValues,
    schedule,
    contacts,
  } = useCalculatorStore();

  const stepIdx = STEPS_ORDER.indexOf(step);

  const handleNext = () => {
    if (step === "auth") {
      // AuthStep manages its own flow and calls goNext internally
      // The profile sub-step submits via form id
      const form = document.getElementById("profile-form") as HTMLFormElement | null;
      form?.requestSubmit();
      return;
    }
    if (step === "checkout") {
      handleSubmit();
      return;
    }
    goNext();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const breakdown = calculatePrice(selectedService, fieldValues);

      const { error } = await supabase.from("orders").insert({
        user_id: user?.id ?? null,
        email: contacts.email,
        name: contacts.name,
        category_id: selectedCategory?.id,
        category_name: selectedCategory?.name,
        service_id: selectedService?.id,
        service_name: selectedService?.name,
        field_values: fieldValues,
        price_total: breakdown.total,
        price_breakdown: breakdown.items,
        scheduled_date: schedule.date,
        scheduled_time: schedule.time,
        address: contacts.address,
        comment: contacts.comment,
      });

      if (error) throw error;
    } catch (err) {
      console.error("Order save error:", err);
    } finally {
      setIsSubmitting(false);
    }

    // Set pending order for payment modal and navigate to dashboard
    const breakdown = calculatePrice(selectedService, fieldValues);
    setPendingOrder({
      serviceName: selectedService?.name ?? "",
      categoryName: selectedCategory?.name ?? "",
      duration: selectedService && selectedService.fields.length > 0 ? "~1–2 часа" : "~1 час",
      scheduledDate: schedule.date,
      scheduledTime: schedule.time,
      priceTotal: breakdown.total,
      priceBreakdown: breakdown.items,
      address: contacts.address,
    });
    reset();
    navigate("/dashboard");
  };

  const canGoBack = stepIdx > 0 && step !== "auth";

  const submitLabel =
    step === "checkout"
      ? "Оформить заказ"
      : step === "auth"
      ? "Далее"
      : "Продолжить";

  // Steps where we hide the nav (they have self-contained CTAs)
  const selfContained = ["category", "service", "summary", "auth"];
  const showNavigation = !selfContained.includes(step);

  if (embedded) {
    return (
      <div className="bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          {canGoBack && (
            <button
              onClick={goBack}
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
                {step === "datetime" && <DateTimeStep />}
                {step === "summary" && <SummaryStep />}
                {step === "auth" && <AuthStep />}
                {step === "checkout" && <CheckoutStep />}
              </motion.div>
            </AnimatePresence>

            {showNavigation && (
              <div className="mt-6 flex gap-3">
                {canGoBack && (
                  <button
                    onClick={goBack}
                    className="px-6 py-3 rounded-xl border-2 border-gray-100 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all"
                  >
                    Назад
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-95"
                >
                  {isSubmitting ? "Оформляем..." : submitLabel}
                </button>
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
                onClick={goBack}
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
                {step === "datetime" && <DateTimeStep />}
                {step === "summary" && <SummaryStep />}
                {step === "auth" && <AuthStep />}
                {step === "checkout" && <CheckoutStep />}
              </motion.div>
            </AnimatePresence>

            {/* Desktop nav buttons */}
            {showNavigation && (
              <div className="mt-8 hidden lg:flex gap-3">
                {canGoBack && (
                  <button
                    onClick={goBack}
                    className="px-6 py-3 rounded-xl border-2 border-gray-100 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all"
                  >
                    Назад
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-95"
                >
                  {isSubmitting ? "Оформляем..." : submitLabel}
                </button>
              </div>
            )}

            {/* Spacer for mobile bottom bar */}
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
